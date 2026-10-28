import unittest
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from backend.app.config import STAFF_ORDER_RETENTION_DAYS
from backend.app.main import app
from staff_order_test_support import add_staff_order


class TestStaffOrderListApi(unittest.TestCase):
    """AC-STAFF-ORDER-01: an authenticated Staff user can read existing orders."""

    def setUp(self):
        self.client = TestClient(app, headers={"X-User-Id": "staff"})

    def test_AC_STAFF_ORDER_01_api_returns_staff_order_list(self):
        now = datetime.now(timezone.utc)
        recent_created_at = now - timedelta(days=1)
        add_staff_order("006", recent_created_at, "PENDING_ACCEPT")
        add_staff_order(
            "001",
            now - timedelta(days=STAFF_ORDER_RETENTION_DAYS + 1),
            "PICKED_UP",
        )

        response = self.client.get("/api/staff/orders")

        self.assertEqual(response.status_code, 200)
        orders = response.json()
        self.assertEqual([order["order_id"] for order in orders], ["006"])
        self.assertEqual(orders[0]["status"], "PENDING_ACCEPT")
        self.assertEqual(
            datetime.fromisoformat(orders[0]["created_at"]),
            recent_created_at,
        )


if __name__ == "__main__":
    unittest.main()
