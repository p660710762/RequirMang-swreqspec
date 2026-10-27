import os
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.database import initialize_database


class TestApprovedACStatus03Cases(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp_dir.cleanup)
        database_path = os.path.join(self.temp_dir.name, "orders.sqlite")
        self.environment = patch.dict(
            os.environ,
            {"APP_ENV": "test", "ORDER_DATABASE_PATH": database_path},
        )
        self.environment.start()
        self.addCleanup(self.environment.stop)

        connection = sqlite3.connect(database_path)
        initialize_database(connection)
        with connection:
            connection.execute(
                """
                INSERT INTO orders (
                    order_id, user_id, created_at, status, total_amount,
                    last_status_change_at, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                ("order-status", "sample-user", "2026-10-25T09:00:00", "PENDING_ACCEPT", 50, None, 1),
            )
        connection.close()
        self.client = TestClient(app)

    def _insert_history(self, rows):
        connection = sqlite3.connect(os.environ["ORDER_DATABASE_PATH"])
        with connection:
            connection.executemany(
                """
                INSERT INTO order_status_history (
                    status_log_id, order_id, status_code, status_name,
                    changed_at, is_confirmed
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                rows,
            )
        connection.close()

    def test_TC_STATUS_03_1_displays_four_status_steps(self):
        self._insert_history(
            [
                ("status-pending", "order-status", "PENDING_ACCEPT", "รอรับ Order", "2026-10-25T09:00:00", 1),
                ("status-preparing", "order-status", "PREPARING", "กำลังเตรียม", "2026-10-25T10:00:00", 1),
                ("status-ready", "order-status", "READY_FOR_PICKUP", "พร้อมรับสินค้า", "2026-10-25T11:00:00", 1),
                ("status-picked-up", "order-status", "PICKED_UP", "รับสินค้าแล้ว", "2026-10-25T12:00:00", 1),
            ]
        )

        # Given Order มีสถานะที่ถูกบันทึกในระบบครบทั้ง 4 ขั้นตาม FR-21
        # When ลูกค้าเปิดรายละเอียด Order (เรียก API สถานะที่หน้าใช้)
        response = self.client.get(
            "/api/orders/order-status/status",
            headers={"X-Test-User": "customer-a"},
        )

        # Then ระบบแสดงสถานะตามลำดับ 4 ขั้น
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(
            [status["status_name"] for status in payload["status_history"]],
            ["รอรับ Order", "กำลังเตรียม", "พร้อมรับสินค้า", "รับสินค้าแล้ว"],
        )

    def test_TC_STATUS_03_2_shows_ready_status_time(self):
        self._insert_history(
            [
                ("status-pending", "order-status", "PENDING_ACCEPT", "รอรับ Order", "2026-10-25T09:00:00", 1),
                ("status-preparing", "order-status", "PREPARING", "กำลังเตรียม", "2026-10-25T10:00:00", 1),
                ("status-ready", "order-status", "READY_FOR_PICKUP", "พร้อมรับสินค้า", "2026-10-25T11:00:00", 1),
            ]
        )

        # Given Order มีสถานะที่ถูกบันทึกในระบบจนถึง “พร้อมรับสินค้า”
        # When ลูกค้าเปิดรายละเอียด Order (เรียก API สถานะที่หน้าใช้)
        response = self.client.get(
            "/api/orders/order-status/status",
            headers={"X-Test-User": "customer-a"},
        )

        # Then ระบบแสดงลำดับ 4 ขั้นตาม FR-21
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(
            [status["status_name"] for status in payload["status_history"]],
            ["รอรับ Order", "กำลังเตรียม", "พร้อมรับสินค้า"],
        )
        # Then เมื่อสถานะเปลี่ยนเป็น “พร้อมรับสินค้า” ระบบแสดงเวลาและสถานะที่เปลี่ยนล่าสุด
        self.assertEqual(payload["current_status"], "READY_FOR_PICKUP")
        self.assertEqual(payload["latest_status_time"], "2026-10-25T11:00:00")
        self.assertEqual(payload["status_history"][-1]["status_name"], "พร้อมรับสินค้า")

    def test_TC_STATUS_03_3_does_not_show_unconfirmed_status(self):
        self._insert_history(
            [
                ("status-unconfirmed", "order-status", "PICKED_UP", "รับสินค้าแล้ว", "2026-10-25T12:00:00", 0),
            ]
        )

        # Given Order ไม่มีสถานะที่ถูกบันทึกและยืนยันในระบบ
        # When ลูกค้าเปิดรายละเอียด Order (เรียก API สถานะที่หน้าใช้)
        response = self.client.get(
            "/api/orders/order-status/status",
            headers={"X-Test-User": "customer-a"},
        )

        # Then ระบบไม่แสดงสถานะที่ไม่ถูกบันทึกหรือไม่ผ่านการยืนยัน ตาม NFR-REL-03
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIsNone(payload["current_status"])
        self.assertIsNone(payload["latest_status_time"])
        self.assertEqual(payload["status_history"], [])
        self.assertNotIn(
            "PICKED_UP",
            [status["status_code"] for status in payload["status_history"]],
        )


if __name__ == "__main__":
    unittest.main()
