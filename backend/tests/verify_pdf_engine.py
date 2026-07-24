import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Base
from models.models import User, Workspace, Paper, PaperChunk
from utils.pdf_engine import process_pdf_background

TEST_DB = "./verify_pdf.db"
PDF_PATH = r"C:\Users\lsake\.gemini\antigravity\brain\558ccbb9-d2c3-4e9f-98f0-8a966316137f\.user_uploaded\media__1784905297124.pdf"

def main():
    print("=== RESEARCHHUB PDF PROCESSING ENGINE VERIFICATION ===")
    
    # Check if PDF exists
    if not os.path.exists(PDF_PATH):
        print(f"Error: Sample PDF not found at {PDF_PATH}")
        sys.exit(1)
        
    print(f"Found sample PDF at: {PDF_PATH}")

    # 1. Setup SQLite Database
    if os.path.exists(TEST_DB):
        try:
            os.remove(TEST_DB)
        except Exception:
            pass
            
    engine = create_engine(f"sqlite:///{TEST_DB}")
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    Base.metadata.create_all(bind=engine)
    print("[1] Test schema created.")

    # 2. Populate user and workspace
    user = User(email="analyst@domain.com", hashed_password="hashed_password", role="user")
    db.add(user)
    db.commit()
    db.refresh(user)

    workspace = Workspace(name="PDF Extraction Test", description="Testing PDF pipeline", user_id=user.id)
    db.add(workspace)
    db.commit()
    db.refresh(workspace)
    print(f"[2] Test User and Workspace '{workspace.name}' created.")

    # 3. Create Paper placeholder
    filename = os.path.basename(PDF_PATH)
    paper = Paper(
        title=filename,
        authors="Analyzing...",
        abstract="Pending...",
        source="pdf_upload",
        workspace_id=workspace.id,
        user_id=user.id,
        status="queued",
        progress=0
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)
    print(f"[3] Paper placeholder created with ID: {paper.id}.")

    # 4. Load PDF bytes and run background process
    print("[4] Starting PDF background processing pipeline...")
    with open(PDF_PATH, "rb") as f:
        file_bytes = f.read()

    # Run processing helper directly
    process_pdf_background(paper.id, file_bytes, SessionLocal)

    # 5. Fetch updated paper details and print outputs
    db.refresh(paper)
    print("\n=== PIPELINE RESULTS ===")
    print(f"Paper Title: {paper.title}")
    print(f"Authors: {paper.authors}")
    print(f"Abstract Summary:\n{paper.abstract}\n")
    print(f"Processing Status: {paper.status}")
    print(f"Processing Progress: {paper.progress}%")
    
    if paper.metadata_json:
        print(f"Journal Source: {paper.metadata_json.get('journal', 'N/A')}")
        references = paper.metadata_json.get("references", [])
        print(f"References Extracted: {len(references)}")
        for i, ref in enumerate(references[:3], 1):
            print(f"  [{i}] {ref}")

    # Count generated chunks
    chunks_count = db.query(PaperChunk).filter(PaperChunk.paper_id == paper.id).count()
    print(f"Total Vector Chunks Generated: {chunks_count}")

    # Cleanup DB
    db.close()
    if os.path.exists(TEST_DB):
        try:
            os.remove(TEST_DB)
        except Exception:
            pass
    print("\n=== VERIFICATION COMPLETED ===")

if __name__ == "__main__":
    main()
