import os
import tempfile
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.routes.orders import MOCK_USERS
from backend.database import connect_database, initialize_database


class TestOrderListMockAuthentication(unittest.TestCase):
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
        self.assertEqual(
            len({identity["user_id"] for identity in MOCK_USERS.values()}),
            len(MOCK_USERS),
        )
        for test_user, identity in MOCK_USERS.items():
            response = self.client.get(
                "/api/orders",
                headers={"X-Test-User": test_user},
            )

            self.assertEqual(response.status_code, 200)
            self.assertEqual(
                {order["order_id"] for order in response.json()},
                {"order-a"} if identity["user_id"] == "sample-user" else {"order-b"},
            )
            self.assertTrue(
                all(order["user_id"] == identity["user_id"] for order in response.json())
            )

    def test_AC_STATUS_09_show_only_authorized_orders(self):
        response = self.client.request(
            "GET",
            "/api/orders?user_id=sample-user-2",
            headers={"X-Test-User": "customer-a"},
            json={"user_id": "sample-user-2"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [order["order_id"] for order in response.json()],
            ["order-a"],
        )

    def test_mock_auth_is_disabled_outside_development_and_test(self):
        with patch.dict(os.environ, {"APP_ENV": "production"}):
            response = self.client.get(
                "/api/orders",
                headers={"X-Test-User": "customer-a"},
            )

        self.assertEqual(response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
