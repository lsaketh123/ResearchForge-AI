import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base, sessionmaker, DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

# Setup Logging
logger = logging.getLogger("researchhub.database")
logging.basicConfig(level=logging.INFO)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./researchhub.db")

class Base(DeclarativeBase):
    pass

# Engine initialization placeholders
engine = None
SessionLocal = None
async_engine = None
async_session_maker = None

def init_db():
    global engine, SessionLocal, async_engine, async_session_maker
    
    # Try connecting to PostgreSQL, fallback to SQLite if fail
    db_url = DATABASE_URL
    is_postgres = db_url.startswith("postgresql://") or db_url.startswith("postgresql+psycopg2://")
    
    try:
        if is_postgres:
            sync_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
            async_url = db_url.replace("postgresql://", "postgresql+asyncpg://").replace("postgresql+psycopg2://", "postgresql+asyncpg://")
            
            logger.info(f"Connecting to PostgreSQL Sync URL: {sync_url}")
            engine = create_engine(sync_url, pool_pre_ping=True, pool_size=10, max_overflow=20)
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
            
            logger.info(f"Connecting to PostgreSQL Async URL: {async_url}")
            async_engine = create_async_engine(async_url, pool_pre_ping=True, pool_size=10, max_overflow=20)
            async_session_maker = async_sessionmaker(async_engine, expire_on_commit=False)
            
            # Simple connection test to verify DB server is up
            with engine.connect() as conn:
                logger.info("Successfully connected to PostgreSQL database.")
        else:
            raise ValueError("Not PostgreSQL, using SQLite")
            
    except Exception as e:
        logger.warning(f"Failed to initialize PostgreSQL: {e}. Falling back to SQLite local database.")
        sqlite_url = "sqlite:///./researchhub.db"
        engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        async_engine = create_async_engine("sqlite+aiosqlite:///./researchhub.db")
        async_session_maker = async_sessionmaker(async_engine, expire_on_commit=False)

init_db()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_async_db():
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
