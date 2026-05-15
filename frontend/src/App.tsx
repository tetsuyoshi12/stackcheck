import { useEffect } from 'react'
import { Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Header from './components/Header'
import TopicListPage from './pages/TopicListPage'
import QuizPage from './pages/QuizPage'
import ResultPage from './pages/ResultPage'
import AdminPage from './pages/AdminPage'

// トップページでOAuthトークンを処理するラッパー
function TopicListWithAuth() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      // URLからトークンを削除してからログイン処理
      setSearchParams({})
      login(token).catch(() => {})
    }
  }, [])

  return <TopicListPage />
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Routes>
          <Route path="/" element={<TopicListWithAuth />} />
          <Route path="/quiz/:topicId" element={<QuizPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App
