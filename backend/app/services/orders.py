"""Order-list query operations.

References: FR-19, NFR-SEC-02, AC-STATUS-01.
"""

import sqlite3


# Supports FR-19 and NFR-SEC-02 by filtering persisted orders using the authenticated user ID.
def list_orders_for_user(
    connection: sqlite3.Connection, user_id: str
) -> list[dict[str, object]]:
    rows = connection.execute(
        """
        SELECT
            order_id,
            user_id,
            created_at,
            status,
            last_status_change_at AS last_updated_at,
            total_amount
        FROM orders
        WHERE user_id = ?
        """,
        (user_id,),
    ).fetchall()
    return [dict(row) for row in rows]
