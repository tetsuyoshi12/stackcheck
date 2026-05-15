import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from authlib.integrations.httpx_client import AsyncOAuth2Client
from jose import JWTError, jwt

from database import get_db
from models import User
from schemas import UserResponse, TokenResponse

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24 * 7  # 7日間
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


def create_jwt(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_current_user_id(request: Request) -> int:
    """Authorizationヘッダーからユーザーを取得する依存性注入"""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth.removeprefix("Bearer ")
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = int(payload["sub"])
        return user_id
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_current_user(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.get("/auth/debug")
async def auth_debug():
    """デバッグ用：環境変数の設定状況を確認する"""
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
    return {
        "GOOGLE_CLIENT_ID_set": bool(GOOGLE_CLIENT_ID),
        "GOOGLE_CLIENT_SECRET_set": bool(GOOGLE_CLIENT_SECRET),
        "JWT_SECRET_KEY_set": bool(os.getenv("JWT_SECRET_KEY")),
        "BACKEND_URL": backend_url,
        "redirect_uri_would_be": f"{backend_url}/auth/google/callback",
        "FRONTEND_ORIGIN": FRONTEND_ORIGIN,
    }


@router.get("/auth/google")
async def google_login():
    """Google OAuth認証を開始する"""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID が設定されていません")

    backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
    redirect_uri = f"{backend_url}/auth/google/callback"

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
    }
    from urllib.parse import urlencode
    url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    return RedirectResponse(url=url)


@router.get("/auth/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Googleからのコールバックを処理してJWTを発行する"""
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
    redirect_uri = f"{backend_url}/auth/google/callback"

    try:
        async with AsyncOAuth2Client(
            client_id=GOOGLE_CLIENT_ID,
            client_secret=GOOGLE_CLIENT_SECRET,
            redirect_uri=redirect_uri,
        ) as client:
            token = await client.fetch_token(
                GOOGLE_TOKEN_URL,
                code=code,
            )
            resp = await client.get(GOOGLE_USERINFO_URL)
            userinfo = resp.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Google認証に失敗しました")

    google_id = userinfo.get("sub")
    email = userinfo.get("email")
    name = userinfo.get("name", email)
    avatar_url = userinfo.get("picture")

    if not google_id or not email:
        raise HTTPException(status_code=400, detail="Googleアカウント情報の取得に失敗しました")

    # ユーザーを取得または作成
    user = db.query(User).filter(User.google_id == google_id).first()
    if not user:
        user = User(
            google_id=google_id,
            email=email,
            name=name,
            avatar_url=avatar_url,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # プロフィール情報を更新
        user.name = name
        user.avatar_url = avatar_url
        db.commit()

    access_token = create_jwt(user.id)

    # フロントエンドにトークンを渡してリダイレクト
    return RedirectResponse(
        url=f"{FRONTEND_ORIGIN}/auth/callback?token={access_token}"
    )


@router.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """ログイン中のユーザー情報を返す"""
    return current_user
