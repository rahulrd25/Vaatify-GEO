from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "GEO Agent - Generative Engine Optimization Engine"
    version: str = "0.1.0"
    environment: str = "development"
    
    # LLM & Search API Keys (Optional for live integrations)
    openai_api_key: str | None = None
    perplexity_api_key: str | None = None
    gemini_api_key: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
