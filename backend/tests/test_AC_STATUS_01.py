import os
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.database import initialize_database


class TestApprovedACStatus01Cases(unittest.TestCase):
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
                    ("order-customer-a", "sample-user", "2026-10-25T09:00:00", "PREPARING", 50, None, 1),
                    ("order-customer-b", "sample-user-2", "2026-10-25T10:00:00", "READY_FOR_PICKUP", 75, None, 1),
                ],
            )
        connection.close()
        self.client = TestClient(app)

    def test_TC_STATUS_01_1_customer_sees_own_orders(self):
        # Given ลูกค้ามี Order อยู่ในระบบ
        # When ลูกค้าเปิดหน้ารายการ Order (เรียก API รายการที่หน้าเว็บใช้)
        response = self.client.get(
            "/api/orders",
            headers={"X-Test-User": "customer-a"},
        )

        # Then ระบบแสดงรายการ Order ของลูกค้า
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {order["order_id"] for order in response.json()},
            {"order-customer-a"},
        )

    def test_TC_STATUS_01_2_hides_other_customers_orders(self):
        # Given ลูกค้ามี Order อยู่ในระบบ และมี Order ของลูกค้าคนอื่นอยู่ด้วย
        # When ลูกค้าเปิดหน้ารายการ Order (เรียก API รายการที่หน้าเว็บใช้)
        response = self.client.get(
            "/api/orders",
            headers={"X-Test-User": "customer-a"},
        )

        # Then ระบบแสดงรายการ Order ของลูกค้าเท่านั้น ตาม NFR-SEC-02
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {order["order_id"] for order in response.json()},
            {"order-customer-a"},
        )
        self.assertNotIn(
            "order-customer-b",
            {order["order_id"] for order in response.json()},
        )
        self.assertTrue(
            all(order["user_id"] == "sample-user" for order in response.json())
        )


if __name__ == "__main__":
    unittest.main()
