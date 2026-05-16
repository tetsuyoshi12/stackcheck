import { useEffect } from 'react'
import { Routes, Route, Navigate, useSearchParams, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Header from './components/Header'
import Footer from './components/Footer'
import TopicListPage from './pages/TopicListPage'
import QuizPage from './pages/QuizPage'
import ResultPage from './pages/ResultPage'
import AdminPage from './pages/AdminPage'
import DashboardPage from './pages/DashboardPage'

// トップページでOAuthトークンを処理するラッパー
function TopicListWithAuth() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { login } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      setSearchParams({})
      login(token).catch(() => {})
    }
  }, [])

  return <TopicListPage />
}

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}

function AppInner() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<TopicListWithAuth />} />
          <Route path="/quiz/:topicId" element={<QuizPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </div>
  )
}

export default App
