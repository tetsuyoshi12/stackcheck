from models import Topic


def test_get_topics_empty(client):
    """トピックが0件の場合は空リストを返す"""
    response = client.get("/topics")
    assert response.status_code == 200
    assert response.json() == []


def test_get_topics_returns_list(client, db):
    """登録済みトピックが一覧で返る"""
    topic = Topic(title="Pythonのリスト内包表記")
    db.add(topic)
    db.commit()

    response = client.get("/topics")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Pythonのリスト内包表記"
    assert "id" in data[0]
    assert "created_at" in data[0]


def test_get_topics_order_by_created_at_desc(client, db):
    """複数トピックは登録日時の降順で返る"""
    db.add(Topic(title="Topic A"))
    db.commit()
    db.add(Topic(title="Topic B"))
    db.commit()

    response = client.get("/topics")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["title"] == "Topic B"
    assert data[1]["title"] == "Topic A"
