from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey, Boolean, Text, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="user", nullable=False)
    refresh_token: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    
    # Audit Columns
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    workspaces: Mapped[List["Workspace"]] = relationship("Workspace", back_populates="owner", cascade="all, delete-orphan")
    papers: Mapped[List["Paper"]] = relationship("Paper", back_populates="user")
    documents: Mapped[List["Document"]] = relationship("Document", back_populates="user")
    shares: Mapped[List["WorkspaceShare"]] = relationship("WorkspaceShare", back_populates="user", cascade="all, delete-orphan")


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Soft Delete Support
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Audit Columns
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    owner: Mapped["User"] = relationship("User", back_populates="workspaces")
    papers: Mapped[List["Paper"]] = relationship("Paper", back_populates="workspace", cascade="all, delete-orphan")
    conversations: Mapped[List["Conversation"]] = relationship("Conversation", back_populates="workspace", cascade="all, delete-orphan")
    documents: Mapped[List["Document"]] = relationship("Document", back_populates="workspace", cascade="all, delete-orphan")
    shares: Mapped[List["WorkspaceShare"]] = relationship("WorkspaceShare", back_populates="workspace", cascade="all, delete-orphan")
    ai_reports: Mapped[List["AIReport"]] = relationship("AIReport", back_populates="workspace", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_workspace_is_deleted", "id", "is_deleted"),
    )


class WorkspaceShare(Base):
    __tablename__ = "workspace_shares"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    workspace_id: Mapped[int] = mapped_column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="viewer", nullable=False)
    
    # Audit Columns
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="shares")
    user: Mapped["User"] = relationship("User", back_populates="shares")


class Paper(Base):
    __tablename__ = "papers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(512), index=True, nullable=False)
    authors: Mapped[str] = mapped_column(Text, nullable=False)
    abstract: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    published_date: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    source: Mapped[str] = mapped_column(String(100), default="arxiv", nullable=False)
    workspace_id: Mapped[int] = mapped_column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    extracted_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # PDF Processing engine properties
    status: Mapped[str] = mapped_column(String(50), default="completed", nullable=False)
    progress: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Soft Delete Support
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Audit Columns
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="papers")
    user: Mapped[Optional["User"]] = relationship("User", back_populates="papers")
    chunks: Mapped[List["PaperChunk"]] = relationship("PaperChunk", back_populates="paper", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_paper_workspace_is_deleted", "workspace_id", "is_deleted"),
    )


class PaperChunk(Base):
    __tablename__ = "paper_chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    paper_id: Mapped[int] = mapped_column(Integer, ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    text_content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[Optional[List[float]]] = mapped_column(JSON, nullable=True)

    paper: Mapped["Paper"] = relationship("Paper", back_populates="chunks")

    __table_args__ = (
        Index("idx_chunk_paper_id", "paper_id"),
    )


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    workspace_id: Mapped[int] = mapped_column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Soft Delete Support
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Audit Columns
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="conversations")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    workspace_id: Mapped[int] = mapped_column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Soft Delete Support
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Audit Columns
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="documents")
    user: Mapped["User"] = relationship("User", back_populates="documents")

    __table_args__ = (
        Index("idx_document_workspace_is_deleted", "workspace_id", "is_deleted"),
    )


class AIReport(Base):
    __tablename__ = "ai_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False)  # summary, insights, review
    result_text: Mapped[str] = mapped_column(Text, nullable=False)
    workspace_id: Mapped[int] = mapped_column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    
    # Soft Delete Support
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Audit Columns
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="ai_reports")
