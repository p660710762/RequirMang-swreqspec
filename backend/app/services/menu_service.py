"""In-memory menu service for the Menu Management API.

References: FR-42, FR-43, FR-44, FR-45, FR-46, FR-47.
"""

from datetime import datetime, timezone
from typing import Any

from backend.app.config import MENU_STATUS_OPEN, MENU_STATUS_SOLD_OUT, required_menu_fields
from backend.app.models import MenuItem
from backend.app.seed import seed_menu_data


MENU_STORE: list[dict[str, Any]] = [
    dict(item) for item in seed_menu_data()["menu_items"]
]


def _validate_menu_fields(payload: dict[str, Any]) -> None:
    """FR-43, FR-46: require name, price, and status before saving."""
    missing = [field for field in required_menu_fields if payload.get(field) in (None, "")]
    if missing:
        raise ValueError(f"Missing required menu fields: {', '.join(missing)}")
    if payload["status"] not in {MENU_STATUS_OPEN, MENU_STATUS_SOLD_OUT}:
        raise ValueError("Menu status must be either 'open' or 'sold_out'")
    try:
        payload["price"] = float(payload["price"])
    except (TypeError, ValueError) as exc:
        raise ValueError("Menu price must be numeric") from exc
    if payload["price"] <= 0:
        raise ValueError("Menu price must be greater than 0")
    promotion = payload.get("promotion")
    if promotion is not None:
        if not isinstance(promotion, dict):
            raise ValueError("Menu promotion must be an object")
        discount = promotion.get("discount_value")
        if discount is not None:
            try:
                discount = float(discount)
            except (TypeError, ValueError) as exc:
                raise ValueError("Promotion discount must be numeric") from exc
            if discount < 0:
                raise ValueError("Promotion discount must not be negative")
            if discount > payload["price"]:
                raise ValueError("Promotion discount must not exceed menu price")


def list_menu_items() -> list[dict[str, Any]]:
    """FR-42: return current menu records for the admin list."""
    return [dict(item) for item in MENU_STORE]


def create_menu_item(payload: dict[str, Any]) -> dict[str, Any]:
    """FR-43, FR-46, FR-47: validate and save a new menu record."""
    _validate_menu_fields(payload)
    now = datetime.now(timezone.utc)
    menu_id = max((item["menu_id"] for item in MENU_STORE), default=0) + 1
    item = MenuItem(
        menu_id=menu_id,
        name=payload["name"],
        price=payload["price"],
        status=payload["status"],
        description=payload.get("description"),
        image_url=payload.get("image_url"),
        created_at=now,
        updated_at=now,
    ).to_dict()
    MENU_STORE.append(item)
    return dict(item)


def update_menu_item(menu_id: int, changes: dict[str, Any]) -> dict[str, Any]:
    """FR-44, FR-47: validate and persist menu and promotion updates."""
    for item in MENU_STORE:
        if item["menu_id"] == menu_id:
            updated = dict(item)
            updated.update(changes)
            _validate_menu_fields(updated)
            if "promotion" in changes:
                if changes["promotion"] is not None and not isinstance(changes["promotion"], dict):
                    raise ValueError("Menu promotion must be an object")
                updated["promotion"] = (
                    dict(changes["promotion"]) if changes["promotion"] is not None else None
                )
            updated["updated_at"] = datetime.now(timezone.utc)
            item.update(updated)
            return dict(item)
    raise ValueError(f"Menu item {menu_id} not found")