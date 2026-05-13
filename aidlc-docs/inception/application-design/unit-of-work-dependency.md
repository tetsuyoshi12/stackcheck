# Unit of Work 依存関係マトリクス

## ユニット間依存関係

| ユニット | 依存先 | 依存タイプ | 説明 |
|---|---|---|---|
| frontend | backend | Runtime（HTTP） | frontendはbackendのAPIを呼び出す |
| backend | — | — | 外部依存なし（PostgreSQLはインフラ） |

## 依存方向

```
frontend  ──HTTP(axios)──>  backend  ──ORM──>  PostgreSQL
```

- **frontend → backend**: 実行時依存（APIコール）
- **backend → PostgreSQL**: インフラ依存（Renderが管理）
- **frontend → backend**: ビルド時依存なし（APIのURLは環境変数で注入）

## 開発順序

| フェーズ | 順序 | 理由 |
|---|---|---|
| 設計 | backend → frontend | APIスキーマを先に確定することでfrontendの型定義が安定する |
| 実装 | 並行可能 | backendはモックなしで独立開発可能。frontendはAPIモックで並行開発可能 |
| 結合テスト | backend完成後 | frontendがbackendの実APIに接続して動作確認 |

## デプロイ順序

1. **backend** を先にRender Web Serviceにデプロイ（APIのURLを確定）
2. **frontend** の `VITE_API_BASE_URL` にbackendのURLを設定してビルド・デプロイ

## ブレーキングチェンジのリスク

| 変更 | 影響 | 対応 |
|---|---|---|
| APIレスポンス構造の変更 | frontendの型定義・表示ロジックに影響 | schemas.pyとtypes/index.tsを同時更新 |
| エンドポイントパスの変更 | frontendのapiClientに影響 | client.tsのURL定数を更新 |
| 認証方式の変更 | AdminPageのリクエストヘッダーに影響 | client.tsの認証ロジックを更新 |
