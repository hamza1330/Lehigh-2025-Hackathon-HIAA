#!/usr/bin/env python3
"""
Simple FastAPI Application - No Database Required
Run with: python simple_main.py
"""

from fastapi import FastAPI
from datetime import datetime
import uvicorn

# Create FastAPI app
app = FastAPI(
    title="GoalTracker API - Simple Version",
    description="Social Accountability App with AI Photo Verification",
    version="1.0.0"
)

# In-memory storage for demo
users_db = []
goals_db = []
verifications_db = []

# Root endpoint
@app.get("/")
def root():
    return {
        "message": "🎯 GoalTracker API - Simple Version",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "In-memory (demo mode)",
        "features": [
            "Goal Tracking",
            "User Management", 
            "Photo Verification",
            "Social Accountability"
        ]
    }

# Health check
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "users_count": len(users_db),
        "goals_count": len(goals_db)
    }

# User endpoints
@app.post("/users/")
def create_user(user_data: dict):
    user_id = len(users_db) + 1
    user = {
        "id": user_id,
        "name": user_data.get("name", "Unknown"),
        "email": user_data.get("email", "user@example.com"),
        "created_at": datetime.utcnow().isoformat()
    }
    users_db.append(user)
    return user

@app.get("/users/")
def get_users():
    return {"users": users_db, "count": len(users_db)}

# Goal endpoints
@app.post("/goals/")
def create_goal(goal_data: dict):
    goal_id = len(goals_db) + 1
    goal = {
        "id": goal_id,
        "title": goal_data.get("title", "New Goal"),
        "description": goal_data.get("description", ""),
        "category": goal_data.get("category", "personal"),
        "status": "active",
        "user_id": goal_data.get("user_id", 1),
        "created_at": datetime.utcnow().isoformat()
    }
    goals_db.append(goal)
    return goal

@app.get("/goals/")
def get_goals():
    return {"goals": goals_db, "count": len(goals_db)}

@app.get("/goals/{goal_id}")
def get_goal(goal_id: int):
    for goal in goals_db:
        if goal["id"] == goal_id:
            return goal
    return {"error": "Goal not found"}

# Verification endpoints
@app.post("/verifications/")
def create_verification(verification_data: dict):
    verification_id = len(verifications_db) + 1
    verification = {
        "id": verification_id,
        "goal_id": verification_data.get("goal_id", 1),
        "photo_url": verification_data.get("photo_url", ""),
        "ai_confidence": verification_data.get("ai_confidence", 85),
        "is_verified": True,
        "verified_at": datetime.utcnow().isoformat()
    }
    verifications_db.append(verification)
    return verification

@app.get("/verifications/")
def get_verifications():
    return {"verifications": verifications_db, "count": len(verifications_db)}

# Demo data endpoint
@app.post("/demo/setup")
def setup_demo_data():
    # Clear existing data
    users_db.clear()
    goals_db.clear()
    verifications_db.clear()
    
    # Add demo users
    users_db.extend([
        {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com",
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": 2,
            "name": "Jane Smith",
            "email": "jane@example.com",
            "created_at": datetime.utcnow().isoformat()
        }
    ])
    
    # Add demo goals
    goals_db.extend([
        {
            "id": 1,
            "title": "Run 5K",
            "description": "Complete a 5K run",
            "category": "fitness",
            "status": "active",
            "user_id": 1,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": 2,
            "title": "Learn Python",
            "description": "Master Python programming",
            "category": "education",
            "status": "active",
            "user_id": 2,
            "created_at": datetime.utcnow().isoformat()
        }
    ])
    
    # Add demo verifications
    verifications_db.extend([
        {
            "id": 1,
            "goal_id": 1,
            "photo_url": "https://example.com/run-photo.jpg",
            "ai_confidence": 92,
            "is_verified": True,
            "verified_at": datetime.utcnow().isoformat()
        }
    ])
    
    return {
        "message": "Demo data setup complete",
        "users": len(users_db),
        "goals": len(goals_db),
        "verifications": len(verifications_db)
    }

# API info endpoint
@app.get("/api/info")
def api_info():
    return {
        "api_name": "GoalTracker API",
        "version": "1.0.0",
        "description": "Social Accountability App with AI Photo Verification",
        "endpoints": [
            "GET / - Root endpoint",
            "GET /health - Health check",
            "POST /users/ - Create user",
            "GET /users/ - List users",
            "POST /goals/ - Create goal",
            "GET /goals/ - List goals",
            "GET /goals/{id} - Get specific goal",
            "POST /verifications/ - Create verification",
            "GET /verifications/ - List verifications",
            "POST /demo/setup - Setup demo data"
        ],
        "features": [
            "User Management",
            "Goal Tracking",
            "Photo Verification",
            "AI Integration Ready",
            "Social Accountability"
        ]
    }

if __name__ == "__main__":
    print("🚀 Starting GoalTracker API (Simple Version)...")
    print("📍 URL: http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")
    print("🎯 Demo Setup: POST http://localhost:8000/demo/setup")
    
    uvicorn.run(
        "simple_main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
