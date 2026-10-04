from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from src.geo_tracker.api.middleware.cors import setup_cors
from src.geo_tracker.api.routes import router
from src.geo_tracker.api.security.api_key import security_settings
from src.geo_tracker.storage.migrations import run_startup_checks_and_migrations
from src.geo_tracker.scheduler import global_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Execute database connectivity checks and idempotent migrations on server boot
    run_startup_checks_and_migrations()
    # Start automated background monitoring scheduler
    await global_scheduler.start()
    yield
    # Gracefully shut down background scheduler
    await global_scheduler.stop()

def custom_openapi(app: FastAPI):
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Vaatify GEO API",
        version="0.1.0",
        description="Generative Engine Optimization (GEO) Visibility & Citation Intelligence Engine by Vaatify",
        routes=app.routes,
    )
    # Configure APIKeyHeader security scheme for Swagger UI "Authorize" button
    openapi_schema["components"]["securitySchemes"] = {
        "APIKeyHeader": {
            "type": "apiKey",
            "in": "header",
            "name": security_settings.api_key_name,
            "description": f"Enter your API key (e.g. `{security_settings.api_key}`)"
        }
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema

def create_app() -> FastAPI:
    app = FastAPI(
        title="Vaatify GEO API",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan
    )


    # Setup Middleware
    setup_cors(app)

    # Register Centralized Router
    app.include_router(router)

    # Custom OpenAPI for Swagger UI Authorization
    app.openapi = lambda: custom_openapi(app)

    return app
