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
    op.create_table(
        'prompts',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('brand', sa.String(length=100), nullable=False),
        sa.Column('prompt_text', sa.Text(), nullable=False),
        sa.Column('active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
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
        sa.ForeignKeyConstraint(['prompt_id'], ['prompts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('runs')
    op.drop_table('prompts')
