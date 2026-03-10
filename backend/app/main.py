import asyncio
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers.admin_router import router as admin_router
from app.routers.auth_router import router as auth_router
from app.routers.push_router import router as push_router
from app.routers.round_router import router as round_router
from app.routers.turn_router import router as turn_router
from app.routers.user_router import router as user_router
from app.routers.vote_router import router as vote_router
from app.db.session import SessionLocal
from app.services.turn_notification_service import send_daily_turn_notifications
from app.services.vote_service import close_all_expired_votes


app = FastAPI(title="MatecoApp API", version="0.1.0")
settings = get_settings()
allowed_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"http://192\.168\.\d+\.\d+:3000|https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(round_router)
app.include_router(turn_router)
app.include_router(admin_router)
app.include_router(push_router)
app.include_router(vote_router)


async def _daily_notification_loop() -> None:
    tz = ZoneInfo(settings.app_timezone)
    app.state.last_notification_run = None
    while True:
        now = datetime.now(tz)
        today_key = now.date().isoformat()
        if now.hour >= 9 and app.state.last_notification_run != today_key:
            db = SessionLocal()
            try:
                send_daily_turn_notifications(db)
                app.state.last_notification_run = today_key
            finally:
                db.close()
        # Close expired penalty votes every check
        db = SessionLocal()
        try:
            close_all_expired_votes(db)
        finally:
            db.close()
        await asyncio.sleep(300)


@app.on_event("startup")
async def startup_event() -> None:
    app.state.notification_task = asyncio.create_task(_daily_notification_loop())


@app.on_event("shutdown")
async def shutdown_event() -> None:
    task = getattr(app.state, "notification_task", None)
    if task:
        task.cancel()


@app.get("/health", tags=["health"])
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
