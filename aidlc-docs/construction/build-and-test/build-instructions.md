# ビルド手順

## 前提条件

| ツール | バージョン | 確認コマンド |
|---|---|---|
| Python | 3.11+ | `python3 --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| PostgreSQL | 15（Renderが管理） | ローカルは任意 |

---

## Backend ビルド

```bash
cd backend

# 1. 仮想環境の作成・有効化
python3 -m venv venv
source venv/bin/activate        # Mac/Linux
# venv\Scripts\activate         # Windows

# 2. 依存関係のインストール
pip install -r requirements.txt

# 3. 環境変数の設定
cp .env.example .env
# .env を編集して DATABASE_URL / ADMIN_USERNAME / ADMIN_PASSWORD / FRONTEND_ORIGIN を設定

# 4. DBマイグレーション
alembic upgrade head

# 5. 起動確認
uvicorn main:app --reload --port 8000
# → http://localhost:8000/docs でSwagger UIを確認
# → http://localhost:8000/health が {"status":"ok"} を返すことを確認
```

**期待される出力:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

---

## Frontend ビルド

```bash
cd frontend

# 1. 依存関係のインストール
npm install

# 2. 環境変数の設定
cp .env.example .env.local
# .env.local の VITE_API_BASE_URL=http://localhost:8000 を確認

# 3. 開発サーバー起動
npm run dev
# → http://localhost:5173 で確認

# 4. 本番ビルド
npm run build
# → frontend/dist/ にビルド成果物が生成される
```

**期待される出力（ビルド）:**
```
✓ built in Xs
dist/index.html
dist/assets/main-[hash].js
dist/assets/main-[hash].css
```

---

## トラブルシューティング

### Backend: `psycopg2-binary` のインストール失敗
- Python 3.14はまだ未対応。**Python 3.11を使用すること**
- `python3.11 -m venv venv` で明示的にバージョン指定

### Backend: `alembic upgrade head` 失敗
- `DATABASE_URL` が正しく設定されているか確認
- PostgreSQLが起動しているか確認: `pg_isready`

### Frontend: `npm install` 失敗
- Node.js 18以上を使用していることを確認
- `node --version` で確認
