import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import topics, questions, admin, categories

load_dotenv()

app = FastAPI(
    title="stackcheck API",
    description="エンジニア向けスキル確認クイズアプリのバックエンドAPI",
    version="1.0.0",
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

# ルーター登録
app.include_router(topics.router)
app.include_router(questions.router)
app.include_router(admin.router)
app.include_router(categories.router)


@app.get("/health")
def health_check():
    """Renderヘルスチェック用エンドポイント"""
    return {"status": "ok"}
