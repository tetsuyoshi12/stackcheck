import base64
from models import Topic


def _auth_header(username: str = "testadmin", password: str = "testpassword") -> dict:
    token = base64.b64encode(f"{username}:{password}".encode()).decode()
    return {"Authorization": f"Basic {token}"}


# --- POST /admin/topics ---

def test_create_topic_success(client):
    """トピックを正常に登録できる"""
    response = client.post(
        "/admin/topics",
        json={"title": "Pythonのリスト内包表記"},
        headers=_auth_header(),
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Pythonのリスト内包表記"
    assert "id" in data
    assert "created_at" in data


def test_create_topic_duplicate(client):
    """同じタイトルのトピックは409を返す"""
    client.post("/admin/topics", json={"title": "重複トピック"}, headers=_auth_header())
    response = client.post(
        "/admin/topics",
        json={"title": "重複トピック"},
        headers=_auth_header(),
    )
    assert response.status_code == 409


def test_create_topic_unauthorized(client):
    """認証なしは401を返す"""
    response = client.post("/admin/topics", json={"title": "テスト"})
    assert response.status_code == 401


def test_create_topic_wrong_credentials(client):
    """誤った認証情報は401を返す"""
    response = client.post(
        "/admin/topics",
        json={"title": "テスト"},
        headers=_auth_header("wrong", "wrong"),
    )
    assert response.status_code == 401


def test_create_topic_empty_title(client):
    """空タイトルは422を返す"""
    response = client.post(
        "/admin/topics",
        json={"title": ""},
        headers=_auth_header(),
    )
    assert response.status_code == 422


# --- POST /admin/questions ---

def _create_topic(client) -> int:
    r = client.post("/admin/topics", json={"title": "テストトピック"}, headers=_auth_header())
    return r.json()["id"]


def _question_payload(topic_id: int, order: int = 1) -> dict:
    return {
        "topic_id": topic_id,
        "question_text": "問題文",
        "option_a": "選択肢A",
        "option_b": "選択肢B",
        "option_c": "選択肢C",
        "option_d": "選択肢D",
        "correct_option": "a",
        "explanation": "解説文",
        "order": order,
    }


def test_create_question_success(client):
    """問題を正常に登録できる"""
    topic_id = _create_topic(client)
    response = client.post(
        "/admin/questions",
        json=_question_payload(topic_id),
        headers=_auth_header(),
    )
    assert response.status_code == 201
    data = response.json()
    assert data["topic_id"] == topic_id
    assert data["correct_option"] == "a"
    assert data["order"] == 1


def test_create_question_topic_not_found(client):
    """存在しないトピックIDは404を返す"""
    response = client.post(
        "/admin/questions",
        json=_question_payload(999),
        headers=_auth_header(),
    )
    assert response.status_code == 404


def test_create_question_duplicate_order(client):
    """同一トピック内でorderが重複すると409を返す"""
    topic_id = _create_topic(client)
    client.post("/admin/questions", json=_question_payload(topic_id, 1), headers=_auth_header())
    response = client.post(
        "/admin/questions",
        json=_question_payload(topic_id, 1),
        headers=_auth_header(),
    )
    assert response.status_code == 409


def test_create_question_invalid_order(client):
    """orderが範囲外（0や6）は422を返す"""
    topic_id = _create_topic(client)
    for invalid_order in [0, 6]:
        response = client.post(
            "/admin/questions",
            json=_question_payload(topic_id, invalid_order),
            headers=_auth_header(),
        )
        assert response.status_code == 422


def test_create_question_invalid_correct_option(client):
    """correct_optionがa/b/c/d以外は422を返す"""
    topic_id = _create_topic(client)
    payload = _question_payload(topic_id)
    payload["correct_option"] = "e"
    response = client.post("/admin/questions", json=payload, headers=_auth_header())
    assert response.status_code == 422
