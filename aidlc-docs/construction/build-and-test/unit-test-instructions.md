# ユニットテスト実行手順

## Backend テスト

```bash
cd backend
source venv/bin/activate   # 仮想環境を有効化

# テスト実行（SQLiteを使用、PostgreSQL不要）
pytest tests/ -v
```

**期待される出力:**
```
tests/test_topics.py::test_get_topics_empty PASSED
tests/test_topics.py::test_get_topics_returns_list PASSED
tests/test_topics.py::test_get_topics_order_by_created_at_desc PASSED
tests/test_questions.py::test_get_questions_topic_not_found PASSED
tests/test_questions.py::test_get_questions_returns_ordered_list PASSED
tests/test_questions.py::test_get_questions_limit_5 PASSED
tests/test_questions.py::test_get_questions_fields PASSED
tests/test_admin.py::test_create_topic_success PASSED
tests/test_admin.py::test_create_topic_duplicate PASSED
tests/test_admin.py::test_create_topic_unauthorized PASSED
tests/test_admin.py::test_create_topic_wrong_credentials PASSED
tests/test_admin.py::test_create_topic_empty_title PASSED
tests/test_admin.py::test_create_question_success PASSED
tests/test_admin.py::test_create_question_topic_not_found PASSED
tests/test_admin.py::test_create_question_duplicate_order PASSED
tests/test_admin.py::test_create_question_invalid_order PASSED
tests/test_admin.py::test_create_question_invalid_correct_option PASSED

17 passed in Xs
```

**注意:** Python 3.11環境が必要（3.14はpydantic-core未対応）

---

## Frontend テスト

```bash
cd frontend
npm run test
```

**期待される出力:**
```
✓ src/test/TopicListPage.test.tsx (5 tests)
✓ src/test/QuizPage.test.tsx (5 tests)
✓ src/test/ResultPage.test.tsx (5 tests)

Test Files  3 passed (3)
Tests       15 passed (15)
```

---

## テスト失敗時の対処

### Backend: `ModuleNotFoundError`
```bash
# backend/ ディレクトリから実行していることを確認
cd backend
pytest tests/ -v
```

### Frontend: `Cannot find module`
```bash
npm install  # 依存関係を再インストール
npm run test
```
