from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db, engine
import models
import crud
import schemas
from datetime import datetime
import os

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="GoalTracker API",
    description="Social Accountability App with AI Photo Verification",
    version="1.0.0"
)

# Security
security = HTTPBearer()

# Dependency to get current user (simplified for demo)
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    # In a real app, you'd decode the JWT token here
    # For demo purposes, we'll skip authentication
    return {"user_id": 1}

# Root endpoint
@app.get("/")
def root():
    return {
        "message": "🎯 GoalTracker API - Connected to AWS RDS successfully!",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "PostgreSQL on AWS RDS"
    }

# Health check
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "timestamp": datetime.utcnow().isoformat()
    }

# User endpoints
@app.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id=current_user["user_id"])
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Goal endpoints
@app.post("/goals/", response_model=schemas.GoalResponse)
def create_goal(goal: schemas.GoalCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.create_goal(db=db, goal=goal, user_id=current_user["user_id"])

@app.get("/goals/", response_model=list[schemas.GoalResponse])
def read_goals(skip: int = 0, limit: int = 100, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    goals = crud.get_goals(db, user_id=current_user["user_id"], skip=skip, limit=limit)
    return goals

@app.get("/goals/{goal_id}", response_model=schemas.GoalResponse)
def read_goal(goal_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = crud.get_goal(db, goal_id=goal_id, user_id=current_user["user_id"])
    if goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal

@app.put("/goals/{goal_id}", response_model=schemas.GoalResponse)
def update_goal(goal_id: int, goal_update: schemas.GoalUpdate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = crud.update_goal(db, goal_id=goal_id, user_id=current_user["user_id"], goal_update=goal_update.dict(exclude_unset=True))
    if goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal

@app.delete("/goals/{goal_id}")
def delete_goal(goal_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = crud.delete_goal(db, goal_id=goal_id, user_id=current_user["user_id"])
    if goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted successfully"}

# Verification endpoints
@app.post("/verifications/", response_model=schemas.VerificationResponse)
def create_verification(verification: schemas.VerificationCreate, db: Session = Depends(get_db)):
    return crud.create_verification(db=db, verification=verification)

@app.get("/goals/{goal_id}/verifications", response_model=list[schemas.VerificationResponse])
def get_goal_verifications(goal_id: int, db: Session = Depends(get_db)):
    verifications = crud.get_verifications_by_goal(db, goal_id=goal_id)
    return verifications

# Database info endpoint
@app.get("/database/info")
def database_info():
    return {
        "database_type": "PostgreSQL",
        "host": "AWS RDS",
        "connection_status": "connected",
        "tables": ["users", "goals", "verifications"],
        "features": [
            "AI Photo Verification",
            "Social Accountability",
            "Goal Tracking",
            "Real-time Updates"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
