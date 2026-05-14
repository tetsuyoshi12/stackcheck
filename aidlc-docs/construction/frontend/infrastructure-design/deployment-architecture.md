# デプロイアーキテクチャ（frontend）

## 本番環境構成

```
ユーザーのブラウザ
    |
    | HTTPS
    v
+----------------------------------+
|  Render Static Site              |
|  stackcheck-frontend             |
|                                  |
|  dist/                           |
|    index.html                    |
|    assets/                       |
|      main-[hash].js              |
|      main-[hash].css             |
|    _redirects  (SPA対応)         |
+----------------------------------+
    |
    | HTTPS + CORS (axios)
    v
+----------------------------------+
|  Render Web Service              |
|  stackcheck-backend              |
+----------------------------------+
```

## デプロイ順序

1. **backend** を先にデプロイしてURLを確定
2. frontendの `VITE_API_BASE_URL` にbackendのURLを設定
3. **frontend** をデプロイ

## ネットワーク設計

| 通信 | 経路 |
|---|---|
| ユーザー → frontend | HTTPS（Render CDN） |
| frontend → backend | HTTPS + CORS（`VITE_API_BASE_URL`） |
