from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


# --- User ---

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class CorrectOption(str, Enum):
    a = "a"
    b = "b"
    c = "c"
    d = "d"


# --- Category ---

class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class CategoryResponse(BaseModel):
    id: int
    name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Topic ---

class TopicCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)


class TopicUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    category_id: Optional[int] = None


class TopicCategoryUpdate(BaseModel):
    category_id: Optional[int] = None


class TopicAdminResponse(BaseModel):
    """管理者向けトピックレスポンス（問題数含む）"""
    id: int
    title: str
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    question_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TopicResponse(BaseModel):
    id: int
    title: str
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_category(cls, topic) -> "TopicResponse":
        return cls(
            id=topic.id,
            title=topic.title,
            category_id=topic.category_id,
            category_name=topic.category.name if topic.category else None,
            created_at=topic.created_at,
        )


# --- Question ---

class QuestionCreate(BaseModel):
    topic_id: int
    question_text: str = Field(..., min_length=1)
    option_a: str = Field(..., min_length=1, max_length=500)
    option_b: str = Field(..., min_length=1, max_length=500)
    option_c: str = Field(..., min_length=1, max_length=500)
    option_d: str = Field(..., min_length=1, max_length=500)
    correct_option: CorrectOption
    explanation: str = Field(..., min_length=1)
    order: int = Field(..., ge=1, le=5)


class QuestionResponse(BaseModel):
    id: int
    topic_id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: CorrectOption
    explanation: str
    order: int

    model_config = ConfigDict(from_attributes=True)


class QuestionUpdate(BaseModel):
    question_text: Optional[str] = Field(None, min_length=1)
    option_a: Optional[str] = Field(None, min_length=1, max_length=500)
    option_b: Optional[str] = Field(None, min_length=1, max_length=500)
    option_c: Optional[str] = Field(None, min_length=1, max_length=500)
    option_d: Optional[str] = Field(None, min_length=1, max_length=500)
    correct_option: Optional[CorrectOption] = None
    explanation: Optional[str] = Field(None, min_length=1)
    order: Optional[int] = Field(None, ge=1, le=5)
