from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Category
from schemas import CategoryResponse

router = APIRouter()


@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    """カテゴリ一覧を名前順で返す"""
    return db.query(Category).order_by(Category.name.asc()).all()
