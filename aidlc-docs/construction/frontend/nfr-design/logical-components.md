# 論理コンポーネント定義（frontend NFR）

## コンポーネント構成

```
main.tsx
  └── BrowserRouter
        └── App.tsx (Routes)
              ├── TopicListPage  ← apiClient.getTopics()
              ├── QuizPage       ← apiClient.getQuestions()
              ├── ResultPage     ← location.state
              └── AdminPage      ← apiClient.postTopic() / postQuestion()
                                    + Basic Auth Header
```

## 環境変数
| 変数名 | 用途 | ローカルデフォルト |
|---|---|---|
| `VITE_API_BASE_URL` | バックエンドAPIのベースURL | `http://localhost:8000` |
