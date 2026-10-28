import unittest
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.staff_order_service import STAFF_ORDER_STORE


class TestStaffOrderVisibleFieldsApi(unittest.TestCase):
    """AC-STAFF-ORDER-09: return each order's number, sequence, and status."""

    def setUp(self):
        STAFF_ORDER_STORE.clear()
        self.client = TestClient(app, headers={"X-User-Id": "staff"})

    def tearDown(self):
        STAFF_ORDER_STORE.clear()

    def test_AC_STAFF_ORDER_09_api_visible_order_fields(self):
        now = datetime.now(timezone.utc)
        STAFF_ORDER_STORE.extend([
            {
                "order_id": "006",
                "created_at": now,
                "status": "waiting",
            },
            {
                "order_id": "005",
                "created_at": now - timedelta(minutes=1),
                "status": "preparing",
            },
        ])

        response = self.client.get("/api/staff/orders")

        self.assertEqual(response.status_code, 200)
        orders_by_id = {order["order_id"]: order for order in response.json()}
        self.assertEqual(
            {
                order_id: (
                    order["order_number"],
                    order["sequence_no"],
                    order["status"],
                )
                for order_id, order in orders_by_id.items()
            },
            {
                "006": ("006", 2, "waiting"),
                "005": ("005", 1, "preparing"),
            },
        )


if __name__ == "__main__":
    unittest.main()
