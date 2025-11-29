from typing import Optional
from fastapi import Depends, HTTPException, status, Query, WebSocketException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

# HTTP Bearer token scheme
security = HTTPBearer()


def get_user_from_token(token: str, db: Session) -> User:
    """Helper to validate token and get user"""
    print(f"🔐 Validating token: {token[:10]}...")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Decode token
    payload = decode_access_token(token)
    if payload is None:
        print("❌ Token decode failed (payload is None)")
        raise credentials_exception
        
    print(f"✅ Token decoded. Payload: {payload}")
    
    # Extract user_id from payload
    user_id_str: str = payload.get("sub")
    if user_id_str is None:
        print("❌ No 'sub' in payload")
        raise credentials_exception
    
    try:
        user_id = UUID(user_id_str)
    except ValueError:
        print(f"❌ Invalid UUID in 'sub': {user_id_str}")
        raise credentials_exception
    
    # Get user from database
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        print(f"❌ User not found for ID: {user_id}")
        raise credentials_exception
    
    if not user.is_active:
        print(f"❌ User {user_id} is inactive")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
        
    print(f"✅ User authenticated: {user.email}")
    return user


def get_current_user_ws(
    token: str = Query(...),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token in Query param.
    Used for WebSockets.
    """
    try:
        return get_user_from_token(token, db)
    except HTTPException as e:
        print(f"❌ WebSocket auth failed: {e.detail}")
        # For WebSockets, we must raise WebSocketException
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Authorization credentials
        db: Database session
    
    Returns:
        User: The authenticated user
    
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Extract token
    token = credentials.credentials
    
    try:
        return get_user_from_token(token, db)
    except HTTPException:
        raise credentials_exception


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to ensure user is active.
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        User: The active user
    
    Raises:
        HTTPException: If user is not active
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Dependency to optionally get current user (allows anonymous access).
    
    Args:
        credentials: Optional HTTP Authorization credentials
        db: Database session
    
    Returns:
        Optional[User]: User if authenticated, None otherwise
    """
    if credentials is None:
        return None
    
    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None
