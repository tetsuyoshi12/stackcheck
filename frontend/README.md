# stackcheck frontend

React（TypeScript）+ Vite によるクイズアプリのフロントエンド。

## セットアップ

```bash
cd frontend
npm install
cp .env.example .env.local
# .env.local の VITE_API_BASE_URL を編集
npm run dev   # http://localhost:5173
```

## 環境変数

| 変数名 | 説明 |
|---|---|
| `VITE_API_BASE_URL` | バックエンドAPIのベースURL |

## テスト

```bash
npm run test
```

## ビルド

```bash
npm run build   # dist/ に出力
```

## ページ構成

| パス | 説明 |
|---|---|
| `/` | トピック一覧 |
| `/quiz/:topicId` | クイズ実施 |
| `/result` | 結果・振り返り |
| `/admin` | 管理者画面（Basic認証） |

## デプロイ（Render Static Site）

`render.yaml` を使用してRenderにデプロイする。
`VITE_API_BASE_URL` はRender Dashboardで手動設定が必要。
