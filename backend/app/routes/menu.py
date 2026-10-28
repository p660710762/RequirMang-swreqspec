"""Admin menu API routes.

References: FR-42, FR-43, FR-44, FR-45, FR-46, FR-47.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..middleware.auth_guard import require_admin
from ..seed import seed_menu_data
from ..services.menu_service import (
    create_menu_item,
    delete_menu_item,
    list_menu_items,
    list_menu_history_and_snapshots,
    update_menu_item,
)
from ..services.menu_status_service import update_menu_status
from ..services.menu_validation import validate_menu_payload


public_router = APIRouter()
router = APIRouter(prefix="/api/admin", dependencies=[Depends(require_admin)])


@public_router.get("/api/promotions/active")
def get_active_promotions():
    """FR-44: expose active promotions used with the customer menu."""
    promotions = seed_menu_data()["promotions"]
    return [
        {
            "id": promo["promotion_id"],
            "title": promo["promotion_name"],
            "discount_value": float(promo["discount_value"]),
            "status": "active",
        }
        for promo in promotions
        if promo.get("is_active")
    ]


class MenuCreateRequest(BaseModel):
    """FR-43, FR-46: accept required and optional menu input fields."""

    name: str | None = None
    price: float | None = None
    status: str | None = None
    description: str | None = None
    image_url: str | None = None


class MenuUpdateRequest(BaseModel):
    """FR-44, FR-47: accept partial menu and promotion changes."""

    name: str | None = None
    price: float | None = None
    status: str | None = None
    description: str | None = None
    image_url: str | None = None
    promotion: dict | None = None


class MenuStatusRequest(BaseModel):
    """FR-45, FR-48: accept one of the two supported menu statuses."""

    status: str


@router.get("/menu")
def get_menu_items():
    """FR-42, FR-49: return the current menu list and retained historical records."""
    payload = list_menu_items()
    payload = {
        "menu_items": payload,
        **list_menu_history_and_snapshots(),
    }
    return payload


@router.post("/menu")
def create_menu(payload: MenuCreateRequest):
    """FR-43, FR-46, FR-47: validate required fields before creating a menu."""
    try:
        validated = validate_menu_payload(payload.model_dump())
        return create_menu_item(validated)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="ไม่สามารถบันทึกข้อมูลได้") from exc


@router.patch("/menu/{menu_id}")
def update_menu(menu_id: int, payload: MenuUpdateRequest):
    """FR-44, FR-47: update menu details and return the latest saved values."""
    try:
        changes = validate_menu_payload(payload.model_dump(exclude_unset=True), partial=True)
        return update_menu_item(menu_id, changes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="ไม่สามารถบันทึกข้อมูลได้") from exc


@router.patch("/menu/{menu_id}/status")
def update_status(menu_id: int, payload: MenuStatusRequest):
    """FR-45, FR-48: save the status used to control menu availability."""
    try:
        return update_menu_status(menu_id, payload.status)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="ไม่สามารถบันทึกข้อมูลได้") from exc


@router.delete("/menu/{menu_id}")
def delete_menu(menu_id: int):
    """FR-49: delete the current catalog record while retaining the archived snapshot."""
    try:
        return delete_menu_item(menu_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="ไม่สามารถลบเมนูได้") from exc