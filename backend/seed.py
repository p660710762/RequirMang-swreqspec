"""Sample order data for local development and verification."""

import sqlite3


# Supports FR-19, FR-20, FR-21, FR-22, and FR-23 with persisted sample orders.
def seed_order_data(connection: sqlite3.Connection) -> None:
    with connection:
        connection.executemany(
            """
            INSERT OR IGNORE INTO orders (
                order_id, user_id, created_at, status, total_amount,
                last_status_change_at, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    "sample-order-older",
                    "sample-user",
                    "2026-10-25T09:00:00",
                    "PENDING_ACCEPT",
                    50,
                    "2026-10-25T09:00:00",
                    1,
                ),
                (
                    "sample-order-newer",
                    "sample-user",
                    "2026-10-26T09:00:00",
                    "PREPARING",
                    75,
                    "2026-10-26T09:05:00",
                    1,
                ),
            ],
        )
        connection.executemany(
            """
            INSERT OR IGNORE INTO order_items (
                order_item_id, order_id, menu_item_id, menu_name,
                quantity, unit_price, line_total
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            [
                ("sample-item-older", "sample-order-older", "sample-menu-1", "รายการตัวอย่าง 1", 1, 50, 50),
                ("sample-item-newer", "sample-order-newer", "sample-menu-2", "รายการตัวอย่าง 2", 1, 75, 75),
            ],
        )
        connection.executemany(
            """
            INSERT OR IGNORE INTO order_status_history (
                status_log_id, order_id, status_code, status_name,
                changed_at, is_confirmed
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    "sample-status-older",
                    "sample-order-older",
                    "PENDING_ACCEPT",
                    "รอรับ Order",
                    "2026-10-25T09:00:00",
                    1,
                ),
                (
                    "sample-status-newer",
                    "sample-order-newer",
                    "PREPARING",
                    "กำลังเตรียม",
                    "2026-10-26T09:05:00",
                    1,
                ),
            ],
        )
