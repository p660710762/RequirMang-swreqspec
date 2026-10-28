import unittest
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from backend.app.config import STAFF_ORDER_RETENTION_DAYS
from backend.app.main import app
from backend.app.services.staff_order_service import STAFF_ORDER_STORE


class TestStaffOrderDetailsApi(unittest.TestCase):
    """AC-STAFF-ORDER-03: return drink names, quantities, and selected options."""

    def setUp(self):
        STAFF_ORDER_STORE.clear()
        self.client = TestClient(app, headers={"X-User-Id": "staff"})

    def tearDown(self):
        STAFF_ORDER_STORE.clear()

    def test_AC_STAFF_ORDER_03_api_order_details(self):
        STAFF_ORDER_STORE.append({
            "order_id": "006",
            "created_at": datetime.now(timezone.utc) - timedelta(days=1),
            "status": "waiting",
            "items": [
                {
                    "order_item_id": "item-1",
                    "menu_item_name": "ชาไทย",
                    "quantity": 2,
                    "selected_options": ["หวานน้อย", "ไม่ใส่น้ำแข็ง"],
                },
                {
                    "order_item_id": "item-2",
                    "menu_item_name": "กาแฟเย็น",
                    "quantity": 1,
                    "selected_options": ["หวานปกติ"],
                },
            ],
        })

        response = self.client.get("/api/staff/orders/006")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {
            "order_id": "006",
            "items": [
                {
                    "order_item_id": "item-1",
                    "menu_item_name": "ชาไทย",
                    "quantity": 2,
                    "selected_options": ["หวานน้อย", "ไม่ใส่น้ำแข็ง"],
                },
                {
                    "order_item_id": "item-2",
                    "menu_item_name": "กาแฟเย็น",
                    "quantity": 1,
                    "selected_options": ["หวานปกติ"],
                },
            ],
        })

    def test_order_details_are_staff_only_and_within_retention_window(self):
        STAFF_ORDER_STORE.append({
            "order_id": "001",
            "created_at": datetime.now(timezone.utc)
            - timedelta(days=STAFF_ORDER_RETENTION_DAYS + 1),
            "status": "picked_up",
            "items": [],
        })

        expired_response = self.client.get("/api/staff/orders/001")
        unauthorized_response = TestClient(app, headers={"X-User-Id": "student"}).get(
            "/api/staff/orders/001"
        )

        self.assertEqual(expired_response.status_code, 404)
        self.assertEqual(unauthorized_response.status_code, 403)


if __name__ == "__main__":
    unittest.main()
