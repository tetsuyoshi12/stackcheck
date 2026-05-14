# ビジネスロジックモデル（frontend）

## コンポーネント詳細設計

### TopicListPage
```
状態:
  - topics: Topic[]
  - loading: boolean
  - error: string | null

マウント時:
  - getTopics() を呼び出す
  - loading=true → APIレスポンス → loading=false

表示:
  - loading中: スピナー
  - error時: エラーメッセージ
  - 正常: トピックカード一覧（クリックで /quiz/:id に遷移）
  - 0件: 「トピックがまだ登録されていません」
```

### QuizPage
```
URLパラメータ: topicId (number)

状態:
  - questions: Question[]
  - currentIndex: number (初期値: 0)
  - answers: Answer[]
  - phase: 'loading' | 'quiz' | 'feedback' | 'done'
  - selectedOption: string | null

マウント時:
  - getQuestions(topicId) を呼び出す
  - phase='loading' → レスポンス → phase='quiz'

handleAnswer(option: string):
  - selectedOption = option
  - is_correct = (option === currentQuestion.correct_option)
  - answers に追加
  - phase = 'feedback'

handleNext():
  - if currentIndex < questions.length - 1:
      currentIndex++, selectedOption=null, phase='quiz'
  - else:
      navigate('/result', { state: { answers } })
```

### ResultPage
```
データ受け取り:
  - useLocation().state.answers: Answer[]
  - stateがない場合（直接アクセス）: / にリダイレクト

表示:
  - 正解数: answers.filter(a => a.is_correct).length / answers.length
  - 全問振り返りリスト（問題文・選択した回答・正解・解説）
  - 「別のトピックに挑戦」→ navigate('/')
  - 「もう一度」→ navigate(-1) または navigate('/quiz/:topicId')
```

### AdminPage
```
状態:
  - username: string
  - password: string
  - topics: Topic[] (問題登録フォーム用)
  - topicForm: { title: string }
  - questionForm: QuestionCreate
  - message: { type: 'success' | 'error', text: string } | null

認証ヘッダー生成:
  - `Basic ${btoa(`${username}:${password}`)}`

handleCreateTopic():
  - postTopic(title, credentials) を呼び出す
  - 201: message='登録しました', フォームリセット
  - 401: message='認証に失敗しました'
  - 409: message='同じタイトルが既に存在します'

handleCreateQuestion():
  - postQuestion(questionForm, credentials) を呼び出す
  - 201: message='登録しました', フォームリセット（topic_idは維持）
  - 401: message='認証に失敗しました'
  - 404: message='トピックが見つかりません'
  - 409: message='同じ出題順が既に存在します'
```

## APIクライアント設計（`src/api/client.ts`）

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
});

// ユーザー向けAPI
export const getTopics = (): Promise<Topic[]>
export const getQuestions = (topicId: number): Promise<Question[]>

// 管理者向けAPI（Basic認証ヘッダー付き）
export const postTopic = (title: string, authHeader: string): Promise<Topic>
export const postQuestion = (data: QuestionCreate, authHeader: string): Promise<Question>
```

## フロントエンドコンポーネント設計（`src/pages/`）

```
frontend/src/
  main.tsx          ← ReactDOM.createRoot + BrowserRouter
  App.tsx           ← Routes定義
  types/
    index.ts        ← Topic, Question, Answer, QuestionCreate
  api/
    client.ts       ← axiosクライアント + API関数
  pages/
    TopicListPage.tsx
    QuizPage.tsx
    ResultPage.tsx
    AdminPage.tsx
```
