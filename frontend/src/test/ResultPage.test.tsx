import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import ResultPage from '../pages/ResultPage'
import type { Answer, Question } from '../types'

const mockQuestion: Question = {
  id: 1, topic_id: 1, question_text: '問題1', order: 1,
  option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D',
  correct_option: 'a', explanation: '解説1',
}

const mockAnswers: Answer[] = [
  { question: mockQuestion, selected: 'a', is_correct: true },
  { question: { ...mockQuestion, id: 2, question_text: '問題2', correct_option: 'b' }, selected: 'a', is_correct: false },
]

const renderResultPage = (answers = mockAnswers, topicId = 1) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/result', state: { answers, topicId } }]}>
      <Routes>
        <Route path="/result" element={<ResultPage />} />
        <Route path="/" element={<div data-testid="home-page">Home</div>} />
        <Route path="/quiz/:topicId" element={<div data-testid="quiz-page">Quiz</div>} />
      </Routes>
    </MemoryRouter>
  )

describe('ResultPage', () => {
  it('スコアを表示する', () => {
    renderResultPage()
    expect(screen.getByTestId('score-text')).toHaveTextContent('1')
  })

  it('振り返りリストを表示する', () => {
    renderResultPage()
    expect(screen.getByTestId('review-list')).toBeInTheDocument()
    expect(screen.getByText('問題1')).toBeInTheDocument()
    expect(screen.getByText('問題2')).toBeInTheDocument()
  })

  it('stateがない場合はトップにリダイレクトする', () => {
    render(
      <MemoryRouter initialEntries={['/result']}>
        <Routes>
          <Route path="/result" element={<ResultPage />} />
          <Route path="/" element={<div data-testid="home-page">Home</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByTestId('home-page')).toBeInTheDocument()
  })

  it('「別のトピックに挑戦」でトップに遷移する', async () => {
    const user = userEvent.setup()
    renderResultPage()
    await user.click(screen.getByTestId('home-button'))
    expect(screen.getByTestId('home-page')).toBeInTheDocument()
  })

  it('「もう一度」でクイズページに遷移する', async () => {
    const user = userEvent.setup()
    renderResultPage()
    await user.click(screen.getByTestId('retry-button'))
    expect(screen.getByTestId('quiz-page')).toBeInTheDocument()
  })
})
