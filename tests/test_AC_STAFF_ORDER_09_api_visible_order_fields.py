import unittest
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from backend.app.main import app
from staff_order_test_support import add_staff_order


class TestStaffOrderVisibleFieldsApi(unittest.TestCase):
    """AC-STAFF-ORDER-09: return each order's number, sequence, and status."""

    def setUp(self):
        self.client = TestClient(app, headers={"X-User-Id": "staff"})

    def test_AC_STAFF_ORDER_09_api_visible_order_fields(self):
        now = datetime.now(timezone.utc)
        add_staff_order("006", now, "PENDING_ACCEPT")
        add_staff_order("005", now - timedelta(minutes=1), "PREPARING")

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
                "006": ("006", 2, "PENDING_ACCEPT"),
                "005": ("005", 1, "PREPARING"),
            },
        )


if __name__ == "__main__":
    unittest.main()
