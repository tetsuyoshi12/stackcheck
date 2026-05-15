import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import type { Answer } from '../types'

interface LocationState {
  answers: Answer[]
  topicId: number
  topicTitle?: string
}

const OPTION_LABELS: Record<string, string> = { a: 'A', b: 'B', c: 'C', d: 'D' }

export default function ResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState | null

  // 直接アクセス時はトップにリダイレクト
  if (!state?.answers) {
    return <Navigate to="/" replace />
  }

  const { answers, topicId, topicTitle } = state
  const correctCount = answers.filter((a) => a.is_correct).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* スコア */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8 text-center">
        <p className="text-gray-500 mb-2">結果</p>
        <p data-testid="score-text" className="text-5xl font-bold text-blue-600">
          {correctCount} <span className="text-2xl text-gray-400">/ {answers.length}</span>
        </p>
        <p className="text-gray-500 mt-2">
          {correctCount === answers.length
            ? '🎉 全問正解！'
            : correctCount >= answers.length / 2
            ? '👍 よくできました'
            : '📚 復習しましょう'}
        </p>
      </div>

      {/* ボタン */}
      <div className="flex gap-3 mb-8">
        <button
          data-testid="home-button"
          onClick={() => navigate('/')}
          className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
        >
          別のトピックに挑戦
        </button>
        <button
          data-testid="retry-button"
          onClick={() => navigate(`/quiz/${topicId}`, { state: { topicTitle } })}
          className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          もう一度
        </button>
      </div>

      {/* 振り返り */}
      <h2 className="text-lg font-bold text-gray-700 mb-4">振り返り</h2>
      <ul data-testid="review-list" className="space-y-4">
        {answers.map((answer, i) => (
          <li
            key={answer.question.id}
            className={`bg-white rounded-xl border p-5 ${
              answer.is_correct ? 'border-green-200' : 'border-red-200'
            }`}
          >
            <p className="text-xs text-gray-400 mb-1">問題 {i + 1}</p>
            <p className="text-gray-800 font-medium mb-3">{answer.question.question_text}</p>
            <div className="text-sm space-y-1 mb-3">
              <p className="text-gray-500">
                あなたの回答:{' '}
                <span className={answer.is_correct ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                  {OPTION_LABELS[answer.selected]}
                </span>
              </p>
              {!answer.is_correct && (
                <p className="text-gray-500">
                  正解:{' '}
                  <span className="text-green-600 font-semibold">
                    {OPTION_LABELS[answer.question.correct_option]}
                  </span>
                </p>
              )}
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed">
              {answer.question.explanation}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
