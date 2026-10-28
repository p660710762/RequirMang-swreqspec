import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.app.main import app


class TestMenuManagementApi(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app, headers={"X-User-Id": "admin"})

    def test_AC_MENU_MGMT_01_admin_can_view_menu_list(self):
        response = self.client.get("/api/admin/menu")

        self.assertEqual(response.status_code, 200)
        menu_items = response.json()["menu_items"]
        self.assertTrue(menu_items)
        self.assertTrue({"menu_id", "name", "price", "status"}.issubset(menu_items[0]))

    def test_AC_MENU_MGMT_02_admin_can_add_menu_item(self):
        response = self.client.post(
            "/api/admin/menu",
            json={"name": "เมนู API ทดสอบ", "price": 10, "status": "open"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "เมนู API ทดสอบ")
        self.assertEqual(response.json()["price"], 10)

    def test_AC_MENU_MGMT_05_validation_before_save(self):
        before = self.client.get("/api/admin/menu").json()["menu_items"]
        response = self.client.post("/api/admin/menu", json={"description": "ข้อมูลไม่ครบ"})
        after = self.client.get("/api/admin/menu").json()["menu_items"]

        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.json())
        self.assertEqual(after, before)

    def test_AC_MENU_MGMT_06_successful_update_is_persisted(self):
        created = self.client.post(
            "/api/admin/menu",
            json={"name": "เมนู API สำหรับแก้ไข", "price": 10, "status": "open"},
        )
        menu_id = created.json()["menu_id"]

        updated = self.client.patch(
            f"/api/admin/menu/{menu_id}",
            json={"price": 15, "description": "แก้ไขแล้ว", "status": "sold_out"},
        )
        listed = self.client.get("/api/admin/menu").json()["menu_items"]
        saved_item = next(item for item in listed if item["menu_id"] == menu_id)

        self.assertEqual(updated.status_code, 200)
        self.assertEqual(saved_item["price"], 15)
        self.assertEqual(saved_item["description"], "แก้ไขแล้ว")
        self.assertEqual(saved_item["status"], "sold_out")

    def test_AC_MENU_MGMT_12_save_failure_is_not_shown_as_success(self):
        created = self.client.post(
            "/api/admin/menu",
            json={"name": "เมนู API สำหรับ fail", "price": 10, "status": "open"},
        )
        menu_id = created.json()["menu_id"]
        before = self.client.get("/api/admin/menu").json()["menu_items"]
        original = next(item for item in before if item["menu_id"] == menu_id)

        with patch("backend.app.routes.menu.update_menu_item", side_effect=RuntimeError("db failure")):
            response = self.client.patch(
                f"/api/admin/menu/{menu_id}",
                json={"price": 99, "description": "ควรไม่บันทึก"},
            )

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json()["detail"], "ไม่สามารถบันทึกข้อมูลได้")

        after = self.client.get("/api/admin/menu").json()["menu_items"]
        saved_item = next(item for item in after if item["menu_id"] == menu_id)
        self.assertEqual(saved_item["price"], original["price"])
        self.assertEqual(saved_item["description"], original["description"])

    def test_TC_MENU_MGMT_06_3_incomplete_update_is_rejected(self):
        created = self.client.post(
            "/api/admin/menu",
            json={"name": "เมนูสำหรับข้อมูลไม่ครบ", "price": 20, "status": "open"},
        )
        menu_id = created.json()["menu_id"]
        before = self.client.get("/api/admin/menu").json()["menu_items"]

        response = self.client.patch(
            f"/api/admin/menu/{menu_id}",
            json={"name": "", "price": 25, "status": "open"},
        )

        after = self.client.get("/api/admin/menu").json()["menu_items"]
        saved_item = next(item for item in after if item["menu_id"] == menu_id)
        original = next(item for item in before if item["menu_id"] == menu_id)

        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.json())
        self.assertEqual(saved_item["name"], original["name"])
        self.assertEqual(saved_item["price"], original["price"])


if __name__ == "__main__":
    unittest.main()
