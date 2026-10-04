import secrets
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic_settings import BaseSettings

class ApiDocSettings(BaseSettings):
    docs_username: str = "admin"
    docs_password: str = "geoagent2026"

docs_settings = ApiDocSettings()
security = HTTPBasic()

def authenticate_docs(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = secrets.compare_digest(credentials.username, docs_settings.docs_username)
    correct_password = secrets.compare_digest(credentials.password, docs_settings.docs_password)
    
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect Swagger documentation username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username
