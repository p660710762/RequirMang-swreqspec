import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.staff_order_service import StaffOrderLoadError


class TestStaffOrderLoadFailureApi(unittest.TestCase):
    """AC-STAFF-ORDER-07: report an error without returning partial order data."""

    def setUp(self):
        self.client = TestClient(app, headers={"X-User-Id": "staff"})

    def test_AC_STAFF_ORDER_07_api_load_failure(self):
        with patch(
            "backend.app.routes.staff_orders.list_staff_orders",
            side_effect=StaffOrderLoadError("load failed"),
        ):
            response = self.client.get("/api/staff/orders")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.json(),
            {"detail": "Staff orders could not be loaded"},
        )
        self.assertNotIn("006", response.text)


if __name__ == "__main__":
    unittest.main()
