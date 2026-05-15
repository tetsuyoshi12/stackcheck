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
    TopicCreate, TopicResponse, TopicCategoryUpdate,
    QuestionCreate, QuestionResponse,
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
def update_topic_category(
    topic_id: int,
    update_in: TopicCategoryUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(verify_credentials),
):
    """トピックのカテゴリを更新する"""
    topic = (
        db.query(Topic)
        .options(joinedload(Topic.category))
        .filter(Topic.id == topic_id)
        .first()
    )
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    if update_in.category_id is not None:
        category = db.query(Category).filter(Category.id == update_in.category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

    topic.category_id = update_in.category_id
    db.commit()
    db.refresh(topic)
    # リレーションを再ロード
    topic = (
        db.query(Topic)
        .options(joinedload(Topic.category))
        .filter(Topic.id == topic_id)
        .first()
    )
    return TopicResponse.from_orm_with_category(topic)


# --- 問題 ---

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
        topic_title = row.get("topic_title", "").strip()
        if not topic_title:
            errors.append(f"行{row_num}: topic_titleが空です")
            skip_count += 1
            continue

        try:
            question_data = QuestionCreate(
                topic_id=0,
                question_text=row.get("question_text", "").strip(),
                option_a=row.get("option_a", "").strip(),
                option_b=row.get("option_b", "").strip(),
                option_c=row.get("option_c", "").strip(),
                option_d=row.get("option_d", "").strip(),
                correct_option=row.get("correct_option", "").strip().lower(),  # type: ignore
                explanation=row.get("explanation", "").strip(),
                order=int(row.get("order", 0)),
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
