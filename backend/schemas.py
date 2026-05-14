from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict


class CorrectOption(str, Enum):
    a = "a"
    b = "b"
    c = "c"
    d = "d"


# --- Topic ---

class TopicCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)


class TopicResponse(BaseModel):
    id: int
    title: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


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
