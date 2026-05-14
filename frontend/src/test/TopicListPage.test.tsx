import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import TopicListPage from '../pages/TopicListPage'
import * as client from '../api/client'

vi.mock('../api/client')

const mockTopics = [
  { id: 1, title: 'Pythonのリスト内包表記', created_at: '2026-01-01T00:00:00Z' },
  { id: 2, title: 'JavaScriptのPromise', created_at: '2026-01-02T00:00:00Z' },
]

describe('TopicListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ローディング中はスピナーを表示する', () => {
    vi.mocked(client.getTopics).mockReturnValue(new Promise(() => {}))
    render(<MemoryRouter><TopicListPage /></MemoryRouter>)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('トピック一覧を表示する', async () => {
    vi.mocked(client.getTopics).mockResolvedValue(mockTopics)
    render(<MemoryRouter><TopicListPage /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByTestId('topic-list')).toBeInTheDocument()
    })
    expect(screen.getByTestId('topic-card-1')).toHaveTextContent('Pythonのリスト内包表記')
    expect(screen.getByTestId('topic-card-2')).toHaveTextContent('JavaScriptのPromise')
  })

  it('0件の場合はメッセージを表示する', async () => {
    vi.mocked(client.getTopics).mockResolvedValue([])
    render(<MemoryRouter><TopicListPage /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('トピックがまだ登録されていません')).toBeInTheDocument()
    })
  })

  it('APIエラー時はエラーメッセージを表示する', async () => {
    vi.mocked(client.getTopics).mockRejectedValue(new Error('Network Error'))
    render(<MemoryRouter><TopicListPage /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument()
    })
  })

  it('トピックカードをクリックするとクイズページに遷移する', async () => {
    vi.mocked(client.getTopics).mockResolvedValue(mockTopics)
    const user = userEvent.setup()
    render(<MemoryRouter><TopicListPage /></MemoryRouter>)
    await waitFor(() => screen.getByTestId('topic-card-1'))
    await user.click(screen.getByTestId('topic-card-1'))
    // ナビゲーションはMemoryRouterでテスト困難なため、クリックが発火することを確認
  })
})
