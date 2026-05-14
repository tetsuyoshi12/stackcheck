# Renderデプロイ手順

## 前提条件
- GitHubにリポジトリをpush済み
- Renderアカウント作成済み（https://render.com）

---

## Step 1: GitHubにpush

```bash
cd c:\Users\owner\git\stackcheck
git add .
git commit -m "feat: initial implementation - backend + frontend"
git push -u origin main
```

---

## Step 2: PostgreSQLの作成

1. Render Dashboard → **New +** → **PostgreSQL**
2. 設定:
   - Name: `stackcheck-db`
   - Database: `stackcheck`
   - Plan: **Free**
   - Region: Oregon (US West)
3. **Create Database** をクリック
4. 作成後、**Internal Database URL** をコピーしておく

---

## Step 3: Backendのデプロイ

### 方法A: render.yaml を使う（推奨）

1. Render Dashboard → **New +** → **Blueprint**
2. GitHubリポジトリを選択
3. `render.yaml` が自動検出される
4. **Apply** をクリック

### 方法B: 手動設定

1. Render Dashboard → **New +** → **Web Service**
2. GitHubリポジトリを選択
3. 設定:
   - Name: `stackcheck-backend`
   - Root Directory: `backend`
   - Runtime: **Python 3**
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port $PORT`
4. **Environment Variables** を設定:

| Key | Value |
|---|---|
| `DATABASE_URL` | Step 2でコピーしたInternal Database URL |
| `ADMIN_USERNAME` | 任意のユーザー名（例: `admin`） |
| `ADMIN_PASSWORD` | 強力なパスワード（必ず変更すること） |
| `FRONTEND_ORIGIN` | 後でfrontendのURLに更新（一旦 `http://localhost:5173`） |

5. **Create Web Service** をクリック
6. デプロイ完了後、**BackendのURL**をコピー（例: `https://stackcheck-backend.onrender.com`）

---

## Step 4: Frontendのデプロイ

1. Render Dashboard → **New +** → **Static Site**
2. GitHubリポジトリを選択
3. 設定:
   - Name: `stackcheck-frontend`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
4. **Environment Variables** を設定:

| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | Step 3でコピーしたBackendのURL |

5. **Create Static Site** をクリック
6. デプロイ完了後、**FrontendのURL**をコピー（例: `https://stackcheck-frontend.onrender.com`）

---

## Step 5: CORS設定の更新

BackendのFRONTEND_ORIGINをFrontendの実際のURLに更新する。

1. Render Dashboard → `stackcheck-backend` → **Environment**
2. `FRONTEND_ORIGIN` を `https://stackcheck-frontend.onrender.com` に更新
3. **Save Changes** → 自動的に再デプロイされる

---

## Step 6: 動作確認

### ヘルスチェック
```
GET https://stackcheck-backend.onrender.com/health
→ {"status": "ok"}
```

### トピック一覧
```
GET https://stackcheck-backend.onrender.com/topics
→ [] （初期状態は空）
```

### フロントエンド
```
https://stackcheck-frontend.onrender.com
→ トップ画面が表示される
```

---

## Step 7: 初期コンテンツの登録

管理者画面（`/admin`）またはcurlでトピック・問題を登録する。

```bash
# トピック登録例
curl -X POST https://stackcheck-backend.onrender.com/admin/topics \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'admin:yourpassword' | base64)" \
  -d '{"title": "Pythonのリスト内包表記"}'
```

**目標: 最低10トピック × 5問 = 50問を登録する**

---

## デプロイ後チェックリスト

- [ ] `GET /health` が `{"status": "ok"}` を返す
- [ ] フロントエンドのトップ画面が表示される
- [ ] トピックを登録してクイズが動作する
- [ ] 管理者画面でBasic認証が機能する
- [ ] CORSエラーが発生しない（ブラウザの開発者ツールで確認）

---

## 注意事項

| 項目 | 内容 |
|---|---|
| コールドスタート | Render無料枠は15〜30秒のコールドスタートがある |
| DB接続 | Internal URLを使用すること（External URLは接続数制限が厳しい） |
| ADMIN_PASSWORD | 必ず強力なパスワードを設定すること |
| 無料枠の制限 | 月750時間まで。複数サービスで共有 |
