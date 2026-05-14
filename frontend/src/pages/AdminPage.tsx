import { useEffect, useState } from 'react'
import { getTopics, postTopic, postQuestion } from '../api/client'
import type { Topic, QuestionCreate } from '../types'
import axios from 'axios'

interface Message {
  type: 'success' | 'error'
  text: string
}

const EMPTY_QUESTION: QuestionCreate = {
  topic_id: 0,
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: 'a',
  explanation: '',
  order: 1,
}

export default function AdminPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [topics, setTopics] = useState<Topic[]>([])
  const [topicTitle, setTopicTitle] = useState('')
  const [questionForm, setQuestionForm] = useState<QuestionCreate>(EMPTY_QUESTION)
  const [message, setMessage] = useState<Message | null>(null)

  const authHeader = () => `Basic ${btoa(`${username}:${password}`)}`

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  // トピック一覧を取得（問題登録フォーム用）
  useEffect(() => {
    getTopics().then(setTopics).catch(() => {})
  }, [])

  const handleCreateTopic = async () => {
    try {
      await postTopic(topicTitle, authHeader())
      showMessage('success', `トピック「${topicTitle}」を登録しました`)
      setTopicTitle('')
      // トピック一覧を更新
      getTopics().then(setTopics).catch(() => {})
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) showMessage('error', '認証に失敗しました')
        else if (err.response?.status === 409) showMessage('error', '同じタイトルのトピックが既に存在します')
        else showMessage('error', 'エラーが発生しました')
      }
    }
  }

  const handleCreateQuestion = async () => {
    try {
      await postQuestion(questionForm, authHeader())
      showMessage('success', '問題を登録しました')
      // topic_idは維持してフォームをリセット
      setQuestionForm({ ...EMPTY_QUESTION, topic_id: questionForm.topic_id })
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) showMessage('error', '認証に失敗しました')
        else if (err.response?.status === 404) showMessage('error', 'トピックが見つかりません')
        else if (err.response?.status === 409) showMessage('error', '同じ出題順の問題が既に存在します')
        else showMessage('error', 'エラーが発生しました')
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">管理者ページ</h1>

      {/* メッセージ */}
      {message && (
        <div
          data-testid="message-text"
          className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 認証情報 */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">認証情報</h2>
        <div className="space-y-3">
          <input
            data-testid="admin-username"
            type="text"
            placeholder="ユーザー名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
          <input
            data-testid="admin-password"
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
      </section>

      {/* トピック登録 */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">トピック登録</h2>
        <div className="flex gap-2">
          <input
            data-testid="topic-title-input"
            type="text"
            placeholder="トピック名（例：Pythonのリスト内包表記）"
            value={topicTitle}
            onChange={(e) => setTopicTitle(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
          <button
            data-testid="create-topic-button"
            onClick={handleCreateTopic}
            disabled={!topicTitle.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            登録
          </button>
        </div>
      </section>

      {/* 問題登録 */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-700 mb-4">問題登録</h2>
        <div className="space-y-3">
          <select
            data-testid="question-topic-select"
            value={questionForm.topic_id}
            onChange={(e) => setQuestionForm({ ...questionForm, topic_id: Number(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          >
            <option value={0}>トピックを選択</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>

          <textarea
            data-testid="question-text-input"
            placeholder="問題文"
            value={questionForm.question_text}
            onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />

          {(['a', 'b', 'c', 'd'] as const).map((opt) => (
            <input
              key={opt}
              data-testid={`option-${opt}-input`}
              type="text"
              placeholder={`選択肢 ${opt.toUpperCase()}`}
              value={questionForm[`option_${opt}` as keyof QuestionCreate] as string}
              onChange={(e) => setQuestionForm({ ...questionForm, [`option_${opt}`]: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          ))}

          <select
            data-testid="correct-option-select"
            value={questionForm.correct_option}
            onChange={(e) => setQuestionForm({ ...questionForm, correct_option: e.target.value as 'a' | 'b' | 'c' | 'd' })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          >
            <option value="a">正解: A</option>
            <option value="b">正解: B</option>
            <option value="c">正解: C</option>
            <option value="d">正解: D</option>
          </select>

          <textarea
            data-testid="explanation-input"
            placeholder="解説文"
            value={questionForm.explanation}
            onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />

          <input
            data-testid="order-input"
            type="number"
            min={1}
            max={5}
            placeholder="出題順（1〜5）"
            value={questionForm.order}
            onChange={(e) => setQuestionForm({ ...questionForm, order: Number(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />

          <button
            data-testid="create-question-button"
            onClick={handleCreateQuestion}
            disabled={!questionForm.topic_id || !questionForm.question_text.trim()}
            className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            問題を登録
          </button>
        </div>
      </section>
    </div>
  )
}
