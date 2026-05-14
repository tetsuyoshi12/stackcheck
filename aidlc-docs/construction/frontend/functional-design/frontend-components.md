# フロントエンドコンポーネント設計

## コンポーネント階層

```
App.tsx (BrowserRouter + Routes)
  ├── / → TopicListPage
  ├── /quiz/:topicId → QuizPage
  ├── /result → ResultPage
  └── /admin → AdminPage
```

## 各コンポーネントのProps・State

### TopicListPage
- Props: なし
- State: `topics`, `loading`, `error`
- data-testid: `topic-list`, `topic-card-{id}`, `loading-spinner`, `error-message`

### QuizPage
- Props: なし（URLパラメータから `topicId` 取得）
- State: `questions`, `currentIndex`, `answers`, `phase`, `selectedOption`
- data-testid: `question-text`, `option-a` 〜 `option-d`, `next-button`, `progress-text`, `feedback-correct`, `feedback-incorrect`, `explanation-text`

### ResultPage
- Props: なし（React Router `location.state` から `answers` 取得）
- State: なし
- data-testid: `score-text`, `review-list`, `retry-button`, `home-button`

### AdminPage
- Props: なし
- State: `username`, `password`, `topics`, `topicForm`, `questionForm`, `message`
- data-testid: `admin-username`, `admin-password`, `topic-title-input`, `create-topic-button`, `question-topic-select`, `question-text-input`, `option-a-input` 〜 `option-d-input`, `correct-option-select`, `explanation-input`, `order-input`, `create-question-button`, `message-text`

## ユーザーインタラクションフロー

```
TopicListPage
  [トピックカード クリック]
       ↓
  navigate('/quiz/:topicId')
       ↓
QuizPage (phase='loading')
  [API取得完了]
       ↓
QuizPage (phase='quiz')
  [選択肢クリック]
       ↓
QuizPage (phase='feedback')
  [「次へ」クリック]
       ↓ (最後の問題でなければ)
QuizPage (phase='quiz', 次の問題)
       ↓ (5問目の「次へ」)
  navigate('/result', { state: { answers } })
       ↓
ResultPage
  [「別のトピックに挑戦」] → navigate('/')
  [「もう一度」] → navigate('/quiz/:topicId')
```
