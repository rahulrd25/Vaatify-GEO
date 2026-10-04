import os
import pytest
from src.geo_tracker.config import (
    load_settings,
    load_competitors_config,
    load_prompts_config,
    MissingEnvironmentVariableError
)

def test_config_load_success(monkeypatch):
    monkeypatch.setenv("PERPLEXITY_API_KEY", "pplx-test")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test")
    monkeypatch.setenv("GEMINI_API_KEY", "gemini-test")
    monkeypatch.setenv("TYPESAFE_API_KEY", "ts-test")
    monkeypatch.setenv("DATABASE_URL", "postgresql://localhost:5432/testdb")

    settings = load_settings()
    assert settings.perplexity_api_key == "pplx-test"
    assert settings.anthropic_api_key == "sk-ant-test"
    assert settings.gemini_api_key == "gemini-test"
    assert settings.typesafe_api_key == "ts-test"
    assert settings.database_url == "postgresql://localhost:5432/testdb"

def test_config_missing_var(monkeypatch):
    monkeypatch.delenv("PERPLEXITY_API_KEY", raising=False)
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("TYPESAFE_API_KEY", raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)

    with pytest.raises(MissingEnvironmentVariableError) as exc_info:
        load_settings()
    
    msg = str(exc_info.value)
    assert "Missing required environment variable(s)" in msg
    assert "PERPLEXITY_API_KEY" in msg

def test_yaml_config_loaders():
    comp_config = load_competitors_config("config/competitors.yaml")
    assert comp_config.brand.name is not None
    assert comp_config.brand.domain is not None
    assert len(comp_config.competitors) > 0

    prompt_config = load_prompts_config("config/prompts.yaml")
    assert len(prompt_config.prompts) > 0
    assert prompt_config.prompts[0].id is not None
