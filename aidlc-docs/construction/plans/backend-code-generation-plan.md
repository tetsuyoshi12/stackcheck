# Code Generation Plan - backend

## ユニット情報
- **ユニット**: backend
- **ディレクトリ**: `backend/`（ワークスペースルート直下）
- **担当ストーリー**: US-01, US-02, US-05, US-06

## 生成ステップ

### Step 1: プロジェクト構造セットアップ
- [x] `backend/` ディレクトリ作成
- [x] `backend/routers/` ディレクトリ作成
- [x] `backend/requirements.txt` 作成
- [x] `backend/.env.example` 作成
- [x] `backend/alembic.ini` 作成
- [x] `backend/alembic/` ディレクトリ・`env.py` 作成

### Step 2: データベース層生成
- [x] `backend/database.py` — SQLAlchemy engine・SessionLocal・get_db()

### Step 3: ORMモデル生成
- [x] `backend/models.py` — Topic・Question モデル

### Step 4: Pydanticスキーマ生成
- [x] `backend/schemas.py` — TopicCreate/Response・QuestionCreate/Response・CorrectOption Enum

### Step 5: ルーター生成（US-01）
- [x] `backend/routers/topics.py` — GET /topics

### Step 6: ルーター生成（US-02）
- [x] `backend/routers/questions.py` — GET /topics/{id}/questions

### Step 7: ルーター生成（US-05, US-06）
- [x] `backend/routers/admin.py` — POST /admin/topics, POST /admin/questions（Basic認証）

### Step 8: メインアプリ生成
- [x] `backend/main.py` — FastAPIアプリ・CORSMiddleware・ルーター登録・/health

### Step 9: Alembicマイグレーション生成
- [x] `backend/alembic/versions/001_initial.py` — topics・questions テーブル作成

### Step 10: テスト生成
- [x] `backend/tests/__init__.py`
- [x] `backend/tests/conftest.py` — テスト用DBセットアップ
- [x] `backend/tests/test_topics.py` — GET /topics テスト
- [x] `backend/tests/test_questions.py` — GET /topics/{id}/questions テスト
- [x] `backend/tests/test_admin.py` — POST /admin/* テスト（認証含む）

### Step 11: デプロイ設定生成
- [x] `render.yaml` — Render IaC設定（ワークスペースルート）

### Step 12: ドキュメント生成
- [x] `backend/README.md` — セットアップ・起動手順

## ストーリートレーサビリティ
| ストーリー | 実装ステップ |
|---|---|
| US-01 | Step 5（topics.py） |
| US-02 | Step 6（questions.py） |
| US-05 | Step 7（admin.py - POST /admin/topics） |
| US-06 | Step 7（admin.py - POST /admin/questions） |
