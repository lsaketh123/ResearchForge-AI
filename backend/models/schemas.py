from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, EmailStr, Field

# Authentication Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[str] = None

# Refresh Token Request
class RefreshTokenRequest(BaseModel):
    refresh_token: str

# Workspace Schemas
class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class WorkspaceResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class WorkspaceShareCreate(BaseModel):
    email: EmailStr
    role: str = Field("viewer", description="Role: viewer or editor")

class WorkspaceShareResponse(BaseModel):
    id: int
    workspace_id: int
    user_id: int
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# Paper Schemas
class PaperImportRequest(BaseModel):
    workspace_id: int
    title: str
    authors: str
    abstract: Optional[str] = None
    published_date: Optional[str] = None
    url: Optional[str] = None
    source: str = "arxiv"

class PaperUpdate(BaseModel):
    title: Optional[str] = None
    authors: Optional[str] = None
    abstract: Optional[str] = None

class PaperResponse(BaseModel):
    id: int
    title: str
    authors: str
    abstract: Optional[str] = None
    published_date: Optional[str] = None
    url: Optional[str] = None
    source: str
    workspace_id: int
    user_id: Optional[int] = None
    status: str
    progress: int
    created_at: datetime

    class Config:
        from_attributes = True

class SearchResponse(BaseModel):
    papers: List[Any]

# Chat Schemas
class ChatRequest(BaseModel):
    workspace_id: int
    message: str = Field(..., min_length=1)

class ChatResponse(BaseModel):
    response: str

class ConversationResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

# AI Tools Schemas
class AnalyzeRequest(BaseModel):
    paper_ids: List[int]
    action: str = Field(..., description="Action: summary, insights, or review")

class AnalyzeResponse(BaseModel):
    result: str

# Document Schemas
class DocumentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str
    workspace_id: int

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class DocumentResponse(BaseModel):
    id: int
    title: str
    content: str
    workspace_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
