# Unit of Work × ユーザーストーリー マッピング

## マッピング表

| ストーリー | 説明 | backend | frontend |
|---|---|---|---|
| US-01 | トピック一覧の閲覧 | `GET /topics` | TopicListPage |
| US-02 | クイズの実施 | `GET /topics/{id}/questions` | QuizPage |
| US-03 | 即時フィードバックと解説 | （なし） | QuizPage（フィードバック表示） |
| US-04 | セッション結果と振り返り | （なし） | ResultPage |
| US-05 | トピックの登録（管理者） | `POST /admin/topics` | AdminPage |
| US-06 | 問題の登録（管理者） | `POST /admin/questions` | AdminPage |

## ユニット別ストーリー割り当て

### Unit: backend
| ストーリー | 実装内容 |
|---|---|
| US-01 | `routers/topics.py` — Topic一覧をDBから取得して返す |
| US-02 | `routers/questions.py` — 指定トピックの問題5問をorder昇順で返す |
| US-05 | `routers/admin.py` — Topicを登録する（Basic認証） |
| US-06 | `routers/admin.py` — Questionを登録する（Basic認証） |

### Unit: frontend
| ストーリー | 実装内容 |
|---|---|
| US-01 | `TopicListPage.tsx` — トピック一覧表示・選択UI |
| US-02 | `QuizPage.tsx` — 問題表示・選択肢クリック・進行管理 |
| US-03 | `QuizPage.tsx` — 回答後の正誤表示・解説表示・「次へ」ボタン |
| US-04 | `ResultPage.tsx` — 正解数表示・全問振り返り・再挑戦ボタン |
| US-05 | `AdminPage.tsx` — トピック登録フォーム |
| US-06 | `AdminPage.tsx` — 問題登録フォーム |

## カバレッジ確認

- 全6ストーリーがいずれかのユニットに割り当て済み ✓
- US-03・US-04はフロントエンドのみ（バックエンドAPIコール不要） ✓
- 全ストーリーが実装可能な粒度に分解済み ✓
