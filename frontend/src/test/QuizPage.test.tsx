import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import QuizPage from '../pages/QuizPage'
import * as client from '../api/client'
import type { Question } from '../types'

vi.mock('../api/client')

const mockQuestions: Question[] = [
  {
    id: 1, topic_id: 1, question_text: '問題1', order: 1,
    option_a: '選択肢A', option_b: '選択肢B', option_c: '選択肢C', option_d: '選択肢D',
    correct_option: 'a', explanation: '解説1',
  },
  {
    id: 2, topic_id: 1, question_text: '問題2', order: 2,
    option_a: '選択肢A', option_b: '選択肢B', option_c: '選択肢C', option_d: '選択肢D',
    correct_option: 'b', explanation: '解説2',
  },
]

const renderQuizPage = () =>
  render(
    <MemoryRouter initialEntries={['/quiz/1']}>
      <Routes>
        <Route path="/quiz/:topicId" element={<QuizPage />} />
        <Route path="/result" element={<div data-testid="result-page">Result</div>} />
      </Routes>
    </MemoryRouter>
  )

describe('QuizPage', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('問題を表示する', async () => {
    vi.mocked(client.getQuestions).mockResolvedValue(mockQuestions)
    renderQuizPage()
    await waitFor(() => {
      expect(screen.getByTestId('question-text')).toHaveTextContent('問題1')
    })
    expect(screen.getByTestId('progress-text')).toHaveTextContent('1 / 2')
  })

  it('正解を選択するとフィードバックが表示される', async () => {
    vi.mocked(client.getQuestions).mockResolvedValue(mockQuestions)
    const user = userEvent.setup()
    renderQuizPage()
    await waitFor(() => screen.getByTestId('option-a'))
    await user.click(screen.getByTestId('option-a'))
    expect(screen.getByTestId('feedback-correct')).toBeInTheDocument()
    expect(screen.getByTestId('explanation-text')).toHaveTextContent('解説1')
    expect(screen.getByTestId('next-button')).toBeInTheDocument()
  })

  it('不正解を選択するとフィードバックが表示される', async () => {
    vi.mocked(client.getQuestions).mockResolvedValue(mockQuestions)
    const user = userEvent.setup()
    renderQuizPage()
    await waitFor(() => screen.getByTestId('option-b'))
    await user.click(screen.getByTestId('option-b'))
    expect(screen.getByTestId('feedback-incorrect')).toBeInTheDocument()
  })

  it('次へボタンで次の問題に進む', async () => {
    vi.mocked(client.getQuestions).mockResolvedValue(mockQuestions)
    const user = userEvent.setup()
    renderQuizPage()
    await waitFor(() => screen.getByTestId('option-a'))
    await user.click(screen.getByTestId('option-a'))
    await user.click(screen.getByTestId('next-button'))
    await waitFor(() => {
      expect(screen.getByTestId('question-text')).toHaveTextContent('問題2')
    })
    expect(screen.getByTestId('progress-text')).toHaveTextContent('2 / 2')
  })

  it('最後の問題の次へで結果画面に遷移する', async () => {
    vi.mocked(client.getQuestions).mockResolvedValue([mockQuestions[0]])
    const user = userEvent.setup()
    renderQuizPage()
    await waitFor(() => screen.getByTestId('option-a'))
    await user.click(screen.getByTestId('option-a'))
    await user.click(screen.getByTestId('next-button'))
    await waitFor(() => {
      expect(screen.getByTestId('result-page')).toBeInTheDocument()
    })
  })
})
