# ビジネスルール定義（backend）

## トピック関連

### BR-01: トピックタイトルの一意性
- 同じタイトルのトピックは登録できない
- DB制約（UNIQUE）＋アプリケーション層で409 Conflictを返す

### BR-02: トピック粒度ポリシー
- 1トピック = 5問で網羅できる範囲に限定する
- アプリケーション層では強制しない（管理者の運用ルール）

---

## 問題関連

### BR-03: 出題順の範囲
- `order` は 1〜5 の整数のみ許可
- バリデーション: `1 <= order <= 5`
- 違反時: 422 Unprocessable Entity

### BR-04: 出題順の一意性
- 同一トピック内で `order` の重複は不可
- DB制約（UNIQUE）＋アプリケーション層で409 Conflictを返す

### BR-05: 正解選択肢の制約
- `correct_option` は `"a"` / `"b"` / `"c"` / `"d"` のみ
- Pydantic Enum + DB Enum で二重バリデーション

### BR-06: 問題取得時のトピック存在確認
- 存在しない `topic_id` に対して `GET /topics/{id}/questions` を呼んだ場合
- 404 Not Found を返す（空リストではなく）

---

## 認証関連

### BR-07: 管理者API保護
- `/admin/*` エンドポイントはすべて Basic 認証必須
- 認証失敗時: 401 Unauthorized（`WWW-Authenticate: Basic` ヘッダー付き）
- 認証情報は環境変数 `ADMIN_USERNAME` / `ADMIN_PASSWORD` と照合
- タイミング攻撃対策: `secrets.compare_digest()` で比較

---

## APIレスポンス関連

### BR-08: トピック一覧の順序
- `GET /topics` は `created_at` 降順（新しいものが先頭）で返す

### BR-09: 問題一覧の順序
- `GET /topics/{id}/questions` は `order` 昇順で返す（1→2→3→4→5）

### BR-10: 問題数の保証
- 1トピックあたり最大5問を返す（DBに5問以上登録されていても先頭5問のみ）
- 実運用上は5問ちょうど登録する運用だが、APIは `LIMIT 5` で安全に処理する
