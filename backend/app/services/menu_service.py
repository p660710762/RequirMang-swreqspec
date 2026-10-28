"""SQLite-backed menu service shared by the Menu Management and customer APIs.

References: FR-42, FR-43, FR-44, FR-45, FR-46, FR-47.
"""

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select

from ..config import MENU_STATUS_OPEN, MENU_STATUS_SOLD_OUT, required_menu_fields
from ..database import SessionLocal, configure_database
from ..models.menu import MenuItemEntity
from .history_service import create_order_snapshot, get_menu_history, get_order_snapshots, record_menu_history


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
    configure_database()
    with SessionLocal() as session:
        items = session.scalars(
            select(MenuItemEntity).order_by(MenuItemEntity.menu_id)
        ).all()
        return [_to_dict(item) for item in items]


def list_menu_history_and_snapshots() -> dict[str, list[dict[str, Any]]]:
    """FR-49: expose the historical records kept to protect old orders."""
    return {
        "menu_history": get_menu_history(),
        "order_snapshots": get_order_snapshots(),
    }


def create_menu_item(payload: dict[str, Any]) -> dict[str, Any]:
    """FR-43, FR-46, FR-47: validate and save a new menu record."""
    _validate_menu_fields(payload)
    configure_database()
    now = datetime.now(timezone.utc)
    with SessionLocal.begin() as session:
        item = MenuItemEntity(
            name=payload["name"],
            price=payload["price"],
            status=payload["status"],
            description=payload.get("description"),
            image_url=payload.get("image_url"),
            created_at=now,
            updated_at=now,
        )
        session.add(item)
        session.flush()
        return _to_dict(item)


def update_menu_item(menu_id: int, changes: dict[str, Any]) -> dict[str, Any]:
    """FR-44, FR-47: validate and persist menu and promotion updates."""
    configure_database()
    with SessionLocal.begin() as session:
        item = session.get(MenuItemEntity, menu_id)
        if item is None:
            raise ValueError(f"Menu item {menu_id} not found")

        previous_price = float(item.price)
        previous_status = item.status
        updated = _to_dict(item)
        updated.update(changes)
        _validate_menu_fields(updated)
        if "promotion" in changes and changes["promotion"] is not None:
            if not isinstance(changes["promotion"], dict):
                raise ValueError("Menu promotion must be an object")

        for field in ("name", "price", "status", "description", "image_url"):
            if field in changes:
                setattr(item, field, changes[field])
        if "promotion" in changes:
            item.promotion = (
                dict(changes["promotion"]) if changes["promotion"] is not None else None
            )
            item.promotion_price = None
        item.updated_at = datetime.now(timezone.utc)
        session.flush()

        next_price = float(item.price)
        next_status = item.status
        if previous_price != next_price or previous_status != next_status:
            record_menu_history(
                menu_id,
                old_price=previous_price,
                new_price=next_price,
                old_status=previous_status,
                new_status=next_status,
                updated_by="admin",
                updated_at=item.updated_at,
            )
        return _to_dict(item)


def delete_menu_item(menu_id: int) -> dict[str, Any]:
    """FR-49: remove the current menu item while retaining archived history/snapshots."""
    configure_database()
    with SessionLocal.begin() as session:
        item = session.get(MenuItemEntity, menu_id)
        if item is None:
            raise ValueError(f"Menu item {menu_id} not found")
        create_order_snapshot(
            order_id=f"deleted:{menu_id}",
            menu_id=item.menu_id,
            snapshot_name=item.name,
            snapshot_price=float(item.price),
            snapshot_status_at_order=item.status,
        )
        record_menu_history(
            menu_id,
            old_price=float(item.price),
            new_price=float(item.price),
            old_status=item.status,
            new_status="deleted",
            updated_by="admin",
            updated_at=datetime.now(timezone.utc),
        )
        session.delete(item)
        session.flush()
        return {"menu_id": menu_id, "deleted": True, "status": "deleted"}


def set_menu_status(menu_id: int, status: str) -> dict[str, Any]:
    configure_database()
    with SessionLocal.begin() as session:
        item = session.get(MenuItemEntity, menu_id)
        if item is None:
            raise ValueError(f"Menu item {menu_id} not found")
        previous_status = item.status
        item.status = status
        item.updated_at = datetime.now(timezone.utc)
        session.flush()
        record_menu_history(
            menu_id,
            old_price=float(item.price),
            new_price=float(item.price),
            old_status=previous_status,
            new_status=status,
            updated_by="admin",
            updated_at=item.updated_at,
        )
        return _to_dict(item)


def _to_dict(item: MenuItemEntity) -> dict[str, Any]:
    return {
        "menu_id": item.menu_id,
        "name": item.name,
        "price": float(item.price),
        "status": item.status,
        "description": item.description,
        "image_url": item.image_url,
        "promotion": dict(item.promotion) if item.promotion is not None else None,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    }