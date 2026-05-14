# 論理コンポーネント定義（backend NFR）

## コンポーネント構成図

```
main.py
  |
  |-- CORSMiddleware          (NFR: CORS制御)
  |
  |-- /health                 (NFR: ヘルスチェック)
  |
  |-- TopicsRouter
  |     |-- get_db()          (DB: セッション管理)
  |
  |-- QuestionsRouter
  |     |-- get_db()
  |
  |-- AdminRouter
        |-- verify_credentials()  (NFR: Basic認証)
        |-- get_db()
```

## 各論理コンポーネントの詳細

### CORSMiddleware
| 項目 | 内容 |
|---|---|
| 種別 | FastAPI Middleware |
| 登録場所 | `main.py` |
| 設定 | `allow_origins=[FRONTEND_ORIGIN]`, `allow_methods=["GET","POST"]` |
| NFR対応 | NFR-04（CORS） |

### verify_credentials（依存性注入関数）
| 項目 | 内容 |
|---|---|
| 種別 | FastAPI Dependency |
| 定義場所 | `routers/admin.py` |
| 適用先 | AdminRouterの全エンドポイント |
| NFR対応 | NFR-03（セキュリティ） |

### get_db（依存性注入関数）
| 項目 | 内容 |
|---|---|
| 種別 | FastAPI Dependency / Generator |
| 定義場所 | `database.py` |
| 適用先 | 全ルーターのエンドポイント |
| 動作 | リクエスト開始時にセッション生成、終了時に自動クローズ |
| NFR対応 | パフォーマンス（コネクションプール） |

### SQLAlchemy Engine
| 項目 | 内容 |
|---|---|
| 種別 | インフラコンポーネント |
| 設定 | `pool_size=5, max_overflow=0, pool_pre_ping=True, pool_recycle=300` |
| NFR対応 | パフォーマンス・可用性（Renderアイドル切断対策） |

### /health エンドポイント
| 項目 | 内容 |
|---|---|
| 種別 | FastAPI Route |
| 定義場所 | `main.py` |
| レスポンス | `{"status": "ok"}` |
| NFR対応 | 可用性（Renderヘルスチェック） |

## 環境変数一覧（NFR関連）

| 変数名 | 用途 | デフォルト（ローカル） |
|---|---|---|
| `DATABASE_URL` | PostgreSQL接続文字列 | `postgresql://user:pass@localhost/stackcheck` |
| `ADMIN_USERNAME` | Basic認証ユーザー名 | （必須・デフォルトなし） |
| `ADMIN_PASSWORD` | Basic認証パスワード | （必須・デフォルトなし） |
| `FRONTEND_ORIGIN` | CORS許可オリジン | `http://localhost:5173` |
