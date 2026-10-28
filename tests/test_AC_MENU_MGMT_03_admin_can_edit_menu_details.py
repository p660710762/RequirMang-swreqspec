import unittest

from fastapi.testclient import TestClient

from backend.app.main import app


class TestMenuEditApi(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app, headers={"X-User-Id": "admin"})

    def test_AC_MENU_MGMT_03_admin_can_edit_menu_details(self):
        created = self.client.post(
            "/api/admin/menu",
            json={"name": "เมนูสำหรับแก้ไข", "price": 45, "status": "open"},
        )
        menu_id = created.json()["menu_id"]

        response = self.client.patch(
            f"/api/admin/menu/{menu_id}",
            json={
                "price": 50,
                "description": "รายละเอียดใหม่",
                "promotion": {
                    "promotion_name": "ลดพิเศษ",
                    "discount_value": 5,
                    "start_at": "2026-11-01T10:00:00+07:00",
                    "end_at": "2026-11-30T10:00:00+07:00",
                },
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["price"], 50)
        self.assertEqual(response.json()["description"], "รายละเอียดใหม่")
        self.assertEqual(response.json()["promotion"]["promotion_name"], "ลดพิเศษ")

    def test_AC_MENU_MGMT_03_rejects_negative_price(self):
        response = self.client.post(
            "/api/admin/menu",
            json={"name": "ราคาติดลบ", "price": -1, "status": "open"},
        )

        self.assertEqual(response.status_code, 400)

    def test_AC_MENU_MGMT_03_rejects_negative_or_excessive_discount(self):
        created = self.client.post(
            "/api/admin/menu",
            json={"name": "ส่วนลดไม่ถูกต้อง", "price": 50, "status": "open"},
        )
        menu_id = created.json()["menu_id"]
        promotion = {
            "promotion_name": "ลดพิเศษ",
            "discount_value": 60,
            "start_at": "2026-11-01T10:00:00+07:00",
            "end_at": "2026-11-30T10:00:00+07:00",
        }

        response = self.client.patch(f"/api/admin/menu/{menu_id}", json={"promotion": promotion})

        self.assertEqual(response.status_code, 400)

    def test_AC_MENU_MGMT_03_rejects_promotion_without_name(self):
        created = self.client.post(
            "/api/admin/menu",
            json={"name": "ไม่มีชื่อโปรโมชั่น", "price": 50, "status": "open"},
        )
        menu_id = created.json()["menu_id"]
        response = self.client.patch(
            f"/api/admin/menu/{menu_id}",
            json={
                "promotion": {
                    "promotion_name": "",
                    "discount_value": 10,
                    "start_at": "2099-11-01T10:00:00+07:00",
                    "end_at": "2099-11-30T10:00:00+07:00",
                },
            },
        )

        self.assertEqual(response.status_code, 400)

    def test_AC_MENU_MGMT_03_clears_promotion_when_set_to_null(self):
        created = self.client.post(
            "/api/admin/menu",
            json={
                "name": "ล้างโปรโมชั่น",
                "price": 50,
                "status": "open",
            },
        )
        menu_id = created.json()["menu_id"]
        response = self.client.patch(
            f"/api/admin/menu/{menu_id}",
            json={
                "promotion": {
                    "promotion_name": "ลดพิเศษ",
                    "discount_value": 5,
                    "start_at": "2026-11-01T10:00:00+07:00",
                    "end_at": "2026-11-30T10:00:00+07:00",
                },
            },
        )
        self.assertEqual(response.status_code, 200)

        cleared = self.client.patch(
            f"/api/admin/menu/{menu_id}",
            json={"promotion": None},
        )

        self.assertEqual(cleared.status_code, 200)
        self.assertIsNone(cleared.json()["promotion"])

    def test_AC_MENU_MGMT_03_rejects_promotion_in_the_past(self):
        response = self.client.post(
            "/api/admin/menu",
            json={
                "name": "โปรโมชั่นย้อนหลัง",
                "price": 50,
                "status": "open",
            },
        )
        menu_id = response.json()["menu_id"]

        updated = self.client.patch(
            f"/api/admin/menu/{menu_id}",
            json={
                "promotion": {
                    "promotion_name": "ลดพิเศษ",
                    "discount_value": 5,
                    "start_at": "2020-01-01T10:00:00+07:00",
                    "end_at": "2020-01-30T10:00:00+07:00",
                },
            },
        )

        self.assertEqual(updated.status_code, 400)


if __name__ == "__main__":
    unittest.main()
