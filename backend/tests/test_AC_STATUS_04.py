import os
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.database import initialize_database


class TestApprovedACStatus04Cases(unittest.TestCase):
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
                (
                    "order-status-04",
                    "sample-user",
                    "2026-10-25T09:00:00",
                    "READY_FOR_PICKUP",
                    140,
                    "2026-10-25T11:00:00",
                    1,
                ),
            )
        connection.close()
        self.client = TestClient(app)

    def _insert_items(self):
        connection = sqlite3.connect(os.environ["ORDER_DATABASE_PATH"])
        with connection:
            connection.executemany(
                """
                INSERT INTO order_items (
                    order_item_id, order_id, menu_item_id, menu_name,
                    quantity, unit_price, line_total
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    ("item-1", "order-status-04", "menu-1", "ชาไทย", 2, 45, 90),
                    ("item-2", "order-status-04", "menu-2", "มัทฉะลาเต้", 1, 50, 50),
                ],
            )
            connection.execute(
                """
                INSERT INTO order_status_history (
                    status_log_id, order_id, status_code, status_name,
                    changed_at, is_confirmed
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    "status-ready",
                    "order-status-04",
                    "READY_FOR_PICKUP",
                    "พร้อมรับสินค้า",
                    "2026-10-25T11:00:00",
                    1,
                ),
            )
        connection.close()

    def test_TC_STATUS_04_1_shows_order_items_and_latest_status(self):
        self._insert_items()

        # Given ลูกค้าเลือก Order ที่ต้องการติดตาม
        # When ระบบโหลดข้อมูล Order สำเร็จ
        response = self.client.get(
            "/api/orders/order-status-04",
            headers={"X-Test-User": "customer-a"},
        )

        # Then ระบบแสดงสถานะล่าสุดและข้อมูลรายการสินค้า ได้แก่ รายการสินค้า จำนวน และราคา
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(
            payload["latest_status"],
            {
                "status_code": "READY_FOR_PICKUP",
                "status_name": "พร้อมรับสินค้า",
                "changed_at": "2026-10-25T11:00:00",
            },
        )
        self.assertEqual(
            [
                (item["menu_name"], item["quantity"], item["unit_price"])
                for item in payload["items"]
            ],
            [("ชาไทย", 2, 45), ("มัทฉะลาเต้", 1, 50)],
        )

    def test_TC_STATUS_04_2_shows_two_order_items(self):
        self._insert_items()

        # Given ลูกค้าเลือก Order ที่มีรายการสินค้า 2 รายการ ซึ่งเป็นขอบล่างของช่วง 2-3 รายการในแผนทดสอบ
        # When ระบบโหลดข้อมูล Order สำเร็จ
        response = self.client.get(
            "/api/orders/order-status-04",
            headers={"X-Test-User": "customer-a"},
        )

        # Then ระบบแสดงสถานะล่าสุด และข้อมูลรายการสินค้าทั้ง 2 รายการ จำนวน และราคาที่เกี่ยวข้องอย่างถูกต้อง
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["latest_status"]["status_name"], "พร้อมรับสินค้า")
        self.assertEqual(len(payload["items"]), 2)
        self.assertEqual(
            [
                (item["menu_name"], item["quantity"], item["unit_price"])
                for item in payload["items"]
            ],
            [("ชาไทย", 2, 45), ("มัทฉะลาเต้", 1, 50)],
        )


if __name__ == "__main__":
    unittest.main()
