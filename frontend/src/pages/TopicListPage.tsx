import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTopics, getCategories } from '../api/client'
import type { Topic, Category } from '../types'
import { useAuth } from '../contexts/AuthContext'

const PAGE_SIZE = 10

export default function TopicListPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    Promise.all([getTopics(), getCategories()])
      .then(([t, c]) => { setTopics(t); setCategories(c) })
      .catch(() => setError('データの取得に失敗しました'))
      .finally(() => setLoading(false))
  }, [])

  // カテゴリフィルター
  const filtered = useMemo(() => {
    if (selectedCategoryId === null) return topics
    return topics.filter((t) => t.category_id === selectedCategoryId)
  }, [topics, selectedCategoryId])

  // ページング
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleCategoryChange = (id: number | null) => {
    setSelectedCategoryId(id)
    setPage(1)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div data-testid="loading-spinner" className="text-gray-500 text-lg">読み込み中...</div>
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
      <p className="text-gray-500 mb-6">トピックを選んでスキルを確認しよう</p>

      {/* ダッシュボードへの導線（ログイン時のみ） */}
      {user && (
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full mb-6 flex items-center justify-between px-5 py-4 bg-gradient-to-r from-violet-600 to-indigo-500 text-white rounded-xl shadow-sm hover:from-violet-700 hover:to-indigo-600 transition-all"
        >
          <div className="text-left">
            <p className="font-semibold text-sm">📊 スキルダッシュボードを見る</p>
            <p className="text-violet-100 text-xs mt-0.5">正答率・習熟度・学習継続グラフを確認しよう</p>
          </div>
          <span className="text-violet-200 text-lg">→</span>
        </button>
      )}

      {/* カテゴリフィルター */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => handleCategoryChange(null)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategoryId === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            すべて
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategoryId === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* トピック一覧 */}
      {paged.length === 0 ? (
        <p className="text-gray-400">
          {selectedCategoryId ? 'このカテゴリのトピックはありません' : 'トピックがまだ登録されていません'}
        </p>
      ) : (
        <ul data-testid="topic-list" className="space-y-3">
          {paged.map((topic) => (
            <li key={topic.id}>
              <button
                data-testid={`topic-card-${topic.id}`}
                onClick={() => navigate(`/quiz/${topic.id}`, { state: { topicTitle: topic.title } })}
                className="w-full text-left px-5 py-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-800 font-medium">{topic.title}</span>
                  {topic.category_name && (
                    <span className="shrink-0 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full border border-blue-100">
                      {topic.category_name}
                    </span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ページング */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            ← 前へ
          </button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            次へ →
          </button>
        </div>
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
