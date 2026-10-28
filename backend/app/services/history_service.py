"""Menu history and order snapshot retention for legacy orders.

References: FR-49, NFR-REL-08, NFR-REL-09, AC-MENU-MGMT-08, AC-MENU-MGMT-14.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

MENU_HISTORY_STORE: list[dict[str, Any]] = []
ORDER_SNAPSHOT_STORE: list[dict[str, Any]] = []


def _next_history_id() -> int:
    return max((entry.get("history_id", 0) for entry in MENU_HISTORY_STORE), default=0) + 1


def record_menu_history(
    menu_id: int,
    *,
    old_price: float | int,
    new_price: float | int,
    old_status: str,
    new_status: str,
    updated_by: str = "admin",
    updated_at: datetime | None = None,
) -> dict[str, Any]:
    """Persist a minimal historical record of menu changes for audit and rollback.

    The store intentionally keeps only the minimum fields needed to protect older
    orders and is kept in memory because the feature scope excludes a dedicated
    API for order history retrieval.
    """
    timestamp = updated_at or datetime.now(timezone.utc)
    history_entry = {
        "history_id": _next_history_id(),
        "menu_id": menu_id,
        "old_price": float(old_price),
        "new_price": float(new_price),
        "old_status": old_status,
        "new_status": new_status,
        "updated_by": updated_by,
        "updated_at": timestamp.isoformat(),
    }
    MENU_HISTORY_STORE.append(history_entry)
    return history_entry


def create_order_snapshot(
    order_id: int | str,
    menu_id: int,
    *,
    snapshot_name: str,
    snapshot_price: float | int,
    snapshot_status_at_order: str,
) -> dict[str, Any]:
    """Retain the menu values used at the moment an order was created."""
    snapshot = {
        "order_id": order_id,
        "menu_id": menu_id,
        "snapshot_name": snapshot_name,
        "snapshot_price": float(snapshot_price),
        "snapshot_status_at_order": snapshot_status_at_order,
    }
    ORDER_SNAPSHOT_STORE.append(snapshot)
    return snapshot


def get_menu_history(menu_id: int | None = None) -> list[dict[str, Any]]:
    if menu_id is None:
        return list(MENU_HISTORY_STORE)
    return [entry for entry in MENU_HISTORY_STORE if entry.get("menu_id") == menu_id]


def get_order_snapshots(menu_id: int | None = None, order_id: int | str | None = None) -> list[dict[str, Any]]:
    rows = list(ORDER_SNAPSHOT_STORE)
    if menu_id is not None:
        rows = [entry for entry in rows if entry.get("menu_id") == menu_id]
    if order_id is not None:
        rows = [entry for entry in rows if entry.get("order_id") == order_id]
    return rows
