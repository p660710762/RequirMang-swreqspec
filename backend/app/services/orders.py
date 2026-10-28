"""Order-list query operations.

References: FR-19, FR-22, FR-23, NFR-SEC-02, AC-STATUS-01.
"""

import sqlite3

ORDER_STATUS_LABELS = {
    "PENDING_ACCEPT": "รอรับ Order",
    "PREPARING": "กำลังเตรียม",
    "READY_FOR_PICKUP": "พร้อมรับสินค้า",
    "PICKED_UP": "รับสินค้าแล้ว",
}


# Supports FR-19, FR-22, FR-23, and NFR-SEC-02 with owner-scoped order summaries and item snapshots.
def list_orders_for_user(
    connection: sqlite3.Connection, user_id: str
) -> list[dict[str, object]]:
    order_columns = {
        row["name"] for row in connection.execute("PRAGMA table_info(orders)")
    }
    if "order_date" in order_columns:
        return _list_application_orders(connection, user_id)

    rows = connection.execute(
        """
        SELECT
            o.order_id,
            o.user_id,
            o.created_at,
            o.status,
            o.last_status_change_at AS last_updated_at,
            o.total_amount,
            i.order_item_id,
            i.menu_name,
            i.quantity,
            i.unit_price
        FROM orders AS o
        LEFT JOIN order_items AS i ON i.order_id = o.order_id
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


def _list_application_orders(
    connection: sqlite3.Connection, user_id: str
) -> list[dict[str, object]]:
    rows = connection.execute(
        """
        SELECT
            o.order_id,
            o.order_date,
            o.owner_user_id AS user_id,
            o.created_at,
            o.status,
            o.total_amount,
            i.order_item_id,
            m.name AS menu_name,
            i.quantity,
            i.unit_price
        FROM orders AS o
        LEFT JOIN order_items AS i
            ON i.order_date = o.order_date AND i.order_id = o.order_id
        LEFT JOIN menu_items AS m ON m.menu_id = i.menu_item_id
        WHERE o.owner_user_id = ?
            AND o.payment_status = 'success'
            AND o.status IN (?, ?, ?, ?)
        ORDER BY o.created_at DESC, i.order_item_id
        """,
        (user_id, *ORDER_STATUS_LABELS),
    ).fetchall()
    orders_by_id: dict[tuple[str, str], dict[str, object]] = {}
    for row in rows:
        order_key = (row["order_date"], row["order_id"])
        order = orders_by_id.get(order_key)
        if order is None:
            order = {
                "order_id": row["order_id"],
                "order_date": row["order_date"],
                "user_id": row["user_id"],
                "created_at": row["created_at"],
                "status": row["status"],
                "last_updated_at": None,
                "total_amount": row["total_amount"],
                "items": [],
            }
            orders_by_id[order_key] = order
        if row["order_item_id"] is not None:
            order["items"].append(
                {
                    "menu_name": row["menu_name"] or "รายการสินค้า",
                    "quantity": row["quantity"],
                    "unit_price": row["unit_price"],
                }
            )
    return list(orders_by_id.values())


# Supports FR-20, FR-22, NFR-SEC-02, and NFR-REL-03 with owner-scoped order details and confirmed status.
def get_order_detail_for_user(
    connection: sqlite3.Connection,
    order_id: str,
    user_id: str,
    order_date: str | None = None,
) -> dict[str, object] | None:
    order_columns = {
        row["name"] for row in connection.execute("PRAGMA table_info(orders)")
    }
    if "order_date" in order_columns:
        order = connection.execute(
            """
            SELECT order_date, order_id, created_at, total_amount, status,
                   last_status_change_at
            FROM orders
            WHERE order_id = ? AND owner_user_id = ?
                AND payment_status = 'success'
                AND status IN (?, ?, ?, ?)
                AND (? IS NULL OR order_date = ?)
            ORDER BY order_date DESC
            LIMIT 1
            """,
            (
                order_id,
                user_id,
                *ORDER_STATUS_LABELS,
                order_date,
                order_date,
            ),
        ).fetchone()
        if order is None:
            return None

        items = connection.execute(
            """
            SELECT i.order_item_id, i.menu_item_id, m.name AS menu_name,
                   i.quantity, i.unit_price, i.line_total
            FROM order_items AS i
            LEFT JOIN menu_items AS m ON m.menu_id = i.menu_item_id
            WHERE i.order_date = ? AND i.order_id = ?
            """,
            (order["order_date"], order_id),
        ).fetchall()
        latest_status = {
            "status_code": order["status"],
            "status_name": ORDER_STATUS_LABELS[order["status"]],
            "changed_at": order["last_status_change_at"],
        }
        return {
            "order_id": order_id,
            "order_date": order["order_date"],
            "created_at": order["created_at"],
            "total_amount": order["total_amount"],
            "last_updated_at": order["last_status_change_at"],
            "items": [
                {
                    **dict(item),
                    "menu_name": item["menu_name"] or "รายการสินค้า",
                }
                for item in items
            ],
            "latest_status": latest_status,
        }

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
    connection: sqlite3.Connection,
    order_id: str,
    user_id: str,
    order_date: str | None = None,
) -> dict[str, object] | None:
    order_columns = {
        row["name"] for row in connection.execute("PRAGMA table_info(orders)")
    }
    if "order_date" in order_columns:
        order = connection.execute(
            """
            SELECT order_id, status, last_status_change_at
            FROM orders
            WHERE order_id = ? AND owner_user_id = ?
                AND payment_status = 'success'
                AND status IN (?, ?, ?, ?)
                AND (? IS NULL OR order_date = ?)
            ORDER BY order_date DESC
            LIMIT 1
            """,
            (
                order_id,
                user_id,
                *ORDER_STATUS_LABELS,
                order_date,
                order_date,
            ),
        ).fetchone()
        if order is None:
            return None
        status = {
            "status_code": order["status"],
            "status_name": ORDER_STATUS_LABELS[order["status"]],
            "changed_at": order["last_status_change_at"],
        }
        return {
            "order_id": order_id,
            "current_status": order["status"],
            "latest_status_time": order["last_status_change_at"],
            "status_history": [status],
        }

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
