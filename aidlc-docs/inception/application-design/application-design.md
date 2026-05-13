# Application Design（統合ドキュメント）

## 概要

stackcheck は FastAPI バックエンド + React（TypeScript）フロントエンドの
2ユニット構成のフルスタックWebアプリケーション。

---

## アーキテクチャ概要

```
[Render Static Site]          [Render Web Service]      [Render PostgreSQL]
  React (TypeScript)    HTTP    FastAPI (Python)    ORM    PostgreSQL
  + Vite               ──────>  + SQLAlchemy        ────>
  + React Router v6    (CORS)   + Alembic
  + axios
```

---

## バックエンドコンポーネント

詳細: `components.md`

| コンポーネント | ファイル | 役割 |
|---|---|---|
| TopicsRouter | routers/topics.py | GET /topics |
| QuestionsRouter | routers/questions.py | GET /topics/{id}/questions |
| AdminRouter | routers/admin.py | POST /admin/* (Basic認証) |
| Database | database.py | DB接続・セッション管理 |
| Models | models.py | Topic / Question ORM モデル |
| Schemas | schemas.py | Pydantic リクエスト/レスポンス |

---

## フロントエンドコンポーネント

詳細: `components.md`

| コンポーネント | ファイル | 役割 |
|---|---|---|
| TopicListPage | pages/TopicListPage.tsx | トピック一覧・選択 |
| QuizPage | pages/QuizPage.tsx | クイズ実施・フィードバック |
| ResultPage | pages/ResultPage.tsx | 結果・振り返り表示 |
| AdminPage | pages/AdminPage.tsx | 管理者コンテンツ登録 |
| apiClient | api/client.ts | axios HTTPクライアント |

---

## サービス層

詳細: `services.md`

- バックエンド: v1はサービス層なし（ルーター直接DBアクセス）
- 認証: AdminRouterに `HTTPBasic` 依存性注入でインライン実装
- フロントエンド: `apiClient` モジュールがサービス層を担う

---

## コンポーネント依存関係

詳細: `component-dependency.md`

- バックエンド: main.py → Routers → Database → Models
- フロントエンド: App.tsx → Pages → apiClient → axios
- 通信: フロントエンド（axios）→ CORS → FastAPI → PostgreSQL

---

## 主要な設計決定

| 決定事項 | 選択 | 理由 |
|---|---|---|
| バックエンドルーター | 機能別分割（3ファイル） | 関心の分離・拡張性 |
| フロントエンド状態管理 | useState/useContext のみ | v1はシンプルに、外部ライブラリ不要 |
| フロントエンドルーティング | React Router v6 | 標準的・実績あり |
| DBアクセス | SQLAlchemy ORM + Alembic | 型安全・マイグレーション管理 |
| 管理者画面 | Reactに組み込み（/admin） | 単一デプロイで管理が楽 |
| APIクライアント | axios | シンプルで使いやすい |
| セッション管理 | useState のみ（DB保存なし） | v1スコープ通り |

---

## ディレクトリ構成（予定）

```
stackcheck/
├── backend/
│   ├── main.py              # FastAPIアプリ・CORS・ルーター登録
│   ├── database.py          # DB接続・セッション
│   ├── models.py            # SQLAlchemy ORM モデル
│   ├── schemas.py           # Pydantic スキーマ
│   └── routers/
│       ├── topics.py        # GET /topics
│       ├── questions.py     # GET /topics/{id}/questions
│       └── admin.py         # POST /admin/* (Basic認証)
├── frontend/
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx          # React Router設定
│       ├── types/
│       │   └── index.ts     # Topic / Question / Answer 型定義
│       ├── api/
│       │   └── client.ts    # axios APIクライアント
│       └── pages/
│           ├── TopicListPage.tsx
│           ├── QuizPage.tsx
│           ├── ResultPage.tsx
│           └── AdminPage.tsx
└── README.md
```
