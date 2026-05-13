# コンポーネントメソッド定義

## バックエンド

### TopicsRouter
| メソッド | シグネチャ | 説明 |
|---|---|---|
| get_topics | `GET /topics → List[TopicResponse]` | 全トピック一覧を返す |

### QuestionsRouter
| メソッド | シグネチャ | 説明 |
|---|---|---|
| get_questions | `GET /topics/{topic_id}/questions → List[QuestionResponse]` | 指定トピックの問題をorder昇順で返す。存在しない場合は404 |

### AdminRouter
| メソッド | シグネチャ | 説明 |
|---|---|---|
| create_topic | `POST /admin/topics (TopicCreate) → TopicResponse` | トピックを登録する（Basic認証必須） |
| create_question | `POST /admin/questions (QuestionCreate) → QuestionResponse` | 問題を登録する（Basic認証必須） |

### Database
| メソッド | シグネチャ | 説明 |
|---|---|---|
| get_db | `get_db() → Generator[Session]` | DBセッションを依存性注入で提供する |

---

## フロントエンド

### apiClient (`frontend/src/api/client.ts`)
| 関数 | シグネチャ | 説明 |
|---|---|---|
| getTopics | `getTopics() → Promise<Topic[]>` | トピック一覧を取得する |
| getQuestions | `getQuestions(topicId: number) → Promise<Question[]>` | 指定トピックの問題一覧を取得する |
| postTopic | `postTopic(title: string, credentials: string) → Promise<Topic>` | トピックを登録する（Basic認証） |
| postQuestion | `postQuestion(data: QuestionCreate, credentials: string) → Promise<Question>` | 問題を登録する（Basic認証） |

### QuizPage（主要な状態・ロジック）
| 状態/関数 | 型 | 説明 |
|---|---|---|
| questions | `Question[]` | 取得した問題リスト |
| currentIndex | `number` | 現在の問題インデックス（0〜4） |
| answers | `Answer[]` | ユーザーの回答履歴 |
| phase | `'quiz' \| 'feedback' \| 'done'` | 現在のフェーズ |
| handleAnswer | `(option: string) → void` | 回答選択時の処理（正誤判定・フェーズ遷移） |
| handleNext | `() → void` | 次の問題へ進む処理 |

---

## 型定義 (`frontend/src/types/index.ts`)

```typescript
interface Topic {
  id: number;
  title: string;
  created_at: string;
}

interface Question {
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

interface Answer {
  question: Question;
  selected: string;
  is_correct: boolean;
}
```
