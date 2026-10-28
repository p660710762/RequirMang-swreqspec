"""Menu status updates for the Admin API.

References: FR-45, FR-48, ASM-03, ASM-12.
"""

from typing import Any

from ..config import MENU_STATUS_OPEN, MENU_STATUS_SOLD_OUT
from .menu_service import set_menu_status


def update_menu_status(menu_id: int, status: str) -> dict[str, Any]:
    """FR-45, FR-48: persist only the supported menu statuses."""
    if status not in {MENU_STATUS_OPEN, MENU_STATUS_SOLD_OUT}:
        raise ValueError("Menu status must be either 'open' or 'sold_out'")

    return set_menu_status(menu_id, status)
