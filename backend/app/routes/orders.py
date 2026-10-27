"""Order-list API with development/test-only mock identity.

References: FR-19, NFR-SEC-02, AC-STATUS-01.
"""

import os
import sqlite3
from collections.abc import Iterator

from fastapi import APIRouter, Depends, Header, HTTPException

from backend.app.services.orders import list_orders_for_user
from backend.database import connect_database, initialize_database


MOCK_USERS: dict[str, dict[str, str]] = {
    "customer-a": {"user_id": "sample-user"},
    "customer-b": {"user_id": "sample-user-2"},
}

# Development/test fixtures only; this mock identity mechanism must never authenticate production requests.
router = APIRouter(prefix="/api/orders", tags=["orders"])


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
        initialize_database(connection)
        yield connection
    finally:
        connection.close()


# Supports FR-19 and NFR-SEC-02 by returning only orders belonging to the mock-authenticated user.
@router.get("")
def get_orders(
    user: dict[str, str] = Depends(get_mock_order_user),
    connection: sqlite3.Connection = Depends(get_order_database),
) -> list[dict[str, object]]:
    return list_orders_for_user(connection, user["user_id"])
