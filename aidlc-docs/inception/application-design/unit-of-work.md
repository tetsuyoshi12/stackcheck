# Unit of Work 定義

## ユニット構成

このプロジェクトは **2ユニット** で構成される。
各ユニットは独立したデプロイ先を持ち、並行して開発できる。

---

## Unit 1: backend

### 概要
| 項目 | 内容 |
|---|---|
| ユニット名 | backend |
| タイプ | Web API Service |
| 言語/フレームワーク | Python / FastAPI |
| データベース | PostgreSQL（SQLAlchemy ORM + Alembic） |
| デプロイ先 | Render Web Service |
| ディレクトリ | `stackcheck/backend/` |

### 責務
- トピック一覧取得API（`GET /topics`）
- 問題取得API（`GET /topics/{id}/questions`）
- 管理者用トピック登録API（`POST /admin/topics`、Basic認証）
- 管理者用問題登録API（`POST /admin/questions`、Basic認証）
- DBスキーマ管理（Alembicマイグレーション）
- CORS設定（フロントエンドオリジンを許可）

### 含むコンポーネント
- `main.py` — FastAPIアプリ初期化・CORS・ルーター登録
- `database.py` — DB接続・セッション管理
- `models.py` — Topic / Question ORM モデル
- `schemas.py` — Pydantic スキーマ
- `routers/topics.py` — TopicsRouter
- `routers/questions.py` — QuestionsRouter
- `routers/admin.py` — AdminRouter（Basic認証）

### 環境変数
| 変数名 | 説明 |
|---|---|
| `DATABASE_URL` | PostgreSQL接続文字列 |
| `ADMIN_USERNAME` | 管理者Basic認証ユーザー名 |
| `ADMIN_PASSWORD` | 管理者Basic認証パスワード |
| `FRONTEND_ORIGIN` | CORSで許可するフロントエンドURL |

---

## Unit 2: frontend

### 概要
| 項目 | 内容 |
|---|---|
| ユニット名 | frontend |
| タイプ | Static Web Application |
| 言語/フレームワーク | TypeScript / React + Vite |
| ルーティング | React Router v6 |
| HTTPクライアント | axios |
| デプロイ先 | Render Static Site |
| ディレクトリ | `stackcheck/frontend/` |

### 責務
- トピック一覧画面（US-01）
- クイズ実施画面・即時フィードバック（US-02, US-03）
- セッション結果・振り返り画面（US-04）
- 管理者トピック登録画面（US-05）
- 管理者問題登録画面（US-06）
- バックエンドAPIとの通信（axios）

### 含むコンポーネント
- `src/main.tsx` — Reactエントリーポイント
- `src/App.tsx` — React Router設定
- `src/types/index.ts` — 型定義（Topic / Question / Answer）
- `src/api/client.ts` — axiosクライアント
- `src/pages/TopicListPage.tsx` — トピック一覧
- `src/pages/QuizPage.tsx` — クイズ実施
- `src/pages/ResultPage.tsx` — 結果表示
- `src/pages/AdminPage.tsx` — 管理者画面

### 環境変数
| 変数名 | 説明 |
|---|---|
| `VITE_API_BASE_URL` | バックエンドAPIのベースURL |
