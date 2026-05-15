"""add categories

Revision ID: 002
Revises: 001
Create Date: 2026-05-15

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # categories テーブル
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(op.f("ix_categories_id"), "categories", ["id"], unique=False)

    # topics に category_id カラムを追加（NULL許容）
    op.add_column(
        "topics",
        sa.Column("category_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_topics_category_id",
        "topics", "categories",
        ["category_id"], ["id"],
        ondelete="SET NULL",
    )
    op.create_index(op.f("ix_topics_category_id"), "topics", ["category_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_topics_category_id"), table_name="topics")
    op.drop_constraint("fk_topics_category_id", "topics", type_="foreignkey")
    op.drop_column("topics", "category_id")
    op.drop_index(op.f("ix_categories_id"), table_name="categories")
    op.drop_table("categories")
