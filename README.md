# stackcheck

エンジニア向けスキル確認クイズアプリ。トピックを選んで4択問題に答えることで、知識定着度・スキルの弱点を把握できる。

## 構成

```
stackcheck/
├── backend/          # FastAPI + PostgreSQL
├── frontend/         # React (TypeScript) + Vite
├── render.yaml       # Renderデプロイ設定
└── aidlc-docs/       # AI-DLC設計ドキュメント
```

## クイックスタート

### Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # DATABASE_URL等を設定
alembic upgrade head
uvicorn main:app --reload --port 8000
# → http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # VITE_API_BASE_URL=http://localhost:8000
npm run dev
# → http://localhost:5173
```

## テスト

```bash
# Backend（Python 3.11必須）
cd backend && pytest tests/ -v

# Frontend
cd frontend && npm run test
```

## デプロイ

`aidlc-docs/operations/deploy-to-render.md` を参照。

## API

| Method | Path | 説明 |
|---|---|---|
| GET | /health | ヘルスチェック |
| GET | /topics | トピック一覧 |
| GET | /topics/{id}/questions | 問題一覧（5問） |
| POST | /admin/topics | トピック登録（Basic認証） |
| POST | /admin/questions | 問題登録（Basic認証） |

## 技術スタック

| レイヤー | 技術 |
|---|---|
| Backend | FastAPI / SQLAlchemy / Alembic / PostgreSQL |
| Frontend | React / TypeScript / Vite / Tailwind CSS |
| Deploy | Render（無料枠） |
