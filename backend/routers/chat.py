from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.models import User, Workspace, Conversation, WorkspaceShare
from models.schemas import ChatRequest, ChatResponse, ConversationResponse
from routers.auth_utils import get_current_user
from utils.ai_engine import run_research_chat

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.post("/", response_model=ChatResponse)
def chat_with_workspace_papers(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    RAG-powered conversational endpoint. Uses semantic similarity to query workspace papers,
    injects context and history, and requests completions from Llama 3.3 70B via Groq.
    """
    workspace = db.query(Workspace).filter(Workspace.id == request.workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        
    # Check read permissions
    has_access = workspace.user_id == current_user.id
    if not has_access:
        share = db.query(WorkspaceShare).filter(
            WorkspaceShare.workspace_id == request.workspace_id,
            WorkspaceShare.user_id == current_user.id
        ).first()
        if not share:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
            
    # Dispatch reasoning chat loop to AI Engine
    try:
        response_content = run_research_chat(
            workspace_id=request.workspace_id,
            query=request.message,
            db=db
        )
        
        # Persist conversation log
        user_msg = Conversation(
            workspace_id=request.workspace_id,
            user_id=current_user.id,
            role="user",
            content=request.message
        )
        assistant_msg = Conversation(
            workspace_id=request.workspace_id,
            user_id=current_user.id,
            role="assistant",
            content=response_content
        )
        
        db.add(user_msg)
        db.add(assistant_msg)
        db.commit()
        
        return {"response": response_content}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Engine failed to process query: {str(e)}"
        )

@router.get("/history/{workspace_id}", response_model=List[ConversationResponse])
def get_conversation_history(
    workspace_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves all conversation records within a workspace.
    """
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        
    # Check permissions
    has_access = workspace.user_id == current_user.id
    if not has_access:
        share = db.query(WorkspaceShare).filter(
            WorkspaceShare.workspace_id == workspace_id,
            WorkspaceShare.user_id == current_user.id
        ).first()
        if not share:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
            
    return db.query(Conversation).filter(
        Conversation.workspace_id == workspace_id
    ).order_by(Conversation.created_at.asc()).all()
