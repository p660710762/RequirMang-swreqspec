"""Staff order routes.

References: FR-29 and the Staff-access constraint.
"""

from fastapi import APIRouter, Depends, HTTPException

from backend.app.middleware.auth_guard import require_staff
from backend.app.services.staff_order_service import get_staff_order_details, list_staff_orders


router = APIRouter(
    prefix="/api/staff/orders",
    dependencies=[Depends(require_staff)],
)


@router.get("")
def get_staff_orders():
    """FR-29: return the current order list to an authenticated Staff user."""
    return list_staff_orders()


@router.get("/{order_id}")
def get_staff_order(order_id: str):
    """FR-31: return the actual drink items, quantities, and options for an order."""
    order = get_staff_order_details(order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
