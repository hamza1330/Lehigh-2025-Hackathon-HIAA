from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from typing import Optional
import boto3
from botocore.exceptions import ClientError

from app.core.database import get_db
from app.core.config import settings
from app.models import Profile, AuthIdentity
from app.schemas import Profile as ProfileSchema, ProfileUpdate, AuthIdentityCreate

router = APIRouter()
security = HTTPBearer()

# AWS Cognito client
cognito_client = boto3.client(
    'cognito-idp',
    region_name=settings.cognito_region,
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key
)

def verify_cognito_token(token: str) -> dict:
    """Verify Cognito JWT token and extract claims"""
    try:
        # In production, you should verify the JWT signature using Cognito's JWKS
        # For now, we'll decode without verification (not recommended for production)
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Profile:
    """Get current authenticated user"""
    token = credentials.credentials
    payload = verify_cognito_token(token)
    
    # Extract provider and subject from token
    provider = payload.get("iss", "").split("/")[-1]  # Extract user pool ID
    subject = payload.get("sub")
    
    if not provider or not subject:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format"
        )
    
    # Find or create auth identity
    auth_identity = db.query(AuthIdentity).filter(
        AuthIdentity.provider == provider,
        AuthIdentity.subject == subject
    ).first()
    
    if not auth_identity:
        # Create new user from Cognito token
        email = payload.get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not found in token"
            )
        
        # Create profile
        profile = Profile(
            email=email,
            display_name=payload.get("name", email.split("@")[0])
        )
        db.add(profile)
        db.flush()  # Get the ID
        
        # Create auth identity
        auth_identity = AuthIdentity(
            provider=provider,
            subject=subject,
            profile_id=profile.id
        )
        db.add(auth_identity)
        db.commit()
        db.refresh(profile)
        return profile
    
    return auth_identity.profile

@router.get("/me", response_model=ProfileSchema)
async def get_current_profile(current_user: Profile = Depends(get_current_user)):
    """Get current user profile"""
    return current_user

@router.patch("/me", response_model=ProfileSchema)
async def update_current_profile(
    profile_update: ProfileUpdate,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    for field, value in profile_update.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user
