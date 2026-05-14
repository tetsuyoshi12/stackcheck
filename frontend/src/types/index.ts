export interface Topic {
  id: number
  title: string
  created_at: string
}

export interface Question {
  id: number
  topic_id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: 'a' | 'b' | 'c' | 'd'
  explanation: string
  order: number
}

export interface Answer {
  question: Question
  selected: 'a' | 'b' | 'c' | 'd'
  is_correct: boolean
}

export interface QuestionCreate {
  topic_id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: 'a' | 'b' | 'c' | 'd'
  explanation: string
  order: number
}
