"""Admin menu API routes.

References: FR-42, FR-43, FR-44, FR-45, FR-46, FR-47.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.app.middleware.auth_guard import require_admin
from backend.app.seed import seed_menu_data
from backend.app.services.menu_service import create_menu_item, list_menu_items, update_menu_item
from backend.app.services.menu_status_service import update_menu_status
from backend.app.services.menu_validation import validate_menu_payload


public_router = APIRouter()
router = APIRouter(prefix="/api/admin", dependencies=[Depends(require_admin)])


@public_router.get("/api/menu")
def get_customer_menu():
    """FR-01, FR-02, FR-05: public menu feed for the customer page."""
    menu_items = list_menu_items()
    promotions = seed_menu_data()["promotions"]
    active_promotions = {
        promo["menu_id"]: {
            "id": promo["promotion_id"],
            "title": promo["promotion_name"],
            "discountPercent": float(promo["discount_value"]),
            "status": "active",
        }
        for promo in promotions
        if promo.get("is_active")
    }

    public_items = []
    for item in menu_items:
        payload = dict(item)
        promo = active_promotions.get(item["menu_id"])
        if promo is not None:
            payload["promotion"] = promo
        public_items.append(payload)
    return public_items


@public_router.get("/api/promotions/active")
def get_active_promotions():
    """FR-05: expose the currently active promotions for the customer menu page."""
    promotions = seed_menu_data()["promotions"]
    return [
        {
            "id": promo["promotion_id"],
            "title": promo["promotion_name"],
            "discountPercent": float(promo["discount_value"]),
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
    """FR-42: return the current menu list and related data."""
    return list_menu_items()


@router.post("/menu")
def create_menu(payload: MenuCreateRequest):
    """FR-43, FR-46, FR-47: validate required fields before creating a menu."""
    try:
        validated = validate_menu_payload(payload.model_dump())
        return create_menu_item(validated)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/menu/{menu_id}")
def update_menu(menu_id: int, payload: MenuUpdateRequest):
    """FR-44, FR-47: update menu details and return the latest saved values."""
    try:
        changes = validate_menu_payload(payload.model_dump(exclude_unset=True), partial=True)
        return update_menu_item(menu_id, changes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/menu/{menu_id}/status")
def update_status(menu_id: int, payload: MenuStatusRequest):
    """FR-45, FR-48: save the status used to control menu availability."""
    try:
        return update_menu_status(menu_id, payload.status)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc