from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from typing import List

from database import get_db
from models import Topic
from schemas import TopicResponse

router = APIRouter()


@router.get("/topics", response_model=List[TopicResponse])
def get_topics(db: Session = Depends(get_db)):
    """トピック一覧を登録日時の降順で返す（カテゴリ情報含む）"""
    topics = (
        db.query(Topic)
        .options(joinedload(Topic.category))
        .order_by(Topic.created_at.desc())
        .all()
    )
    return [TopicResponse.from_orm_with_category(t) for t in topics]
