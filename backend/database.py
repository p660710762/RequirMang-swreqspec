"""SQLite schema and connection helpers for order status tracking."""

import sqlite3
from pathlib import Path


_SCHEMA = """
CREATE TABLE IF NOT EXISTS orders (
    order_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL,
    total_amount NUMERIC NOT NULL,
    last_status_change_at TEXT,
    is_active INTEGER NOT NULL CHECK (is_active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS order_items (
    order_item_id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders (order_id),
    menu_item_id TEXT NOT NULL,
    menu_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC NOT NULL,
    line_total NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS order_status_history (
    status_log_id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders (order_id),
    status_code TEXT NOT NULL,
    status_name TEXT NOT NULL,
    changed_at TEXT NOT NULL,
    is_confirmed INTEGER NOT NULL CHECK (is_confirmed IN (0, 1))
);
"""


# Supports FR-19, FR-20, FR-21, FR-22, FR-23, and NFR-SEC-02 with a relational store.
def connect_database(database_path: str | Path) -> sqlite3.Connection:
    connection = sqlite3.connect(database_path, timeout=10, check_same_thread=False)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA busy_timeout = 10000")
    return connection


# Supports FR-19, FR-20, FR-21, FR-22, FR-23, and NFR-REL-03 with persisted order data.
def initialize_database(connection: sqlite3.Connection) -> None:
    connection.executescript(_SCHEMA)
