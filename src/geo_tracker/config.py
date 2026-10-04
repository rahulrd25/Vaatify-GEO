import os
import yaml
from pathlib import Path
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict

class MissingEnvironmentVariableError(ValueError):
    """Raised when a required environment variable is missing."""
    pass

class Settings(BaseSettings):
    perplexity_api_key: str
    anthropic_api_key: str
    gemini_api_key: str
    typesafe_api_key: str
    database_url: str
    openai_api_key: str = "openai-dev-mock-key"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

def load_settings() -> Settings:
    required_vars = [
        "PERPLEXITY_API_KEY",
        "ANTHROPIC_API_KEY",
        "GEMINI_API_KEY",
        "TYPESAFE_API_KEY",
        "DATABASE_URL"
    ]
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        raise MissingEnvironmentVariableError(
            f"Missing required environment variable(s): {', '.join(missing)}"
        )
    return Settings()

class CompetitorConfig(BaseModel):
    name: str
    domain: str

class BrandConfig(BaseModel):
    name: str
    domain: str

class CompetitorsFileConfig(BaseModel):
    brand: BrandConfig
    competitors: list[CompetitorConfig]

class PromptItemConfig(BaseModel):
    id: str
    text: str
    active: bool = True

class PromptsFileConfig(BaseModel):
    prompts: list[PromptItemConfig]

def load_competitors_config(file_path: str | Path = "config/competitors.yaml") -> CompetitorsFileConfig:
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Competitors configuration file not found at {file_path}")
    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return CompetitorsFileConfig.model_validate(data)

def load_prompts_config(file_path: str | Path = "config/prompts.yaml") -> PromptsFileConfig:
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Prompts configuration file not found at {file_path}")
    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return PromptsFileConfig.model_validate(data)
