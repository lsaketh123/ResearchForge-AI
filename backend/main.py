import logging
import time
from collections import defaultdict
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, workspaces, papers, chat, ai, documents

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("researchhub.main")

# Auto-create tables at startup (extremely robust local behavior)
try:
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
except Exception as e:
    logger.error(f"Error initializing database tables: {e}")

app = FastAPI(title="ResearchHub AI API", version="1.0.0")

# Custom Sliding-Window Rate Limiter Config
RATE_LIMIT_REQUESTS = 250  # Allow ample headroom for local concurrent automated tests
RATE_LIMIT_WINDOW = 60
client_requests = defaultdict(list)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    current_time = time.time()
    
    # Filter out requests older than the window
    client_requests[client_ip] = [
        t for t in client_requests[client_ip]
        if current_time - t < RATE_LIMIT_WINDOW
    ]
    
    if len(client_requests[client_ip]) >= RATE_LIMIT_REQUESTS:
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Too many requests. Please try again in a minute."}
        )
        
    client_requests[client_ip].append(current_time)
    response = await call_next(request)
    return response

# CORS Middleware Configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please check server logs."}
    )

# Include Routers
app.include_router(auth.router)
app.include_router(workspaces.router)
app.include_router(papers.router)
app.include_router(chat.router)
app.include_router(ai.router)
app.include_router(documents.router)

from fastapi import Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "unhealthy", "database": str(e)}
        )

@app.get("/")
async def root():
    return {"message": "ResearchHub AI API is running"}
