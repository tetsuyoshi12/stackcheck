---
inclusion: always
---

# Technology Stack

## バックエンド
- **フレームワーク**：FastAPI（Python）
- **選定理由**：軽量・非同期・自動ドキュメント生成、MVP最速構成

## データベース
- **DB**：PostgreSQL
- **運用**：Renderの無料枠で利用

## フロントエンド
- **フレームワーク**：React
- **生成方法**：v0 / Bolt.new 等のAIツールで自動生成することを前提とする

## インフラ
- **ホスティング**：Render（無料枠）
- **方針**：最速デプロイ・検証を優先

## AI・コンテンツ生成
- **利用場面**：問題コンテンツの事前生成（ユーザーセッション外）
- **モデル**：Gemini 1.5 Flash 等、低コスト・低遅延なモデルを優先
- **重要**：ユーザーセッション中のAI APIコールはゼロ。すべての問題・解説はDB保存済みのものを返す

## APIエンドポイント設計

```
# ユーザー向け
GET  /topics                    → トピック一覧取得
GET  /topics/{id}/questions     → 該当トピックの問題5問取得

# 管理者向け（固定トークン認証）
POST /admin/topics              → トピック登録
POST /admin/questions           → 問題登録
```

## データモデル

### Topic（トピック）
| フィールド | 型 | 説明 |
|---|---|---|
| id | int | 主キー |
| title | string | 例：「Pythonのリスト内包表記」 |
| created_at | datetime | 登録日時 |

**トピック粒度ポリシー**：1トピック = 5問で網羅できる範囲に限定する。抽象度が高すぎるトピック（例：「Python全般」）は登録しない。

### Question（問題）
| フィールド | 型 | 説明 |
|---|---|---|
| id | int | 主キー |
| topic_id | FK | 所属トピック |
| question_text | string | 問題文 |
| option_a | string | 選択肢A |
| option_b | string | 選択肢B |
| option_c | string | 選択肢C |
| option_d | string | 選択肢D |
| correct_option | enum(a/b/c/d) | 正解の選択肢 |
| explanation | text | 解説文（AI事前生成・DB保存済み） |
| order | int | トピック内の出題順（1〜5） |
