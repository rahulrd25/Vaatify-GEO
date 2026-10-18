import uuid
from datetime import datetime, timezone
from typing import Any, List, Optional
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class BrandProfileModel(Base):
    __tablename__ = "brand_profiles"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: f"brand_{uuid.uuid4().hex[:12]}")
    user_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    domain: Mapped[str] = mapped_column(String(255), nullable=False)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    competitors: Mapped[List["CompetitorModel"]] = relationship(
        "CompetitorModel", back_populates="brand_profile", cascade="all, delete-orphan"
    )
    prompts: Mapped[List["PromptModel"]] = relationship(
        "PromptModel", back_populates="brand_profile", cascade="all, delete-orphan"
    )

class CompetitorModel(Base):
    __tablename__ = "competitors"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: f"comp_{uuid.uuid4().hex[:12]}")
    brand_id: Mapped[str] = mapped_column(String(50), ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    domain: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    brand_profile: Mapped["BrandProfileModel"] = relationship("BrandProfileModel", back_populates="competitors")

class PromptModel(Base):
    __tablename__ = "prompts"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: f"qry_{uuid.uuid4().hex[:12]}")
    user_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    brand_id: Mapped[Optional[str]] = mapped_column(String(50), ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=True, index=True)
    brand: Mapped[str] = mapped_column(String(100), nullable=False)
    prompt_text: Mapped[str] = mapped_column(Text, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    brand_profile: Mapped[Optional["BrandProfileModel"]] = relationship("BrandProfileModel", back_populates="prompts")
    runs: Mapped[List["RunModel"]] = relationship("RunModel", back_populates="prompt", cascade="all, delete-orphan")
    alerts: Mapped[List["DriftAlertModel"]] = relationship("DriftAlertModel", back_populates="prompt", cascade="all, delete-orphan")
    recommendations: Mapped[List["AgentRecommendationModel"]] = relationship("AgentRecommendationModel", back_populates="prompt", cascade="all, delete-orphan")

class RunModel(Base):
    __tablename__ = "runs"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: f"run_{uuid.uuid4().hex[:12]}")
    prompt_id: Mapped[str] = mapped_column(String(50), ForeignKey("prompts.id", ondelete="CASCADE"), nullable=False)
    engine: Mapped[str] = mapped_column(String(50), nullable=False)
    run_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    raw_response_text: Mapped[str] = mapped_column(Text, nullable=False)
    brand_mentioned: Mapped[bool] = mapped_column(Boolean, nullable=False)
    brand_cited: Mapped[bool] = mapped_column(Boolean, nullable=False)
    citation_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    
    # Store competitor mentions as list of strings ["CompA", "CompB"]
    competitors_mentioned: Mapped[Any] = mapped_column(JSON, default=list, nullable=False)
    
    # Store competitor citations as list of dicts [{"name": "CompA", "url": "..."}]
    competitors_cited: Mapped[Any] = mapped_column(JSON, default=list, nullable=False)

    # Advanced GEO Metrics & Collection Mode
    collection_mode: Mapped[str] = mapped_column(String(20), default="api", nullable=False)
    position_rank: Mapped[Optional[int]] = mapped_column(nullable=True)
    snippet_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    prominence_score: Mapped[Optional[float]] = mapped_column(default=0.0, nullable=True)

    prompt: Mapped["PromptModel"] = relationship("PromptModel", back_populates="runs")

class DriftAlertModel(Base):
    __tablename__ = "drift_alerts"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: f"alt_{uuid.uuid4().hex[:12]}")
    prompt_id: Mapped[str] = mapped_column(String(50), ForeignKey("prompts.id", ondelete="CASCADE"), nullable=False)
    engine: Mapped[str] = mapped_column(String(50), nullable=False)
    alert_type: Mapped[str] = mapped_column(String(50), nullable=False)  # gained_citation, lost_citation
    previous_status: Mapped[bool] = mapped_column(Boolean, nullable=False)
    new_status: Mapped[bool] = mapped_column(Boolean, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="unread", nullable=False)  # unread, acknowledged, dismissed
    triggered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    prompt: Mapped["PromptModel"] = relationship("PromptModel", back_populates="alerts")

class AgentRecommendationModel(Base):
    __tablename__ = "agent_recommendations"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: f"rec_{uuid.uuid4().hex[:12]}")
    prompt_id: Mapped[Optional[str]] = mapped_column(String(50), ForeignKey("prompts.id", ondelete="SET NULL"), nullable=True)
    recommendation_type: Mapped[str] = mapped_column(String(50), nullable=False)  # content_gap, citation_builder, schema_markup
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    suggestion_text: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)  # high, medium, low
    status: Mapped[str] = mapped_column(String(30), default="pending", nullable=False)  # pending, applied, dismissed
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    prompt: Mapped[Optional["PromptModel"]] = relationship("PromptModel", back_populates="recommendations")

class MonitoringScheduleModel(Base):
    __tablename__ = "monitoring_schedules"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: f"sch_{uuid.uuid4().hex[:12]}")
    user_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    brand_id: Mapped[Optional[str]] = mapped_column(String(50), ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=True, index=True)
    brand: Mapped[str] = mapped_column(String(100), nullable=False)
    frequency: Mapped[str] = mapped_column(String(20), default="weekly", nullable=False)  # "weekly", "daily", "off"
    day_of_week: Mapped[int] = mapped_column(default=0, nullable=False)  # 0 = Monday, 6 = Sunday
    hour_utc: Mapped[int] = mapped_column(default=9, nullable=False)  # 0-23 UTC
    minute_utc: Mapped[int] = mapped_column(default=0, nullable=False)  # 0-59 UTC
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_run_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    next_run_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_run_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)  # "success", "failed", "running"
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
