from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.models import User, Paper, WorkspaceShare
from models.schemas import AnalyzeRequest, AnalyzeResponse
from routers.auth_utils import get_current_user
from utils.ai_engine import run_paper_analysis

router = APIRouter(prefix="/api/ai", tags=["ai"])

@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_selected_papers(
    request: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Triggers multi-paper academic analysis (Summarize, Extract Insights, or Literature Review)
    using the Groq Llama 3.3 70B model.
    """
    if not request.paper_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No papers selected for analysis"
        )
        
    # Fetch papers and verify user access
    papers = db.query(Paper).filter(Paper.id.in_(request.paper_ids)).all()
    if len(papers) != len(request.paper_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more selected papers do not exist"
        )
        
    # Check authorization for each paper
    for paper in papers:
        workspace = paper.workspace
        is_owner = workspace.user_id == current_user.id
        is_authorized = is_owner
        
        if not is_owner:
            share = db.query(WorkspaceShare).filter(
                WorkspaceShare.workspace_id == workspace.id,
                WorkspaceShare.user_id == current_user.id
            ).first()
            if share:
                is_authorized = True
                
        if not is_authorized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied for paper ID {paper.id} ({paper.title[:30]}...)"
            )
            
    # Dispatch multi-document synthesis task to AI Engine
    try:
        result_text = run_paper_analysis(
            paper_ids=request.paper_ids,
            action=request.action,
            db=db
        )
        return {"result": result_text}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Engine failed to run analysis: {str(e)}"
        )
