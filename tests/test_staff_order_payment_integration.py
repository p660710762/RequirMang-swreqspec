from fastapi.testclient import TestClient

from backend.app.main import app


def test_AC_STAFF_ORDER_01_lists_paid_order_created_by_customer_payment(
    monkeypatch,
):
    monkeypatch.setenv("APP_ENV", "test")
    client = TestClient(app)
    customer_headers = {"X-Test-User": "customer-a"}

    menu_response = client.get("/api/menu")
    assert menu_response.status_code == 200
    menu_item = menu_response.json()["items"][0]

    draft_response = client.post("/api/orders/drafts", headers=customer_headers)
    assert draft_response.status_code == 201
    draft = draft_response.json()
    order_reference = {
        "order_date": draft["order_date"],
        "order_id": draft["order_id"],
    }

    item_response = client.post(
        "/api/orders/items",
        headers=customer_headers,
        json={
            **order_reference,
            "menu_item_id": menu_item["menu_id"],
            "quantity": 2,
            "sweetness_level": "หวานน้อย 50%",
            "toppings": ["ไข่มุก"],
            "ice_level": "ไม่ใส่น้ำแข็ง",
        },
    )
    assert item_response.status_code == 201

    confirm_response = client.post("/api/orders/confirm", json=order_reference)
    assert confirm_response.status_code == 200
    payment_response = client.post(
        "/api/orders/payment/mock-success",
        headers=customer_headers,
        json=order_reference,
    )
    assert payment_response.status_code == 200

    staff_headers = {"X-User-Id": "staff"}
    staff_orders_response = client.get("/api/staff/orders", headers=staff_headers)
    assert staff_orders_response.status_code == 200
    staff_orders = staff_orders_response.json()
    assert any(
        order["order_id"] == draft["order_id"]
        and order["order_date"] == draft["order_date"]
        and order["status"] == "PENDING_ACCEPT"
        for order in staff_orders
    )

    details_response = client.get(
        f"/api/staff/orders/{draft['order_id']}",
        headers=staff_headers,
        params={"order_date": draft["order_date"]},
    )
    assert details_response.status_code == 200
    assert details_response.json()["items"] == [
        {
            "order_item_id": item_response.json()["order_item_id"],
            "menu_item_name": menu_item["name"],
            "quantity": 2,
            "selected_options": ["หวานน้อย 50%", "ไม่ใส่น้ำแข็ง", "ไข่มุก"],
        }
    ]
