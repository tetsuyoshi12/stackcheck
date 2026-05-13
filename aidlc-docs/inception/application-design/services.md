# サービス定義

## バックエンドサービス層

FastAPIはルーターが直接DBセッションを受け取るシンプルな構成のため、
v1では独立したサービスクラスは設けず、ルーター内で直接DBクエリを実行する。
ビジネスロジックが複雑化した場合（v2以降）にサービス層を分離する。

### 認証サービス（インライン）
- **場所**: `backend/routers/admin.py` 内
- **方式**: FastAPIの `HTTPBasic` + `HTTPBasicCredentials` を使用
- **実装**: 環境変数 `ADMIN_USERNAME` / `ADMIN_PASSWORD` と照合
- **適用**: AdminRouterの全エンドポイントに `Depends(verify_credentials)` で適用

---

## フロントエンドサービス層

### APIクライアントサービス (`frontend/src/api/client.ts`)
フロントエンドのサービス層はAPIクライアントモジュールが担う。
axiosインスタンスを中央管理し、全APIコールをここに集約する。

```
TopicListPage ─┐
QuizPage       ├──→ apiClient (axios) ──→ FastAPI Backend
ResultPage     │
AdminPage ─────┘
```

### セッション状態管理
クイズのセッション状態（回答履歴・現在の問題インデックス）は
`QuizPage` コンポーネントの `useState` で管理する。
DBへの保存は行わず、ブラウザのセッションストレージも使用しない（v1）。
ページリロードでリセットされる仕様。
