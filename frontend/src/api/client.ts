import axios from 'axios'
import type { Topic, Question, QuestionCreate, Category } from '../types'

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

export const updateTopicCategory = async (
  topicId: number,
  categoryId: number | null,
  authHeader: string,
): Promise<Topic> => {
  const { data } = await api.put<Topic>(
    `/admin/topics/${topicId}`,
    { category_id: categoryId },
    { headers: { Authorization: authHeader } },
  )
  return data
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
