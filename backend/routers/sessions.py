from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from database import get_db
from models import (
    User, Topic, Question, QuizSession, SessionAnswer, TopicMastery,
    Category,
)
from schemas import SessionCreate, SessionResponse, DashboardResponse, CategoryMastery, CategoryAccuracy, DailyActivity
from routers.auth import get_current_user

router = APIRouter()


@router.post("/sessions", response_model=SessionResponse, status_code=201)
def create_session(
    session_in: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """クイズ結果を保存する（JWT認証必須）"""
    topic = db.query(Topic).filter(Topic.id == session_in.topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    score = sum(1 for a in session_in.answers if a.is_correct)
    total = len(session_in.answers)

    # セッション保存
    new_session = QuizSession(
        user_id=current_user.id,
        topic_id=session_in.topic_id,
        score=score,
        total=total,
    )
    db.add(new_session)
    db.flush()  # IDを取得するためflush

    # 回答保存
    for ans in session_in.answers:
        db.add(SessionAnswer(
            session_id=new_session.id,
            question_id=ans.question_id,
            selected_option=ans.selected_option,
            is_correct=ans.is_correct,
        ))

    # 習熟フラグ更新
    is_mastered = (score == total and total > 0)
    mastery = db.query(TopicMastery).filter(
        TopicMastery.user_id == current_user.id,
        TopicMastery.topic_id == session_in.topic_id,
    ).first()

    if mastery:
        mastery.is_mastered = is_mastered
        mastery.updated_at = datetime.now(timezone.utc)
    else:
        db.add(TopicMastery(
            user_id=current_user.id,
            topic_id=session_in.topic_id,
            is_mastered=is_mastered,
        ))

    db.commit()
    db.refresh(new_session)
    return new_session


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """ダッシュボードデータを取得する（JWT認証必須）"""

    # ① スキルマップ：カテゴリ別習熟率
    categories = db.query(Category).all()
    skill_map = []
    for cat in categories:
        topics = db.query(Topic).filter(Topic.category_id == cat.id).all()
        total_count = len(topics)
        if total_count == 0:
            continue
        topic_ids = [t.id for t in topics]
        mastered_count = db.query(TopicMastery).filter(
            TopicMastery.user_id == current_user.id,
            TopicMastery.topic_id.in_(topic_ids),
            TopicMastery.is_mastered == True,
        ).count()
        skill_map.append(CategoryMastery(
            category_name=cat.name,
            mastered_count=mastered_count,
            total_count=total_count,
            mastery_rate=mastered_count / total_count,
        ))

    # カテゴリなしトピックも集計
    uncategorized_topics = db.query(Topic).filter(Topic.category_id == None).all()
    if uncategorized_topics:
        total_count = len(uncategorized_topics)
        topic_ids = [t.id for t in uncategorized_topics]
        mastered_count = db.query(TopicMastery).filter(
            TopicMastery.user_id == current_user.id,
            TopicMastery.topic_id.in_(topic_ids),
            TopicMastery.is_mastered == True,
        ).count()
        skill_map.append(CategoryMastery(
            category_name="未分類",
            mastered_count=mastered_count,
            total_count=total_count,
            mastery_rate=mastered_count / total_count,
        ))

    # ② カテゴリ別正答率（正答率の低い順）
    category_accuracy = []
    for cat in categories:
        topics = db.query(Topic).filter(Topic.category_id == cat.id).all()
        if not topics:
            continue
        topic_ids = [t.id for t in topics]
        sessions = db.query(QuizSession).filter(
            QuizSession.user_id == current_user.id,
            QuizSession.topic_id.in_(topic_ids),
        ).all()
        if not sessions:
            continue
        total_correct = sum(s.score for s in sessions)
        total_answers = sum(s.total for s in sessions)
        if total_answers == 0:
            continue
        category_accuracy.append(CategoryAccuracy(
            category_name=cat.name,
            correct_count=total_correct,
            total_count=total_answers,
            accuracy=total_correct / total_answers,
        ))

    # 正答率の高い順にソート
    category_accuracy.sort(key=lambda x: x.accuracy, reverse=True)

    # ③ 日別セッション数（直近90日）
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=90)

    sessions_90d = db.query(
        func.date(QuizSession.created_at).label("date"),
        func.count(QuizSession.id).label("count"),
    ).filter(
        QuizSession.user_id == current_user.id,
        QuizSession.created_at >= since,
    ).group_by(
        func.date(QuizSession.created_at)
    ).all()

    activity_map = {str(row.date): row.count for row in sessions_90d}

    daily_activity = []
    for i in range(90):
        d = (now - timedelta(days=89 - i)).strftime("%Y-%m-%d")
        daily_activity.append(DailyActivity(date=d, count=activity_map.get(d, 0)))

    # ストリーク計算（今日から連続して学習した日数）
    streak = 0
    for i in range(90):
        d = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        if activity_map.get(d, 0) > 0:
            streak += 1
        else:
            break

    return DashboardResponse(
        skill_map=skill_map,
        category_accuracy=category_accuracy,
        daily_activity=daily_activity,
        streak=streak,
    )
