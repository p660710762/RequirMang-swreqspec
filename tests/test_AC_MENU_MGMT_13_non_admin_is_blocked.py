import unittest

from fastapi.testclient import TestClient

from backend.app.main import app


class TestMenuManagementAdminGuard(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app, headers={"X-User-Id": "student"})

    def test_AC_MENU_MGMT_13_non_admin_is_blocked(self):
        create_response = self.client.post(
            "/api/admin/menu",
            json={"name": "เมนูที่ต้องไม่ถูกสร้าง", "price": 10, "status": "open"},
        )
        update_response = self.client.patch(
            "/api/admin/menu/1",
            json={"price": 15},
        )

        self.assertEqual(create_response.status_code, 403)
        self.assertEqual(update_response.status_code, 403)


if __name__ == "__main__":
    unittest.main()
