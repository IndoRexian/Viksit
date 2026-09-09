import logging

from api.v1.api import api_router
from core.config import settings
from db.init_db import init_db
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

# Configure secure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("sih2026.api")


def create_application() -> FastAPI:
    # Disable FastAPI internal debug mode in response payloads to prevent traceback leaks
    application = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
    )

    # Secure CORS configuration
    allowed_origins = list(
        set(
            [
                "http://localhost:3000",
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:8000",
                "http://127.0.0.1:8000",
            ]
            + [str(o).rstrip("/") for o in settings.CORS_ORIGINS]
        )
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global Exception Handler for Starlette/FastAPI HTTP Exceptions
    @application.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=exc.headers,
        )

    # Global Exception Handler for Request Validation Errors (Clean format, no object dumps)
    @application.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):
        error_messages = []
        for error in exc.errors():
            loc = " -> ".join(str(loc_part) for loc_part in error.get("loc", []))
            msg = error.get("msg", "Invalid value")
            error_messages.append(f"{loc}: {msg}" if loc else msg)
        formatted_detail = (
            "; ".join(error_messages) if error_messages else "Invalid request data."
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": formatted_detail},
        )

    # Global Catch-All Handler for Unhandled Exceptions (Prevents any stack trace or DB schema leakage)
    @application.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.error(
            f"Unhandled exception on {request.method} {request.url.path}: {exc}",
            exc_info=True,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "An internal server error occurred. Please try again later."
            },
        )

    application.include_router(api_router, prefix="/api/v1")

    @application.on_event("startup")
    def startup_event():
        init_db()

    @application.get("/health", tags=["Health"])
    def health_check():
        return {"status": "healthy", "version": settings.APP_VERSION}

    return application


app = create_application()
