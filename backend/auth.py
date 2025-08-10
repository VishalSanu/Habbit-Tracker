from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os
from datetime import datetime, timedelta
from typing import Optional
import httpx
from models import User, UserCreate
from database import Database

# JWT Configuration
SECRET_KEY = os.environ.get("JWT_SECRET", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

security = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def verify_google_token(token: str) -> dict:
    """Verify Google OAuth token and return user info"""
    # Handle demo/mock token for testing
    if token == "mock-google-token-for-demo":
        return {
            "google_id": "demo-user-123",
            "email": "demo@habittracker.com",
            "name": "Demo User",
            "picture": "https://via.placeholder.com/150"
        }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?access_token={token}"
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google token"
                )
            
            token_info = response.json()
            
            # Get user profile information
            profile_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if profile_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Could not fetch user profile"
                )
            
            profile_data = profile_response.json()
            
            return {
                "google_id": profile_data.get("id"),
                "email": profile_data.get("email"),
                "name": profile_data.get("name"),
                "picture": profile_data.get("picture")
            }
            
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not verify Google token"
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current user from JWT token"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    user = await Database.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

async def get_or_create_user(google_user_data: dict) -> dict:
    """Get existing user or create new one from Google data"""
    # Check if user exists
    existing_user = await Database.get_user_by_google_id(google_user_data["google_id"])
    
    if existing_user:
        # Update user info in case it changed
        await Database.update_user(existing_user["_id"], {
            "name": google_user_data["name"],
            "picture": google_user_data.get("picture"),
            "email": google_user_data["email"]
        })
        return existing_user
    
    # Create new user
    user_create = UserCreate(**google_user_data)
    user_dict = user_create.dict()
    user_dict["_id"] = str(user_dict.pop("id", ""))
    
    new_user = await Database.create_user(user_dict)
    return new_user