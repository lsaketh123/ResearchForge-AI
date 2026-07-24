import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Base
from models.models import User, Workspace, Paper, PaperChunk, Conversation
from utils.vector_store import get_embedding
from utils.ai_engine import run_research_chat, run_paper_analysis

TEST_DB = "./verify_ai.db"

def main():
    print("=== RESEARCHHUB AI ENGINE VERIFICATION ===")
    
    # 1. Clean and setup test DB
    if os.path.exists(TEST_DB):
        try:
            os.remove(TEST_DB)
        except Exception:
            pass
            
    engine = create_engine(f"sqlite:///{TEST_DB}")
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    Base.metadata.create_all(bind=engine)
    print("[1] Database schema created.")

    # 2. Populate test workspace & user
    user = User(email="editor@nature.com", hashed_password="hashed_pw", role="researcher")
    db.add(user)
    db.commit()
    db.refresh(user)
    
    workspace = Workspace(name="Medical Vision Research", description="Comparing CNNs and ViTs", user_id=user.id)
    db.add(workspace)
    db.commit()
    db.refresh(workspace)
    print(f"[2] Test User and Workspace '{workspace.name}' created.")

    # 3. Create Sample Papers
    papers_data = [
        {
            "title": "Convolutional Neural Networks in Breast Cancer Diagnosis",
            "authors": "Smith et al., 2022",
            "abstract": "We evaluate deep convolutional neural networks (CNNs) for classification of histopathology breast tissue scans. Our ResNet-50 architecture obtains 94.2% AUC, demonstrating robust spatial equivariance and fast inference times. However, the model lacks global context capture and fails on complex macro-structures."
        },
        {
            "title": "Vision Transformers for Histopathology Segmentation",
            "authors": "Lee et al., 2023",
            "abstract": "Vision Transformers (ViTs) utilize self-attention mechanisms to model global context. On breast scan datasets, our Swin-Transformer achieves 96.5% AUC. While superior at modeling long-range dependencies, ViTs require 5x more training data than CNNs and exhibit heavy computational training latencies."
        }
    ]

    print("[3] Importing and indexing publications...")
    for idx, pdata in enumerate(papers_data, 1):
        paper = Paper(
            title=pdata["title"],
            authors=pdata["authors"],
            abstract=pdata["abstract"],
            source="arxiv",
            workspace_id=workspace.id,
            user_id=user.id
        )
        db.add(paper)
        db.commit()
        db.refresh(paper)
        
        # Embed and index
        text = f"Title: {paper.title}\nAbstract: {paper.abstract}"
        embedding = get_embedding(text)
        chunk = PaperChunk(
            paper_id=paper.id,
            chunk_index=0,
            text_content=text,
            embedding=embedding
        )
        db.add(chunk)
        db.commit()
        print(f"    - Publication #{idx} indexed successfully.")

    # 4. Run RAG Question Answering
    query = "What are the main performance trade-offs between CNNs and Transformers in breast scans?"
    print(f"\n[4] Running RAG Research Chat for query: '{query}'")
    chat_response = run_research_chat(workspace_id=workspace.id, query=query, db=db)
    print("\n--- RAG CHAT RESPONSE ---")
    print(chat_response)
    print("-------------------------\n")

    # 5. Run Multi-paper Comparison
    paper_ids = [p.id for p in db.query(Paper).all()]
    print("[5] Generating Multi-Paper Comparison Report...")
    comparison = run_paper_analysis(paper_ids=paper_ids, action="comparison", db=db)
    print("\n--- COMPARISON REPORT ---")
    print(comparison)
    print("-------------------------\n")

    # 6. Run Gap Detection Analysis
    print("[6] Running Research Gap Detection...")
    gaps = run_paper_analysis(paper_ids=paper_ids, action="gap_detection", db=db)
    print("\n--- GAP DETECTION REPORT ---")
    print(gaps)
    print("-------------------------\n")

    # Cleanup DB file
    db.close()
    if os.path.exists(TEST_DB):
        try:
            os.remove(TEST_DB)
        except Exception:
            pass
    print("=== VERIFICATION COMPLETED ===")

if __name__ == "__main__":
    main()
