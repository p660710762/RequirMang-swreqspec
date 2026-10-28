from datetime import date
from decimal import Decimal

from fastapi.testclient import TestClient

from backend.app.main import app


def test_order_api_uses_sqlite_repository_for_draft_and_items(tmp_path, monkeypatch):
    database_path = tmp_path / "orders.sqlite3"
    monkeypatch.setenv("ORDER_DATABASE_PATH", str(database_path))

    with TestClient(app) as client:
        draft_response = client.post("/api/orders/drafts")
        assert draft_response.status_code == 201
        draft = draft_response.json()
        assert draft == {
            "order_date": date.today().isoformat(),
            "order_id": "001",
        }

        add_response = client.post(
            "/api/orders/items",
            json={
                **draft,
                "menu_item_id": 1,
                "quantity": 2,
                "sweetness_level": "หวานปกติ 75%",
                "toppings": ["ไข่มุก"],
            },
        )
        assert add_response.status_code == 201
        assert add_response.json()["quantity"] == 2
        assert add_response.json()["toppings"] == ["ไข่มุก"]

        summary_response = client.get(
            "/api/orders/preview",
            params=draft,
        )
        assert summary_response.status_code == 200
        assert summary_response.json()["items"][0]["quantity"] == 2
        assert Decimal(summary_response.json()["total_amount"]) == Decimal("2")

        update_response = client.patch(
            f"/api/orders/items/{add_response.json()['order_item_id']}",
            json={"quantity": 3},
        )
        assert update_response.status_code == 200
        assert Decimal(update_response.json()["total_amount"]) == Decimal("3")

        delete_response = client.patch(
            f"/api/orders/items/{add_response.json()['order_item_id']}",
            json={"quantity": 0},
        )
        assert delete_response.status_code == 200
        assert delete_response.json()["order_item_id"] is None
        assert Decimal(delete_response.json()["total_amount"]) == Decimal("0")

        next_draft_response = client.post("/api/orders/drafts")
        assert next_draft_response.status_code == 201
        next_draft = next_draft_response.json()
        assert next_draft["order_id"] == "002"

        add_next_item_response = client.post(
            "/api/orders/items",
            json={
                **next_draft,
                "menu_item_id": 1,
                "quantity": 1,
                "sweetness_level": "ไม่หวาน",
            },
        )
        assert add_next_item_response.status_code == 201

        confirm_response = client.post("/api/orders/confirm", json=next_draft)
        assert confirm_response.status_code == 200
        assert confirm_response.json()["payment_status"] == "pending"
