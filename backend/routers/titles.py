from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Title, TitleRequirement, UserTitle, User
from schemas import TitleResponse, TitleRequirementResponse, UserTitleResponse
from routers.auth import get_current_user

router = APIRouter()


@router.get("/titles", response_model=List[TitleResponse])
def get_titles(db: Session = Depends(get_db)):
    """全称号一覧取得（条件含む）"""
    titles = db.query(Title).all()
    result = []
    for t in titles:
        reqs = []
        for r in t.requirements:
            reqs.append(TitleRequirementResponse(
                id=r.id,
                category_id=r.category_id,
                category_name=r.category.name if r.category else None,
                threshold=r.threshold,
            ))
        result.append(TitleResponse(
            id=t.id,
            name=t.name,
            description=t.description,
            requirements=reqs,
        ))
    return result


@router.get("/users/me/titles", response_model=List[UserTitleResponse])
def get_my_titles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """ログインユーザーの保有称号一覧（is_active=Trueのみ）"""
    user_titles = (
        db.query(UserTitle)
        .filter(
            UserTitle.user_id == current_user.id,
            UserTitle.is_active == True,
        )
        .all()
    )
    return [
        UserTitleResponse(
            id=ut.id,
            title_id=ut.title_id,
            title_name=ut.title.name,
            acquired_at=ut.acquired_at,
            is_active=ut.is_active,
        )
        for ut in user_titles
    ]
