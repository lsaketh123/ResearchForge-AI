from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from models.models import User
from models.schemas import UserCreate, UserLogin, UserResponse, Token, RefreshTokenRequest
from routers.auth_utils import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    SECRET_KEY,
    ALGORITHM
)
from jose import jwt, JWTError

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Registers a new user in the database.
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
        
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        role="user"  # Default role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Stateless login route for application frontend clients sending JSON.
    """
    user = db.query(User).filter(User.email == user_credentials.email).first()
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user.email, "user_id": user.id, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.email, "user_id": user.id, "role": user.role})
    
    # Store refresh token in user profile
    user.refresh_token = refresh_token
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/login/swagger", response_model=Token, include_in_schema=False)
def login_swagger(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Form-based login route specifically for FastAPI Swagger interactive UI documentation.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user.email, "user_id": user.id, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.email, "user_id": user.id, "role": user.role})
    
    user.refresh_token = refresh_token
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=Token)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Rotates the expired access token using a valid, matching refresh token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(request.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        user_id: int = payload.get("user_id")
        
        if email is None or token_type != "refresh" or user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None or user.refresh_token != request.refresh_token:
        raise credentials_exception
        
    # Generate new tokens
    access_token = create_access_token(data={"sub": user.email, "user_id": user.id, "role": user.role})
    new_refresh_token = create_refresh_token(data={"sub": user.email, "user_id": user.id, "role": user.role})
    
    user.refresh_token = new_refresh_token
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }
