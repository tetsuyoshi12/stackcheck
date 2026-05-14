# テックスタック決定（backend）

## ランタイム・フレームワーク

| 技術 | バージョン | 選定理由 |
|---|---|---|
| Python | 3.11+ | Render無料枠対応・型ヒント充実 |
| FastAPI | 0.111.x | 軽量・非同期・自動OpenAPI生成 |
| uvicorn | 0.29.x | ASGI対応・本番利用実績あり |

## データベース

| 技術 | バージョン | 選定理由 |
|---|---|---|
| PostgreSQL | 15（Render管理） | Render無料枠で提供・要件通り |
| SQLAlchemy | 2.0.x | ORM・型安全・Alembic連携 |
| Alembic | 1.13.x | マイグレーション管理 |
| psycopg2-binary | 2.9.x | PostgreSQL接続ドライバ |

## 認証

| 技術 | 選定理由 |
|---|---|
| FastAPI `HTTPBasic` | 標準ライブラリ・追加依存なし |
| `secrets.compare_digest` | タイミング攻撃対策（Python標準） |

## バリデーション

| 技術 | バージョン | 選定理由 |
|---|---|---|
| Pydantic | v2（FastAPI同梱） | 型安全・高速・FastAPI統合 |

## テスト

| 技術 | バージョン | 選定理由 |
|---|---|---|
| pytest | 8.x | Python標準テストフレームワーク |
| httpx | 0.27.x | FastAPI TestClient用非同期HTTPクライアント |

## 依存関係ファイル（`backend/requirements.txt`）

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
alembic==1.13.1
psycopg2-binary==2.9.9
pydantic==2.7.1
python-dotenv==1.0.1
httpx==0.27.0
pytest==8.2.0
```
