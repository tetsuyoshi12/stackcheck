# ビジネスロジックモデル（backend）

## Pydantic スキーマ定義

### Topic スキーマ
```python
# リクエスト
class TopicCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)

# レスポンス
class TopicResponse(BaseModel):
    id: int
    title: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

### Question スキーマ
```python
from enum import Enum

class CorrectOption(str, Enum):
    a = "a"
    b = "b"
    c = "c"
    d = "d"

# リクエスト
class QuestionCreate(BaseModel):
    topic_id:       int
    question_text:  str  = Field(..., min_length=1)
    option_a:       str  = Field(..., min_length=1, max_length=500)
    option_b:       str  = Field(..., min_length=1, max_length=500)
    option_c:       str  = Field(..., min_length=1, max_length=500)
    option_d:       str  = Field(..., min_length=1, max_length=500)
    correct_option: CorrectOption
    explanation:    str  = Field(..., min_length=1)
    order:          int  = Field(..., ge=1, le=5)

# レスポンス
class QuestionResponse(BaseModel):
    id:             int
    topic_id:       int
    question_text:  str
    option_a:       str
    option_b:       str
    option_c:       str
    option_d:       str
    correct_option: CorrectOption
    explanation:    str
    order:          int

    model_config = ConfigDict(from_attributes=True)
```

---

## エンドポイントロジック

### GET /topics
```
1. DBセッションを取得（get_db依存性注入）
2. Topic.query.order_by(created_at DESC).all() を実行
3. List[TopicResponse] を返す
4. 0件の場合は空リスト [] を返す（404ではない）
```

### GET /topics/{topic_id}/questions
```
1. DBセッションを取得
2. Topic を topic_id で検索
3. 存在しない場合 → 404 Not Found
4. Question.query.filter(topic_id=topic_id).order_by(order ASC).limit(5).all()
5. List[QuestionResponse] を返す
```

### POST /admin/topics
```
1. Basic認証を検証（verify_credentials依存性注入）
2. 認証失敗 → 401 Unauthorized
3. TopicCreate スキーマでリクエストボディをバリデーション
4. title の重複チェック（DB UNIQUE制約）
5. 重複あり → 409 Conflict
6. Topic レコードを INSERT
7. TopicResponse を返す（201 Created）
```

### POST /admin/questions
```
1. Basic認証を検証
2. 認証失敗 → 401 Unauthorized
3. QuestionCreate スキーマでバリデーション（order: 1-5, correct_option: a-d）
4. topic_id の存在確認
5. 存在しない → 404 Not Found
6. (topic_id, order) の重複チェック
7. 重複あり → 409 Conflict
8. Question レコードを INSERT
9. QuestionResponse を返す（201 Created）
```

---

## エラーレスポンス形式

```python
# FastAPIのデフォルトエラー形式を使用
{
    "detail": "エラーメッセージ"
}
```

| HTTPステータス | 発生条件 |
|---|---|
| 201 Created | POST成功 |
| 400 Bad Request | 不正なリクエスト形式 |
| 401 Unauthorized | Basic認証失敗 |
| 404 Not Found | リソースが存在しない |
| 409 Conflict | 重複データ（title / topic_id+order） |
| 422 Unprocessable Entity | Pydanticバリデーション失敗 |
