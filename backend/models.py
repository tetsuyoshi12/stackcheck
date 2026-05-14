from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey,
    Enum, UniqueConstraint, func,
)
from sqlalchemy.orm import relationship
from database import Base


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, unique=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    questions = relationship(
        "Question",
        back_populates="topic",
        cascade="all, delete-orphan",
        order_by="Question.order",
    )


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(
        Integer,
        ForeignKey("topics.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_text = Column(Text, nullable=False)
    option_a = Column(String(500), nullable=False)
    option_b = Column(String(500), nullable=False)
    option_c = Column(String(500), nullable=False)
    option_d = Column(String(500), nullable=False)
    correct_option = Column(
        Enum("a", "b", "c", "d", name="correct_option_enum"),
        nullable=False,
    )
    explanation = Column(Text, nullable=False)
    order = Column(Integer, nullable=False)

    topic = relationship("Topic", back_populates="questions")

    __table_args__ = (
        UniqueConstraint("topic_id", "order", name="uq_topic_order"),
    )
