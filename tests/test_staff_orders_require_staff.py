import unittest

from fastapi.testclient import TestClient

from backend.app.main import app


class TestStaffOrdersGuard(unittest.TestCase):
    """FR-29 and Staff-access constraint: protect the staff order route."""

    def setUp(self):
        self.client = TestClient(app)

    def test_staff_orders_require_staff(self):
        staff_response = self.client.get(
            "/api/staff/orders",
            headers={"X-User-Id": "staff"},
        )
        student_response = self.client.get(
            "/api/staff/orders",
            headers={"X-User-Id": "student"},
        )
        admin_response = self.client.get(
            "/api/staff/orders",
            headers={"X-User-Id": "admin"},
        )
        unauthenticated_response = self.client.get("/api/staff/orders")

        self.assertEqual(staff_response.status_code, 200)
        self.assertEqual(student_response.status_code, 403)
        self.assertEqual(admin_response.status_code, 403)
        self.assertEqual(unauthenticated_response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
