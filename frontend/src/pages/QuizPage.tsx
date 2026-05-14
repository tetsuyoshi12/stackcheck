import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getQuestions } from '../api/client'
import type { Answer, Question } from '../types'

type Phase = 'loading' | 'quiz' | 'feedback' | 'error'

const OPTION_LABELS: Record<string, string> = {
  a: 'A',
  b: 'B',
  c: 'C',
  d: 'D',
}

export default function QuizPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [phase, setPhase] = useState<Phase>('loading')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  useEffect(() => {
    if (!topicId) return
    getQuestions(Number(topicId))
      .then((qs) => {
        setQuestions(qs)
        setPhase('quiz')
      })
      .catch(() => setPhase('error'))
  }, [topicId])

  const currentQuestion = questions[currentIndex]

  const handleAnswer = (option: 'a' | 'b' | 'c' | 'd') => {
    if (phase !== 'quiz') return
    const is_correct = option === currentQuestion.correct_option
    setSelectedOption(option)
    setAnswers((prev) => [...prev, { question: currentQuestion, selected: option, is_correct }])
    setPhase('feedback')
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1)
      setSelectedOption(null)
      setPhase('quiz')
    } else {
      navigate('/result', { state: { answers: [...answers], topicId: Number(topicId) } })
    }
  }

  if (phase === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">問題を読み込み中...</p>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <p className="text-red-500">問題の取得に失敗しました</p>
        <button onClick={() => navigate('/')} className="text-blue-500 underline">
          トップに戻る
        </button>
      </div>
    )
  }

  const options: Array<{ key: 'a' | 'b' | 'c' | 'd'; text: string }> = [
    { key: 'a', text: currentQuestion.option_a },
    { key: 'b', text: currentQuestion.option_b },
    { key: 'c', text: currentQuestion.option_c },
    { key: 'd', text: currentQuestion.option_d },
  ]

  const isCorrect = selectedOption === currentQuestion.correct_option

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* 進捗 */}
      <p data-testid="progress-text" className="text-sm text-gray-400 mb-4">
        {currentIndex + 1} / {questions.length}
      </p>

      {/* 問題文 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <p data-testid="question-text" className="text-gray-800 text-lg font-medium leading-relaxed">
          {currentQuestion.question_text}
        </p>
      </div>

      {/* 選択肢 */}
      <div className="space-y-3 mb-6">
        {options.map(({ key, text }) => {
          let btnClass =
            'w-full text-left px-5 py-4 rounded-xl border transition-all font-medium '

          if (phase === 'feedback') {
            if (key === currentQuestion.correct_option) {
              btnClass += 'bg-green-50 border-green-400 text-green-800'
            } else if (key === selectedOption) {
              btnClass += 'bg-red-50 border-red-400 text-red-800'
            } else {
              btnClass += 'bg-white border-gray-200 text-gray-400'
            }
          } else {
            btnClass += 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:shadow-sm'
          }

          return (
            <button
              key={key}
              data-testid={`option-${key}`}
              onClick={() => handleAnswer(key)}
              disabled={phase === 'feedback'}
              className={btnClass}
            >
              <span className="font-bold mr-3">{OPTION_LABELS[key]}.</span>
              {text}
            </button>
          )
        })}
      </div>

      {/* フィードバック */}
      {phase === 'feedback' && (
        <div className={`rounded-xl p-5 mb-6 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p
            data-testid={isCorrect ? 'feedback-correct' : 'feedback-incorrect'}
            className={`font-bold mb-2 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}
          >
            {isCorrect ? '✓ 正解！' : '✗ 不正解'}
          </p>
          <p data-testid="explanation-text" className="text-gray-700 text-sm leading-relaxed">
            {currentQuestion.explanation}
          </p>
        </div>
      )}

      {/* 次へボタン */}
      {phase === 'feedback' && (
        <button
          data-testid="next-button"
          onClick={handleNext}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          {currentIndex < questions.length - 1 ? '次の問題へ →' : '結果を見る →'}
        </button>
      )}
    </div>
  )
}
