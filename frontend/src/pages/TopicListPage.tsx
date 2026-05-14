import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTopics } from '../api/client'
import type { Topic } from '../types'

export default function TopicListPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    getTopics()
      .then(setTopics)
      .catch(() => setError('トピックの取得に失敗しました'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div data-testid="loading-spinner" className="text-gray-500 text-lg">
          読み込み中...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p data-testid="error-message" className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">stackcheck</h1>
      <p className="text-gray-500 mb-8">トピックを選んでスキルを確認しよう</p>

      {topics.length === 0 ? (
        <p className="text-gray-400">トピックがまだ登録されていません</p>
      ) : (
        <ul data-testid="topic-list" className="space-y-3">
          {topics.map((topic) => (
            <li key={topic.id}>
              <button
                data-testid={`topic-card-${topic.id}`}
                onClick={() => navigate(`/quiz/${topic.id}`)}
                className="w-full text-left px-5 py-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all"
              >
                <span className="text-gray-800 font-medium">{topic.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 text-right">
        <button
          onClick={() => navigate('/admin')}
          className="text-sm text-gray-400 hover:text-gray-600 underline"
        >
          管理者ページ
        </button>
      </div>
    </div>
  )
}
