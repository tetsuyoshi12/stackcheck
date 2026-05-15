import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getTopics, postTopic, postQuestion, uploadCsv,
  getCategories, postCategory, updateTopic, deleteTopic,
  getAdminTopics, getAdminQuestions, updateQuestion, deleteQuestion,
} from '../api/client'
import type { CsvUploadResult, TopicAdminResponse } from '../api/client'
import type { Topic, QuestionCreate, Category, Question } from '../types'
import axios from 'axios'

interface Message { type: 'success' | 'error'; text: string }

const EMPTY_QUESTION: QuestionCreate = {
  topic_id: 0, question_text: '', option_a: '', option_b: '',
  option_c: '', option_d: '', correct_option: 'a', explanation: '', order: 1,
}
const PAGE_SIZE = 10

export default function AdminPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'list' | 'register'>('list')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<Message | null>(null)

  // トピック一覧タブ
  const [adminTopics, setAdminTopics] = useState<TopicAdminResponse[]>([])
  const [topicPage, setTopicPage] = useState(1)
  const [editingTopic, setEditingTopic] = useState<TopicAdminResponse | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editCategoryId, setEditCategoryId] = useState<number | ''>('')

  // 問題一覧
  const [selectedTopic, setSelectedTopic] = useState<TopicAdminResponse | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [editQ, setEditQ] = useState<Partial<Question>>({})

  // 登録タブ
  const [categories, setCategories] = useState<Category[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [topicTitle, setTopicTitle] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [questionForm, setQuestionForm] = useState<QuestionCreate>(EMPTY_QUESTION)
  const [csvResult, setCsvResult] = useState<CsvUploadResult | null>(null)
  const [csvUploading, setCsvUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // 新規登録タブ：問題番号選択
  const [registerTopicId, setRegisterTopicId] = useState(0)
  const [registerTopicQuestions, setRegisterTopicQuestions] = useState<Question[]>([])
  const [registerOrder, setRegisterOrder] = useState<number | null>(null)

  const authHeader = () => `Basic ${btoa(`${username}:${password}`)}`
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const refreshAll = () => {
    const header = `Basic ${btoa(`${username}:${password}`)}`
    getAdminTopics(header).then(setAdminTopics).catch(() => {})
    getTopics().then(setTopics).catch(() => {})
    getCategories().then(setCategories).catch(() => {})
  }

  useEffect(() => {
    getTopics().then(setTopics).catch(() => {})
    getCategories().then(setCategories).catch(() => {})
  }, [])

  const loadAdminTopics = (user: string, pass: string) => {
    const header = `Basic ${btoa(`${user}:${pass}`)}`
    getAdminTopics(header)
      .then(setAdminTopics)
      .catch(() => showMessage('error', '認証に失敗しました。ユーザー名・パスワードを確認してください'))
  }

  useEffect(() => {
    if (tab === 'list' && username && password) {
      loadAdminTopics(username, password)
    }
  }, [tab])

  // ---- トピック操作 ----
  const handleEditTopic = (t: TopicAdminResponse) => {
    setEditingTopic(t)
    setEditTitle(t.title)
    setEditCategoryId(t.category_id ?? '')
    setSelectedTopic(null)
  }

  const handleSaveTopic = async () => {
    if (!editingTopic) return
    try {
      await updateTopic(
        editingTopic.id,
        { title: editTitle, category_id: editCategoryId === '' ? null : Number(editCategoryId) },
        authHeader(),
      )
      showMessage('success', 'トピックを更新しました')
      setEditingTopic(null)
      refreshAll()
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) showMessage('error', '認証に失敗しました')
        else if (err.response?.status === 409) showMessage('error', '同じタイトルが既に存在します')
        else showMessage('error', 'トピックの更新に失敗しました')
      }
    }
  }

  const handleDeleteTopic = async (t: TopicAdminResponse) => {
    if (!window.confirm(`「${t.title}」を削除しますか？\n関連する問題（${t.question_count}件）もすべて削除されます。`)) return
    try {
      await deleteTopic(t.id, authHeader())
      showMessage('success', `「${t.title}」を削除しました`)
      if (selectedTopic?.id === t.id) setSelectedTopic(null)
      refreshAll()
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) showMessage('error', '認証に失敗しました')
        else showMessage('error', 'トピックの削除に失敗しました')
      }
    }
  }

  // ---- 問題操作 ----
  const handleSelectTopic = async (t: TopicAdminResponse) => {
    setSelectedTopic(t)
    setEditingTopic(null)
    setSelectedQuestion(null)
    setEditQ({})
    try {
      const qs = await getAdminQuestions(t.id, authHeader())
      setQuestions(qs)
    } catch {
      showMessage('error', '問題の取得に失敗しました')
    }
  }

  const handleSelectQuestion = (q: Question) => {
    setSelectedQuestion(q)
    setEditQ({ ...q })
  }

  const handleSaveQuestion = async () => {
    if (!selectedQuestion) return
    try {
      await updateQuestion(selectedQuestion.id, editQ, authHeader())
      showMessage('success', '問題を更新しました')
      if (selectedTopic) {
        const qs = await getAdminQuestions(selectedTopic.id, authHeader())
        setQuestions(qs)
        // 更新後も同じ問題を選択状態に保つ
        const updated = qs.find((q) => q.id === selectedQuestion.id)
        if (updated) { setSelectedQuestion(updated); setEditQ({ ...updated }) }
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) showMessage('error', '認証に失敗しました')
        else if (err.response?.status === 409) showMessage('error', '同じ出題順が既に存在します')
        else showMessage('error', '問題の更新に失敗しました')
      }
    }
  }

  const handleDeleteQuestion = async (q: Question) => {
    if (!window.confirm(`問題${q.order}「${q.question_text.slice(0, 30)}...」を削除しますか？`)) return
    try {
      await deleteQuestion(q.id, authHeader())
      showMessage('success', '問題を削除しました')
      setSelectedQuestion(null)
      setEditQ({})
      if (selectedTopic) {
        const qs = await getAdminQuestions(selectedTopic.id, authHeader())
        setQuestions(qs)
        refreshAll()
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) showMessage('error', '認証に失敗しました')
        else showMessage('error', '問題の削除に失敗しました')
      }
    }
  }

  const handleRegisterTopicChange = async (topicId: number) => {
    setRegisterTopicId(topicId)
    setRegisterOrder(null)
    setQuestionForm({ ...EMPTY_QUESTION, topic_id: topicId })
    if (topicId) {
      try {
        const qs = await getAdminQuestions(topicId, authHeader())
        setRegisterTopicQuestions(qs)
      } catch {
        setRegisterTopicQuestions([])
      }
    } else {
      setRegisterTopicQuestions([])
    }
  }

  const handleRegisterOrderSelect = (order: number) => {
    setRegisterOrder(order)
    const existing = registerTopicQuestions.find((q) => q.order === order)
    if (existing) {
      setQuestionForm({
        topic_id: registerTopicId,
        question_text: existing.question_text,
        option_a: existing.option_a,
        option_b: existing.option_b,
        option_c: existing.option_c,
        option_d: existing.option_d,
        correct_option: existing.correct_option,
        explanation: existing.explanation,
        order: existing.order,
      })
    } else {
      setQuestionForm({ ...EMPTY_QUESTION, topic_id: registerTopicId, order })
    }
  }

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
      refreshAll()
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
      // 番号ボタンの状態を更新
      if (registerTopicId) {
        const qs = await getAdminQuestions(registerTopicId, authHeader())
        setRegisterTopicQuestions(qs)
      }
      // フォームはそのまま（次の問題を続けて入力しやすいように）
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
      refreshAll()
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

  // ページング
  const topicTotalPages = Math.max(1, Math.ceil(adminTopics.length / PAGE_SIZE))
  const pagedTopics = adminTopics.slice((topicPage - 1) * PAGE_SIZE, topicPage * PAGE_SIZE)

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
  const btnPrimary = "px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
  const btnDanger = "px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
  const btnSecondary = "px-3 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-6">
        <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
          ← トップに戻る
        </button>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">管理者ページ</h1>

      {/* メッセージ */}
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* 認証情報 */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-700 mb-3">認証情報</h2>
        <div className="flex gap-3">
          <input data-testid="admin-username" type="text" placeholder="ユーザー名" value={username} onChange={(e) => setUsername(e.target.value)} className={inputCls} />
          <input data-testid="admin-password" type="password" placeholder="パスワード" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
        </div>
      </section>

      {/* タブ */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        <button onClick={() => { setTab('list'); if (username && password) { const h = `Basic ${btoa(`${username}:${password}`)}`; getAdminTopics(h).then(setAdminTopics).catch(() => {}) } }} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          トピック・問題管理
        </button>
        <button onClick={() => setTab('register')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'register' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          新規登録
        </button>
      </div>

      {/* ===== トピック・問題管理タブ ===== */}
      {tab === 'list' && (
        <div className="space-y-4">
          {/* トピック一覧 */}
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">トピック一覧</h2>
              <button onClick={() => loadAdminTopics(username, password)} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">
                読み込む
              </button>
            </div>
            {adminTopics.length === 0 ? (
              <p className="text-sm text-gray-400">トピックがありません</p>
            ) : (
              <>
                <div className="space-y-2">
                  {pagedTopics.map((t) => (
                    <div key={t.id}>
                      {editingTopic?.id === t.id ? (
                        // 編集フォーム
                        <div className="border border-blue-200 rounded-lg p-3 bg-blue-50 space-y-2">
                          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={inputCls} placeholder="トピック名" />
                          <select value={editCategoryId} onChange={(e) => setEditCategoryId(e.target.value === '' ? '' : Number(e.target.value))} className={inputCls}>
                            <option value="">カテゴリなし</option>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <div className="flex gap-2">
                            <button onClick={handleSaveTopic} className={btnPrimary}>保存</button>
                            <button onClick={() => setEditingTopic(null)} className={btnSecondary}>キャンセル</button>
                          </div>
                        </div>
                      ) : (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors cursor-pointer ${selectedTopic?.id === t.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                          onClick={() => handleSelectTopic(t)}>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-800 truncate block">{t.title}</span>
                            <span className="text-xs text-gray-400">{t.question_count}問{t.category_name ? ` · ${t.category_name}` : ''}</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); handleEditTopic(t) }} className={btnSecondary}>編集</button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteTopic(t) }} className={btnDanger}>削除</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {topicTotalPages > 1 && (
                  <div className="flex justify-center items-center gap-3 mt-4">
                    <button onClick={() => setTopicPage((p) => Math.max(1, p - 1))} disabled={topicPage === 1} className="px-3 py-1 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">← 前へ</button>
                    <span className="text-sm text-gray-500">{topicPage} / {topicTotalPages}</span>
                    <button onClick={() => setTopicPage((p) => Math.min(topicTotalPages, p + 1))} disabled={topicPage === topicTotalPages} className="px-3 py-1 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">次へ →</button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* 問題管理 */}
          {selectedTopic && (
            <section className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="mb-4">
                <h2 className="font-semibold text-gray-700">問題管理</h2>
                <p className="text-xs text-blue-500 mt-0.5">{selectedTopic.title}</p>
              </div>

              {questions.length === 0 ? (
                <p className="text-sm text-gray-400">問題がありません</p>
              ) : (
                <>
                  {/* 問題番号ボタン */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {questions.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => handleSelectQuestion(q)}
                        className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${
                          selectedQuestion?.id === q.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {q.order}
                      </button>
                    ))}
                  </div>

                  {/* 選択した問題の編集フォーム */}
                  {selectedQuestion && (
                    <div className="border border-blue-200 rounded-xl p-4 bg-blue-50 space-y-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-blue-600">問題 {selectedQuestion.order}</span>
                        <button onClick={() => handleDeleteQuestion(selectedQuestion)} className={btnDanger}>削除</button>
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">問題文</label>
                        <textarea
                          value={editQ.question_text ?? ''}
                          onChange={(e) => setEditQ({ ...editQ, question_text: e.target.value })}
                          rows={3}
                          className={inputCls}
                        />
                      </div>

                      {(['a', 'b', 'c', 'd'] as const).map((k) => (
                        <div key={k}>
                          <label className="text-xs text-gray-500 mb-1 block">選択肢 {k.toUpperCase()}</label>
                          <input
                            value={(editQ[`option_${k}` as keyof Question] as string) ?? ''}
                            onChange={(e) => setEditQ({ ...editQ, [`option_${k}`]: e.target.value })}
                            className={inputCls}
                          />
                        </div>
                      ))}

                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">正解</label>
                        <select
                          value={editQ.correct_option ?? 'a'}
                          onChange={(e) => setEditQ({ ...editQ, correct_option: e.target.value as 'a' | 'b' | 'c' | 'd' })}
                          className={inputCls}
                        >
                          {(['a', 'b', 'c', 'd'] as const).map((o) => (
                            <option key={o} value={o}>正解: {o.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">解説</label>
                        <textarea
                          value={editQ.explanation ?? ''}
                          onChange={(e) => setEditQ({ ...editQ, explanation: e.target.value })}
                          rows={3}
                          className={inputCls}
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">出題順（1〜5）</label>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={editQ.order ?? 1}
                          onChange={(e) => setEditQ({ ...editQ, order: Number(e.target.value) })}
                          className={inputCls}
                        />
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button onClick={handleSaveQuestion} className={btnPrimary}>保存</button>
                        <button onClick={() => { setSelectedQuestion(null); setEditQ({}) }} className={btnSecondary}>閉じる</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          )}
        </div>
      )}

      {/* ===== 新規登録タブ ===== */}
      {tab === 'register' && (
        <div className="space-y-6">
          {/* CSVアップロード */}
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-700 mb-1">CSVアップロード</h2>
            <p className="text-xs text-gray-400 mb-4">形式: topic_title, question_text, option_a〜d, correct_option, explanation, order[, category_name]</p>
            <div className="flex items-center gap-3">
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCsvUpload} disabled={csvUploading}
                className="text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-40" />
              {csvUploading && <span className="text-sm text-gray-400">アップロード中...</span>}
            </div>
            {csvResult && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600 font-semibold">✓ 成功: {csvResult.success_count}件</span>
                  {csvResult.skip_count > 0 && <span className="text-yellow-600 font-semibold">⚠ スキップ: {csvResult.skip_count}件</span>}
                </div>
                {csvResult.errors.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <ul className="text-xs text-yellow-700 space-y-1">{csvResult.errors.map((e, i) => <li key={i}>• {e}</li>)}</ul>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* カテゴリ登録 */}
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-700 mb-3">カテゴリ登録</h2>
            <div className="flex gap-2">
              <input type="text" placeholder="カテゴリ名（例：Python / SQL / Git）" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} className={inputCls} />
              <button onClick={handleCreateCategory} disabled={!categoryName.trim()} className={btnPrimary}>登録</button>
            </div>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {categories.map((c) => <span key={c.id} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full border border-blue-100">{c.name}</span>)}
              </div>
            )}
          </section>

          {/* トピック登録 */}
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-700 mb-3">トピック登録</h2>
            <div className="flex gap-2">
              <input data-testid="topic-title-input" type="text" placeholder="トピック名" value={topicTitle} onChange={(e) => setTopicTitle(e.target.value)} className={inputCls} />
              <button data-testid="create-topic-button" onClick={handleCreateTopic} disabled={!topicTitle.trim()} className={btnPrimary}>登録</button>
            </div>
          </section>

          {/* 問題登録 */}
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-700 mb-3">問題登録・編集</h2>
            <div className="space-y-3">
              {/* Step1: トピック選択 */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">① トピックを選択</label>
                <select
                  data-testid="question-topic-select"
                  value={registerTopicId}
                  onChange={(e) => handleRegisterTopicChange(Number(e.target.value))}
                  className={inputCls}
                >
                  <option value={0}>トピックを選択</option>
                  {topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>

              {/* Step2: 問題番号選択 */}
              {registerTopicId > 0 && (
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">② 問題番号を選択（登録済みは青、未登録はグレー）</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((order) => {
                      const exists = registerTopicQuestions.some((q) => q.order === order)
                      return (
                        <button
                          key={order}
                          onClick={() => handleRegisterOrderSelect(order)}
                          className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${
                            registerOrder === order
                              ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                              : exists
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          {order}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Step3: フォーム */}
              {registerOrder !== null && (
                <>
                  <div className="pt-1 pb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      registerTopicQuestions.some((q) => q.order === registerOrder)
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {registerTopicQuestions.some((q) => q.order === registerOrder) ? `問題${registerOrder}を編集` : `問題${registerOrder}を新規登録`}
                    </span>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">問題文</label>
                    <textarea
                      data-testid="question-text-input"
                      placeholder="問題文"
                      value={questionForm.question_text}
                      onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                      rows={3}
                      className={inputCls}
                    />
                  </div>

                  {(['a', 'b', 'c', 'd'] as const).map((opt) => (
                    <div key={opt}>
                      <label className="text-xs text-gray-500 mb-1 block">選択肢 {opt.toUpperCase()}</label>
                      <input
                        data-testid={`option-${opt}-input`}
                        type="text"
                        placeholder={`選択肢 ${opt.toUpperCase()}`}
                        value={questionForm[`option_${opt}` as keyof QuestionCreate] as string}
                        onChange={(e) => setQuestionForm({ ...questionForm, [`option_${opt}`]: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                  ))}

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">正解</label>
                    <select
                      data-testid="correct-option-select"
                      value={questionForm.correct_option}
                      onChange={(e) => setQuestionForm({ ...questionForm, correct_option: e.target.value as 'a' | 'b' | 'c' | 'd' })}
                      className={inputCls}
                    >
                      {(['a', 'b', 'c', 'd'] as const).map((o) => (
                        <option key={o} value={o}>正解: {o.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">解説</label>
                    <textarea
                      data-testid="explanation-input"
                      placeholder="解説文"
                      value={questionForm.explanation}
                      onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                      rows={3}
                      className={inputCls}
                    />
                  </div>

                  <button
                    data-testid="create-question-button"
                    onClick={handleCreateQuestion}
                    disabled={!questionForm.question_text.trim()}
                    className={`w-full py-2 ${btnPrimary}`}
                  >
                    {registerTopicQuestions.some((q) => q.order === registerOrder) ? '上書き登録' : '新規登録'}
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
