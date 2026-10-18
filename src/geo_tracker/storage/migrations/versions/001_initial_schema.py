"""initial_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-29 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. brand_profiles
    op.create_table(
        'brand_profiles',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('user_id', sa.String(length=100), nullable=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('domain', sa.String(length=255), nullable=False),
        sa.Column('industry', sa.String(length=100), nullable=True),
        sa.Column('onboarding_completed', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_brand_profiles_user_id', 'brand_profiles', ['user_id'])

    # 2. competitors
    op.create_table(
        'competitors',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('brand_id', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('domain', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['brand_id'], ['brand_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 3. prompts
    op.create_table(
        'prompts',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('user_id', sa.String(length=100), nullable=True),
        sa.Column('brand_id', sa.String(length=50), nullable=True),
        sa.Column('brand', sa.String(length=100), nullable=False),
        sa.Column('prompt_text', sa.Text(), nullable=False),
        sa.Column('active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['brand_id'], ['brand_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_prompts_user_id', 'prompts', ['user_id'])
    op.create_index('ix_prompts_brand_id', 'prompts', ['brand_id'])

    # 4. runs
    op.create_table(
        'runs',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('prompt_id', sa.String(length=50), nullable=False),
        sa.Column('engine', sa.String(length=50), nullable=False),
        sa.Column('run_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('raw_response_text', sa.Text(), nullable=False),
        sa.Column('brand_mentioned', sa.Boolean(), nullable=False),
        sa.Column('brand_cited', sa.Boolean(), nullable=False),
        sa.Column('citation_url', sa.String(length=2048), nullable=True),
        sa.Column('competitors_mentioned', sa.JSON(), nullable=False),
        sa.Column('competitors_cited', sa.JSON(), nullable=False),
        sa.Column('collection_mode', sa.String(length=20), nullable=False, server_default='api'),
        sa.Column('position_rank', sa.Integer(), nullable=True),
        sa.Column('snippet_text', sa.Text(), nullable=True),
        sa.Column('prominence_score', sa.Float(), nullable=True, server_default='0.0'),
        sa.ForeignKeyConstraint(['prompt_id'], ['prompts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 5. drift_alerts
    op.create_table(
        'drift_alerts',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('prompt_id', sa.String(length=50), nullable=False),
        sa.Column('engine', sa.String(length=50), nullable=False),
        sa.Column('alert_type', sa.String(length=50), nullable=False),
        sa.Column('previous_status', sa.Boolean(), nullable=False),
        sa.Column('new_status', sa.Boolean(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='unread'),
        sa.Column('triggered_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['prompt_id'], ['prompts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 6. agent_recommendations
    op.create_table(
        'agent_recommendations',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('prompt_id', sa.String(length=50), nullable=True),
        sa.Column('recommendation_type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('suggestion_text', sa.Text(), nullable=False),
        sa.Column('priority', sa.String(length=20), nullable=False, server_default='medium'),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['prompt_id'], ['prompts.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # 7. monitoring_schedules
    op.create_table(
        'monitoring_schedules',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('user_id', sa.String(length=100), nullable=True),
        sa.Column('brand_id', sa.String(length=50), nullable=True),
        sa.Column('brand', sa.String(length=100), nullable=False),
        sa.Column('frequency', sa.String(length=20), nullable=False, server_default='weekly'),
        sa.Column('day_of_week', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('hour_utc', sa.Integer(), nullable=False, server_default='9'),
        sa.Column('minute_utc', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('last_run_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('next_run_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_run_status', sa.String(length=30), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['brand_id'], ['brand_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_monitoring_schedules_user_id', 'monitoring_schedules', ['user_id'])
    op.create_index('ix_monitoring_schedules_brand_id', 'monitoring_schedules', ['brand_id'])

def downgrade() -> None:
    op.drop_table('monitoring_schedules')
    op.drop_table('agent_recommendations')
    op.drop_table('drift_alerts')
    op.drop_table('runs')
    op.drop_table('prompts')
    op.drop_table('competitors')
    op.drop_table('brand_profiles')
