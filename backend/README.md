# stackcheck backend

FastAPI + PostgreSQL によるクイズアプリのバックエンドAPI。

## セットアップ

### 必要なもの
- Python 3.11+
- PostgreSQL（ローカル）

### インストール

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 環境変数

`.env.example` をコピーして `.env` を作成し、値を設定する。

```bash
cp .env.example .env
```

| 変数名 | 説明 |
|---|---|
| `DATABASE_URL` | PostgreSQL接続文字列 |
| `ADMIN_USERNAME` | 管理者ユーザー名 |
| `ADMIN_PASSWORD` | 管理者パスワード |
| `FRONTEND_ORIGIN` | CORSで許可するフロントエンドURL |

### DBマイグレーション

```bash
alembic upgrade head
```

### 起動

```bash
uvicorn main:app --reload --port 8000
```

API ドキュメント: http://localhost:8000/docs

## テスト

```bash
pytest tests/ -v
```

## APIエンドポイント

| メソッド | パス | 説明 |
|---|---|---|
| GET | /health | ヘルスチェック |
| GET | /topics | トピック一覧取得 |
| GET | /topics/{id}/questions | 問題一覧取得 |
| POST | /admin/topics | トピック登録（Basic認証） |
| POST | /admin/questions | 問題登録（Basic認証） |

## デプロイ（Render）

`render.yaml` を使用してRenderにデプロイする。
`ADMIN_USERNAME` / `ADMIN_PASSWORD` / `FRONTEND_ORIGIN` はRender Dashboardで手動設定が必要。
