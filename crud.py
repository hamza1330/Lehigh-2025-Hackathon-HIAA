from sqlalchemy.orm import Session
from sqlalchemy import and_
from models import User, Goal, Verification
from schemas import UserCreate, GoalCreate, VerificationCreate
from passlib.context import CryptContext
from datetime import datetime
from typing import List, Optional

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# User CRUD operations
def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        name=user.name,
        email=user.email,
        password_hash=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    return user

# Goal CRUD operations
def get_goals(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(Goal).filter(Goal.user_id == user_id).offset(skip).limit(limit).all()

def get_goal(db: Session, goal_id: int, user_id: int):
    return db.query(Goal).filter(and_(Goal.id == goal_id, Goal.user_id == user_id)).first()

def create_goal(db: Session, goal: GoalCreate, user_id: int):
    db_goal = Goal(**goal.dict(), user_id=user_id)
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

def update_goal(db: Session, goal_id: int, user_id: int, goal_update: dict):
    db_goal = get_goal(db, goal_id, user_id)
    if db_goal:
        for key, value in goal_update.items():
            if value is not None:
                setattr(db_goal, key, value)
        db_goal.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_goal)
    return db_goal

def delete_goal(db: Session, goal_id: int, user_id: int):
    db_goal = get_goal(db, goal_id, user_id)
    if db_goal:
        db.delete(db_goal)
        db.commit()
    return db_goal

# Verification CRUD operations
def create_verification(db: Session, verification: VerificationCreate):
    db_verification = Verification(**verification.dict())
    db.add(db_verification)
    db.commit()
    db.refresh(db_verification)
    return db_verification

def get_verifications_by_goal(db: Session, goal_id: int):
    return db.query(Verification).filter(Verification.goal_id == goal_id).all()
