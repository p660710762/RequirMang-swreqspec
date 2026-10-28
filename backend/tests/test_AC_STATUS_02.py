import os
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.database import initialize_database


class TestApprovedACStatus02Cases(unittest.TestCase):
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
            connection.executemany(
                """
                INSERT INTO orders (
                    order_id, user_id, created_at, status, total_amount,
                    last_status_change_at, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    ("order-owned", "sample-user", "2026-10-25T09:00:00", "PREPARING", 50, None, 1),
                    ("order-other", "sample-user-2", "2026-10-25T10:00:00", "PICKED_UP", 75, None, 1),
                ],
            )
        connection.close()
        self.client = TestClient(app)

    def _add_confirmed_status(self, order_id, status_code, status_name, changed_at):
        connection = sqlite3.connect(os.environ["ORDER_DATABASE_PATH"])
        with connection:
            connection.execute(
                """
                INSERT INTO order_status_history (
                    status_log_id, order_id, status_code, status_name,
                    changed_at, is_confirmed
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    f"status-{order_id}",
                    order_id,
                    status_code,
                    status_name,
                    changed_at,
                    1,
                ),
            )
        connection.close()

    def test_TC_STATUS_02_1_customer_sees_selected_order_detail(self):
        self._add_confirmed_status(
            "order-owned", "PREPARING", "กำลังเตรียม", "2026-10-25T09:10:00"
        )

        # Given ลูกค้ามี Order อยู่ในระบบ
        # When ลูกค้าเลือก Order ที่ต้องการติดตาม
        response = self.client.get(
            "/api/orders/order-owned",
            headers={"X-Test-User": "customer-a"},
        )

        # Then ระบบแสดงรายละเอียดและสถานะล่าสุดของ Order ที่เลือก
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["order_id"], "order-owned")
        self.assertEqual(payload["latest_status"]["status_name"], "กำลังเตรียม")

    def test_TC_STATUS_02_2_customer_sees_completed_order_detail(self):
        self._add_confirmed_status(
            "order-owned", "PICKED_UP", "รับสินค้าแล้ว", "2026-10-25T12:00:00"
        )

        # Given ลูกค้ามี Order ที่สถานะล่าสุดเป็น “รับสินค้าแล้ว”
        # When ลูกค้าเลือก Order นั้นเพื่อติดตาม
        response = self.client.get(
            "/api/orders/order-owned",
            headers={"X-Test-User": "customer-a"},
        )

        # Then ระบบแสดงรายละเอียดและสถานะล่าสุด “รับสินค้าแล้ว” ของ Order ที่เลือก
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["order_id"], "order-owned")
        self.assertEqual(payload["latest_status"]["status_code"], "PICKED_UP")
        self.assertEqual(payload["latest_status"]["status_name"], "รับสินค้าแล้ว")

    def test_TC_STATUS_02_3_hides_unauthorized_order_detail(self):
        # Given ลูกค้ามี Order ของตนเองและมี Order ของลูกค้ารายอื่นในระบบ แต่ไม่มีสิทธิ์เข้าถึง Order ของลูกค้ารายอื่น
        # When ลูกค้าเลือก Order ของลูกค้ารายอื่น
        response = self.client.get(
            "/api/orders/order-other",
            headers={"X-Test-User": "customer-a"},
        )

        # Then ระบบไม่แสดงรายละเอียดหรือสถานะของ Order ที่ลูกค้าไม่มีสิทธิ์เข้าถึง ตาม NFR-SEC-02
        self.assertNotEqual(response.status_code, 200)
        self.assertNotIn("order_id", response.json())
        self.assertNotIn("latest_status", response.json())
        self.assertNotIn("items", response.json())


if __name__ == "__main__":
    unittest.main()
