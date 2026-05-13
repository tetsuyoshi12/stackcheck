# 要件確認質問

以下の質問に回答してください。各質問の `[Answer]:` タグの後に選択肢の文字（A, B, C...）を記入してください。
選択肢に該当するものがない場合は `X` を選び、その後に説明を追記してください。

---

## Question 1
バックエンドのデプロイ先として想定しているプラットフォームはどれですか？

A) Render（無料枠）
B) Railway
C) Fly.io
D) AWS / GCP / Azure（有料クラウド）
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2
フロントエンドのデプロイ先として想定しているプラットフォームはどれですか？

A) Vercel
B) Netlify
C) Render（静的サイト）
D) バックエンドと同じサーバーで配信（FastAPIで静的ファイル配信）
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 3
フロントエンドの実装方針はどれですか？

A) React（TypeScript）をゼロから実装する
B) React（JavaScript）をゼロから実装する
C) v0 / Bolt.new 等のAIツールで自動生成したコードをベースにする（このリポジトリには含めない）
D) FastAPIのJinja2テンプレートでサーバーサイドレンダリング（フロントエンド不要）
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4
管理者用のトピック・問題登録機能について、どのような形式を想定していますか？

A) 管理者用Web画面（ブラウザから操作できるUI）
B) REST APIのみ（curlやPostmanで直接叩く）
C) CSVやJSONファイルのインポート機能
D) Pythonスクリプトで直接DBに投入
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 5
管理者APIの認証方式はどれを想定していますか？

A) 固定トークン（環境変数で設定、シンプルなBearer認証）
B) Basic認証（ユーザー名＋パスワード）
C) 認証なし（ローカル開発・内部利用のみ）
X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 6
問題コンテンツ（トピック・問題・解説）の初期データはどのように用意しますか？

A) AIツール（Gemini等）で事前生成し、管理画面から手動登録する
B) AIツールで生成したJSONをスクリプトでDBに一括投入する
C) このプロジェクトのコード生成フェーズでサンプルデータも含めて生成する
D) 後で別途用意する（今回のスコープ外）
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 7
クイズのセッション管理について、v1の方針を確認します。

A) 認証なし・DB保存なし（ブラウザのセッションストレージのみ）
B) 認証なし・DB保存あり（匿名ユーザーとして結果を保存）
C) 認証あり（v1からGoogleログイン等を実装）
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 8
1トピックあたりの問題数は固定ですか？

A) 固定5問（仕様通り）
B) トピックごとに可変（1〜10問など）
C) ユーザーが問題数を選べる
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 9
問題の出題順序はどうしますか？

A) 登録順（orderフィールドの昇順）で固定
B) ランダム順
C) 登録順をデフォルトとし、ランダムオプションも提供
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 10
CORSの設定について、フロントエンドとバックエンドの関係はどうなりますか？

A) フロントエンドとバックエンドは別オリジン（CORS設定が必要）
B) 同一オリジンで配信（CORS不要）
C) 開発中は別オリジン、本番は同一オリジン
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 11: Property-Based Testing Extension
このプロジェクトにプロパティベーステスト（PBT）ルールを適用しますか？

A) Yes — すべてのPBTルールをブロッキング制約として適用する（ビジネスロジック・データ変換・シリアライゼーションがあるプロジェクトに推奨）
B) Partial — 純粋関数とシリアライゼーションのラウンドトリップのみPBTルールを適用する
C) No — PBTルールをスキップする（シンプルなCRUDアプリ・UIのみのプロジェクトに適切）
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 12: Security Extensions
このプロジェクトにセキュリティ拡張ルールを適用しますか？

A) Yes — すべてのSECURITYルールをブロッキング制約として適用する（本番グレードのアプリに推奨）
B) No — すべてのSECURITYルールをスキップする（PoC・プロトタイプ・実験的プロジェクトに適切）
X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

回答が完了したら「完了」とお知らせください。
