import { Routes, Route, Navigate } from 'react-router-dom'
import TopicListPage from './pages/TopicListPage'
import QuizPage from './pages/QuizPage'
import ResultPage from './pages/ResultPage'
import AdminPage from './pages/AdminPage'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<TopicListPage />} />
        <Route path="/quiz/:topicId" element={<QuizPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
