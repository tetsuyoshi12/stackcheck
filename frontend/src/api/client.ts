import axios from 'axios'
import type { Topic, Question, QuestionCreate, Category, User } from '../types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
})

// ユーザー向けAPI

export const getTopics = async (): Promise<Topic[]> => {
  const { data } = await api.get<Topic[]>('/topics')
  return data
}

export const getCategories = async (): Promise<Category[]> => {
  const { data } = await api.get<Category[]>('/categories')
  return data
}

export const getMe = async (token: string): Promise<User> => {
  const { data } = await api.get<User>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

export const getGoogleLoginUrl = (): string => {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  return `${base}/auth/google`
}

export const getQuestions = async (topicId: number): Promise<Question[]> => {
  const { data } = await api.get<Question[]>(`/topics/${topicId}/questions`)
  return data
}

// 管理者向けAPI（Basic認証ヘッダー付き）

export const postTopic = async (
  title: string,
  authHeader: string,
): Promise<Topic> => {
  const { data } = await api.post<Topic>(
    '/admin/topics',
    { title },
    { headers: { Authorization: authHeader } },
  )
  return data
}

export const postCategory = async (
  name: string,
  authHeader: string,
): Promise<Category> => {
  const { data } = await api.post<Category>(
    '/admin/categories',
    { name },
    { headers: { Authorization: authHeader } },
  )
  return data
}

export interface TopicAdminResponse {
  id: number
  title: string
  category_id: number | null
  category_name: string | null
  question_count: number
  created_at: string
}

export const getAdminTopics = async (authHeader: string): Promise<TopicAdminResponse[]> => {
  const { data } = await api.get<TopicAdminResponse[]>('/admin/topics', {
    headers: { Authorization: authHeader },
  })
  return data
}

export const updateTopic = async (
  topicId: number,
  payload: { title?: string; category_id?: number | null },
  authHeader: string,
): Promise<Topic> => {
  const { data } = await api.put<Topic>(
    `/admin/topics/${topicId}`,
    payload,
    { headers: { Authorization: authHeader } },
  )
  return data
}

export const deleteTopic = async (topicId: number, authHeader: string): Promise<void> => {
  await api.delete(`/admin/topics/${topicId}`, {
    headers: { Authorization: authHeader },
  })
}

export const getAdminQuestions = async (
  topicId: number,
  authHeader: string,
): Promise<Question[]> => {
  const { data } = await api.get<Question[]>(`/admin/topics/${topicId}/questions`, {
    headers: { Authorization: authHeader },
  })
  return data
}

export const updateQuestion = async (
  questionId: number,
  payload: Partial<Omit<Question, 'id' | 'topic_id'>>,
  authHeader: string,
): Promise<Question> => {
  const { data } = await api.put<Question>(
    `/admin/questions/${questionId}`,
    payload,
    { headers: { Authorization: authHeader } },
  )
  return data
}

export const deleteQuestion = async (questionId: number, authHeader: string): Promise<void> => {
  await api.delete(`/admin/questions/${questionId}`, {
    headers: { Authorization: authHeader },
  })
}

export const postQuestion = async (
  payload: QuestionCreate,
  authHeader: string,
): Promise<Question> => {
  const { data } = await api.post<Question>(
    '/admin/questions',
    payload,
    { headers: { Authorization: authHeader } },
  )
  return data
}

export interface CsvUploadResult {
  success_count: number
  skip_count: number
  errors: string[]
}

export const uploadCsv = async (
  file: File,
  authHeader: string,
): Promise<CsvUploadResult> => {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<CsvUploadResult>(
    '/admin/csv-upload',
    formData,
    { headers: { Authorization: authHeader, 'Content-Type': 'multipart/form-data' } },
  )
  return data
}

// セッション・ダッシュボード

export interface AnswerInput {
  question_id: number
  selected_option: string
  is_correct: boolean
}

export interface SessionCreate {
  topic_id: number
  answers: AnswerInput[]
}

export interface SessionResponse {
  id: number
  topic_id: number
  score: number
  total: number
  created_at: string
}

export interface CategoryMastery {
  category_name: string
  mastered_count: number
  total_count: number
  mastery_rate: number
}

export interface CategoryAccuracy {
  category_name: string
  correct_count: number
  total_count: number
  accuracy: number
}

export interface DailyActivity {
  date: string
  count: number
}

export interface DashboardData {
  skill_map: CategoryMastery[]
  category_accuracy: CategoryAccuracy[]
  daily_activity: DailyActivity[]
  streak: number
}

export const postSession = async (
  payload: SessionCreate,
  token: string,
): Promise<SessionResponse> => {
  const { data } = await api.post<SessionResponse>('/sessions', payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

export const getDashboard = async (token: string): Promise<DashboardData> => {
  const { data } = await api.get<DashboardData>('/dashboard', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}
