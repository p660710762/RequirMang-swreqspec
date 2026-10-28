import unittest
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from backend.app.config import STAFF_ORDER_RETENTION_DAYS
from backend.app.main import app
from staff_order_test_support import add_staff_order


class TestStaffOrderDetailsApi(unittest.TestCase):
    """AC-STAFF-ORDER-03: return drink names, quantities, and selected options."""

    def setUp(self):
        self.client = TestClient(app, headers={"X-User-Id": "staff"})

    def test_AC_STAFF_ORDER_03_api_order_details(self):
        created_at = datetime.now(timezone.utc) - timedelta(days=1)
        add_staff_order(
            "006",
            created_at,
            "PENDING_ACCEPT",
            items=[
                {
                    "menu_item_name": "ชาไทย",
                    "quantity": 2,
                    "selected_options": ["หวานน้อย 50%", "ไม่ใส่น้ำแข็ง"],
                },
                {
                    "menu_item_name": "กาแฟเย็น",
                    "quantity": 1,
                    "selected_options": ["หวานปกติ 75%"],
                },
            ],
        )

        response = self.client.get(
            "/api/staff/orders/006",
            params={"order_date": created_at.date().isoformat()},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {
            "order_id": "006",
            "items": [
                {
                    "order_item_id": 1,
                    "menu_item_name": "ชาไทย",
                    "quantity": 2,
                    "selected_options": ["หวานน้อย 50%", "ไม่ใส่น้ำแข็ง"],
                },
                {
                    "order_item_id": 2,
                    "menu_item_name": "กาแฟเย็น",
                    "quantity": 1,
                    "selected_options": ["หวานปกติ 75%", "ใส่น้ำแข็งปริมาณปกติ"],
                },
            ],
        })

    def test_order_details_are_staff_only_and_within_retention_window(self):
        add_staff_order(
            "001",
            datetime.now(timezone.utc)
            - timedelta(days=STAFF_ORDER_RETENTION_DAYS + 1),
            "PICKED_UP",
        )

        expired_response = self.client.get("/api/staff/orders/001")
        unauthorized_response = TestClient(app, headers={"X-User-Id": "student"}).get(
            "/api/staff/orders/001"
        )

        self.assertEqual(expired_response.status_code, 404)
        self.assertEqual(unauthorized_response.status_code, 403)


if __name__ == "__main__":
    unittest.main()
