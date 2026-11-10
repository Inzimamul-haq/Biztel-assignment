"""FastAPI application entrypoint, CORS middleware, error handlers, and router registration."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.errors import register_error_handlers
from app.core.logging import setup_logging
from app.features.auth.router import router as auth_router
from app.features.chat.router import router as chat_router
from app.features.conversations.router import router as conversations_router

setup_logging()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Shop-Floor Supervisor AI Copilot",
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_error_handlers(app)

    app.include_router(auth_router)
    app.include_router(conversations_router)
    app.include_router(chat_router)

    @app.get("/api/health", tags=["health"])
    def health_check() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
