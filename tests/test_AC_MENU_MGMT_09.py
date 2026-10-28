import unittest

from fastapi.testclient import TestClient

from backend.app.main import app


class TestMenuNotForSale(unittest.TestCase):
    def setUp(self):
        self.admin_client = TestClient(app, headers={"X-User-Id": "admin"})
        self.customer_client = TestClient(app, headers={"X-User-Id": "student"})
        self.non_admin_client = TestClient(app, headers={"X-User-Id": "student"})

    def _create_menu(self, status="open"):
        response = self.admin_client.post(
            "/api/admin/menu",
            json={"name": "เมนูไม่จำหน่าย", "price": 40, "status": status},
        )
        self.assertEqual(response.status_code, 200)
        return response.json()["menu_id"]

    def test_TC_MENU_MGMT_09_1_admin_marks_menu_not_for_sale(self):
        # Given Admin เลือกเมนูที่ไม่จำหน่าย และเมนูอยู่ในสถานะ “เปิดขาย”
        menu_id = self._create_menu("open")

        # When Admin ยืนยันการดำเนินการ
        response = self.admin_client.patch(
            f"/api/admin/menu/{menu_id}/status",
            json={"status": "sold_out"},
        )

        # Then ระบบเปลี่ยนเป็น “หมด” และไม่อนุญาตให้ลูกค้าสั่งซื้อ
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "sold_out")
        draft = self.customer_client.post("/api/orders/drafts")
        ordered = self.customer_client.post(
            "/api/orders/items",
            json={
                **draft.json(),
                "menu_item_id": menu_id,
                "quantity": 1,
                "sweetness_level": "หวานปกติ 75%",
                "toppings": ["ไข่มุก"],
                "ice_level": "ไม่ใส่น้ำแข็ง",
            },
        )
        self.assertEqual(ordered.status_code, 409)

    def test_TC_MENU_MGMT_09_2_already_unavailable_menu_stays_not_for_sale(self):
        # Given Admin เลือกเมนูที่ไม่จำหน่าย และเมนูอยู่ในสถานะ “หมด” อยู่แล้ว
        menu_id = self._create_menu("sold_out")

        # When Admin ยืนยันการดำเนินการอีกครั้ง
        response = self.admin_client.patch(
            f"/api/admin/menu/{menu_id}/status",
            json={"status": "sold_out"},
        )

        # Then ระบบคงสถานะที่ไม่เปิดขาย และไม่อนุญาตให้ลูกค้าสั่งซื้อ
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "sold_out")
        draft = self.customer_client.post("/api/orders/drafts")
        ordered = self.customer_client.post(
            "/api/orders/items",
            json={
                **draft.json(),
                "menu_item_id": menu_id,
                "quantity": 1,
                "sweetness_level": "หวานปกติ 75%",
                "toppings": ["ไข่มุก"],
                "ice_level": "ไม่ใส่น้ำแข็ง",
            },
        )
        self.assertEqual(ordered.status_code, 409)

    def test_TC_MENU_MGMT_09_3_non_admin_cannot_mark_menu_not_for_sale(self):
        # Given ผู้ใช้งานไม่มีสิทธิ์ Admin และเลือกเมนูที่ไม่จำหน่าย
        menu_id = self._create_menu("open")

        # When ผู้ใช้งานพยายามยืนยันการดำเนินการ
        response = self.non_admin_client.patch(
            f"/api/admin/menu/{menu_id}/status",
            json={"status": "sold_out"},
        )

        # Then ระบบไม่อนุญาตให้ดำเนินการตาม NFR-SEC-05
        self.assertEqual(response.status_code, 403)
        # spec ไม่ได้บอกข้อความแจ้งเตือนที่ต้องแสดง จึงไม่ตรวจข้อความ


if __name__ == "__main__":
    unittest.main()
