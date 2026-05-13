# Application Design - 質問

以下の質問に回答してください。各質問の `[Answer]:` タグの後に選択肢の文字を記入してください。

---

## Question 1
バックエンドのルーター構成はどれを希望しますか？

A) 機能別ルーター（topics.py / questions.py / admin.py）に分割する（ステアリングファイルの構成通り）
B) 単一ファイル（main.py）にすべてのエンドポイントをまとめる
C) ドメイン別（user_api.py / admin_api.py）の2ファイル構成
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2
フロントエンドのコンポーネント構成はどれを希望しますか？

A) ページ単位（TopicListPage / QuizPage / ResultPage / AdminPage）でコンポーネントを分割する
B) ページ＋共通コンポーネント（Button / Card / ProgressBar 等）に分割する
C) 最小構成（ページコンポーネントのみ、共通化は後回し）
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3
フロントエンドの状態管理はどれを使いますか？

A) React の useState / useContext のみ（外部ライブラリなし）
B) Zustand（軽量な状態管理ライブラリ）
C) Redux Toolkit
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4
フロントエンドのルーティングはどれを使いますか？

A) React Router v6
B) TanStack Router
C) ルーティングなし（シングルページ、状態で画面切り替え）
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 5
バックエンドのDBアクセス層はどれを使いますか？

A) SQLAlchemy ORM（モデルクラスでテーブル定義）+ Alembic（マイグレーション）
B) SQLAlchemy Core（SQLを直接記述）+ Alembic
C) asyncpg（非同期PostgreSQLドライバ直接利用）
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 6
管理者画面はどこに配置しますか？

A) フロントエンド（React）の中に管理者ページとして組み込む（/admin ルート）
B) バックエンド（FastAPI）のJinja2テンプレートで別途提供する
C) 独立した別アプリとして作成する
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 7
APIクライアント（フロントエンドからのHTTPリクエスト）はどれを使いますか？

A) fetch API（ブラウザ標準、ライブラリなし）
B) axios
C) TanStack Query（サーバー状態管理＋キャッシュ）
X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

回答が完了したら「完了」とお知らせください。
