from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Topic, Question
from schemas import QuestionResponse

router = APIRouter()


@router.get("/topics/{topic_id}/questions", response_model=List[QuestionResponse])
def get_questions(topic_id: int, db: Session = Depends(get_db)):
    """指定トピックの問題を出題順（order昇順）で最大5問返す（US-02）"""
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    questions = (
        db.query(Question)
        .filter(Question.topic_id == topic_id)
        .order_by(Question.order.asc())
        .limit(5)
        .all()
    )
    return questions
