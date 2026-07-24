from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.models import User, Workspace, WorkspaceShare
from models.schemas import (
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceResponse,
    WorkspaceShareCreate,
    WorkspaceShareResponse
)
from routers.auth_utils import get_current_user

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])

@router.get("/", response_model=List[WorkspaceResponse])
def list_workspaces(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns all workspaces owned by the user or shared with them.
    """
    # Query owned workspaces
    owned = db.query(Workspace).filter(Workspace.user_id == current_user.id).all()
    
    # Query shared workspaces
    shares = db.query(WorkspaceShare).filter(WorkspaceShare.user_id == current_user.id).all()
    shared_workspaces = [s.workspace for s in shares if s.workspace is not None]
    
    return owned + shared_workspaces

@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(workspace_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Retrieves a single workspace. Checks ownership or active share access.
    """
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        
    # Check access permission
    has_access = workspace.user_id == current_user.id
    if not has_access:
        share = db.query(WorkspaceShare).filter(
            WorkspaceShare.workspace_id == workspace_id,
            WorkspaceShare.user_id == current_user.id
        ).first()
        if not share:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
            
    return workspace

@router.post("/", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_workspace(workspace_data: WorkspaceCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Creates a new workspace.
    """
    new_workspace = Workspace(
        name=workspace_data.name,
        description=workspace_data.description,
        user_id=current_user.id
    )
    db.add(new_workspace)
    db.commit()
    db.refresh(new_workspace)
    return new_workspace

@router.put("/{workspace_id}", response_model=WorkspaceResponse)
def update_workspace(
    workspace_id: int,
    workspace_data: WorkspaceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates workspace name or description. Allows owner or editor.
    """
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        
    # Permissions: owner or editor share
    is_owner = workspace.user_id == current_user.id
    is_editor = False
    
    if not is_owner:
        share = db.query(WorkspaceShare).filter(
            WorkspaceShare.workspace_id == workspace_id,
            WorkspaceShare.user_id == current_user.id
        ).first()
        if share and share.role == "editor":
            is_editor = True
            
    if not is_owner and not is_editor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this workspace"
        )
        
    if workspace_data.name is not None:
        workspace.name = workspace_data.name
    if workspace_data.description is not None:
        workspace.description = workspace_data.description
        
    db.commit()
    db.refresh(workspace)
    return workspace

@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(workspace_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Deletes a workspace. Only allowed for workspace owners.
    """
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        
    # Only owner can delete
    if workspace.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the workspace owner can delete it"
        )
        
    db.delete(workspace)
    db.commit()
    return

# Workspace Sharing Management

@router.post("/{workspace_id}/share", response_model=WorkspaceShareResponse, status_code=status.HTTP_201_CREATED)
def share_workspace(
    workspace_id: int,
    share_data: WorkspaceShareCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Shares a workspace with another user by email. Only allowed for owner.
    """
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        
    if workspace.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can share this workspace"
        )
        
    # Find user to share with
    target_user = db.query(User).filter(User.email == share_data.email).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email '{share_data.email}' not found"
        )
        
    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot share a workspace with yourself"
        )
        
    # Check if already shared
    existing_share = db.query(WorkspaceShare).filter(
        WorkspaceShare.workspace_id == workspace_id,
        WorkspaceShare.user_id == target_user.id
    ).first()
    
    if existing_share:
        # Update role
        existing_share.role = share_data.role
        db.commit()
        db.refresh(existing_share)
        
        # Add email field dynamically for Response validation
        res = WorkspaceShareResponse(
            id=existing_share.id,
            workspace_id=existing_share.workspace_id,
            user_id=existing_share.user_id,
            email=target_user.email,
            role=existing_share.role,
            created_at=existing_share.created_at
        )
        return res
        
    new_share = WorkspaceShare(
        workspace_id=workspace_id,
        user_id=target_user.id,
        role=share_data.role
    )
    db.add(new_share)
    db.commit()
    db.refresh(new_share)
    
    res = WorkspaceShareResponse(
        id=new_share.id,
        workspace_id=new_share.workspace_id,
        user_id=new_share.user_id,
        email=target_user.email,
        role=new_share.role,
        created_at=new_share.created_at
    )
    return res

@router.get("/{workspace_id}/shares", response_model=List[WorkspaceShareResponse])
def list_workspace_shares(
    workspace_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lists all shares for a workspace. Only owner can view.
    """
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        
    if workspace.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can view share details"
        )
        
    shares = db.query(WorkspaceShare).filter(WorkspaceShare.workspace_id == workspace_id).all()
    
    res = []
    for s in shares:
        target_user = db.query(User).filter(User.id == s.user_id).first()
        res.append(WorkspaceShareResponse(
            id=s.id,
            workspace_id=s.workspace_id,
            user_id=s.user_id,
            email=target_user.email if target_user else "Deleted User",
            role=s.role,
            created_at=s.created_at
        ))
        
    return res

@router.delete("/{workspace_id}/share/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_workspace_share(
    workspace_id: int,
    share_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Revokes/Deletes a workspace share. Only owner can execute.
    """
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        
    if workspace.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can revoke workspace shares"
        )
        
    share = db.query(WorkspaceShare).filter(
        WorkspaceShare.id == share_id,
        WorkspaceShare.workspace_id == workspace_id
    ).first()
    
    if not share:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share record not found")
        
    db.delete(share)
    db.commit()
    return
