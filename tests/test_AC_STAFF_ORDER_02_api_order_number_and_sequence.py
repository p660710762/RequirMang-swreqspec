import unittest
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from backend.app.config import STAFF_ORDER_RETENTION_DAYS
from backend.app.main import app
from backend.app.services.staff_order_service import STAFF_ORDER_STORE


class TestStaffOrderNumberAndSequenceApi(unittest.TestCase):
    """AC-STAFF-ORDER-02: return an order number and time-based queue sequence."""

    def setUp(self):
        STAFF_ORDER_STORE.clear()
        self.client = TestClient(app, headers={"X-User-Id": "staff"})

    def tearDown(self):
        STAFF_ORDER_STORE.clear()

    def test_AC_STAFF_ORDER_02_api_order_number_and_sequence(self):
        now = datetime.now(timezone.utc)
        tie_time = now - timedelta(hours=2)
        STAFF_ORDER_STORE.extend([
            {
                "order_id": "006",
                "created_at": now - timedelta(hours=1),
                "status": "waiting",
            },
            {"order_id": "004", "created_at": tie_time, "status": "waiting"},
            {"order_id": "003", "created_at": tie_time, "status": "waiting"},
            {
                "order_id": "001",
                "created_at": now - timedelta(days=STAFF_ORDER_RETENTION_DAYS + 1),
                "status": "picked_up",
            },
        ])

        response = self.client.get("/api/staff/orders")

        self.assertEqual(response.status_code, 200)
        orders = response.json()
        self.assertEqual(
            [(order["order_number"], order["sequence_no"]) for order in orders],
            [("006", 3), ("004", 2), ("003", 1)],
        )


if __name__ == "__main__":
    unittest.main()
