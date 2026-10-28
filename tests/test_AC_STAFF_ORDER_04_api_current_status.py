import unittest
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from backend.app.main import app
from staff_order_test_support import add_staff_order


class TestStaffOrderCurrentStatusApi(unittest.TestCase):
    """AC-STAFF-ORDER-04: each listed order includes its current status."""

    def setUp(self):
        self.client = TestClient(app, headers={"X-User-Id": "staff"})

    def test_AC_STAFF_ORDER_04_api_current_status(self):
        current_orders = [
            ("006", datetime.now(timezone.utc), "PENDING_ACCEPT"),
            ("005", datetime.now(timezone.utc), "PICKED_UP"),
        ]
        for order_id, created_at, order_status in current_orders:
            add_staff_order(order_id, created_at, order_status)

        response = self.client.get("/api/staff/orders")

        self.assertEqual(response.status_code, 200)
        orders_by_id = {order["order_id"]: order for order in response.json()}
        self.assertEqual(
            {order_id: order["status"] for order_id, order in orders_by_id.items()},
            {order_id: order_status for order_id, _, order_status in current_orders},
        )


if __name__ == "__main__":
    unittest.main()
