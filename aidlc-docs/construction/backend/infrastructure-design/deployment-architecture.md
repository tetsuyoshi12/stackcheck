# デプロイアーキテクチャ（backend）

## 本番環境構成図

```
Internet
    |
    | HTTPS (TLS by Render)
    v
+----------------------------------+
|  Render Web Service              |
|  stackcheck-backend              |
|                                  |
|  uvicorn (ASGI)                  |
|    |                             |
|    +-- FastAPI app               |
|         |-- CORSMiddleware       |
|         |-- /health              |
|         |-- /topics              |
|         |-- /topics/{id}/...     |
|         +-- /admin/*             |
|              (Basic Auth)        |
+----------------------------------+
    |
    | Internal Network (Render)
    | postgresql://...
    v
+----------------------------------+
|  Render PostgreSQL               |
|  stackcheck-db                   |
|                                  |
|  tables:                         |
|    - topics                      |
|    - questions                   |
+----------------------------------+
```

## デプロイフロー

```
1. git push origin main
       |
       v
2. Render が自動検知（GitHub連携）
       |
       v
3. Build: pip install -r requirements.txt
       |
       v
4. Start: alembic upgrade head
       |        (マイグレーション自動実行)
       v
5. Start: uvicorn main:app --host 0.0.0.0 --port $PORT
       |
       v
6. Health Check: GET /health → 200 OK
       |
       v
7. デプロイ完了・トラフィック切り替え
```

## ネットワーク設計

| 通信 | 経路 | 備考 |
|---|---|---|
| ユーザー → backend | HTTPS（Render TLS終端） | アプリ側でHTTPS対応不要 |
| frontend → backend | HTTPS + CORS | `FRONTEND_ORIGIN` で制限 |
| backend → PostgreSQL | Internal Network | `Internal Database URL` 使用 |

## スケーリング方針（v1）

| 項目 | v1方針 |
|---|---|
| インスタンス数 | 1（Render無料枠） |
| オートスケール | なし |
| コールドスタート | 許容（15〜30秒） |
| アップタイム | ベストエフォート |

## セキュリティ境界

| 境界 | 対策 |
|---|---|
| インターネット → backend | Render TLS（HTTPS強制） |
| frontend → /admin/* | Basic認証（`ADMIN_USERNAME`/`ADMIN_PASSWORD`） |
| backend → PostgreSQL | Internal Network（外部からアクセス不可） |
| 環境変数 | Render Dashboard で管理（コードに含めない） |
