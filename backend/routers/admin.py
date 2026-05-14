import os
import secrets
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import get_db
from models import Topic, Question
from schemas import TopicCreate, TopicResponse, QuestionCreate, QuestionResponse

router = APIRouter()
security = HTTPBasic()


def verify_credentials(credentials: HTTPBasicCredentials = Depends(security)) -> str:
    """Basic認証の検証（タイミング攻撃対策あり）"""
    correct_username = os.getenv("ADMIN_USERNAME", "")
    correct_password = os.getenv("ADMIN_PASSWORD", "")

    username_ok = secrets.compare_digest(
        credentials.username.encode("utf-8"),
        correct_username.encode("utf-8"),
    )
    password_ok = secrets.compare_digest(
        credentials.password.encode("utf-8"),
        correct_password.encode("utf-8"),
    )

    if not (username_ok and password_ok):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username


@router.post("/admin/topics", response_model=TopicResponse, status_code=201)
def create_topic(
    topic_in: TopicCreate,
    db: Session = Depends(get_db),
    _: str = Depends(verify_credentials),
):
    """トピックを登録する（US-05）"""
    new_topic = Topic(title=topic_in.title)
    db.add(new_topic)
    try:
        db.commit()
        db.refresh(new_topic)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Topic title already exists")
    return new_topic


@router.post("/admin/questions", response_model=QuestionResponse, status_code=201)
def create_question(
    question_in: QuestionCreate,
    db: Session = Depends(get_db),
    _: str = Depends(verify_credentials),
):
    """問題を登録する（US-06）"""
    # トピック存在確認
    topic = db.query(Topic).filter(Topic.id == question_in.topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    new_question = Question(
        topic_id=question_in.topic_id,
        question_text=question_in.question_text,
        option_a=question_in.option_a,
        option_b=question_in.option_b,
        option_c=question_in.option_c,
        option_d=question_in.option_d,
        correct_option=question_in.correct_option.value,
        explanation=question_in.explanation,
        order=question_in.order,
    )
    db.add(new_question)
    try:
        db.commit()
        db.refresh(new_question)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Question with this order already exists for the topic",
        )
    return new_question
