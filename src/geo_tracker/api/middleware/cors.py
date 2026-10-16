import os
from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

def setup_cors(app: FastAPI) -> None:
    """
    Configures Cross-Origin Resource Sharing (CORS) middleware.
    In production: Enforces strict explicit origin whitelist and restricted headers.
    In development: Accommodates localhost, local network IPs, and standard dev ports.
    """
    is_prod = os.getenv("ENV", "development").lower() == "production"

    if is_prod:
        # Strict explicit whitelist for production deployments
        production_origins = [
            "https://geo.vaatify.com",
            "https://vaatify.com",
        ]
        env_origins = os.getenv("ALLOWED_ORIGINS", "")
        if env_origins:
            for origin in env_origins.split(","):
                cleaned = origin.strip().rstrip("/")
                if cleaned and cleaned not in production_origins:
                    production_origins.append(cleaned)

        app.add_middleware(
            CORSMiddleware,
            allow_origins=production_origins,
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allow_headers=["Content-Type", "Authorization", "X-API-Key", "Accept"],
        )
    else:
        # Development: Accommodate local development servers and loopback addresses
        dev_origins = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8005",
            "http://127.0.0.1:8005",
        ]
        env_origins = os.getenv("ALLOWED_ORIGINS", "")
        if env_origins:
            for origin in env_origins.split(","):
                cleaned = origin.strip().rstrip("/")
                if cleaned and cleaned not in dev_origins:
                    dev_origins.append(cleaned)

        app.add_middleware(
            CORSMiddleware,
            allow_origins=dev_origins,
            allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d+\.\d+)(:[0-9]+)?$",
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )


