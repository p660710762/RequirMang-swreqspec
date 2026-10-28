"""Staff order routes.

References: FR-29 and the Staff-access constraint.
"""

from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from ..middleware.auth_guard import require_staff
from ..services.staff_order_service import (
    StaffOrderLoadError,
    StaffOrderNotFoundError,
    InvalidStaffOrderTransitionError,
    get_staff_order_details,
    list_staff_orders,
    update_staff_order_status,
)


router = APIRouter(
    prefix="/api/staff/orders",
    dependencies=[Depends(require_staff)],
)

class StaffOrderStatusRequest(BaseModel):
    """FR-25, FR-26: accept only one of the defined Order status codes."""

    new_status: Literal[
        "PENDING_ACCEPT",
        "PREPARING",
        "READY_FOR_PICKUP",
        "PICKED_UP",
    ]


@router.get("")
def get_staff_orders():
    """FR-29: return the current order list to an authenticated Staff user."""
    try:
        return list_staff_orders()
    except StaffOrderLoadError as error:
        raise HTTPException(
            status_code=503,
            detail="Staff orders could not be loaded",
        ) from error


@router.get("/{order_id}")
def get_staff_order(order_id: str, order_date: date | None = Query(default=None)):
    """FR-31: return the actual drink items, quantities, and options for an order."""
    try:
        order = get_staff_order_details(order_id, order_date)
    except StaffOrderLoadError as error:
        raise HTTPException(
            status_code=503,
            detail="Staff order details could not be loaded",
        ) from error
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/{order_id}/status")
def patch_staff_order_status(
    order_id: str,
    payload: StaffOrderStatusRequest,
    order_date: date = Query(...),
):
    """FR-25, FR-26, FR-27: persist the next valid status for an Order."""
    try:
        return update_staff_order_status(
            order_id, order_date, payload.new_status
        )
    except StaffOrderNotFoundError as error:
        raise HTTPException(status_code=404, detail="Order not found") from error
    except InvalidStaffOrderTransitionError as error:
        raise HTTPException(
            status_code=409,
            detail="Order status must advance by exactly one step",
        ) from error
    except StaffOrderLoadError as error:
        raise HTTPException(
            status_code=503,
            detail="Staff order status could not be saved",
        ) from error
