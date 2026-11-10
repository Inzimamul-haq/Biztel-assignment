"""Custom application exceptions and unified JSON error handlers (Section 6.4)."""

import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


class AppError(Exception):
    """Domain or HTTP exception returning {"detail": ..., "code": ...}."""

    def __init__(
        self,
        detail: str,
        code: str = "BAD_REQUEST",
        status_code: int = status.HTTP_400_BAD_REQUEST,
    ) -> None:
        super().__init__(detail)
        self.detail = detail
        self.code = code
        self.status_code = status.HTTP_400_BAD_REQUEST if status_code is None else status_code


def register_error_handlers(app: FastAPI) -> None:
    """Attach handlers so every error returns {"detail": "message", "code": "SOME_CODE"}."""

    @app.exception_handler(AppError)
    async def handle_app_error(_request: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "code": exc.code},
        )

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_error(_request: Request, exc: StarletteHTTPException) -> JSONResponse:
        code = "UNAUTHORIZED" if exc.status_code == status.HTTP_401_UNAUTHORIZED else "HTTP_ERROR"
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": str(exc.detail), "code": code},
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        _request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        errors = exc.errors()
        first_msg = "Invalid request payload."
        if errors:
            loc = ".".join(str(part) for part in errors[0].get("loc", []) if part != "body")
            msg = errors[0].get("msg", "Invalid value")
            first_msg = f"{loc}: {msg}" if loc else msg
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": first_msg, "code": "VALIDATION_ERROR"},
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(_request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled application error: %s", type(exc).__name__)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "An unexpected server error occurred. Please try again.",
                "code": "INTERNAL_ERROR",
            },
        )
