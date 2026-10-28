"""In-memory service for the Staff Order prototype.

References: FR-29 and the constraints for current, authorized order data
available within the previous seven days.
"""

from datetime import datetime, timedelta, timezone
from typing import Any

from backend.app.config import STAFF_ORDER_RETENTION_DAYS


STAFF_ORDER_STORE: list[dict[str, Any]] = []


def list_staff_orders() -> list[dict[str, Any]]:
    """FR-29: return current Staff-visible orders within the allowed history."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=STAFF_ORDER_RETENTION_DAYS)
    current_orders = [
        (index, order)
        for index, order in enumerate(STAFF_ORDER_STORE)
        if order["created_at"] >= cutoff
    ]
    chronological_orders = sorted(
        current_orders,
        key=lambda item: (item[1]["created_at"], str(item[1]["order_id"])),
    )
    sequence_by_index = {
        store_index: sequence_no
        for sequence_no, (store_index, _) in enumerate(chronological_orders, start=1)
    }

    return [
        {
            **order,
            "order_number": order["order_id"],
            "sequence_no": sequence_by_index[store_index],
        }
        for store_index, order in current_orders
    ]


def get_staff_order_details(order_id: str) -> dict[str, Any] | None:
    """FR-31: return the persisted drink items, quantities, and options for one current order."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=STAFF_ORDER_RETENTION_DAYS)
    order = next(
        (
            order
            for order in STAFF_ORDER_STORE
            if str(order["order_id"]) == order_id and order["created_at"] >= cutoff
        ),
        None,
    )
    if order is None:
        return None

    return {
        "order_id": order["order_id"],
        "items": [
            {
                "order_item_id": item["order_item_id"],
                "menu_item_name": item["menu_item_name"],
                "quantity": item["quantity"],
                "selected_options": list(item["selected_options"]),
            }
            for item in order["items"]
        ],
    }
