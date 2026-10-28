from fastapi.testclient import TestClient
from sqlalchemy import text

from app.main import app
from app.database import engine


def _cleanup_menu_test_data(menu_id: int) -> None:
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                DELETE FROM payment_transactions
                WHERE (order_date, order_id) IN (
                    SELECT order_date, order_id FROM orders
                    WHERE EXISTS (
                        SELECT 1 FROM order_items
                        WHERE order_items.order_date = orders.order_date
                          AND order_items.order_id = orders.order_id
                          AND order_items.menu_item_id = :menu_id
                    )
                )
                """
            ),
            {"menu_id": menu_id},
        )
        connection.execute(
            text(
                """
                DELETE FROM order_options
                WHERE order_item_id IN (
                    SELECT order_item_id FROM order_items
                    WHERE menu_item_id = :menu_id
                )
                """
            ),
            {"menu_id": menu_id},
        )
        connection.execute(
            text("DELETE FROM order_items WHERE menu_item_id = :menu_id"),
            {"menu_id": menu_id},
        )
        connection.execute(
            text(
                """
                DELETE FROM orders
                WHERE NOT EXISTS (
                    SELECT 1 FROM order_items
                    WHERE order_items.order_date = orders.order_date
                      AND order_items.order_id = orders.order_id
                )
                """
            )
        )


def _order_item_payload(draft: dict, menu_id: int) -> dict:
    return {
        **draft,
        "menu_item_id": menu_id,
        "quantity": 1,
        "sweetness_level": "หวานปกติ 75%",
        "toppings": ["ไข่มุก"],
        "ice_level": "ไม่ใส่น้ำแข็ง",
    }


def test_TC_MENU_MGMT_10_1_sold_out_status_blocks_purchase():
    admin_client = TestClient(app, headers={"X-User-Id": "admin"})
    customer_client = TestClient(app, headers={"X-User-Id": "student"})

    # Given Admin เลือกเมนูที่อยู่ในสถานะ “เปิดขาย”
    created = admin_client.post(
        "/api/admin/menu",
        json={"name": "เมนู AC-10 ทางปกติ", "price": 50, "status": "open"},
    )
    menu_id = created.json()["menu_id"]

    try:
        # When Admin เปลี่ยนสถานะเป็น “หมด”
        status_response = admin_client.patch(
            f"/api/admin/menu/{menu_id}/status",
            json={"status": "sold_out"},
        )

        # Then ระบบบันทึกสถานะ “หมด” และไม่อนุญาตให้ลูกค้าสั่งเมนูดังกล่าว
        assert status_response.status_code == 200
        assert status_response.json()["status"] == "sold_out"
        draft = customer_client.post("/api/orders/drafts")
        ordered = customer_client.post(
            "/api/orders/items",
            json=_order_item_payload(draft.json(), menu_id),
        )
        assert ordered.status_code == 409
    finally:
        _cleanup_menu_test_data(menu_id)
        admin_client.delete(f"/api/admin/menu/{menu_id}")


def test_TC_MENU_MGMT_10_2_status_change_blocks_new_purchase():
    admin_client = TestClient(app, headers={"X-User-Id": "admin"})
    customer_client = TestClient(app, headers={"X-User-Id": "student"})

    # Given Admin เลือกเมนู “เปิดขาย” และลูกค้าพยายามสั่งก่อนเปลี่ยนสถานะ
    created = admin_client.post(
        "/api/admin/menu",
        json={"name": "เมนู AC-10 ทางขอบ", "price": 50, "status": "open"},
    )
    menu_id = created.json()["menu_id"]
    try:
        before_draft = customer_client.post("/api/orders/drafts")
        before_order = customer_client.post(
            "/api/orders/items",
            json=_order_item_payload(before_draft.json(), menu_id),
        )
        assert before_order.status_code == 201

        # When Admin เปลี่ยนสถานะเป็น “หมด” แล้วลูกค้าพยายามสั่งซื้อใหม่
        status_response = admin_client.patch(
            f"/api/admin/menu/{menu_id}/status",
            json={"status": "sold_out"},
        )
        after_draft = customer_client.post("/api/orders/drafts")
        after_order = customer_client.post(
            "/api/orders/items",
            json=_order_item_payload(after_draft.json(), menu_id),
        )

        # Then ระบบบันทึกสถานะ “หมด” และหลังเปลี่ยนสถานะไม่อนุญาตให้สั่งเมนูดังกล่าว
        assert status_response.status_code == 200
        assert status_response.json()["status"] == "sold_out"
        assert after_order.status_code == 409
    finally:
        _cleanup_menu_test_data(menu_id)
        admin_client.delete(f"/api/admin/menu/{menu_id}")
