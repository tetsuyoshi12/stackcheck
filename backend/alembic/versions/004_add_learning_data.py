"""add learning data tables

Revision ID: 004
Revises: 003
Create Date: 2026-05-16

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # quiz_sessions テーブル
    op.create_table(
        "quiz_sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("topic_id", sa.Integer(), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("total", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["topic_id"], ["topics.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_quiz_sessions_id"), "quiz_sessions", ["id"], unique=False)
    op.create_index(op.f("ix_quiz_sessions_user_id"), "quiz_sessions", ["user_id"], unique=False)
    op.create_index(op.f("ix_quiz_sessions_created_at"), "quiz_sessions", ["created_at"], unique=False)

    # session_answers テーブル
    op.create_table(
        "session_answers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("question_id", sa.Integer(), nullable=False),
        sa.Column("selected_option", sa.String(length=1), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["quiz_sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["question_id"], ["questions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_session_answers_id"), "session_answers", ["id"], unique=False)

    # topic_mastery テーブル
    op.create_table(
        "topic_mastery",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("topic_id", sa.Integer(), nullable=False),
        sa.Column("is_mastered", sa.Boolean(), nullable=False, default=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            onupdate=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["topic_id"], ["topics.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "topic_id", name="uq_user_topic_mastery"),
    )
    op.create_index(op.f("ix_topic_mastery_id"), "topic_mastery", ["id"], unique=False)
    op.create_index(op.f("ix_topic_mastery_user_id"), "topic_mastery", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_topic_mastery_user_id"), table_name="topic_mastery")
    op.drop_index(op.f("ix_topic_mastery_id"), table_name="topic_mastery")
    op.drop_table("topic_mastery")
    op.drop_index(op.f("ix_session_answers_id"), table_name="session_answers")
    op.drop_table("session_answers")
    op.drop_index(op.f("ix_quiz_sessions_created_at"), table_name="quiz_sessions")
    op.drop_index(op.f("ix_quiz_sessions_user_id"), table_name="quiz_sessions")
    op.drop_index(op.f("ix_quiz_sessions_id"), table_name="quiz_sessions")
    op.drop_table("quiz_sessions")
