# インフラ設計（backend）

## デプロイ構成概要

```
[Render Web Service]
  - Runtime: Python 3.11
  - Start Command: alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port $PORT
  - Health Check Path: /health
  - Plan: Free

[Render PostgreSQL]
  - Version: PostgreSQL 15
  - Plan: Free
  - 接続: DATABASE_URL 環境変数経由
```

---

## Render Web Service 設定

| 項目 | 値 |
|---|---|
| Name | stackcheck-backend |
| Runtime | Python 3 |
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/health` |
| Plan | Free |

### 環境変数（Render Dashboard で設定）
| 変数名 | 値の設定方法 |
|---|---|
| `DATABASE_URL` | Render PostgreSQL の Internal Database URL を貼り付け |
| `ADMIN_USERNAME` | 任意の文字列（例: `admin`） |
| `ADMIN_PASSWORD` | 強力なパスワード |
| `FRONTEND_ORIGIN` | フロントエンドのRender Static Site URL（例: `https://stackcheck.onrender.com`） |

---

## Render PostgreSQL 設定

| 項目 | 値 |
|---|---|
| Name | stackcheck-db |
| Database Name | stackcheck |
| Plan | Free |
| Region | Oregon（バックエンドと同一リージョン） |

### 接続情報の取得
Render Dashboard → PostgreSQL → **Internal Database URL** をコピーして `DATABASE_URL` に設定する。
（Internal URLはRender内部ネットワーク経由で接続するため低レイテンシ）

---

## Alembic マイグレーション設定

### alembic.ini
```ini
[alembic]
script_location = alembic
sqlalchemy.url = %(DATABASE_URL)s
```

### env.py の設定
```python
from models import Base
target_metadata = Base.metadata

# 環境変数からDATABASE_URLを取得
config.set_main_option("sqlalchemy.url", os.getenv("DATABASE_URL", ""))
```

### マイグレーション実行タイミング
- **ローカル**: `alembic upgrade head` を手動実行
- **本番（Render）**: Start Command の先頭に `alembic upgrade head &&` を付与して自動実行

---

## ローカル開発環境

### 必要なもの
- Python 3.11+
- PostgreSQL（ローカルまたはDockerで起動）
- `.env` ファイル

### `.env` ファイル（`backend/.env`）
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/stackcheck
ADMIN_USERNAME=admin
ADMIN_PASSWORD=localpassword
FRONTEND_ORIGIN=http://localhost:5173
```

### ローカル起動手順
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload --port 8000
```

---

## render.yaml（Infrastructure as Code）

```yaml
services:
  - type: web
    name: stackcheck-backend
    runtime: python
    rootDir: backend
    buildCommand: pip install -r requirements.txt
    startCommand: alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /health
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: stackcheck-db
          property: connectionString
      - key: ADMIN_USERNAME
        sync: false
      - key: ADMIN_PASSWORD
        sync: false
      - key: FRONTEND_ORIGIN
        sync: false

databases:
  - name: stackcheck-db
    databaseName: stackcheck
    plan: free
```

**注意**: `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `FRONTEND_ORIGIN` は `sync: false` のため、Render Dashboardで手動設定が必要。
