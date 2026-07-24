import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from models.models import User, Workspace, Paper, PaperChunk, Document
from main import app

# Setup file-based SQLite database for testing
TEST_DB_FILE = "./test_check.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_DB_FILE}"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override get_db dependency
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    # Delete test db if exists
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except Exception:
            pass
            
    # Create tables
    Base.metadata.create_all(bind=engine)
    yield
    # Drop tables and cleanup file
    Base.metadata.drop_all(bind=engine)
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except Exception:
            pass

@pytest.fixture(scope="module")
def client():
    return TestClient(app)

@pytest.fixture(scope="module")
def auth_headers(client):
    # Register test user
    email = "test@example.com"
    password = "password123"
    
    register_response = client.post(
        "/api/auth/register",
        json={"email": email, "password": password}
    )
    assert register_response.status_code == 201
    
    # Login to get token
    login_response = client.post(
        "/api/auth/login",
        json={"email": email, "password": password}
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    access_token = token_data["access_token"]
    
    return {"Authorization": f"Bearer {access_token}"}

# Tests

def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "ResearchHub AI API is running"}

def test_register_duplicate(client, auth_headers):
    # User test@example.com is already registered by fixture
    response = client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "password123"}
    )
    assert response.status_code == 400

def test_login_invalid(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "wrong_password"}
    )
    assert response.status_code == 401

def test_workspace_operations(client, auth_headers):
    # 1. Create Workspace
    response = client.post(
        "/api/workspaces/",
        json={"name": "Deep Learning Research", "description": "Analyzing LLMs and CNNs"},
        headers=auth_headers
    )
    assert response.status_code == 201
    workspace = response.json()
    assert workspace["name"] == "Deep Learning Research"
    workspace_id = workspace["id"]
    
    # 2. Get Workspaces
    response = client.get("/api/workspaces/", headers=auth_headers)
    assert response.status_code == 200
    workspaces = response.json()
    assert len(workspaces) >= 1
    assert any(w["id"] == workspace_id for w in workspaces)

def test_paper_operations(client, auth_headers):
    # Get workspace first
    response = client.get("/api/workspaces/", headers=auth_headers)
    workspace_id = response.json()[0]["id"]
    
    # 1. Search Papers (mocked/online check)
    response = client.get(
        "/api/papers/search?query=transformer&source=arxiv&limit=2",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "papers" in data
    
    # 2. Import Paper
    response = client.post(
        "/api/papers/import",
        json={
            "workspace_id": workspace_id,
            "title": "Attention Is All You Need",
            "authors": "Vaswani et al.",
            "abstract": "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...",
            "published_date": "2017-06-12",
            "url": "https://arxiv.org/abs/1706.03762",
            "source": "arxiv"
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    paper = response.json()
    assert paper["title"] == "Attention Is All You Need"
    paper_id = paper["id"]
    
    # 3. List Papers
    response = client.get(f"/api/papers/?workspace_id={workspace_id}", headers=auth_headers)
    assert response.status_code == 200
    papers = response.json()
    assert len(papers) == 1
    assert papers[0]["id"] == paper_id

def test_chat_rag(client, auth_headers):
    response = client.get("/api/workspaces/", headers=auth_headers)
    workspace_id = response.json()[0]["id"]
    
    response = client.post(
        "/api/chat/",
        json={"workspace_id": workspace_id, "message": "What is the difference between transformers and CNNs?"},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert "Transformer" in data["response"]
    
    # Check history
    response = client.get(f"/api/chat/history/{workspace_id}", headers=auth_headers)
    assert response.status_code == 200
    history = response.json()
    assert len(history) >= 2 # User message and Assistant response

def test_ai_tools(client, auth_headers):
    response = client.get("/api/workspaces/", headers=auth_headers)
    workspace_id = response.json()[0]["id"]
    
    # Get paper id
    response = client.get(f"/api/papers/?workspace_id={workspace_id}", headers=auth_headers)
    paper_id = response.json()[0]["id"]
    
    response = client.post(
        "/api/ai/analyze",
        json={"paper_ids": [paper_id], "action": "summary"},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "result" in data

def test_document_operations(client, auth_headers):
    response = client.get("/api/workspaces/", headers=auth_headers)
    workspace_id = response.json()[0]["id"]
    
    # 1. Create Document
    response = client.post(
        "/api/documents/",
        json={"title": "My Research Notes", "content": "# Notes\nExploring attention layers.", "workspace_id": workspace_id},
        headers=auth_headers
    )
    assert response.status_code == 201
    doc = response.json()
    assert doc["title"] == "My Research Notes"
    doc_id = doc["id"]
    
    # 2. List Documents
    response = client.get(f"/api/documents/?workspace_id={workspace_id}", headers=auth_headers)
    assert response.status_code == 200
    docs = response.json()
    assert len(docs) == 1
    
    # 3. Update Document
    response = client.put(
        f"/api/documents/{doc_id}",
        json={"content": "# Notes\nExploring attention layers. (Updated)"},
        headers=auth_headers
    )
    assert response.status_code == 200
    updated_doc = response.json()
    assert "Updated" in updated_doc["content"]
    
    # 4. Delete Document
    response = client.delete(f"/api/documents/{doc_id}", headers=auth_headers)
    assert response.status_code == 204

def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
