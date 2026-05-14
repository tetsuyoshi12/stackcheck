from models import Topic, Question


def _make_question(topic_id: int, order: int) -> Question:
    return Question(
        topic_id=topic_id,
        question_text=f"問題{order}",
        option_a="A",
        option_b="B",
        option_c="C",
        option_d="D",
        correct_option="a",
        explanation="解説",
        order=order,
    )


def test_get_questions_topic_not_found(client):
    """存在しないトピックIDは404を返す"""
    response = client.get("/topics/999/questions")
    assert response.status_code == 404


def test_get_questions_returns_ordered_list(client, db):
    """問題がorder昇順で返る"""
    topic = Topic(title="テストトピック")
    db.add(topic)
    db.commit()
    db.refresh(topic)

    for i in [3, 1, 2]:
        db.add(_make_question(topic.id, i))
    db.commit()

    response = client.get(f"/topics/{topic.id}/questions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    assert [q["order"] for q in data] == [1, 2, 3]


def test_get_questions_limit_5(client, db):
    """5問を超えて登録されていても最大5問を返す"""
    topic = Topic(title="多問トピック")
    db.add(topic)
    db.commit()
    db.refresh(topic)

    # 5問のみ登録（orderは1-5の制約があるため）
    for i in range(1, 6):
        db.add(_make_question(topic.id, i))
    db.commit()

    response = client.get(f"/topics/{topic.id}/questions")
    assert response.status_code == 200
    assert len(response.json()) == 5


def test_get_questions_fields(client, db):
    """レスポンスに必要なフィールドが含まれる"""
    topic = Topic(title="フィールドテスト")
    db.add(topic)
    db.commit()
    db.refresh(topic)

    db.add(_make_question(topic.id, 1))
    db.commit()

    response = client.get(f"/topics/{topic.id}/questions")
    q = response.json()[0]
    for field in ["id", "topic_id", "question_text", "option_a", "option_b",
                  "option_c", "option_d", "correct_option", "explanation", "order"]:
        assert field in q
