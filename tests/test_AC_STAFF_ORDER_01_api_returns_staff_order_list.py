import unittest
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from backend.app.config import STAFF_ORDER_RETENTION_DAYS
from backend.app.main import app
from backend.app.services.staff_order_service import STAFF_ORDER_STORE


class TestStaffOrderListApi(unittest.TestCase):
    """AC-STAFF-ORDER-01: an authenticated Staff user can read existing orders."""

    def setUp(self):
        STAFF_ORDER_STORE.clear()
        self.client = TestClient(app, headers={"X-User-Id": "staff"})

    def tearDown(self):
        STAFF_ORDER_STORE.clear()

    def test_AC_STAFF_ORDER_01_api_returns_staff_order_list(self):
        now = datetime.now(timezone.utc)
        recent_order = {
            "order_id": "006",
            "created_at": now - timedelta(days=1),
            "status": "waiting",
        }
        expired_order = {
            "order_id": "001",
            "created_at": now - timedelta(days=STAFF_ORDER_RETENTION_DAYS + 1),
            "status": "picked_up",
        }
        STAFF_ORDER_STORE.extend([recent_order, expired_order])

        response = self.client.get("/api/staff/orders")

        self.assertEqual(response.status_code, 200)
        orders = response.json()
        self.assertEqual([order["order_id"] for order in orders], ["006"])
        self.assertEqual(orders[0]["status"], recent_order["status"])
        self.assertEqual(
            datetime.fromisoformat(orders[0]["created_at"]),
            recent_order["created_at"],
        )


if __name__ == "__main__":
    unittest.main()
