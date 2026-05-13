# コンポーネント定義

## バックエンドコンポーネント

### 1. TopicsRouter
- **目的**: トピック一覧取得APIを提供する
- **ファイル**: `backend/routers/topics.py`
- **責務**:
  - `GET /topics` — 全トピック一覧をDBから取得して返す
  - トピックが存在しない場合は空リストを返す

### 2. QuestionsRouter
- **目的**: 問題取得APIを提供する
- **ファイル**: `backend/routers/questions.py`
- **責務**:
  - `GET /topics/{id}/questions` — 指定トピックの問題5問を`order`昇順で取得して返す
  - 存在しないトピックIDの場合は404を返す

### 3. AdminRouter
- **目的**: 管理者向けコンテンツ登録APIを提供する
- **ファイル**: `backend/routers/admin.py`
- **責務**:
  - `POST /admin/topics` — トピックをDBに登録する
  - `POST /admin/questions` — 問題・選択肢・正解・解説をDBに登録する
  - Basic認証ミドルウェアで保護する

### 4. Database
- **目的**: DB接続・セッション管理を提供する
- **ファイル**: `backend/database.py`
- **責務**:
  - SQLAlchemy engineの初期化
  - SessionLocalファクトリの提供
  - `get_db()` 依存性注入関数の提供

### 5. Models
- **目的**: DBテーブルのORMモデルを定義する
- **ファイル**: `backend/models.py`
- **責務**:
  - `Topic` モデル（id, title, created_at）
  - `Question` モデル（id, topic_id, question_text, option_a〜d, correct_option, explanation, order）

### 6. Schemas
- **目的**: APIのリクエスト/レスポンスのPydanticスキーマを定義する
- **ファイル**: `backend/schemas.py`
- **責務**:
  - `TopicCreate` / `TopicResponse` スキーマ
  - `QuestionCreate` / `QuestionResponse` スキーマ

---

## フロントエンドコンポーネント

### 7. TopicListPage
- **目的**: トピック一覧を表示し、ユーザーがトピックを選択できる画面
- **ファイル**: `frontend/src/pages/TopicListPage.tsx`
- **責務**:
  - `GET /topics` を呼び出してトピック一覧を取得・表示
  - トピックカードのクリックでクイズ画面に遷移

### 8. QuizPage
- **目的**: クイズを1問ずつ出題し、回答・フィードバックを管理する画面
- **ファイル**: `frontend/src/pages/QuizPage.tsx`
- **責務**:
  - `GET /topics/{id}/questions` で問題を取得
  - 問題文・選択肢の表示
  - 回答選択後の正誤判定・解説表示
  - 問題進行管理（1/5 → 2/5 → ... → 5/5）
  - 5問終了後に結果画面へ遷移

### 9. ResultPage
- **目的**: クイズ終了後の結果と振り返りを表示する画面
- **ファイル**: `frontend/src/pages/ResultPage.tsx`
- **責務**:
  - 正解数（X/5）の表示
  - 全問の問題・回答・正解・解説の一覧表示
  - 「別のトピックに挑戦」「もう一度」ボタンの提供

### 10. AdminPage
- **目的**: 管理者がトピック・問題を登録できる画面
- **ファイル**: `frontend/src/pages/AdminPage.tsx`
- **責務**:
  - Basic認証ヘッダーを付与したAPIリクエスト
  - トピック登録フォーム（タイトル入力）
  - 問題登録フォーム（トピック選択・問題文・選択肢A〜D・正解・解説・順番）
  - 登録成功・失敗のフィードバック表示

### 11. apiClient
- **目的**: バックエンドAPIとの通信を担当するHTTPクライアント
- **ファイル**: `frontend/src/api/client.ts`
- **責務**:
  - axiosインスタンスの設定（baseURL、デフォルトヘッダー）
  - `getTopics()` / `getQuestions(topicId)` / `postTopic()` / `postQuestion()` 関数の提供
  - エラーハンドリング
