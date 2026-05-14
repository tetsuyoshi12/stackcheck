# 統合テスト手順

## 前提条件
- backendが `http://localhost:8000` で起動済み
- frontendが `http://localhost:5173` で起動済み
- DBにトピック・問題が登録済み（または以下の手順で登録）

---

## シナリオ 1: 管理者によるコンテンツ登録

### 1-1. トピック登録
```bash
curl -X POST http://localhost:8000/admin/topics \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'admin:yourpassword' | base64)" \
  -d '{"title": "Pythonのリスト内包表記"}'
```
**期待結果:** `201 Created` + `{"id": 1, "title": "Pythonのリスト内包表記", ...}`

### 1-2. 問題登録（5問）
```bash
for order in 1 2 3 4 5; do
  curl -X POST http://localhost:8000/admin/questions \
    -H "Content-Type: application/json" \
    -H "Authorization: Basic $(echo -n 'admin:yourpassword' | base64)" \
    -d "{
      \"topic_id\": 1,
      \"question_text\": \"問題${order}\",
      \"option_a\": \"選択肢A\",
      \"option_b\": \"選択肢B\",
      \"option_c\": \"選択肢C\",
      \"option_d\": \"選択肢D\",
      \"correct_option\": \"a\",
      \"explanation\": \"解説${order}\",
      \"order\": ${order}
    }"
done
```
**期待結果:** 5回とも `201 Created`

---

## シナリオ 2: ユーザーによるクイズ実施（APIレベル）

### 2-1. トピック一覧取得
```bash
curl http://localhost:8000/topics
```
**期待結果:** `[{"id": 1, "title": "Pythonのリスト内包表記", ...}]`

### 2-2. 問題取得
```bash
curl http://localhost:8000/topics/1/questions
```
**期待結果:** 5問のリスト（order昇順）

---

## シナリオ 3: ブラウザでの一連フロー確認

1. `http://localhost:5173` を開く
2. トピック一覧が表示されることを確認
3. トピックをクリックしてクイズ開始
4. 問題が表示されることを確認（1/5）
5. 選択肢をクリックして回答
6. 正誤フィードバックと解説が表示されることを確認
7. 「次へ」で次の問題に進む
8. 5問終了後に結果画面が表示されることを確認
9. 「別のトピックに挑戦」でトップに戻ることを確認
10. 「もう一度」で同じクイズが再開されることを確認

---

## シナリオ 4: CORS確認

ブラウザの開発者ツール（Network タブ）で以下を確認:
- `http://localhost:5173` からのAPIリクエストに `Access-Control-Allow-Origin` ヘッダーが含まれる
- CORSエラーが発生しないこと

---

## シナリオ 5: 管理者画面の動作確認

1. `http://localhost:5173/admin` を開く
2. ユーザー名・パスワードを入力
3. トピック登録フォームでトピックを登録
4. 成功メッセージが表示されることを確認
5. 問題登録フォームで問題を登録
6. 成功メッセージが表示されることを確認
7. 誤ったパスワードで登録を試みて「認証に失敗しました」が表示されることを確認
