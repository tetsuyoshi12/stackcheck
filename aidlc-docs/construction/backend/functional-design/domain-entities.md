# ドメインエンティティ定義（backend）

## Topic（トピック）

### SQLAlchemy モデル
```python
class Topic(Base):
    __tablename__ = "topics"

    id         = Column(Integer, primary_key=True, index=True)
    title      = Column(String(200), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    questions  = relationship("Question", back_populates="topic",
                              cascade="all, delete-orphan", order_by="Question.order")
```

### フィールド制約
| フィールド | 型 | 制約 |
|---|---|---|
| id | Integer | PK、自動採番 |
| title | String(200) | NOT NULL、UNIQUE |
| created_at | DateTime(timezone=True) | NOT NULL、DB側でデフォルト設定 |

---

## Question（問題）

### SQLAlchemy モデル
```python
class Question(Base):
    __tablename__ = "questions"

    id             = Column(Integer, primary_key=True, index=True)
    topic_id       = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text  = Column(Text, nullable=False)
    option_a       = Column(String(500), nullable=False)
    option_b       = Column(String(500), nullable=False)
    option_c       = Column(String(500), nullable=False)
    option_d       = Column(String(500), nullable=False)
    correct_option = Column(Enum("a", "b", "c", "d", name="correct_option_enum"), nullable=False)
    explanation    = Column(Text, nullable=False)
    order          = Column(Integer, nullable=False)

    topic          = relationship("Topic", back_populates="questions")

    __table_args__ = (
        UniqueConstraint("topic_id", "order", name="uq_topic_order"),
    )
```

### フィールド制約
| フィールド | 型 | 制約 |
|---|---|---|
| id | Integer | PK、自動採番 |
| topic_id | Integer | FK → topics.id、NOT NULL、CASCADE DELETE |
| question_text | Text | NOT NULL |
| option_a〜d | String(500) | NOT NULL |
| correct_option | Enum(a/b/c/d) | NOT NULL |
| explanation | Text | NOT NULL |
| order | Integer | NOT NULL、topic_idとの複合UNIQUE |

### ビジネスルール
- `order` は 1〜5 の範囲（アプリケーション層でバリデーション）
- 同一トピック内で `order` は重複不可（DB制約）
- `correct_option` は `a` / `b` / `c` / `d` のみ（DB Enum制約）
- トピック削除時は関連する問題も CASCADE DELETE
