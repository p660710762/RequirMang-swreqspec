"""SQLite repository for Order draft and item flows (FR-06 to FR-10, FR-12)."""

from contextlib import contextmanager
from datetime import date, datetime, timezone
from decimal import Decimal
import json
import os
from pathlib import Path
import sqlite3
from types import SimpleNamespace
from typing import Iterator

from .order_service import MenuItemRecord, OrderDraftNotFoundError


DEFAULT_ORDER_DATABASE_PATH = Path(__file__).resolve().parents[2] / "orders.sqlite3"


class OrderNumberExhaustedError(Exception):
    """The daily order number range has been exhausted."""


class SqliteOrderRepository:
    """Persist Order drafts and items for FR-06 to FR-10 and FR-12."""

    def __init__(self, database_path: str | Path | None = None) -> None:
        configured_path = database_path or os.environ.get(
            "ORDER_DATABASE_PATH", DEFAULT_ORDER_DATABASE_PATH
        )
        self._database_path = Path(configured_path)
        self._database_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize_database()

    @contextmanager
    def _connection(self, *, immediate: bool = False) -> Iterator[sqlite3.Connection]:
        connection = sqlite3.connect(self._database_path, timeout=30)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        try:
            if immediate:
                connection.execute("BEGIN IMMEDIATE")
            yield connection
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def _initialize_database(self) -> None:
        with self._connection() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS menu_items (
                    menu_id INTEGER PRIMARY KEY
                );
                CREATE TABLE IF NOT EXISTS orders (
                    order_date TEXT NOT NULL,
                    order_id TEXT NOT NULL CHECK (
                        length(order_id) = 3
                        AND order_id GLOB '[0-9][0-9][0-9]'
                        AND order_id != '000'
                    ),
                    status TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    total_amount TEXT NOT NULL,
                    paid_at TEXT,
                    payment_status TEXT NOT NULL CHECK (
                        payment_status IN ('pending', 'success', 'failed', 'timeout')
                    ),
                    PRIMARY KEY (order_date, order_id)
                );
                CREATE TABLE IF NOT EXISTS order_items (
                    order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    order_date TEXT NOT NULL,
                    order_id TEXT NOT NULL,
                    menu_item_id INTEGER NOT NULL REFERENCES menu_items(menu_id),
                    name TEXT NOT NULL,
                    quantity INTEGER NOT NULL CHECK (quantity > 0),
                    unit_price TEXT NOT NULL,
                    line_total TEXT NOT NULL,
                    FOREIGN KEY (order_date, order_id)
                        REFERENCES orders(order_date, order_id)
                );
                CREATE TABLE IF NOT EXISTS order_options (
                    order_item_id INTEGER PRIMARY KEY REFERENCES order_items(order_item_id),
                    sweetness_level TEXT NOT NULL CHECK (
                        sweetness_level IN ('หวานปกติ 75%', 'หวานน้อย 50%', 'เพิ่มหวาน 100%', 'ไม่หวาน')
                    ),
                    toppings TEXT,
                    ice_level TEXT NOT NULL CHECK (
                        ice_level IN (
                            'น้ำแข็งน้อย (ปริมาณน้ำเท่าเดิม)',
                            'ไม่ใส่น้ำแข็ง',
                            'แยกน้ำแข็ง',
                            'ใส่น้ำแข็งปริมาณปกติ'
                        )
                    )
                );
                """
            )

    def create_draft(self) -> SimpleNamespace:
        order_date = date.today()
        date_key = order_date.isoformat()
        with self._connection(immediate=True) as connection:
            latest = connection.execute(
                """
                SELECT MAX(CAST(order_id AS INTEGER))
                FROM orders
                WHERE order_date = ?
                """,
                (date_key,),
            ).fetchone()[0]
            next_order_number = (latest or 0) + 1
            if next_order_number > 999:
                raise OrderNumberExhaustedError

            order_id = f"{next_order_number:03}"
            connection.execute(
                """
                INSERT INTO orders (
                    order_date, order_id, status, created_at, total_amount, payment_status
                )
                VALUES (?, ?, 'draft', ?, '0', 'pending')
                """,
                (date_key, order_id, datetime.now(timezone.utc).isoformat()),
            )

        return SimpleNamespace(order_date=order_date, order_id=order_id)

    def add_item_to_draft(
        self,
        order_date: date,
        order_id: str,
        menu_item: MenuItemRecord,
        quantity: int,
    ) -> SimpleNamespace:
        with self._connection(immediate=True) as connection:
            order = self._get_draft(connection, order_date, order_id)
            if order is None:
                raise OrderDraftNotFoundError
            menu_id = menu_item.menu_id
            connection.execute(
                "INSERT OR IGNORE INTO menu_items (menu_id) VALUES (?)",
                (menu_id,),
            )
            result = connection.execute(
                """
                INSERT INTO order_items (
                    order_date, order_id, menu_item_id, name, quantity, unit_price, line_total
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    order_date.isoformat(),
                    order_id,
                    menu_id,
                    menu_item.name,
                    quantity,
                    str(menu_item.price),
                    str(menu_item.price * quantity),
                ),
            )
            item_id = result.lastrowid
            self._refresh_total(connection, order_date, order_id)

        return SimpleNamespace(
            order_item_id=item_id,
            order_date=order_date,
            order_id=order_id,
            menu_item_id=menu_id,
            quantity=quantity,
        )

    def save_item_options(
        self,
        order_item_id: int,
        sweetness_level: str,
        toppings: list[str] | None,
        ice_level: str,
    ) -> SimpleNamespace:
        with self._connection(immediate=True) as connection:
            item = connection.execute(
                """
                SELECT i.order_date, i.order_id
                FROM order_items AS i
                JOIN orders AS o
                  ON o.order_date = i.order_date AND o.order_id = i.order_id
                WHERE i.order_item_id = ? AND o.status = 'draft'
                """,
                (order_item_id,),
            ).fetchone()
            if item is None:
                raise OrderDraftNotFoundError

            connection.execute(
                """
                INSERT INTO order_options (order_item_id, sweetness_level, toppings, ice_level)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(order_item_id) DO UPDATE SET
                    sweetness_level = excluded.sweetness_level,
                    toppings = excluded.toppings,
                    ice_level = excluded.ice_level
                """,
                (
                    order_item_id,
                    sweetness_level,
                    None if toppings is None else json.dumps(toppings, ensure_ascii=False),
                    ice_level,
                ),
            )

        return SimpleNamespace(
            order_item_id=order_item_id,
            sweetness_level=sweetness_level,
            toppings=toppings,
            ice_level=ice_level,
        )

    def get_order_summary(
        self, order_date: date, order_id: str
    ) -> SimpleNamespace | None:
        with self._connection() as connection:
            if self._get_order(connection, order_date, order_id) is None:
                return None

            rows = connection.execute(
                """
                SELECT order_item_id, menu_item_id, name, quantity, unit_price, line_total
                FROM order_items
                WHERE order_date = ? AND order_id = ?
                ORDER BY order_item_id
                """,
                (order_date.isoformat(), order_id),
            ).fetchall()

        items = [
            SimpleNamespace(
                order_item_id=row["order_item_id"],
                menu_item_id=row["menu_item_id"],
                name=row["name"],
                quantity=row["quantity"],
                unit_price=Decimal(row["unit_price"]),
                line_total=Decimal(row["line_total"]),
            )
            for row in rows
        ]
        return SimpleNamespace(
            items=items,
            total_amount=sum((item.line_total for item in items), Decimal("0")),
        )

    def get_order_options(
        self, order_date: date, order_id: str
    ) -> list[SimpleNamespace] | None:
        with self._connection() as connection:
            if self._get_order(connection, order_date, order_id) is None:
                return None

            rows = connection.execute(
                """
                SELECT options.order_item_id, options.sweetness_level, options.toppings,
                       options.ice_level
                FROM order_options AS options
                JOIN order_items AS items USING (order_item_id)
                WHERE items.order_date = ? AND items.order_id = ?
                ORDER BY options.order_item_id
                """,
                (order_date.isoformat(), order_id),
            ).fetchall()

        return [
            SimpleNamespace(
                order_item_id=row["order_item_id"],
                sweetness_level=row["sweetness_level"],
                toppings=None if row["toppings"] is None else json.loads(row["toppings"]),
                ice_level=row["ice_level"],
            )
            for row in rows
        ]

    def prepare_payment(self, order_date: date, order_id: str) -> SimpleNamespace:
        with self._connection(immediate=True) as connection:
            order = self._get_draft(connection, order_date, order_id)
            if order is None:
                raise OrderDraftNotFoundError
            connection.execute(
                """
                UPDATE orders SET status = 'payment_pending', payment_status = 'pending'
                WHERE order_date = ? AND order_id = ?
                """,
                (order_date.isoformat(), order_id),
            )

        return SimpleNamespace(
            order_date=order_date,
            order_id=order_id,
            payment_status="pending",
        )

    def update_item(
        self,
        order_item_id: int,
        quantity: int | None,
        sweetness_level: str | None,
        toppings: list[str] | None,
        ice_level: str | None,
    ) -> SimpleNamespace:
        with self._connection(immediate=True) as connection:
            item = connection.execute(
                """
                SELECT i.*, o.status
                FROM order_items AS i
                JOIN orders AS o
                  ON o.order_date = i.order_date AND o.order_id = i.order_id
                WHERE i.order_item_id = ?
                """,
                (order_item_id,),
            ).fetchone()
            if item is None or item["status"] != "draft":
                raise OrderDraftNotFoundError

            order_date = date.fromisoformat(item["order_date"])
            order_id = item["order_id"]
            if quantity == 0:
                connection.execute(
                    "DELETE FROM order_options WHERE order_item_id = ?",
                    (order_item_id,),
                )
                connection.execute(
                    "DELETE FROM order_items WHERE order_item_id = ?",
                    (order_item_id,),
                )
                updated_item = None
                option = None
            else:
                if quantity is not None:
                    line_total = Decimal(item["unit_price"]) * quantity
                    connection.execute(
                        """
                        UPDATE order_items SET quantity = ?, line_total = ?
                        WHERE order_item_id = ?
                        """,
                        (quantity, str(line_total), order_item_id),
                    )

                option = connection.execute(
                    "SELECT * FROM order_options WHERE order_item_id = ?",
                    (order_item_id,),
                ).fetchone()
                if option is None:
                    option_values = {
                        "sweetness_level": sweetness_level,
                        "toppings": toppings,
                        "ice_level": ice_level,
                    }
                    if any(value is not None for value in option_values.values()):
                        connection.execute(
                            """
                            INSERT INTO order_options (
                                order_item_id, sweetness_level, toppings, ice_level
                            )
                            VALUES (?, ?, ?, ?)
                            """,
                            (
                                order_item_id,
                                sweetness_level or "",
                                (
                                    None
                                    if toppings is None
                                    else json.dumps(toppings, ensure_ascii=False)
                                ),
                                ice_level or "ใส่น้ำแข็งปริมาณปกติ",
                            ),
                        )
                else:
                    connection.execute(
                        """
                        UPDATE order_options SET
                            sweetness_level = ?,
                            toppings = ?,
                            ice_level = ?
                        WHERE order_item_id = ?
                        """,
                        (
                            sweetness_level or option["sweetness_level"],
                            (
                                json.dumps(toppings, ensure_ascii=False)
                                if toppings is not None
                                else option["toppings"]
                            ),
                            ice_level or option["ice_level"],
                            order_item_id,
                        ),
                    )

                updated_row = connection.execute(
                    "SELECT * FROM order_items WHERE order_item_id = ?",
                    (order_item_id,),
                ).fetchone()
                updated_item = _item_record(updated_row)
                option = connection.execute(
                    "SELECT * FROM order_options WHERE order_item_id = ?",
                    (order_item_id,),
                ).fetchone()

            total_amount = self._refresh_total(connection, order_date, order_id)

        return SimpleNamespace(
            item=updated_item,
            sweetness_level=None if option is None else option["sweetness_level"],
            toppings=(
                None
                if option is None or option["toppings"] is None
                else json.loads(option["toppings"])
            ),
            ice_level=None if option is None else option["ice_level"],
            total_amount=total_amount,
        )

    @staticmethod
    def _get_order(
        connection: sqlite3.Connection, order_date: date, order_id: str
    ) -> sqlite3.Row | None:
        return connection.execute(
            "SELECT * FROM orders WHERE order_date = ? AND order_id = ?",
            (order_date.isoformat(), order_id),
        ).fetchone()

    @classmethod
    def _get_draft(
        cls, connection: sqlite3.Connection, order_date: date, order_id: str
    ) -> sqlite3.Row | None:
        order = cls._get_order(connection, order_date, order_id)
        return order if order is not None and order["status"] == "draft" else None

    @staticmethod
    def _refresh_total(
        connection: sqlite3.Connection, order_date: date, order_id: str
    ) -> Decimal:
        total = sum(
            (
                Decimal(row["line_total"])
                for row in connection.execute(
                    """
                    SELECT line_total FROM order_items
                    WHERE order_date = ? AND order_id = ?
                    """,
                    (order_date.isoformat(), order_id),
                ).fetchall()
            ),
            Decimal("0"),
        )
        connection.execute(
            "UPDATE orders SET total_amount = ? WHERE order_date = ? AND order_id = ?",
            (str(total), order_date.isoformat(), order_id),
        )
        return total


def _item_record(row: sqlite3.Row) -> SimpleNamespace:
    return SimpleNamespace(
        order_item_id=row["order_item_id"],
        order_date=date.fromisoformat(row["order_date"]),
        order_id=row["order_id"],
        menu_item_id=row["menu_item_id"],
        quantity=row["quantity"],
        name=row["name"],
        unit_price=Decimal(row["unit_price"]),
        line_total=Decimal(row["line_total"]),
    )
