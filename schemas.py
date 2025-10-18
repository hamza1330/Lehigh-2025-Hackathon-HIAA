from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# User schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Goal schemas
class GoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    priority: str = "medium"
    target_date: Optional[datetime] = None

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    target_date: Optional[datetime] = None

class GoalResponse(GoalBase):
    id: int
    status: str
    created_at: datetime
    user_id: int
    
    class Config:
        from_attributes = True

# Verification schemas
class VerificationBase(BaseModel):
    photo_url: Optional[str] = None
    notes: Optional[str] = None

class VerificationCreate(VerificationBase):
    goal_id: int

class VerificationResponse(VerificationBase):
    id: int
    verified_at: datetime
    ai_confidence: Optional[int] = None
    is_verified: bool
    goal_id: int
    
    class Config:
        from_attributes = True
