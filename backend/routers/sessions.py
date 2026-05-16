from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from database import get_db
from models import (
    User, Topic, Question, QuizSession, SessionAnswer, TopicMastery,
    Category, Title, TitleRequirement, UserTitle,
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

    # 称号付与ロジック
    _update_user_titles(db, current_user.id)

    return new_session


def _update_user_titles(db: Session, user_id: int) -> None:
    """全称号の条件を評価してUserTitleを更新する"""
    titles = db.query(Title).all()
    for title in titles:
        if not title.requirements:
            continue

        # 全条件を満たすか確認
        all_met = True
        for req in title.requirements:
            # カテゴリ内の全トピック数
            total = db.query(Topic).filter(Topic.category_id == req.category_id).count()
            if total == 0:
                all_met = False
                break
            # 習熟済みトピック数
            mastered = db.query(TopicMastery).filter(
                TopicMastery.user_id == user_id,
                TopicMastery.is_mastered == True,
                TopicMastery.topic_id.in_(
                    db.query(Topic.id).filter(Topic.category_id == req.category_id)
                ),
            ).count()
            mastery_rate = mastered / total
            # threshold は 0〜100 の整数（%）
            if mastery_rate * 100 < req.threshold:
                all_met = False
                break

        # UserTitle を更新または作成
        user_title = db.query(UserTitle).filter(
            UserTitle.user_id == user_id,
            UserTitle.title_id == title.id,
        ).first()

        if all_met:
            if not user_title:
                db.add(UserTitle(user_id=user_id, title_id=title.id, is_active=True))
            else:
                user_title.is_active = True
        else:
            if user_title:
                user_title.is_active = False

    db.commit()


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """ダッシュボードデータを取得する（JWT認証必須）"""

    categories = db.query(Category).all()

    # ① スキルマップ：習熟済みトピックのみブロック表示
    # mastered_count > 0 のカテゴリのみ返す（未習熟カテゴリは表示しない）
    skill_map = []
    for cat in categories:
        topics = db.query(Topic).filter(Topic.category_id == cat.id).all()
        if not topics:
            continue
        topic_ids = [t.id for t in topics]
        mastered_count = db.query(TopicMastery).filter(
            TopicMastery.user_id == current_user.id,
            TopicMastery.topic_id.in_(topic_ids),
            TopicMastery.is_mastered == True,
        ).count()
        if mastered_count == 0:
            continue  # 習熟済みトピックがないカテゴリは表示しない
        skill_map.append(CategoryMastery(
            category_name=cat.name,
            mastered_count=mastered_count,
            total_count=len(topics),
            mastery_rate=mastered_count / len(topics),
        ))

    # ② カテゴリ別正答率
    # - 分母 = カテゴリ内の全トピック数 × 5問
    # - 同じトピックを複数回解いた場合は最新セッションのみ使用
    # - 未解答トピックは 0/5 として計算
    category_accuracy = []
    for cat in categories:
        topics = db.query(Topic).filter(Topic.category_id == cat.id).all()
        if not topics:
            continue

        total_correct = 0
        total_questions = len(topics) * 5  # 全トピック × 5問が分母

        for topic in topics:
            # 最新セッションのみ取得
            latest = (
                db.query(QuizSession)
                .filter(
                    QuizSession.user_id == current_user.id,
                    QuizSession.topic_id == topic.id,
                )
                .order_by(QuizSession.created_at.desc())
                .first()
            )
            if latest:
                total_correct += latest.score
            # 未解答トピックは 0点（分母には含まれる）

        accuracy = total_correct / total_questions if total_questions > 0 else 0.0
        category_accuracy.append(CategoryAccuracy(
            category_name=cat.name,
            correct_count=total_correct,
            total_count=total_questions,
            accuracy=accuracy,
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
