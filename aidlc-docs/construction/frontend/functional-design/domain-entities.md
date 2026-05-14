# ドメインエンティティ定義（frontend）

## 型定義（`src/types/index.ts`）

```typescript
// バックエンドAPIのレスポンスと対応する型

export interface Topic {
  id: number;
  title: string;
  created_at: string;
}

export interface Question {
  id: number;
  topic_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'a' | 'b' | 'c' | 'd';
  explanation: string;
  order: number;
}

// クイズセッション中の回答記録（DBには保存しない）
export interface Answer {
  question: Question;
  selected: 'a' | 'b' | 'c' | 'd';
  is_correct: boolean;
}

// 管理者用問題登録フォームの入力型
export interface QuestionCreate {
  topic_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'a' | 'b' | 'c' | 'd';
  explanation: string;
  order: number;
}
```

## クイズセッション状態

セッション状態はブラウザのメモリ（`useState`）のみで管理。DBへの保存・sessionStorageへの永続化は行わない。

```typescript
// QuizPage内の状態
type QuizPhase = 'loading' | 'quiz' | 'feedback' | 'done';

interface QuizState {
  questions: Question[];      // 取得した問題リスト（5問）
  currentIndex: number;       // 現在の問題インデックス（0〜4）
  answers: Answer[];          // 回答履歴
  phase: QuizPhase;           // 現在のフェーズ
  selectedOption: string | null; // 選択中の選択肢
}
```
