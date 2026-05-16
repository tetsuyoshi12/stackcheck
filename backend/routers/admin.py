import os
import csv
import io
import secrets
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, ValidationError
from typing import List, Optional

from database import get_db
from models import Topic, Question, Category
from schemas import (
    TopicCreate, TopicUpdate, TopicResponse, TopicAdminResponse, TopicCategoryUpdate,
    QuestionCreate, QuestionUpdate, QuestionResponse,
    CategoryCreate, CategoryResponse,
)

router = APIRouter()
security = HTTPBasic()


def verify_credentials(credentials: HTTPBasicCredentials = Depends(security)) -> str:
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


# --- カテゴリ ---

@router.post("/admin/categories", response_model=CategoryResponse, status_code=201)
def create_category(
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
    _: str = Depends(verify_credentials),
):
    """カテゴリを登録する"""
    new_cat = Category(name=category_in.name)
    db.add(new_cat)
    try:
        db.commit()
        db.refresh(new_cat)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Category name already exists")
    return new_cat


# --- トピック ---

@router.get("/admin/topics", response_model=List[TopicAdminResponse])
def list_admin_topics(
    db: Session = Depends(get_db),
    _: str = Depends(verify_credentials),
):
    """管理者用トピック一覧（問題数・カテゴリ含む）"""
    from sqlalchemy import func as sqlfunc

    # 問題数をサブクエリで取得（joinedloadとGROUP BYの競合を避ける）
    question_count_subq = (
        db.query(
            Question.topic_id,
            sqlfunc.count(Question.id).label("question_count"),
        )
        .group_by(Question.topic_id)
        .subquery()
    )

    rows = (
        db.query(Topic, question_count_subq.c.question_count)
        .outerjoin(question_count_subq, question_count_subq.c.topic_id == Topic.id)
        .options(joinedload(Topic.category))
        .order_by(Topic.created_at.desc())
        .all()
    )

    result = []
    for topic, question_count in rows:
        result.append(TopicAdminResponse(
            id=topic.id,
            title=topic.title,
            category_id=topic.category_id,
            category_name=topic.category.name if topic.category else None,
            question_count=question_count or 0,
            created_at=topic.created_at,
        ))
    return result


@router.post("/admin/topics", response_model=TopicResponse, status_code=201)
def create_topic(
    topic_in: TopicCreate,
    db: Session = Depends(get_db),
    _: str = Depends(verify_credentials),
):
    """トピックを登録する"""
    new_topic = Topic(title=topic_in.title)
    db.add(new_topic)
    try:
        db.commit()
        db.refresh(new_topic)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Topic title already exists")
    return TopicResponse.from_orm_with_category(new_topic)


@router.put("/admin/topics/{topic_id}", response_model=TopicResponse)
def update_topic(
    topic_id: int,
    update_in: TopicUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(verify_credentials),
):
    """トピックのタイトル・カテゴリを更新する"""
    topic = (
        db.query(Topic)
        .options(joinedload(Topic.category))
        .filter(Topic.id == topic_id)
        .first()
    )
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    if update_in.title is not None:
        topic.title = update_in.title
    if "category_id" in update_in.model_fields_set or update_in.category_id is not None:
        if update_in.category_id is not None:
            category = db.query(Category).filter(Category.id == update_in.category_id).first()
            if not category:
                raise HTTPException(status_code=404, detail="Category not found")
        topic.category_id = update_in.category_id

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Topic title already exists")

    topic = (
        db.query(Topic)
        .options(joinedload(Topic.category))
        .filter(Topic.id == topic_id)
        .first()
    )
    return TopicResponse.from_orm_with_category(topic)


@router.delete("/admin/topics/{topic_id}", status_code=204)
def delete_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_credentials),
):
    """トピックを削除する（関連問題もCASCADE削除）"""
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    db.delete(topic)
    db.commit()


# --- 問題 ---

@router.get("/admin/topics/{topic_id}/questions", response_model=List[QuestionResponse])
def list_admin_questions(
    topic_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_credentials),
):
    """管理者用：指定トピックの問題一覧"""
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return (
        db.query(Question)
        .filter(Question.topic_id == topic_id)
        .order_by(Question.order.asc())
        .all()
    )


@router.post("/admin/questions", response_model=QuestionResponse, status_code=201)
def create_question(
    question_in: QuestionCreate,
    db: Session = Depends(get_db),
    _: str = Depends(verify_credentials),
):
    """問題を登録する"""
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


@router.put("/admin/questions/{question_id}", response_model=QuestionResponse)
def update_question(
    question_id: int,
    update_in: QuestionUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(verify_credentials),
):
    """問題を編集する"""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    if update_in.question_text is not None:
        question.question_text = update_in.question_text
    if update_in.option_a is not None:
        question.option_a = update_in.option_a
    if update_in.option_b is not None:
        question.option_b = update_in.option_b
    if update_in.option_c is not None:
        question.option_c = update_in.option_c
    if update_in.option_d is not None:
        question.option_d = update_in.option_d
    if update_in.correct_option is not None:
        question.correct_option = update_in.correct_option.value
    if update_in.explanation is not None:
        question.explanation = update_in.explanation
    if update_in.order is not None:
        question.order = update_in.order

    try:
        db.commit()
        db.refresh(question)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Question with this order already exists for the topic",
        )
    return question


@router.delete("/admin/questions/{question_id}", status_code=204)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_credentials),
):
    """問題を削除する"""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(question)
    db.commit()


# --- CSVアップロード ---

class CsvUploadResult(BaseModel):
    success_count: int
    skip_count: int
    errors: List[str]


@router.post("/admin/csv-upload", response_model=CsvUploadResult)
async def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: str = Depends(verify_credentials),
):
    """CSVファイルからトピック・問題を一括登録する（category_name列はオプション）"""
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="CSVファイルをアップロードしてください")

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="UTF-8形式のCSVファイルをアップロードしてください")

    reader = csv.DictReader(io.StringIO(text))

    required_columns = {
        "topic_title", "question_text", "option_a", "option_b",
        "option_c", "option_d", "correct_option", "explanation", "order"
    }
    if reader.fieldnames is None or not required_columns.issubset(set(reader.fieldnames)):
        missing = required_columns - set(reader.fieldnames or [])
        raise HTTPException(
            status_code=400,
            detail=f"CSVに必須カラムがありません: {', '.join(sorted(missing))}"
        )

    has_category_col = "category_name" in (reader.fieldnames or [])

    success_count = 0
    skip_count = 0
    errors: List[str] = []
    topic_cache: dict[str, int] = {}
    category_cache: dict[str, int] = {}

    for row_num, row in enumerate(reader, start=2):
        topic_title = (row.get("topic_title") or "").strip()
        if not topic_title:
            errors.append(f"行{row_num}: topic_titleが空です")
            skip_count += 1
            continue

        try:
            def s(val) -> str:
                return (val or "").strip()

            question_data = QuestionCreate(
                topic_id=0,
                question_text=s(row.get("question_text")),
                option_a=s(row.get("option_a")),
                option_b=s(row.get("option_b")),
                option_c=s(row.get("option_c")),
                option_d=s(row.get("option_d")),
                correct_option=s(row.get("correct_option")).lower(),  # type: ignore
                explanation=s(row.get("explanation")),
                order=int(row.get("order") or 0),
            )
        except (ValidationError, ValueError) as e:
            errors.append(f"行{row_num}: バリデーションエラー - {str(e)[:100]}")
            skip_count += 1
            continue

        # カテゴリの取得または作成（category_name列がある場合のみ）
        category_id: Optional[int] = None
        if has_category_col:
            category_name = row.get("category_name", "").strip()
            if category_name:
                if category_name in category_cache:
                    category_id = category_cache[category_name]
                else:
                    cat = db.query(Category).filter(Category.name == category_name).first()
                    if not cat:
                        cat = Category(name=category_name)
                        db.add(cat)
                        try:
                            db.commit()
                            db.refresh(cat)
                        except IntegrityError:
                            db.rollback()
                            cat = db.query(Category).filter(Category.name == category_name).first()
                    if cat:
                        category_cache[category_name] = cat.id
                        category_id = cat.id

        # トピックの取得または作成
        if topic_title in topic_cache:
            topic_id = topic_cache[topic_title]
        else:
            topic = db.query(Topic).filter(Topic.title == topic_title).first()
            if not topic:
                topic = Topic(title=topic_title, category_id=category_id)
                db.add(topic)
                try:
                    db.commit()
                    db.refresh(topic)
                except IntegrityError:
                    db.rollback()
                    topic = db.query(Topic).filter(Topic.title == topic_title).first()
                    if not topic:
                        errors.append(f"行{row_num}: トピック作成に失敗しました")
                        skip_count += 1
                        continue
            else:
                # 既存トピックにcategory_idを設定（未設定の場合のみ）
                if category_id and topic.category_id is None:
                    topic.category_id = category_id
                    db.commit()
            topic_cache[topic_title] = topic.id
            topic_id = topic.id

        new_question = Question(
            topic_id=topic_id,
            question_text=question_data.question_text,
            option_a=question_data.option_a,
            option_b=question_data.option_b,
            option_c=question_data.option_c,
            option_d=question_data.option_d,
            correct_option=question_data.correct_option.value,
            explanation=question_data.explanation,
            order=question_data.order,
        )
        db.add(new_question)
        try:
            db.commit()
            success_count += 1
        except IntegrityError:
            db.rollback()
            errors.append(f"行{row_num}: 同じトピックに同じ出題順（order={question_data.order}）が既に存在します")
            skip_count += 1

    return CsvUploadResult(
        success_count=success_count,
        skip_count=skip_count,
        errors=errors,
    )
