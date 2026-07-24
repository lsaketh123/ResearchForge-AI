import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
from models.models import User, Workspace, Paper, WorkspaceShare, PaperChunk
from models.schemas import PaperResponse, PaperImportRequest, SearchResponse
from routers.auth_utils import get_current_user
from utils.academic_search import query_academic_databases as search_academic_databases
from utils.pdf_engine import is_duplicate_publication, process_pdf_background

router = APIRouter(prefix="/api/papers", tags=["papers"])

@router.post("/upload", response_model=PaperResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_pdf_paper(
    background_tasks: BackgroundTasks,
    workspace_id: int = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Uploads a single research paper PDF. Performs duplicate checks, immediately persists a
    placeholder 'queued' record, and triggers background parsing & vector indexing.
    """
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        
    if workspace.user_id != current_user.id:
        share = db.query(WorkspaceShare).filter(
            WorkspaceShare.workspace_id == workspace_id,
            WorkspaceShare.user_id == current_user.id
        ).first()
        if not share:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Read bytes
    file_bytes = await file.read()
    filename = file.filename or "uploaded_paper.pdf"

    # Duplicate detection
    if is_duplicate_publication(filename, workspace_id, db):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A paper with the file name '{filename}' already exists in this workspace."
        )

    # Persist database placeholder
    paper = Paper(
        title=filename,
        authors="Processing...",
        abstract="Pending background extraction.",
        source="pdf_upload",
        workspace_id=workspace_id,
        user_id=current_user.id,
        status="queued",
        progress=0
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)

    # Launch processing background worker task
    background_tasks.add_task(process_pdf_background, paper.id, file_bytes, SessionLocal)
    return paper

@router.post("/upload-multiple", response_model=List[PaperResponse], status_code=status.HTTP_202_ACCEPTED)
async def upload_multiple_pdf_papers(
    background_tasks: BackgroundTasks,
    workspace_id: int = Form(...),
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Enables concurrent multi-file uploading of academic papers. Enqueues background tasks for each.
    """
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        
    if workspace.user_id != current_user.id:
        share = db.query(WorkspaceShare).filter(
            WorkspaceShare.workspace_id == workspace_id,
            WorkspaceShare.user_id == current_user.id
        ).first()
        if not share:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    accepted_papers = []
    for file in files:
        file_bytes = await file.read()
        filename = file.filename or "uploaded_paper.pdf"

        # Skip duplicates or issue alerts in status, here we skip duplicate files to ensure robust multi-upload
        if is_duplicate_publication(filename, workspace_id, db):
            continue

        paper = Paper(
            title=filename,
            authors="Processing...",
            abstract="Pending background extraction.",
            source="pdf_upload",
            workspace_id=workspace_id,
            user_id=current_user.id,
            status="queued",
            progress=0
        )
        db.add(paper)
        db.commit()
        db.refresh(paper)

        background_tasks.add_task(process_pdf_background, paper.id, file_bytes, SessionLocal)
        accepted_papers.append(paper)

    return accepted_papers

@router.get("/status/{paper_id}")
def get_paper_processing_status(
    paper_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves the parsing status and progress percentage for polling clients.
    """
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper not found")
        
    # Security check
    workspace = paper.workspace
    if workspace.user_id != current_user.id:
        share = db.query(WorkspaceShare).filter(
            WorkspaceShare.workspace_id == workspace.id,
            WorkspaceShare.user_id == current_user.id
        ).first()
        if not share:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return {
        "id": paper.id,
        "status": paper.status,
        "progress": paper.progress,
        "title": paper.title
    }

@router.get("/", response_model=List[PaperResponse])
def get_imported_papers(
    workspace_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lists all papers within a workspace.
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
            
    return db.query(Paper).filter(Paper.workspace_id == workspace_id).all()

@router.delete("/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_paper(
    paper_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Removes a paper and all its associated semantic chunk embeddings.
    """
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper not found")
        
    # Check permissions
    if paper.workspace.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    db.delete(paper)
    db.commit()
    return

@router.get("/search", response_model=SearchResponse)
async def search_papers_online(
    query: str,
    source: str = "all",
    current_user: User = Depends(get_current_user)
):
    """
    Searches online databases (arXiv and PubMed) concurrently.
    """
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    try:
        results = await search_academic_databases(query, source)
        return {"papers": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import", response_model=PaperResponse, status_code=status.HTTP_201_CREATED)
def import_paper_from_search(
    request: PaperImportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Imports a paper found via search into a personal workspace, generating standard chunk indices.
    """
    workspace = db.query(Workspace).filter(Workspace.id == request.workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        
    # Access check
    if workspace.user_id != current_user.id:
        share = db.query(WorkspaceShare).filter(
            WorkspaceShare.workspace_id == request.workspace_id,
            WorkspaceShare.user_id == current_user.id
        ).first()
        if not share:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
            
    # Verify duplicates
    if is_duplicate_publication(request.title, request.workspace_id, db):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This publication is already imported in the workspace."
        )

    paper = Paper(
        title=request.title,
        authors=request.authors,
        abstract=request.abstract,
        published_date=request.published_date,
        url=request.url,
        source=request.source,
        workspace_id=request.workspace_id,
        user_id=current_user.id,
        status="completed",
        progress=100
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)
    
    # Save abstract as first chunk
    chunk_text = f"Title: {paper.title}\nAuthors: {paper.authors}\nAbstract: {paper.abstract or ''}"
    chunk = PaperChunk(
        paper_id=paper.id,
        chunk_index=0,
        text_content=chunk_text,
        embedding=None  # Embedded dynamically on first semantic chat retrieval if null
    )
    db.add(chunk)
    db.commit()
    
    return paper
