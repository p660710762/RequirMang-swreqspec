"""Order-list API with development/test-only mock identity.

References: FR-19, NFR-SEC-02, AC-STATUS-01.
"""

import os
import sqlite3
from threading import Lock
from collections.abc import Iterator

from fastapi import APIRouter, Depends, Header, HTTPException

from backend.app.services.orders import (
    get_order_detail_for_user,
    get_order_status_for_user,
    list_orders_for_user,
)
from backend.database import connect_database, initialize_database


MOCK_USERS: dict[str, dict[str, str]] = {
    "customer-a": {"user_id": "sample-user"},
    "customer-b": {"user_id": "sample-user-2"},
}

# Development/test fixtures only; this mock identity mechanism must never authenticate production requests.
router = APIRouter(prefix="/api/orders", tags=["orders"])
_INITIALIZED_DATABASES: set[str] = set()
_DATABASE_INIT_LOCK = Lock()


# Supports NFR-SEC-02 by resolving an allowlisted test identity only outside production.
def get_mock_order_user(
    x_test_user: str | None = Header(default=None, alias="X-Test-User"),
) -> dict[str, str]:
    environment = os.environ.get("APP_ENV")
    if environment not in {"development", "test"}:
        raise HTTPException(status_code=401, detail="Mock authentication is disabled")
    if x_test_user not in MOCK_USERS:
        raise HTTPException(status_code=401, detail="Test user is not recognized")
    return MOCK_USERS[x_test_user]


# Supports FR-19 by providing a configured relational database connection for the request.
def get_order_database() -> Iterator[sqlite3.Connection]:
    database_path = os.environ.get("ORDER_DATABASE_PATH")
    if not database_path:
        raise HTTPException(status_code=503, detail="Order database is not configured")

    connection = connect_database(database_path)
    try:
        with _DATABASE_INIT_LOCK:
            if database_path not in _INITIALIZED_DATABASES:
                initialize_database(connection)
                _INITIALIZED_DATABASES.add(database_path)
        yield connection
    finally:
        connection.close()


# Supports FR-19, FR-22, and NFR-SEC-02 by returning the user's orders and their saved item summaries.
@router.get("")
def get_orders(
    user: dict[str, str] = Depends(get_mock_order_user),
    connection: sqlite3.Connection = Depends(get_order_database),
) -> list[dict[str, object]]:
    return list_orders_for_user(connection, user["user_id"])


# Supports FR-20 and NFR-SEC-02 by returning only details owned by the mock-authenticated user.
@router.get("/{order_id}")
def get_order_detail(
    order_id: str,
    user: dict[str, str] = Depends(get_mock_order_user),
    connection: sqlite3.Connection = Depends(get_order_database),
) -> dict[str, object]:
    order = get_order_detail_for_user(connection, order_id, user["user_id"])
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# Supports FR-21, NFR-REL-03, NFR-SEC-02, and AC-STATUS-07 by reloading only the owner's confirmed status.
@router.post("/{order_id}/status/refresh")
def refresh_order_status(
    order_id: str,
    user: dict[str, str] = Depends(get_mock_order_user),
    connection: sqlite3.Connection = Depends(get_order_database),
) -> dict[str, object]:
    try:
        status = get_order_status_for_user(connection, order_id, user["user_id"])
    except sqlite3.Error as error:
        raise HTTPException(
            status_code=503,
            detail="Unable to load confirmed order status",
        ) from error
    if status is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return status


# Supports FR-21, NFR-REL-03, and NFR-SEC-02 by exposing only an owner's confirmed status history.
@router.get("/{order_id}/status")
def get_order_status(
    order_id: str,
    user: dict[str, str] = Depends(get_mock_order_user),
    connection: sqlite3.Connection = Depends(get_order_database),
) -> dict[str, object]:
    status = get_order_status_for_user(connection, order_id, user["user_id"])
    if status is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return status
