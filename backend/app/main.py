"""FastAPI application entrypoint, CORS middleware, error handlers, and router registration."""

import logging

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.errors import register_error_handlers
from app.core.logging import setup_logging
from app.features.auth.router import router as auth_router
from app.features.chat.router import router as chat_router
from app.features.conversations.router import router as conversations_router

setup_logging()
logger = logging.getLogger(__name__)

_SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), geolocation=()",
    "Cache-Control": "no-store",
}


def create_app() -> FastAPI:
    if settings.jwt_secret in {"change-me", "replace-with-a-long-random-string"} or len(settings.jwt_secret) < 32:
        logger.warning("JWT_SECRET is weak or default. Set a random value of 32+ characters in backend/.env.")

    app = FastAPI(
        title="Shop-Floor Supervisor AI Copilot",
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=False,  # bearer tokens, no cookies
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    @app.middleware("http")
    async def security_headers(request: Request, call_next) -> Response:  # type: ignore[no-untyped-def]
        response: Response = await call_next(request)
        for name, value in _SECURITY_HEADERS.items():
            response.headers.setdefault(name, value)
        return response

    register_error_handlers(app)

    app.include_router(auth_router)
    app.include_router(conversations_router)
    app.include_router(chat_router)

    @app.get("/api/health", tags=["health"])
    def health_check() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
