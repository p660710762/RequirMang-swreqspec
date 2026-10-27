import unittest

from fastapi.testclient import TestClient

from backend.app.main import app


class TestMenuStatusApi(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app, headers={"X-User-Id": "admin"})

    def test_AC_MENU_MGMT_04_admin_can_change_status(self):
        created = self.client.post(
            "/api/admin/menu",
            json={"name": "เมนูเปลี่ยนสถานะ", "price": 45, "status": "open"},
        )
        menu_id = created.json()["menu_id"]

        response = self.client.patch(
            f"/api/admin/menu/{menu_id}/status",
            json={"status": "sold_out"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "sold_out")

    def test_AC_MENU_MGMT_15_promotion_datetime_must_be_valid(self):
        created = self.client.post(
            "/api/admin/menu",
            json={"name": "เมนูโปรโมชั่น", "price": 45, "status": "open"},
        )
        menu_id = created.json()["menu_id"]

        response = self.client.patch(
            f"/api/admin/menu/{menu_id}",
            json={
                "promotion": {
                    "promotion_name": "ลดพิเศษ",
                    "start_at": "2026-11-30T10:00",
                    "end_at": "2026-11-01T10:00+07:00",
                },
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("timezone", response.json()["detail"])

    def test_AC_MENU_MGMT_15_promotion_end_before_start_is_rejected(self):
        created = self.client.post(
            "/api/admin/menu",
            json={"name": "เมนูช่วงเวลา", "price": 45, "status": "open"},
        )
        response = self.client.patch(
            f"/api/admin/menu/{created.json()['menu_id']}",
            json={
                "promotion": {
                    "start_at": "2026-11-30T10:00:00+07:00",
                    "end_at": "2026-11-01T10:00:00+07:00",
                },
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("must not be before", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
