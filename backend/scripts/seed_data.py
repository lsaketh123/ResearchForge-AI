import os
import sys
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal, Base
from models.models import User, Workspace, Paper, Conversation, Document
from routers.auth_utils import get_password_hash

def seed():
    print("=== STARTING DATABASE SEED DATA INJECTION ===")
    
    # Establish session
    db = SessionLocal()
    
    try:
        # 1. Create a Seed User
        seed_email = "pioneer@academic.org"
        user = db.query(User).filter(User.email == seed_email).first()
        if not user:
            print(f"Creating seed user: {seed_email}...")
            user = User(
                email=seed_email,
                hashed_password=get_password_hash("password123"),
                role="researcher"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            print(f"Seed user '{seed_email}' already exists.")

        # 2. Create Quantum Computing Workspace
        ws1_name = "Quantum Computing Lab"
        ws1 = db.query(Workspace).filter(Workspace.name == ws1_name, Workspace.user_id == user.id).first()
        if not ws1:
            print(f"Creating workspace: {ws1_name}...")
            ws1 = Workspace(
                name=ws1_name,
                description="Quantum supremacy, algorithms, and Sycamore evaluations.",
                user_id=user.id
            )
            db.add(ws1)
            db.commit()
            db.refresh(ws1)
        else:
            print(f"Workspace '{ws1_name}' already exists.")

        # 3. Create Autonomous Driving Workspace
        ws2_name = "Autonomous Driving Research"
        ws2 = db.query(Workspace).filter(Workspace.name == ws2_name, Workspace.user_id == user.id).first()
        if not ws2:
            print(f"Creating workspace: {ws2_name}...")
            ws2 = Workspace(
                name=ws2_name,
                description="End-to-end deep learning, path planning, and sensor fusion methodologies.",
                user_id=user.id
            )
            db.add(ws2)
            db.commit()
            db.refresh(ws2)
        else:
            print(f"Workspace '{ws2_name}' already exists.")

        # 4. Seed Quantum Paper
        paper1_title = "Quantum Supremacy Using a Programmable Superconducting Processor"
        p1 = db.query(Paper).filter(Paper.title == paper1_title, Paper.workspace_id == ws1.id).first()
        if not p1:
            print("Importing quantum papers...")
            p1 = Paper(
                title=paper1_title,
                authors="Arute et al., 2019",
                abstract="We report the use of a processor with 53 programmable superconducting qubits to solve a task in 200 seconds that would take a classical supercomputer 10,000 years.",
                published_date="2019-10-23",
                url="https://www.nature.com/articles/s41586-019-1666-5",
                source="arxiv",
                workspace_id=ws1.id,
                user_id=user.id,
                status="completed",
                progress=100
            )
            db.add(p1)
            db.commit()

        # 5. Seed Self-driving Paper
        paper2_title = "End to End Learning for Self-Driving Cars"
        p2 = db.query(Paper).filter(Paper.title == paper2_title, Paper.workspace_id == ws2.id).first()
        if not p2:
            print("Importing driving papers...")
            p2 = Paper(
                title=paper2_title,
                authors="Bojarski et al., Nvidia 2016",
                abstract="We trained a convolutional neural network (CNN) to map raw pixels from a single front-facing camera directly to steering commands. This end-to-end approach proved highly effective.",
                published_date="2016-04-25",
                url="https://arxiv.org/abs/1604.07316",
                source="arxiv",
                workspace_id=ws2.id,
                user_id=user.id,
                status="completed",
                progress=100
            )
            db.add(p2)
            db.commit()

        # 6. Seed mock Chat Messages
        chat_count = db.query(Conversation).filter(Conversation.workspace_id == ws1.id).count()
        if chat_count == 0:
            print("Seeding quantum lab conversation history logs...")
            msg1 = Conversation(
                workspace_id=ws1.id,
                user_id=user.id,
                role="user",
                content="How many qubits did Arute et al. use?"
            )
            msg2 = Conversation(
                workspace_id=ws1.id,
                user_id=user.id,
                role="assistant",
                content="Arute et al. utilized a programmable superconducting processor with 53 active qubits to demonstrate quantum supremacy."
            )
            db.add_all([msg1, msg2])
            db.commit()

        # 7. Seed note files in DocSpace
        doc_count = db.query(Document).filter(Document.workspace_id == ws2.id).count()
        if doc_count == 0:
            print("Seeding self-driving note drafts in Doc Space...")
            doc = Document(
                title="Steering Angles Log",
                content="# CNN Steering Controls\nNotes on end-to-end convolutional feature maps and lane-keeping parameters.",
                workspace_id=ws2.id,
                user_id=user.id
            )
            db.add(doc)
            db.commit()

        print("=== DATABASE SEEDING COMPLETED SUCCESSFULLY ===")
    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
