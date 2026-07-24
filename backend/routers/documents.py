from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
from models.models import User, Workspace, Document, WorkspaceShare
from models.schemas import DocumentCreate, DocumentResponse, DocumentUpdate
from routers.auth_utils import get_current_user

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.get("/", response_model=List[DocumentResponse])
def list_workspace_documents(
    workspace_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lists all documents/notes inside a workspace. Checks permissions.
    """
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        
    # Check read permissions
    has_access = workspace.user_id == current_user.id
    if not has_access:
        share = db.query(WorkspaceShare).filter(
            WorkspaceShare.workspace_id == workspace_id,
            WorkspaceShare.user_id == current_user.id
        ).first()
        if not share:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
            
    return db.query(Document).filter(Document.workspace_id == workspace_id).all()

@router.post("/", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def create_document(
    document_data: DocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a new note/document in the workspace. Checks write permissions.
    """
    workspace = db.query(Workspace).filter(Workspace.id == document_data.workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        
    # Check write access (owner or editor share)
    is_owner = workspace.user_id == current_user.id
    is_editor = False
    
    if not is_owner:
        share = db.query(WorkspaceShare).filter(
            WorkspaceShare.workspace_id == document_data.workspace_id,
            WorkspaceShare.user_id == current_user.id
        ).first()
        if share and share.role == "editor":
            is_editor = True
            
    if not is_owner and not is_editor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have write access to this workspace"
        )
        
    new_doc = Document(
        title=document_data.title,
        content=document_data.content,
        workspace_id=document_data.workspace_id,
        user_id=current_user.id
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc

@router.put("/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: int,
    document_data: DocumentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates the title or content of an existing document. Checks write permissions.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    workspace = doc.workspace
    is_owner = workspace.user_id == current_user.id
    is_editor = False
    
    if not is_owner:
        share = db.query(WorkspaceShare).filter(
            WorkspaceShare.workspace_id == workspace.id,
            WorkspaceShare.user_id == current_user.id
        ).first()
        if share and share.role == "editor":
            is_editor = True
            
    if not is_owner and not is_editor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have write access to this workspace"
        )
        
    if document_data.title is not None:
        doc.title = document_data.title
    if document_data.content is not None:
        doc.content = document_data.content
        
    db.commit()
    db.refresh(doc)
    return doc

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletes a document from the workspace. Checks write permissions.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    workspace = doc.workspace
    is_owner = workspace.user_id == current_user.id
    is_editor = False
    
    if not is_owner:
        share = db.query(WorkspaceShare).filter(
            WorkspaceShare.workspace_id == workspace.id,
            WorkspaceShare.user_id == current_user.id
        ).first()
        if share and share.role == "editor":
            is_editor = True
            
    if not is_owner and not is_editor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have write access to this workspace"
        )
        
    db.delete(doc)
    db.commit()
    return
