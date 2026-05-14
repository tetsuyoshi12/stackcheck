# インフラ設計（frontend）

## Render Static Site 設定

| 項目 | 値 |
|---|---|
| Name | stackcheck-frontend |
| Runtime | Static |
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| Plan | Free |

### 環境変数
| 変数名 | 値 |
|---|---|
| `VITE_API_BASE_URL` | backendのRender URL（例: `https://stackcheck-backend.onrender.com`） |

## ローカル開発

```bash
cd frontend
npm install
# .env.local を作成
echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local
npm run dev   # http://localhost:5173
```

## ビルド・デプロイフロー

```
git push origin main
  → Render自動検知
  → npm install && npm run build
  → dist/ を静的ファイルとして配信
  → https://stackcheck-frontend.onrender.com
```

## SPA対応（React Router）

Render Static Siteでは `/*` を `index.html` にリダイレクトする設定が必要。

`frontend/public/_redirects` ファイルを作成:
```
/*  /index.html  200
```
