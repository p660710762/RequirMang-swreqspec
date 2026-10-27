"""Placeholder seed records for the Menu Management admin view.

References: FR-42, FR-43, FR-44, FR-49, NFR-REL-08, NFR-REL-09.
"""

from datetime import datetime, timezone

from backend.app.config import MENU_STATUS_OPEN, MENU_STATUS_SOLD_OUT
from backend.app.models import MenuHistory, MenuItem, OrderSnapshot, Promotion


def seed_menu_data() -> dict[str, list[dict]]:
    """FR-42: provide placeholder menu and related records for admin review."""
    now = datetime.now(timezone.utc)
    menu_item = MenuItem(
        menu_id=1,
        name="เมนูตัวอย่าง",
        price=1.0,
        status=MENU_STATUS_OPEN,
        created_at=now,
        updated_at=now,
    )
    promotion = Promotion(
        promotion_id=1,
        menu_id=menu_item.menu_id,
        promotion_name="โปรโมชั่นตัวอย่าง",
        discount_value=1.0,
        is_active=True,
        start_at=now,
        end_at=now,
    )
    history = MenuHistory(
        history_id=1,
        menu_id=menu_item.menu_id,
        old_price=1.0,
        new_price=1.0,
        old_status=MENU_STATUS_OPEN,
        new_status=MENU_STATUS_OPEN,
        updated_by="admin",
        updated_at=now,
    )
    snapshot = OrderSnapshot(
        order_id=1,
        menu_id=menu_item.menu_id,
        snapshot_price=menu_item.price,
        snapshot_name=menu_item.name,
        snapshot_status_at_order=MENU_STATUS_SOLD_OUT,
    )

    return {
        "menu_items": [menu_item.to_dict()],
        "promotions": [promotion.to_dict()],
        "menu_history": [history.to_dict()],
        "order_snapshots": [snapshot.to_dict()],
    }