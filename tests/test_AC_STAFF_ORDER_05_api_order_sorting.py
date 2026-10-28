import unittest
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from backend.app.main import app
from staff_order_test_support import add_staff_order


class TestStaffOrderSortingApi(unittest.TestCase):
    """AC-STAFF-ORDER-05: active orders are newest-first and finished orders last."""

    def setUp(self):
        self.client = TestClient(app, headers={"X-User-Id": "staff"})

    def test_AC_STAFF_ORDER_05_api_order_sorting(self):
        now = datetime.now(timezone.utc)
        add_staff_order("003", now - timedelta(hours=2), "PREPARING")
        add_staff_order("001", now - timedelta(hours=3), "PICKED_UP")
        add_staff_order("004", now - timedelta(hours=1), "PENDING_ACCEPT")
        add_staff_order("002", now - timedelta(minutes=10), "CANCELLED")

        response = self.client.get("/api/staff/orders")

        self.assertEqual(response.status_code, 200)
        orders = response.json()
        self.assertEqual(
            [order["order_id"] for order in orders],
            ["004", "003", "002", "001"],
        )
        self.assertEqual(
            [(order["order_id"], order["sequence_no"]) for order in orders],
            [("004", 3), ("003", 2), ("002", 4), ("001", 1)],
        )
        self.assertEqual(len(orders), 4)


if __name__ == "__main__":
    unittest.main()
