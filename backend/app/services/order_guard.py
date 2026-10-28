"""Guard logic for customer ordering against sold-out menu items.

References: FR-45, FR-48, AC-MENU-MGMT-07, AC-MENU-MGMT-10.
"""

from ..config import MENU_STATUS_OPEN


def is_menu_orderable(menu_status: str | None) -> bool:
    """Return True only for the supported open-for-sale status."""
    return menu_status == MENU_STATUS_OPEN


def ensure_menu_is_orderable(menu_status: str | None) -> None:
    """Raise when the menu state blocks customer ordering."""
    if not is_menu_orderable(menu_status):
        raise ValueError("Menu item is not available for ordering")
