"""Menu status updates for the Admin API.

References: FR-45, FR-48, ASM-03, ASM-12.
"""

from typing import Any

from backend.app.config import MENU_STATUS_OPEN, MENU_STATUS_SOLD_OUT
from backend.app.services.menu_service import MENU_STORE


def update_menu_status(menu_id: int, status: str) -> dict[str, Any]:
    """FR-45, FR-48: persist only the supported menu statuses."""
    if status not in {MENU_STATUS_OPEN, MENU_STATUS_SOLD_OUT}:
        raise ValueError("Menu status must be either 'open' or 'sold_out'")

    for item in MENU_STORE:
        if item["menu_id"] == menu_id:
            item["status"] = status
            return dict(item)
    raise ValueError(f"Menu item {menu_id} not found")
