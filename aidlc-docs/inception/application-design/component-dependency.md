# コンポーネント依存関係

## バックエンド依存関係

```
main.py
  ├── TopicsRouter (routers/topics.py)
  │     └── Database (database.py)
  │           └── Models (models.py)
  ├── QuestionsRouter (routers/questions.py)
  │     └── Database (database.py)
  │           └── Models (models.py)
  └── AdminRouter (routers/admin.py)
        ├── Database (database.py)
        │     └── Models (models.py)
        └── Schemas (schemas.py)
```

### 依存マトリクス（バックエンド）

| コンポーネント | 依存先 | 通信方式 |
|---|---|---|
| TopicsRouter | Database, Models, Schemas | SQLAlchemy Session |
| QuestionsRouter | Database, Models, Schemas | SQLAlchemy Session |
| AdminRouter | Database, Models, Schemas | SQLAlchemy Session + HTTPBasic |
| Database | Models | SQLAlchemy ORM |
| Models | — | — |
| Schemas | — | — |

---

## フロントエンド依存関係

```
App.tsx (React Router)
  ├── TopicListPage
  │     └── apiClient
  ├── QuizPage
  │     └── apiClient
  ├── ResultPage
  │     └── (props from QuizPage via React Router state)
  └── AdminPage
        └── apiClient
```

### 依存マトリクス（フロントエンド）

| コンポーネント | 依存先 | 通信方式 |
|---|---|---|
| TopicListPage | apiClient | axios HTTP GET |
| QuizPage | apiClient | axios HTTP GET |
| ResultPage | QuizPage（Router state） | React Router location.state |
| AdminPage | apiClient | axios HTTP POST + Basic Auth |
| apiClient | axios | HTTP |

---

## フロントエンド ↔ バックエンド 通信マップ

| フロントエンド | エンドポイント | バックエンド |
|---|---|---|
| TopicListPage | GET /topics | TopicsRouter |
| QuizPage | GET /topics/{id}/questions | QuestionsRouter |
| AdminPage | POST /admin/topics | AdminRouter |
| AdminPage | POST /admin/questions | AdminRouter |

---

## データフロー図

```
[ブラウザ]
    |
    | HTTP (axios)
    v
[FastAPI - Render Web Service]
    |
    | SQLAlchemy ORM
    v
[PostgreSQL - Render DB]
```

CORSミドルウェアがフロントエンドオリジン（Render Static Site）からのリクエストを許可する。
