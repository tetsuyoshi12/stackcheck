# NFR設計パターン（backend）

## CORS パターン

### 設計
FastAPIの `CORSMiddleware` を `main.py` に登録する。

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)
```

**設計判断：**
- `allow_origins` は環境変数で管理（ワイルドカード `*` は使用しない）
- `allow_credentials=False`（Basic認証はAuthorizationヘッダーで送るためCookieは不要）
- メソッドは `GET` / `POST` のみ（v1で使用するものだけ許可）

---

## Basic認証パターン

### 設計
FastAPIの `HTTPBasic` 依存性注入を使い、`verify_credentials` 関数を全adminエンドポイントに適用する。

```python
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import secrets

security = HTTPBasic()

def verify_credentials(credentials: HTTPBasicCredentials = Depends(security)) -> str:
    correct_username = os.getenv("ADMIN_USERNAME", "")
    correct_password = os.getenv("ADMIN_PASSWORD", "")

    username_ok = secrets.compare_digest(
        credentials.username.encode("utf-8"),
        correct_username.encode("utf-8")
    )
    password_ok = secrets.compare_digest(
        credentials.password.encode("utf-8"),
        correct_password.encode("utf-8")
    )

    if not (username_ok and password_ok):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username
```

**設計判断：**
- `secrets.compare_digest` でタイミング攻撃を防ぐ
- 環境変数が未設定の場合は空文字列と比較（実質認証失敗）
- `Depends(verify_credentials)` を各adminエンドポイントに付与

---

## DBコネクションプールパターン

### 設計
Render無料枠PostgreSQLの接続数上限（最大97接続）を考慮し、プールサイズを制限する。

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "")

# Renderの無料枠PostgreSQLは接続数が限られるため小さめに設定
engine = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=0,
    pool_pre_ping=True,   # 切断検知・自動再接続
    pool_recycle=300,     # 5分でコネクションをリサイクル（Renderのアイドル切断対策）
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

**設計判断：**
- `pool_pre_ping=True`: Renderのアイドル切断後の再接続を自動処理
- `pool_recycle=300`: 長時間アイドル後のコネクション無効化を防ぐ
- `max_overflow=0`: 無料枠の接続数を超えないよう厳格に制限

---

## ヘルスチェックパターン

### 設計
Renderのヘルスチェック用に軽量なエンドポイントを提供する。

```python
@app.get("/health")
def health_check():
    return {"status": "ok"}
```

**設計判断：**
- DBへのアクセスなし（コールドスタート直後でも即応答）
- Renderのヘルスチェックパスに `/health` を設定

---

## エラーハンドリングパターン

### 設計
FastAPIのデフォルト例外ハンドラを使用。カスタムハンドラは不要。

```python
# DB IntegrityError（重複制約違反）を409に変換
from sqlalchemy.exc import IntegrityError

try:
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
except IntegrityError:
    db.rollback()
    raise HTTPException(status_code=409, detail="Duplicate entry")
```

**設計判断：**
- `IntegrityError` のみキャッチ（UNIQUE制約違反）
- その他の例外はFastAPIのデフォルト500ハンドラに委ねる
