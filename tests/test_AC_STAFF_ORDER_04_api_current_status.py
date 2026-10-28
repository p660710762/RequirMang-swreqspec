import unittest
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.staff_order_service import STAFF_ORDER_STORE


class TestStaffOrderCurrentStatusApi(unittest.TestCase):
    """AC-STAFF-ORDER-04: each listed order includes its current status."""

    def setUp(self):
        STAFF_ORDER_STORE.clear()
        self.client = TestClient(app, headers={"X-User-Id": "staff"})

    def tearDown(self):
        STAFF_ORDER_STORE.clear()

    def test_AC_STAFF_ORDER_04_api_current_status(self):
        current_orders = [
            {
                "order_id": "006",
                "created_at": datetime.now(timezone.utc),
                "status": "waiting",
            },
            {
                "order_id": "005",
                "created_at": datetime.now(timezone.utc),
                "status": "picked_up",
            },
        ]
        STAFF_ORDER_STORE.extend(current_orders)

        response = self.client.get("/api/staff/orders")

        self.assertEqual(response.status_code, 200)
        orders_by_id = {order["order_id"]: order for order in response.json()}
        self.assertEqual(
            {order_id: order["status"] for order_id, order in orders_by_id.items()},
            {order["order_id"]: order["status"] for order in current_orders},
        )


if __name__ == "__main__":
    unittest.main()
