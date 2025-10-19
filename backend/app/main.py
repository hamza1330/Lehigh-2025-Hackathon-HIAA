from fastapi import FastAPI

from app.routers import health, groups, profile, sessions, notifications, maintenance

app = FastAPI(title="LockIN API", version="0.1.0")

app.include_router(health.router)
app.include_router(profile.router)
app.include_router(groups.router)
app.include_router(sessions.router)
app.include_router(notifications.router)
app.include_router(maintenance.router)

