import sqlite3
import uuid

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.database import configure_database


def test_AC_STATUS_01_and_AC_STATUS_09_reads_only_owned_paid_orders(
    tmp_path, monkeypatch
):
    user_id = str(uuid.uuid4())
    other_user_id = str(uuid.uuid4())
    database_path = tmp_path / "application.sqlite3"
    monkeypatch.setenv("APP_ENV", "test")
    monkeypatch.setenv("ORDER_DATABASE_PATH", str(database_path))
    configure_database()

    connection = sqlite3.connect(database_path)
    with connection:
        connection.executemany(
            """
            INSERT INTO orders (
                order_date, order_id, status, created_at, total_amount,
                payment_status, owner_user_id, last_status_change_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                ("2026-10-25", "001", "PREPARING", "2026-10-25T09:00:00", 90, "success", user_id, None),
                ("2026-10-25", "002", "PREPARING", "2026-10-25T10:00:00", 75, "success", other_user_id, None),
                ("2026-10-25", "003", "draft", "2026-10-25T11:00:00", 50, "pending", user_id, None),
                ("2026-10-25", "004", "PREPARING", "2026-10-25T12:00:00", 25, "success", None, None),
                ("2026-10-26", "001", "READY_FOR_PICKUP", "2026-10-26T09:00:00", 60, "success", user_id, None),
            ],
        )
        connection.execute(
            """
            INSERT INTO order_items (
                order_date, order_id, menu_item_id, quantity, unit_price, line_total
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            ("2026-10-25", "001", 1, 2, 45, 90),
        )
    connection.close()

    with TestClient(app) as client:
        response = client.get(
            "/api/orders",
            headers={"X-Test-User": user_id},
        )

        assert response.status_code == 200
        assert [(order["order_date"], order["order_id"]) for order in response.json()] == [
            ("2026-10-26", "001"),
            ("2026-10-25", "001"),
        ]
        assert response.json()[1]["items"] == [
            {"menu_name": "เมนูตัวอย่าง", "quantity": 2, "unit_price": 45}
        ]

        detail = client.get(
            "/api/orders/001",
            params={"order_date": "2026-10-25"},
            headers={"X-Test-User": user_id},
        )
        assert detail.status_code == 200
        assert detail.json()["latest_status"]["status_code"] == "PREPARING"

        status_response = client.get(
            "/api/orders/001/status",
            params={"order_date": "2026-10-25"},
            headers={"X-Test-User": user_id},
        )
        assert status_response.status_code == 200
        assert status_response.json()["current_status"] == "PREPARING"

        newer_status_response = client.get(
            "/api/orders/001/status",
            params={"order_date": "2026-10-26"},
            headers={"X-Test-User": user_id},
        )
        assert newer_status_response.status_code == 200
        assert newer_status_response.json()["current_status"] == "READY_FOR_PICKUP"

        other_user_response = client.get(
            "/api/orders",
            headers={"X-Test-User": other_user_id},
        )
        assert other_user_response.status_code == 200
        assert [order["order_id"] for order in other_user_response.json()] == ["002"]
        assert all(
            order["user_id"] == other_user_id
            for order in other_user_response.json()
        )


def test_FR_06_new_draft_is_bound_to_mock_account_and_legacy_drafts_remain_unowned(
    tmp_path, monkeypatch
):
    user_id = str(uuid.uuid4())
    database_path = tmp_path / "application.sqlite3"
    monkeypatch.setenv("APP_ENV", "test")
    monkeypatch.setenv("ORDER_DATABASE_PATH", str(database_path))
    configure_database()

    with TestClient(app) as client:
        response = client.post(
            "/api/orders/drafts",
            headers={"X-Test-User": user_id},
        )

    assert response.status_code == 201
    connection = sqlite3.connect(database_path)
    owner = connection.execute(
        "SELECT owner_user_id FROM orders WHERE order_id = ?",
        (response.json()["order_id"],),
    ).fetchone()
    connection.close()
    assert owner == (user_id,)


def test_mock_payment_success_moves_owned_order_into_status_list(
    tmp_path, monkeypatch
):
    user_id = str(uuid.uuid4())
    other_user_id = str(uuid.uuid4())
    database_path = tmp_path / "application.sqlite3"
    monkeypatch.setenv("APP_ENV", "test")
    monkeypatch.setenv("ORDER_DATABASE_PATH", str(database_path))
    configure_database()

    with TestClient(app) as client:
        menu_response = client.get("/api/menu")
        assert menu_response.status_code == 200
        menu_item = next(
            item for item in menu_response.json()["items"] if item["status"] == "open"
        )
        headers = {"X-Test-User": user_id}
        draft_response = client.post("/api/orders/drafts", headers=headers)
        assert draft_response.status_code == 201
        draft = draft_response.json()

        add_item_response = client.post(
            "/api/orders/items",
            headers=headers,
            json={
                **draft,
                "menu_item_id": menu_item["menu_id"],
                "quantity": 2,
                "sweetness_level": "หวานปกติ 75%",
            },
        )
        assert add_item_response.status_code == 201

        confirmation = client.post("/api/orders/confirm", json=draft)
        assert confirmation.status_code == 200
        assert confirmation.json()["payment_status"] == "pending"
        assert client.get("/api/orders", headers=headers).json() == []

        unauthorized_payment = client.post(
            "/api/orders/payment/mock-success",
            headers={"X-Test-User": other_user_id},
            json=draft,
        )
        assert unauthorized_payment.status_code == 404

        payment = client.post(
            "/api/orders/payment/mock-success",
            headers=headers,
            json=draft,
        )
        assert payment.status_code == 200
        assert payment.json()["payment_status"] == "success"
        assert payment.json()["status"] == "PENDING_ACCEPT"

        orders_response = client.get("/api/orders", headers=headers)
        assert orders_response.status_code == 200
        assert len(orders_response.json()) == 1
        order = orders_response.json()[0]
        assert order["order_id"] == draft["order_id"]
        assert order["order_date"] == draft["order_date"]
        assert order["status"] == "PENDING_ACCEPT"
        assert order["items"] == [
            {
                "menu_name": menu_item["name"],
                "quantity": 2,
                "unit_price": float(menu_item["effective_price"]),
            }
        ]

        duplicate_payment = client.post(
            "/api/orders/payment/mock-success",
            headers=headers,
            json=draft,
        )
        assert duplicate_payment.status_code == 409


def test_mock_payment_success_is_unavailable_outside_development_and_test(
    tmp_path, monkeypatch
):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ORDER_DATABASE_PATH", str(tmp_path / "application.sqlite3"))

    with TestClient(app) as client:
        response = client.post(
            "/api/orders/payment/mock-success",
            headers={"X-Test-User": str(uuid.uuid4())},
            json={"order_date": "2026-10-28", "order_id": "001"},
        )

    assert response.status_code == 401
