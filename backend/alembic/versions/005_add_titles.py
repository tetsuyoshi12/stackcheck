"""add titles tables

Revision ID: 005
Revises: 004
Create Date: 2026-05-16

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # titles テーブル（称号マスター）
    op.create_table(
        "titles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(op.f("ix_titles_id"), "titles", ["id"], unique=False)

    # title_requirements テーブル（称号付与条件）
    op.create_table(
        "title_requirements",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title_id", sa.Integer(), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("threshold", sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(["title_id"], ["titles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("title_id", "category_id", name="uq_title_category"),
    )
    op.create_index(op.f("ix_title_requirements_id"), "title_requirements", ["id"], unique=False)

    # user_titles テーブル（ユーザー保有称号）
    op.create_table(
        "user_titles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title_id", sa.Integer(), nullable=False),
        sa.Column(
            "acquired_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["title_id"], ["titles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "title_id", name="uq_user_title"),
    )
    op.create_index(op.f("ix_user_titles_id"), "user_titles", ["id"], unique=False)
    op.create_index(op.f("ix_user_titles_user_id"), "user_titles", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_titles_user_id"), table_name="user_titles")
    op.drop_index(op.f("ix_user_titles_id"), table_name="user_titles")
    op.drop_table("user_titles")
    op.drop_index(op.f("ix_title_requirements_id"), table_name="title_requirements")
    op.drop_table("title_requirements")
    op.drop_index(op.f("ix_titles_id"), table_name="titles")
    op.drop_table("titles")
