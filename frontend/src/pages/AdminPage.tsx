import { useEffect, useRef, useState } from 'react'
import {
  getTopics, postTopic, postQuestion, uploadCsv,
  getCategories, postCategory, updateTopicCategory,
} from '../api/client'
import type { CsvUploadResult } from '../api/client'
import type { Topic, QuestionCreate, Category } from '../types'
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
  const [categories, setCategories] = useState<Category[]>([])
  const [topicTitle, setTopicTitle] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [questionForm, setQuestionForm] = useState<QuestionCreate>(EMPTY_QUESTION)
  const [message, setMessage] = useState<Message | null>(null)
  const [csvResult, setCsvResult] = useState<CsvUploadResult | null>(null)
  const [csvUploading, setCsvUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const authHeader = () => `Basic ${btoa(`${username}:${password}`)}`

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const refreshData = () => {
    getTopics().then(setTopics).catch(() => {})
    getCategories().then(setCategories).catch(() => {})
  }

  useEffect(() => { refreshData() }, [])

  const handleCreateCategory = async () => {
    try {
      await postCategory(categoryName, authHeader())
      showMessage('success', `カテゴリ「${categoryName}」を登録しました`)
      setCategoryName('')
      getCategories().then(setCategories).catch(() => {})
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) showMessage('error', '認証に失敗しました')
        else if (err.response?.status === 409) showMessage('error', '同じ名前のカテゴリが既に存在します')
        else showMessage('error', 'エラーが発生しました')
      }
    }
  }

  const handleCreateTopic = async () => {
    try {
      await postTopic(topicTitle, authHeader())
      showMessage('success', `トピック「${topicTitle}」を登録しました`)
      setTopicTitle('')
      getTopics().then(setTopics).catch(() => {})
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) showMessage('error', '認証に失敗しました')
        else if (err.response?.status === 409) showMessage('error', '同じタイトルのトピックが既に存在します')
        else showMessage('error', 'エラーが発生しました')
      }
    }
  }

  const handleTopicCategoryChange = async (topicId: number, categoryId: number | null) => {
    try {
      await updateTopicCategory(topicId, categoryId, authHeader())
      getTopics().then(setTopics).catch(() => {})
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) showMessage('error', '認証に失敗しました')
        else showMessage('error', 'カテゴリの更新に失敗しました')
      }
    }
  }

  const handleCreateQuestion = async () => {
    try {
      await postQuestion(questionForm, authHeader())
      showMessage('success', '問題を登録しました')
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

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvResult(null)
    setCsvUploading(true)
    try {
      const result = await uploadCsv(file, authHeader())
      setCsvResult(result)
      refreshData()
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) showMessage('error', '認証に失敗しました')
        else showMessage('error', err.response?.data?.detail || 'CSVアップロードに失敗しました')
      }
    } finally {
      setCsvUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
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

      {/* CSVアップロード */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-700 mb-1">CSVアップロード</h2>
        <p className="text-xs text-gray-400 mb-4">
          形式: topic_title, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, order[, category_name]
        </p>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            disabled={csvUploading}
            className="text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-40"
          />
          {csvUploading && <span className="text-sm text-gray-400">アップロード中...</span>}
        </div>
        {csvResult && (
          <div className="mt-4 space-y-2">
            <div className="flex gap-4 text-sm">
              <span className="text-green-600 font-semibold">✓ 成功: {csvResult.success_count}件</span>
              {csvResult.skip_count > 0 && (
                <span className="text-yellow-600 font-semibold">⚠ スキップ: {csvResult.skip_count}件</span>
              )}
            </div>
            {csvResult.errors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-yellow-700 mb-1">エラー詳細:</p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {csvResult.errors.map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* カテゴリ登録 */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">カテゴリ登録</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="カテゴリ名（例：Python / SQL / Git）"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
          <button
            onClick={handleCreateCategory}
            disabled={!categoryName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            登録
          </button>
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {categories.map((c) => (
              <span key={c.id} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full border border-blue-100">
                {c.name}
              </span>
            ))}
          </div>
        )}
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

      {/* トピック一覧・カテゴリ設定 */}
      {topics.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">トピックのカテゴリ設定</h2>
          <div className="space-y-2">
            {topics.map((topic) => (
              <div key={topic.id} className="flex items-center gap-3">
                <span className="flex-1 text-sm text-gray-700 truncate">{topic.title}</span>
                <select
                  value={topic.category_id ?? ''}
                  onChange={(e) =>
                    handleTopicCategoryChange(
                      topic.id,
                      e.target.value === '' ? null : Number(e.target.value),
                    )
                  }
                  className="w-36 border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-400"
                >
                  <option value="">未設定</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </section>
      )}

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
