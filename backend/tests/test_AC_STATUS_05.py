import os
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.database import initialize_database


class TestApprovedACStatus05Cases(unittest.TestCase):
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
        connection.close()
        self.client = TestClient(app)

    def _insert_orders(self, orders):
        connection = sqlite3.connect(os.environ["ORDER_DATABASE_PATH"])
        with connection:
            connection.executemany(
                """
                INSERT INTO orders (
                    order_id, user_id, created_at, status, total_amount,
                    last_status_change_at, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (order_id, "sample-user", created_at, "PREPARING", 50, None, 1)
                    for order_id, created_at in orders
                ],
            )
        connection.close()

    def test_TC_STATUS_05_1_lists_multiple_orders_newest_first(self):
        self._insert_orders(
            [
                ("order-oldest", "2026-10-24T09:00:00"),
                ("order-middle", "2026-10-25T09:00:00"),
                ("order-newest", "2026-10-26T09:00:00"),
            ]
        )

        # Given ลูกค้ามีหลาย Order อยู่ในระบบ
        # When ลูกค้าเปิดหน้าติดตามสถานะ Order (เรียก API รายการที่หน้าใช้)
        response = self.client.get(
            "/api/orders",
            headers={"X-Test-User": "customer-a"},
        )

        # Then ระบบแสดงรายการ Order ให้ลูกค้าเลือกติดตาม และเรียงตามวันที่สร้างล่าสุดก่อน
        self.assertEqual(response.status_code, 200)
        orders = response.json()
        self.assertEqual(len(orders), 3)
        self.assertEqual(
            [order["order_id"] for order in orders],
            ["order-newest", "order-middle", "order-oldest"],
        )

    def test_TC_STATUS_05_2_orders_two_items_newest_first(self):
        self._insert_orders(
            [
                ("order-older", "2026-10-25T09:00:00"),
                ("order-newer", "2026-10-26T09:00:00"),
            ]
        )

        # Given ลูกค้ามี Order 2 รายการอยู่ในระบบ โดยรายการหนึ่งสร้างใหม่กว่าอีกรายการ
        # When ลูกค้าเปิดหน้าติดตามสถานะ Order (เรียก API รายการที่หน้าใช้)
        response = self.client.get(
            "/api/orders",
            headers={"X-Test-User": "customer-a"},
        )

        # Then ระบบแสดง Order ทั้งสองให้เลือก และแสดง Order ที่สร้างใหม่กว่าก่อน
        self.assertEqual(response.status_code, 200)
        orders = response.json()
        self.assertEqual(len(orders), 2)
        self.assertEqual(
            [order["order_id"] for order in orders],
            ["order-newer", "order-older"],
        )


if __name__ == "__main__":
    unittest.main()
