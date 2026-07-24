# ResearchHub AI

Intelligent Research Paper Management and Analysis System using Agentic AI.

ResearchHub AI is a production-quality web application built using **React** and **TypeScript** for the frontend, **FastAPI** for backend processing, and integrated with **Groq's Llama 3.3 70B** model for advanced natural language understanding. It enables researchers to query academic databases (arXiv, PubMed) concurrently, import papers into project-specific workspaces, upload local PDFs, edit notes in a dedicated Doc Space, and interact with a context-aware AI chatbot using local semantic vector search.

---

## 1. Project Folder Structure

```
ResearchHub-AI/
├── backend/
│   ├── main.py                 # FastAPI Application entry point
│   ├── database.py             # Database connections (SQLAlchemy sync/async)
│   ├── requirements.txt        # Backend dependencies
│   ├── .env                    # Secrets and environment configs
│   ├── models/                 # SQLAlchemy schemas & validation classes
│   │   ├── models.py           # DB Tables (User, Workspace, Paper, Chunks, etc.)
│   │   └── schemas.py          # Pydantic schemas (requests & responses)
│   ├── routers/                # API Route modules
│   │   ├── auth.py             # User Register, Login & JWT refreshes
│   │   ├── workspaces.py       # Projects, folders & share systems
│   │   ├── papers.py           # Academic searches & PDF vector indexes
│   │   ├── chat.py             # Conversational RAG queries
│   │   ├── ai.py               # AI summaries & literature reviews
│   │   └── documents.py        # Doc Space note CRUD
│   ├── utils/                  # Helper modules
│   │   ├── groq_client.py      # Llama 3.3 API integration with fallback
│   │   ├── academic_search.py  # Concurrency arXiv + PubMed feeds
│   │   ├── pdf_parser.py       # pypdf parser & text chunking
│   │   └── vector_store.py     # SentenceTransformers semantic searches
│   └── tests/                  # Backend endpoints integration suite
├── frontend/
│   ├── vite.config.ts          # Vite build setups and backend server proxy
│   ├── tailwind.config.js      # Custom theme colors and dark mode switches
│   ├── package.json            # React project dependencies
│   └── src/
│       ├── main.tsx            # DOM mounting root
│       ├── App.tsx             # Theme toggler & routing setup
│       ├── index.css           # Tailwind base styles and glass effects
│       ├── components/         # Layout modules (Sidebar, Navbar, Globe)
│       └── pages/              # User screens (Dashboard, DocSpace, etc.)
└── README.md
```

---

## 2. Requirements & Pre-requisites

- **Python**: 3.12 or 3.13
- **Node.js**: v18+ and **NPM**
- **Database**: PostgreSQL (defaults to port 5432) or SQLite auto-fallback.
- **Groq API Key**: Optional (system falls back to simulation mode if no key is supplied).

---

## 3. Quick Start Setup

### 3.1 Running the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Unix/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Verify/Edit the environment configuration in `.env`:
   - If PostgreSQL is not running, database queries automatically fallback to a local SQLite database (`sqlite:///./researchhub.db`).
5. Generate and apply initial database migrations:
   ```bash
   alembic upgrade head
   ```
6. Run the integration test suite:
   ```bash
   pytest
   ```
7. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   *The Swagger API documentation is available at `http://localhost:8000/docs`.*

### 3.2 Running the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Compile the production bundles:
   ```bash
   npm run build
   ```
4. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The client application launches at `http://localhost:3000`.*
   *All `/api/*` network requests sent from the client are automatically proxied to port 8000 by Vite.*


# 🎥 Demo Video

Watch the full project demo here:

[(https://drive.google.com/file/d/1c6Isumjiu1Ne3D4ca9DXjYAUXSHrzFE9/view?usp=sharing)]
