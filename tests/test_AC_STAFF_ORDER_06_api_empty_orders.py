import unittest

from fastapi.testclient import TestClient

from backend.app.main import app


class TestStaffOrderEmptyListApi(unittest.TestCase):
    """AC-STAFF-ORDER-06: return an empty list when no orders exist."""

    def setUp(self):
        self.client = TestClient(app, headers={"X-User-Id": "staff"})

    def test_AC_STAFF_ORDER_06_api_empty_orders(self):
        response = self.client.get("/api/staff/orders")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])


if __name__ == "__main__":
    unittest.main()
