import unittest

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.menu_service import MENU_STORE


class TestMenuManagementValidation(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app, headers={"X-User-Id": "admin"})

    def test_AC_MENU_MGMT_05_validation_before_save(self):
        before_count = len(MENU_STORE)
        response = self.client.post(
            "/api/admin/menu",
            json={"name": "เมนูข้อมูลไม่ครบ", "price": 10},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.json())
        self.assertEqual(len(MENU_STORE), before_count)

    def test_AC_MENU_MGMT_11_invalid_data_is_rejected(self):
        before_count = len(MENU_STORE)
        response = self.client.post(
            "/api/admin/menu",
            json={"name": "   ", "price": 10, "status": "open"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(len(MENU_STORE), before_count)


if __name__ == "__main__":
    unittest.main()
