import os
import secrets
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic_settings import BaseSettings, SettingsConfigDict

class ApiDocSettings(BaseSettings):
    docs_username: str = ""
    docs_password: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

docs_settings = ApiDocSettings()
security = HTTPBasic()

def authenticate_docs(credentials: HTTPBasicCredentials = Depends(security)):
    expected_user = os.getenv("DOCS_USERNAME") or docs_settings.docs_username
    expected_pass = os.getenv("DOCS_PASSWORD") or docs_settings.docs_password

    if not expected_user or not expected_pass:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="API documentation access is disabled because DOCS_USERNAME and DOCS_PASSWORD are not configured."
        )

    correct_username = secrets.compare_digest(credentials.username, expected_user)
    correct_password = secrets.compare_digest(credentials.password, expected_pass)
    
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect documentation username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username
