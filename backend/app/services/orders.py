"""Order-list query operations.

References: FR-19, FR-22, FR-23, NFR-SEC-02, AC-STATUS-01.
"""

import sqlite3


# Supports FR-19, FR-22, FR-23, and NFR-SEC-02 with owner-scoped order summaries and item snapshots.
def list_orders_for_user(
    connection: sqlite3.Connection, user_id: str
) -> list[dict[str, object]]:
    rows = connection.execute(
        """
        SELECT
            o.order_id,
            o.user_id,
            o.created_at,
            confirmed.status_code AS status,
            confirmed.changed_at AS last_updated_at,
            o.total_amount,
            i.order_item_id,
            i.menu_name,
            i.quantity,
            i.unit_price
        FROM orders AS o
        LEFT JOIN order_items AS i ON i.order_id = o.order_id
        LEFT JOIN order_status_history AS confirmed
            ON confirmed.order_id = o.order_id
            AND confirmed.is_confirmed = 1
            AND confirmed.changed_at = (
                SELECT MAX(history.changed_at)
                FROM order_status_history AS history
                WHERE history.order_id = o.order_id
                    AND history.is_confirmed = 1
            )
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC, i.order_item_id
        """,
        (user_id,),
    ).fetchall()
    orders_by_id: dict[str, dict[str, object]] = {}
    for row in rows:
        order = orders_by_id.get(row["order_id"])
        if order is None:
            order = {
                "order_id": row["order_id"],
                "user_id": row["user_id"],
                "created_at": row["created_at"],
                "status": row["status"],
                "last_updated_at": row["last_updated_at"],
                "total_amount": row["total_amount"],
                "items": [],
            }
            orders_by_id[row["order_id"]] = order
        if row["order_item_id"] is not None:
            order["items"].append(
                {
                    "menu_name": row["menu_name"],
                    "quantity": row["quantity"],
                    "unit_price": row["unit_price"],
                }
            )
    return list(orders_by_id.values())


# Supports FR-20, FR-22, NFR-SEC-02, and NFR-REL-03 with owner-scoped order details and confirmed status.
def get_order_detail_for_user(
    connection: sqlite3.Connection, order_id: str, user_id: str
) -> dict[str, object] | None:
    order = connection.execute(
        """
        SELECT
            order_id,
            created_at,
            total_amount,
            last_status_change_at AS last_updated_at
        FROM orders
        WHERE order_id = ? AND user_id = ?
        """,
        (order_id, user_id),
    ).fetchone()
    if order is None:
        return None

    items = connection.execute(
        """
        SELECT
            order_item_id,
            menu_item_id,
            menu_name,
            quantity,
            unit_price,
            line_total
        FROM order_items
        WHERE order_id = ?
        """,
        (order_id,),
    ).fetchall()
    latest_status = connection.execute(
        """
        SELECT status_code, status_name, changed_at
        FROM order_status_history
        WHERE order_id = ? AND is_confirmed = 1
        ORDER BY changed_at DESC
        LIMIT 1
        """,
        (order_id,),
    ).fetchone()

    return {
        **dict(order),
        "items": [dict(item) for item in items],
        "latest_status": dict(latest_status) if latest_status is not None else None,
    }


# Supports FR-21, NFR-REL-03, NFR-SEC-02, and AC-STATUS-07 with an owner-scoped confirmed status history.
def get_order_status_for_user(
    connection: sqlite3.Connection, order_id: str, user_id: str
) -> dict[str, object] | None:
    order = connection.execute(
        "SELECT order_id FROM orders WHERE order_id = ? AND user_id = ?",
        (order_id, user_id),
    ).fetchone()
    if order is None:
        return None

    rows = connection.execute(
        """
        SELECT status_code, status_name, changed_at
        FROM order_status_history
        WHERE order_id = ? AND is_confirmed = 1
        ORDER BY changed_at ASC
        """,
        (order_id,),
    ).fetchall()
    history = [dict(row) for row in rows]
    latest = history[-1] if history else None

    return {
        "order_id": order_id,
        "current_status": latest["status_code"] if latest is not None else None,
        "latest_status_time": latest["changed_at"] if latest is not None else None,
        "status_history": history,
    }
