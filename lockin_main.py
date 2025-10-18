#!/usr/bin/env python3
"""
LockIn - Social Scheduling + Focus Lock for Real Productivity
Run with: python lockin_main.py
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import uvicorn
import json
from typing import List, Dict
import asyncio

# Create FastAPI app
app = FastAPI(
    title="LockIn API",
    description="Social Scheduling + Focus Lock for Real Productivity",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# In-memory storage for demo
users_db = []
groups_db = []
sessions_db = []
time_logs_db = []
focus_events_db = []
active_sessions = {}  # user_id -> session_data
websocket_connections = []  # Active WebSocket connections

# Root endpoint
@app.get("/")
def root():
    return {
        "message": "🔒 LockIn - Social Scheduling + Focus Lock",
        "tagline": "Plan together. Lock in together. Win together.",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "In-memory (demo mode)",
        "features": [
            "Group Creation & Shared Goals",
            "Lock-In Sessions (Social Scheduling)",
            "Clock-In/Clock-Out Timer",
            "Focus Lock 🔒 (Distraction Prevention)",
            "Real-time Group Presence",
            "Progress Dashboard",
            "Social Motivation & Reactions"
        ]
    }

# Health check
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "users_count": len(users_db),
        "groups_count": len(groups_db),
        "sessions_count": len(sessions_db),
        "active_sessions": len(active_sessions)
    }

# User endpoints
@app.post("/users/")
def create_user(user_data: dict):
    user_id = len(users_db) + 1
    user = {
        "id": user_id,
        "name": user_data.get("name", "Unknown"),
        "email": user_data.get("email", "user@example.com"),
        "avatar": user_data.get("avatar", "👤"),
        "created_at": datetime.utcnow().isoformat(),
        "total_hours": 0,
        "streak_days": 0,
        "focus_score": 0
    }
    users_db.append(user)
    return user

@app.get("/users/")
def get_users():
    return {"users": users_db, "count": len(users_db)}

# Group endpoints
@app.post("/groups/")
def create_group(group_data: dict):
    group_id = len(groups_db) + 1
    group = {
        "id": group_id,
        "name": group_data.get("name", "New Group"),
        "description": group_data.get("description", ""),
        "invite_code": f"LOCK{group_id:04d}",
        "admin_id": group_data.get("admin_id", 1),
        "members": [group_data.get("admin_id", 1)],
        "weekly_goal": group_data.get("weekly_goal", 40),  # hours per week
        "created_at": datetime.utcnow().isoformat(),
        "is_active": True
    }
    groups_db.append(group)
    return group

@app.get("/groups/")
def get_groups():
    return {"groups": groups_db, "count": len(groups_db)}

@app.post("/groups/{group_id}/join")
def join_group(group_id: int, user_data: dict):
    user_id = user_data.get("user_id")
    for group in groups_db:
        if group["id"] == group_id:
            if user_id not in group["members"]:
                group["members"].append(user_id)
            return {"message": "Joined group successfully", "group": group}
    return {"error": "Group not found"}

# Session endpoints
@app.post("/sessions/")
def create_session(session_data: dict):
    session_id = len(sessions_db) + 1
    session = {
        "id": session_id,
        "title": session_data.get("title", "Focus Session"),
        "description": session_data.get("description", ""),
        "group_id": session_data.get("group_id", 1),
        "start_time": session_data.get("start_time"),
        "end_time": session_data.get("end_time"),
        "duration_minutes": session_data.get("duration_minutes", 60),
        "tag": session_data.get("tag", "Study"),
        "created_by": session_data.get("created_by", 1),
        "participants": [],
        "status": "scheduled",  # scheduled, active, completed
        "created_at": datetime.utcnow().isoformat()
    }
    sessions_db.append(session)
    return session

@app.get("/sessions/")
def get_sessions():
    return {"sessions": sessions_db, "count": len(sessions_db)}

@app.post("/sessions/{session_id}/join")
def join_session(session_id: int, user_data: dict):
    user_id = user_data.get("user_id")
    for session in sessions_db:
        if session["id"] == session_id:
            if user_id not in session["participants"]:
                session["participants"].append(user_id)
            return {"message": "Joined session successfully", "session": session}
    return {"error": "Session not found"}

# Timer endpoints
@app.post("/sessions/{session_id}/start")
def start_session(session_id: int, user_data: dict):
    user_id = user_data.get("user_id")
    session = next((s for s in sessions_db if s["id"] == session_id), None)
    
    if not session:
        return {"error": "Session not found"}
    
    if user_id not in session["participants"]:
        return {"error": "User not in session"}
    
    # Start active session
    active_sessions[user_id] = {
        "session_id": session_id,
        "start_time": datetime.utcnow(),
        "status": "active",
        "focus_lock_enabled": True,
        "distractions_blocked": 0
    }
    
    session["status"] = "active"
    
    # Notify all WebSocket connections
    asyncio.create_task(broadcast_presence_update())
    
    return {
        "message": "Session started",
        "session": session,
        "start_time": active_sessions[user_id]["start_time"].isoformat()
    }

@app.post("/sessions/{session_id}/stop")
def stop_session(session_id: int, user_data: dict):
    user_id = user_data.get("user_id")
    
    if user_id not in active_sessions:
        return {"error": "No active session found"}
    
    session_data = active_sessions[user_id]
    start_time = session_data["start_time"]
    end_time = datetime.utcnow()
    duration_minutes = int((end_time - start_time).total_seconds() / 60)
    
    # Log the time
    time_log = {
        "id": len(time_logs_db) + 1,
        "user_id": user_id,
        "session_id": session_id,
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "duration_minutes": duration_minutes,
        "tag": session_data.get("tag", "Study"),
        "distractions_blocked": session_data["distractions_blocked"]
    }
    time_logs_db.append(time_log)
    
    # Update user stats
    for user in users_db:
        if user["id"] == user_id:
            user["total_hours"] += duration_minutes / 60
            user["focus_score"] = min(100, user["focus_score"] + 5)
            break
    
    # Remove from active sessions
    del active_sessions[user_id]
    
    # Notify all WebSocket connections
    asyncio.create_task(broadcast_presence_update())
    
    return {
        "message": "Session completed",
        "duration_minutes": duration_minutes,
        "distractions_blocked": session_data["distractions_blocked"],
        "time_log": time_log
    }

# Focus Lock endpoints
@app.post("/focus-lock/enable")
def enable_focus_lock(user_data: dict):
    user_id = user_data.get("user_id")
    
    if user_id not in active_sessions:
        return {"error": "No active session to lock"}
    
    active_sessions[user_id]["focus_lock_enabled"] = True
    
    return {
        "message": "Focus Lock enabled",
        "status": "locked",
        "features": [
            "Auto-pause on app switch",
            "Distraction blocking",
            "Focus mode activation"
        ]
    }

@app.post("/focus-lock/distraction")
def log_distraction(distraction_data: dict):
    user_id = distraction_data.get("user_id")
    app_name = distraction_data.get("app_name", "Unknown App")
    
    if user_id in active_sessions:
        active_sessions[user_id]["distractions_blocked"] += 1
    
    focus_event = {
        "id": len(focus_events_db) + 1,
        "user_id": user_id,
        "event_type": "distraction_blocked",
        "app_name": app_name,
        "timestamp": datetime.utcnow().isoformat()
    }
    focus_events_db.append(focus_event)
    
    return {
        "message": "Distraction blocked",
        "total_blocked": active_sessions.get(user_id, {}).get("distractions_blocked", 0)
    }

# Presence and real-time endpoints
@app.get("/presence/")
def get_presence():
    active_users = []
    for user_id, session_data in active_sessions.items():
        user = next((u for u in users_db if u["id"] == user_id), None)
        if user:
            active_users.append({
                "user_id": user_id,
                "name": user["name"],
                "avatar": user["avatar"],
                "session_id": session_data["session_id"],
                "start_time": session_data["start_time"].isoformat(),
                "focus_lock_enabled": session_data["focus_lock_enabled"]
            })
    
    return {
        "active_users": active_users,
        "count": len(active_users),
        "message": f"{len(active_users)} friends locked in right now"
    }

# Progress and analytics
@app.get("/progress/{user_id}")
def get_user_progress(user_id: int):
    user = next((u for u in users_db if u["id"] == user_id), None)
    if not user:
        return {"error": "User not found"}
    
    # Get user's time logs
    user_logs = [log for log in time_logs_db if log["user_id"] == user_id]
    total_hours = sum(log["duration_minutes"] for log in user_logs) / 60
    distractions_blocked = sum(log["distractions_blocked"] for log in user_logs)
    
    # Get user's groups
    user_groups = [g for g in groups_db if user_id in g["members"]]
    
    return {
        "user": user,
        "total_hours": round(total_hours, 2),
        "distractions_blocked": distractions_blocked,
        "sessions_completed": len(user_logs),
        "groups": user_groups,
        "focus_score": user["focus_score"],
        "streak_days": user["streak_days"]
    }

@app.get("/dashboard/{group_id}")
def get_group_dashboard(group_id: int):
    group = next((g for g in groups_db if g["id"] == group_id), None)
    if not group:
        return {"error": "Group not found"}
    
    # Get group members' progress
    member_progress = []
    for member_id in group["members"]:
        member_logs = [log for log in time_logs_db if log["user_id"] == member_id]
        total_hours = sum(log["duration_minutes"] for log in member_logs) / 60
        member = next((u for u in users_db if u["id"] == member_id), None)
        if member:
            member_progress.append({
                "user": member,
                "total_hours": round(total_hours, 2),
                "goal_percentage": round((total_hours / group["weekly_goal"]) * 100, 1)
            })
    
    return {
        "group": group,
        "member_progress": member_progress,
        "group_total_hours": round(sum(mp["total_hours"] for mp in member_progress), 2),
        "group_goal_percentage": round((sum(mp["total_hours"] for mp in member_progress) / group["weekly_goal"]) * 100, 1)
    }

# WebSocket for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    websocket_connections.append(websocket)
    
    try:
        while True:
            # Keep connection alive and send periodic updates
            await asyncio.sleep(5)
            await websocket.send_text(json.dumps({
                "type": "presence_update",
                "active_sessions": len(active_sessions),
                "timestamp": datetime.utcnow().isoformat()
            }))
    except WebSocketDisconnect:
        websocket_connections.remove(websocket)

async def broadcast_presence_update():
    """Broadcast presence update to all connected clients"""
    if websocket_connections:
        message = json.dumps({
            "type": "presence_update",
            "active_sessions": len(active_sessions),
            "timestamp": datetime.utcnow().isoformat()
        })
        for connection in websocket_connections:
            try:
                await connection.send_text(message)
            except:
                websocket_connections.remove(connection)

# Demo data setup
@app.post("/demo/setup")
def setup_demo_data():
    # Clear existing data
    users_db.clear()
    groups_db.clear()
    sessions_db.clear()
    time_logs_db.clear()
    focus_events_db.clear()
    active_sessions.clear()
    
    # Create demo users
    demo_users = [
        {"id": 1, "name": "Alex Chen", "email": "alex@example.com", "avatar": "👨‍💻", "total_hours": 0, "streak_days": 0, "focus_score": 0},
        {"id": 2, "name": "Sarah Kim", "email": "sarah@example.com", "avatar": "👩‍🎓", "total_hours": 0, "streak_days": 0, "focus_score": 0},
        {"id": 3, "name": "Mike Johnson", "email": "mike@example.com", "avatar": "👨‍🔬", "total_hours": 0, "streak_days": 0, "focus_score": 0}
    ]
    users_db.extend(demo_users)
    
    # Create demo group
    demo_group = {
        "id": 1,
        "name": "CS Finals Squad",
        "description": "Study group for CS finals preparation",
        "invite_code": "LOCK0001",
        "admin_id": 1,
        "members": [1, 2, 3],
        "weekly_goal": 40,
        "created_at": datetime.utcnow().isoformat(),
        "is_active": True
    }
    groups_db.append(demo_group)
    
    # Create demo sessions
    demo_sessions = [
        {
            "id": 1,
            "title": "Algorithm Study Session",
            "description": "Review algorithms and data structures",
            "group_id": 1,
            "start_time": (datetime.utcnow() + timedelta(hours=1)).isoformat(),
            "end_time": (datetime.utcnow() + timedelta(hours=3)).isoformat(),
            "duration_minutes": 120,
            "tag": "Algorithms",
            "created_by": 1,
            "participants": [1, 2, 3],
            "status": "scheduled",
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": 2,
            "title": "Database Design Review",
            "description": "Database concepts and SQL practice",
            "group_id": 1,
            "start_time": (datetime.utcnow() + timedelta(hours=4)).isoformat(),
            "end_time": (datetime.utcnow() + timedelta(hours=6)).isoformat(),
            "duration_minutes": 120,
            "tag": "Database",
            "created_by": 2,
            "participants": [1, 2],
            "status": "scheduled",
            "created_at": datetime.utcnow().isoformat()
        }
    ]
    sessions_db.extend(demo_sessions)
    
    return {
        "message": "LockIn demo data setup complete!",
        "users": len(users_db),
        "groups": len(groups_db),
        "sessions": len(sessions_db),
        "features": [
            "Create groups with invite codes",
            "Schedule Lock-In sessions",
            "Real-time focus tracking",
            "Focus Lock distraction prevention",
            "Social accountability and motivation"
        ]
    }

# API info endpoint
@app.get("/api/info")
def api_info():
    return {
        "api_name": "LockIn API",
        "version": "1.0.0",
        "description": "Social Scheduling + Focus Lock for Real Productivity",
        "tagline": "Plan together. Lock in together. Win together.",
        "endpoints": [
            "GET / - Root endpoint",
            "GET /health - Health check",
            "POST /users/ - Create user",
            "GET /users/ - List users",
            "POST /groups/ - Create group",
            "GET /groups/ - List groups",
            "POST /groups/{id}/join - Join group",
            "POST /sessions/ - Create session",
            "GET /sessions/ - List sessions",
            "POST /sessions/{id}/join - Join session",
            "POST /sessions/{id}/start - Start session",
            "POST /sessions/{id}/stop - Stop session",
            "POST /focus-lock/enable - Enable Focus Lock",
            "POST /focus-lock/distraction - Log distraction",
            "GET /presence/ - Get active users",
            "GET /progress/{user_id} - User progress",
            "GET /dashboard/{group_id} - Group dashboard",
            "WebSocket /ws - Real-time updates",
            "POST /demo/setup - Setup demo data"
        ],
        "features": [
            "Group Creation & Shared Goals",
            "Lock-In Sessions (Social Scheduling)",
            "Clock-In/Clock-Out Timer",
            "Focus Lock 🔒 (Distraction Prevention)",
            "Real-time Group Presence",
            "Progress Dashboard",
            "Social Motivation & Reactions"
        ]
    }

if __name__ == "__main__":
    print("🔒 Starting LockIn API...")
    print("📍 URL: http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")
    print("🎯 Demo Setup: POST http://localhost:8000/demo/setup")
    print("🔗 WebSocket: ws://localhost:8000/ws")
    
    uvicorn.run(
        "lockin_main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
