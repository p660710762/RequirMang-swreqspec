import unittest

from fastapi.testclient import TestClient

from backend.app.main import app


class TestSoldOutMenuGuard(unittest.TestCase):
    def setUp(self):
        self.admin_client = TestClient(app, headers={"X-User-Id": "admin"})
        self.customer_client = TestClient(app, headers={"X-Test-User": "customer-a"})

    def test_AC_MENU_MGMT_07_sold_out_menu_is_blocked_for_customer(self):
        created = self.admin_client.post(
            "/api/admin/menu",
            json={"name": "เมนูปิดขาย", "price": 35, "status": "sold_out"},
        )
        menu_id = created.json()["menu_id"]

        response = self.customer_client.post(
            "/api/orders/drafts",
        )
        self.assertEqual(response.status_code, 201)

        draft = response.json()
        ordered = self.customer_client.post(
            "/api/orders/items",
            json={
                "order_date": draft["order_date"],
                "order_id": draft["order_id"],
                "menu_item_id": menu_id,
                "quantity": 1,
                "sweetness_level": "หวานปกติ 75%",
                "toppings": ["ไข่มุก"],
                "ice_level": "ไม่ใส่น้ำแข็ง",
            },
        )

        self.assertEqual(ordered.status_code, 409)
        self.assertIn("not available for ordering", ordered.json()["detail"])

    def test_AC_MENU_MGMT_10_out_of_stock_marking_blocks_purchase(self):
        created = self.admin_client.post(
            "/api/admin/menu",
            json={"name": "เมนูที่ต้องปิด", "price": 50, "status": "open"},
        )
        menu_id = created.json()["menu_id"]

        self.admin_client.patch(
            f"/api/admin/menu/{menu_id}/status",
            json={"status": "sold_out"},
        )

        response = self.customer_client.post(
            "/api/orders/drafts",
        )
        self.assertEqual(response.status_code, 201)

        draft = response.json()
        ordered = self.customer_client.post(
            "/api/orders/items",
            json={
                "order_date": draft["order_date"],
                "order_id": draft["order_id"],
                "menu_item_id": menu_id,
                "quantity": 1,
                "sweetness_level": "หวานปกติ 75%",
                "toppings": ["ไข่มุก"],
                "ice_level": "ไม่ใส่น้ำแข็ง",
            },
        )

        self.assertEqual(ordered.status_code, 409)
        self.assertIn("not available for ordering", ordered.json()["detail"])


if __name__ == "__main__":
    unittest.main()
