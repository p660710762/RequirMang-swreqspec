import unittest
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from backend.app.config import STAFF_ORDER_RETENTION_DAYS
from backend.app.main import app
from staff_order_test_support import add_staff_order


class TestStaffOrderNumberAndSequenceApi(unittest.TestCase):
    """AC-STAFF-ORDER-02: return an order number and time-based queue sequence."""

    def setUp(self):
        self.client = TestClient(app, headers={"X-User-Id": "staff"})

    def test_AC_STAFF_ORDER_02_api_order_number_and_sequence(self):
        now = datetime.now(timezone.utc)
        tie_time = now - timedelta(hours=2)
        add_staff_order("006", now - timedelta(hours=1), "PENDING_ACCEPT")
        add_staff_order("004", tie_time, "PREPARING")
        add_staff_order("003", tie_time, "PREPARING")
        add_staff_order(
            "001",
            now - timedelta(days=STAFF_ORDER_RETENTION_DAYS + 1),
            "PICKED_UP",
        )

        response = self.client.get("/api/staff/orders")

        self.assertEqual(response.status_code, 200)
        orders = response.json()
        self.assertEqual(
            [(order["order_number"], order["sequence_no"]) for order in orders],
            [("006", 3), ("004", 2), ("003", 1)],
        )


if __name__ == "__main__":
    unittest.main()
