# NFR設計パターン（frontend）

## 環境変数パターン

```typescript
// src/api/client.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
});
```

- ローカル: `.env.local` に `VITE_API_BASE_URL=http://localhost:8000`
- 本番: Render Static Site の環境変数に設定

## エラーハンドリングパターン

```typescript
// APIエラーを統一的に処理
try {
  const data = await getTopics();
  setTopics(data);
} catch (err) {
  if (axios.isAxiosError(err)) {
    setError(err.response?.data?.detail || 'エラーが発生しました');
  } else {
    setError('予期しないエラーが発生しました');
  }
} finally {
  setLoading(false);
}
```

## ローディング状態パターン

```typescript
// 全APIコールで統一
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  setLoading(true);
  fetchData()
    .then(setData)
    .catch(handleError)
    .finally(() => setLoading(false));
}, []);
```

## Basic認証ヘッダーパターン

```typescript
// AdminPage内
const getAuthHeader = () =>
  `Basic ${btoa(`${username}:${password}`)}`;

// APIクライアントに渡す
await postTopic(title, getAuthHeader());
```

## React Router state渡しパターン（QuizPage → ResultPage）

```typescript
// QuizPage: 結果画面への遷移
navigate('/result', { state: { answers, topicId } });

// ResultPage: stateの受け取り
const location = useLocation();
const { answers, topicId } = location.state ?? {};
if (!answers) {
  return <Navigate to="/" replace />;
}
```
