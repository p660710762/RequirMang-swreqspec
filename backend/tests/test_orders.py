import os
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.routes.orders import MOCK_USERS
from backend.database import connect_database, initialize_database


class TestOrderListOwnership(unittest.TestCase):
    """Supports FR-19 and NFR-SEC-02 by checking each test user sees only their own orders."""

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

        connection = connect_database(database_path)
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
                    ("order-a", "sample-user", "2026-10-25T09:00:00", "PENDING_ACCEPT", 50, None, 1),
                    ("order-b", "sample-user-2", "2026-10-25T10:00:00", "PREPARING", 75, None, 1),
                ],
            )
        connection.close()
        self.client = TestClient(app)

    def test_AC_STATUS_01_show_only_user_orders(self):
        connection = connect_database(os.environ["ORDER_DATABASE_PATH"])
        with connection:
            connection.execute(
                """
                INSERT INTO order_items (
                    order_item_id, order_id, menu_item_id, menu_name,
                    quantity, unit_price, line_total
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                ("item-a", "order-a", "menu-a", "ชาไทย", 2, 45, 90),
            )
        connection.close()

        self.assertEqual(
            len({identity["user_id"] for identity in MOCK_USERS.values()}),
            len(MOCK_USERS),
        )

        for test_user, identity in MOCK_USERS.items():
            with self.subTest(test_user=test_user):
                response = self.client.get(
                    "/api/orders",
                    headers={"X-Test-User": test_user},
                )

                self.assertEqual(response.status_code, 200)
                self.assertTrue(response.json())
                self.assertTrue(
                    all(
                        order["user_id"] == identity["user_id"]
                        for order in response.json()
                    )
                )
                self.assertEqual(
                    {order["order_id"] for order in response.json()},
                    {"order-a"}
                    if identity["user_id"] == "sample-user"
                    else {"order-b"},
                )
                if identity["user_id"] == "sample-user":
                    self.assertEqual(
                        response.json()[0]["items"],
                        [{"menu_name": "ชาไทย", "quantity": 2, "unit_price": 45}],
                    )

    def test_NFR_REL_03_order_list_uses_latest_confirmed_status(self):
        connection = connect_database(os.environ["ORDER_DATABASE_PATH"])
        with connection:
            connection.execute(
                "UPDATE orders SET status = ? WHERE order_id = ?",
                ("PICKED_UP", "order-a"),
            )
            connection.executemany(
                """
                INSERT INTO order_status_history (
                    status_log_id, order_id, status_code, status_name,
                    changed_at, is_confirmed
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                [
                    ("list-confirmed", "order-a", "PREPARING", "กำลังเตรียม", "2026-10-25T10:00:00", 1),
                    ("list-unconfirmed", "order-a", "PICKED_UP", "รับสินค้าแล้ว", "2026-10-25T11:00:00", 0),
                ],
            )
        connection.close()

        response = self.client.get(
            "/api/orders",
            headers={"X-Test-User": "customer-a"},
        )

        self.assertEqual(response.status_code, 200)
        order = next(item for item in response.json() if item["order_id"] == "order-a")
        self.assertEqual(order["status"], "PREPARING")
        self.assertEqual(order["last_updated_at"], "2026-10-25T10:00:00")
        self.assertNotEqual(order["status"], "PICKED_UP")

    # Verifies NFR-SEC-02 exposes only the current mock-authenticated user's orders.
    def test_AC_STATUS_09_show_only_authorized_orders(self):
        response = self.client.get(
            "/api/orders",
            headers={"X-Test-User": "customer-a"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {order["order_id"] for order in response.json()},
            {"order-a"},
        )
        self.assertTrue(
            all(order["user_id"] == MOCK_USERS["customer-a"]["user_id"] for order in response.json())
        )
        self.assertNotIn(
            "order-b",
            {order["order_id"] for order in response.json()},
        )

    def test_AC_STATUS_05_list_orders_sorted_by_latest_created(self):
        connection = connect_database(os.environ["ORDER_DATABASE_PATH"])
        with connection:
            connection.execute("DELETE FROM orders")
            connection.executemany(
                """
                INSERT INTO orders (
                    order_id, user_id, created_at, status, total_amount,
                    last_status_change_at, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    ("order-old", "sample-user", "2026-10-25T09:00:00", "PENDING_ACCEPT", 50, None, 1),
                    ("order-new", "sample-user", "2026-10-26T09:00:00", "PREPARING", 75, None, 1),
                    ("other-user-order", "sample-user-2", "2026-10-27T09:00:00", "PREPARING", 80, None, 1),
                ],
            )
        connection.close()

        response = self.client.get(
            "/api/orders",
            headers={"X-Test-User": "customer-a"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [order["order_id"] for order in response.json()],
            ["order-new", "order-old"],
        )

    def test_AC_STATUS_02_select_order_and_view_detail(self):
        connection = connect_database(os.environ["ORDER_DATABASE_PATH"])
        with connection:
            connection.execute(
                """
                INSERT INTO order_items (
                    order_item_id, order_id, menu_item_id, menu_name,
                    quantity, unit_price, line_total
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                ("item-a", "order-a", "menu-a", "ชาไทย", 2, 45, 90),
            )
            connection.executemany(
                """
                INSERT INTO order_status_history (
                    status_log_id, order_id, status_code, status_name,
                    changed_at, is_confirmed
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                [
                    ("status-confirmed", "order-a", "PREPARING", "กำลังเตรียม", "2026-10-25T10:00:00", 1),
                    ("status-unconfirmed", "order-a", "READY_FOR_PICKUP", "พร้อมรับสินค้า", "2026-10-25T11:00:00", 0),
                ],
            )
        connection.close()

        response = self.client.get(
            "/api/orders/order-a",
            headers={"X-Test-User": "customer-a"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["order_id"], "order-a")
        self.assertEqual(response.json()["latest_status"], {
            "status_code": "PREPARING",
            "status_name": "กำลังเตรียม",
            "changed_at": "2026-10-25T10:00:00",
        })
        self.assertEqual(response.json()["items"], [{
            "order_item_id": "item-a",
            "menu_item_id": "menu-a",
            "menu_name": "ชาไทย",
            "quantity": 2,
            "unit_price": 45,
            "line_total": 90,
        }])

        other_user_response = self.client.get(
            "/api/orders/order-b",
            headers={"X-Test-User": "customer-a"},
        )
        self.assertEqual(other_user_response.status_code, 404)

    def test_AC_STATUS_02_detail_without_confirmed_status_returns_null(self):
        response = self.client.get(
            "/api/orders/order-a",
            headers={"X-Test-User": "customer-a"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["latest_status"])
        self.assertNotIn("status", response.json())

    # Verifies FR-22 returns order items and the latest confirmed status for the selected order.
    def test_AC_STATUS_04_show_order_items_and_latest_status(self):
        connection = connect_database(os.environ["ORDER_DATABASE_PATH"])
        with connection:
            connection.executemany(
                """
                INSERT INTO order_items (
                    order_item_id, order_id, menu_item_id, menu_name,
                    quantity, unit_price, line_total
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    ("item-a1", "order-a", "menu-a", "ชาไทย", 2, 45, 90),
                    ("item-a2", "order-a", "menu-b", "โกโก้", 1, 50, 50),
                ],
            )
            connection.executemany(
                """
                INSERT INTO order_status_history (
                    status_log_id, order_id, status_code, status_name,
                    changed_at, is_confirmed
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                [
                    ("status-a1", "order-a", "PREPARING", "กำลังเตรียม", "2026-10-25T10:00:00", 1),
                    ("status-a2", "order-a", "READY_FOR_PICKUP", "พร้อมรับสินค้า", "2026-10-25T11:00:00", 1),
                    ("status-a3", "order-a", "PICKED_UP", "รับสินค้าแล้ว", "2026-10-25T12:00:00", 0),
                ],
            )
        connection.close()

        response = self.client.get(
            "/api/orders/order-a",
            headers={"X-Test-User": "customer-a"},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["items"], [
            {
                "order_item_id": "item-a1",
                "menu_item_id": "menu-a",
                "menu_name": "ชาไทย",
                "quantity": 2,
                "unit_price": 45,
                "line_total": 90,
            },
            {
                "order_item_id": "item-a2",
                "menu_item_id": "menu-b",
                "menu_name": "โกโก้",
                "quantity": 1,
                "unit_price": 50,
                "line_total": 50,
            },
        ])
        self.assertEqual(
            payload["latest_status"],
            {
                "status_code": "READY_FOR_PICKUP",
                "status_name": "พร้อมรับสินค้า",
                "changed_at": "2026-10-25T11:00:00",
            },
        )

    # Verifies NFR-REL-03 only exposes the latest confirmed status in order detail and status history.
    def test_AC_STATUS_08_show_only_confirmed_status(self):
        connection = connect_database(os.environ["ORDER_DATABASE_PATH"])
        with connection:
            connection.executemany(
                """
                INSERT INTO order_status_history (
                    status_log_id, order_id, status_code, status_name,
                    changed_at, is_confirmed
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                [
                    ("status-confirmed-old", "order-a", "PREPARING", "กำลังเตรียม", "2026-10-25T10:00:00", 1),
                    ("status-confirmed-latest", "order-a", "READY_FOR_PICKUP", "พร้อมรับสินค้า", "2026-10-25T11:00:00", 1),
                    ("status-unconfirmed-latest", "order-a", "PICKED_UP", "รับสินค้าแล้ว", "2026-10-25T12:00:00", 0),
                ],
            )
        connection.close()

        headers = {"X-Test-User": "customer-a"}
        detail_response = self.client.get("/api/orders/order-a", headers=headers)
        history_response = self.client.get("/api/orders/order-a/status", headers=headers)

        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(
            detail_response.json()["latest_status"],
            {
                "status_code": "READY_FOR_PICKUP",
                "status_name": "พร้อมรับสินค้า",
                "changed_at": "2026-10-25T11:00:00",
            },
        )
        self.assertEqual(history_response.status_code, 200)
        history_payload = history_response.json()
        self.assertEqual(history_payload["current_status"], "READY_FOR_PICKUP")
        self.assertEqual(history_payload["latest_status_time"], "2026-10-25T11:00:00")
        self.assertEqual(
            [status["status_code"] for status in history_payload["status_history"]],
            ["PREPARING", "READY_FOR_PICKUP"],
        )

    # Verifies AC-STATUS-07 reloads only confirmed data and reports a load failure explicitly.
    def test_AC_STATUS_07_refresh_returns_confirmed_status_or_error(self):
        connection = connect_database(os.environ["ORDER_DATABASE_PATH"])
        with connection:
            connection.executemany(
                """
                INSERT INTO order_status_history (
                    status_log_id, order_id, status_code, status_name,
                    changed_at, is_confirmed
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                [
                    ("refresh-confirmed", "order-a", "PREPARING", "กำลังเตรียม", "2026-10-25T10:00:00", 1),
                    ("refresh-unconfirmed", "order-a", "PICKED_UP", "รับสินค้าแล้ว", "2026-10-25T11:00:00", 0),
                ],
            )
        connection.close()

        headers = {"X-Test-User": "customer-a"}
        response = self.client.post(
            "/api/orders/order-a/status/refresh",
            headers=headers,
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["current_status"], "PREPARING")
        self.assertEqual(
            [status["status_code"] for status in payload["status_history"]],
            ["PREPARING"],
        )

        with patch(
            "backend.app.routes.orders.get_order_status_for_user",
            side_effect=sqlite3.OperationalError("database unavailable"),
        ):
            failed_response = self.client.post(
                "/api/orders/order-a/status/refresh",
                headers=headers,
            )

        self.assertEqual(failed_response.status_code, 503)
        self.assertEqual(
            failed_response.json()["detail"],
            "Unable to load confirmed order status",
        )

    def test_constraint_customer_cannot_change_order_status(self):
        response = self.client.patch(
            "/api/orders/order-a/status",
            headers={"X-Test-User": "customer-a"},
            json={"status": "PICKED_UP"},
        )

        self.assertEqual(response.status_code, 405)
        status_response = self.client.get(
            "/api/orders/order-a/status",
            headers={"X-Test-User": "customer-a"},
        )
        self.assertEqual(status_response.status_code, 200)
        self.assertIsNone(status_response.json()["current_status"])

    # Verifies FR-21, NFR-REL-03, and NFR-SEC-02 for the confirmed owner status history.
    def test_AC_STATUS_03_display_4_step_status_flow(self):
        connection = connect_database(os.environ["ORDER_DATABASE_PATH"])
        with connection:
            connection.executemany(
                """
                INSERT INTO order_status_history (
                    status_log_id, order_id, status_code, status_name,
                    changed_at, is_confirmed
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                [
                    ("status-pending", "order-a", "PENDING_ACCEPT", "รอรับ Order", "2026-10-25T09:00:00", 1),
                    ("status-preparing", "order-a", "PREPARING", "กำลังเตรียม", "2026-10-25T10:00:00", 1),
                    ("status-ready", "order-a", "READY_FOR_PICKUP", "พร้อมรับสินค้า", "2026-10-25T11:00:00", 1),
                    ("status-picked-up", "order-a", "PICKED_UP", "รับสินค้าแล้ว", "2026-10-25T12:00:00", 1),
                    ("status-unconfirmed", "order-a", "PREPARING", "กำลังเตรียม", "2026-10-25T13:00:00", 0),
                ],
            )
        connection.close()

        response = self.client.get(
            "/api/orders/order-a/status",
            headers={"X-Test-User": "customer-a"},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["current_status"], "PICKED_UP")
        self.assertEqual(payload["latest_status_time"], "2026-10-25T12:00:00")
        self.assertEqual(
            [status["status_code"] for status in payload["status_history"]],
            ["PENDING_ACCEPT", "PREPARING", "READY_FOR_PICKUP", "PICKED_UP"],
        )
        self.assertEqual(
            [status["status_name"] for status in payload["status_history"]],
            ["รอรับ Order", "กำลังเตรียม", "พร้อมรับสินค้า", "รับสินค้าแล้ว"],
        )
        self.assertEqual(
            payload["status_history"][2]["changed_at"],
            "2026-10-25T11:00:00",
        )
        self.assertEqual(
            payload["status_history"][3]["changed_at"],
            "2026-10-25T12:00:00",
        )

        other_user_response = self.client.get(
            "/api/orders/order-b/status",
            headers={"X-Test-User": "customer-a"},
        )
        self.assertEqual(other_user_response.status_code, 404)


if __name__ == "__main__":
    unittest.main()
