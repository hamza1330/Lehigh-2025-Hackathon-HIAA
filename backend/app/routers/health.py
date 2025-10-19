from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["health"])

@router.get("/healthz")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
