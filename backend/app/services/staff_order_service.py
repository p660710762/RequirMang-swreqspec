"""Staff order queries backed by the application's persisted Orders.

References: FR-29, FR-30, FR-31, FR-32, FR-33, and the seven-day history constraint.
"""

from datetime import date, datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import selectinload

from backend.app.config import STAFF_ORDER_RETENTION_DAYS
from backend.app.database import SessionLocal
from backend.app.models.order import Order
from backend.app.models.order_item import OrderItem

ORDER_STATUS_STEPS = (
    "PENDING_ACCEPT",
    "PREPARING",
    "READY_FOR_PICKUP",
    "PICKED_UP",
)


class StaffOrderLoadError(Exception):
    """FR-29: identify order-list data that cannot be safely returned."""


class StaffOrderNotFoundError(Exception):
    """FR-24: identify an order that is unavailable for Staff status updates."""


class InvalidStaffOrderTransitionError(Exception):
    """FR-26: reject skipped, repeated, or backward status transitions."""


def _as_utc(value: datetime) -> datetime:
    """FR-33: normalize persisted timestamps before applying the retention window."""
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _is_finished_order(status: str) -> bool:
    """FR-32: identify picked-up or canceled orders for the finished queue."""
    return status.strip().casefold() in {
        "picked_up",
        "รับสินค้าแล้ว",
        "ยกเลิก",
        "cancelled",
    }


def _load_recent_orders() -> list[Order]:
    """FR-29: load paid Orders from the same database used by Status."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=STAFF_ORDER_RETENTION_DAYS)
    with SessionLocal() as session:
        orders = session.scalars(
            select(Order)
            .where(Order.payment_status == "success", Order.created_at >= cutoff)
            .options(
                selectinload(Order.items).selectinload(OrderItem.menu_item),
                selectinload(Order.items).selectinload(OrderItem.options),
            )
        ).all()
        return list(orders)


def list_staff_orders() -> list[dict[str, Any]]:
    """FR-29, FR-30, FR-32, FR-33: return recent paid Orders in queue order."""
    try:
        orders = _load_recent_orders()
        chronological = sorted(
            orders,
            key=lambda order: (
                _as_utc(order.created_at),
                order.order_date,
                order.order_id,
            ),
        )
        sequence_by_key = {
            (order.order_date, order.order_id): sequence_no
            for sequence_no, order in enumerate(chronological, start=1)
        }
        newest_first = sorted(
            orders,
            key=lambda order: (
                _as_utc(order.created_at),
                order.order_date,
                order.order_id,
            ),
            reverse=True,
        )
        display_order = sorted(
            newest_first, key=lambda order: _is_finished_order(order.status)
        )
        return [
            {
                "order_id": order.order_id,
                "order_date": order.order_date.isoformat(),
                "created_at": _as_utc(order.created_at),
                "status": order.status,
                "order_number": order.order_id,
                "sequence_no": sequence_by_key[(order.order_date, order.order_id)],
            }
            for order in display_order
        ]
    except SQLAlchemyError as error:
        raise StaffOrderLoadError("Staff orders could not be loaded") from error


def get_staff_order_details(
    order_id: str, order_date: date | None = None
) -> dict[str, Any] | None:
    """FR-31: return persisted drink items and options for a paid Order."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=STAFF_ORDER_RETENTION_DAYS)
    try:
        with SessionLocal() as session:
            query = (
                select(Order)
                .where(
                    Order.order_id == order_id,
                    Order.payment_status == "success",
                    Order.created_at >= cutoff,
                )
                .options(
                    selectinload(Order.items).selectinload(OrderItem.menu_item),
                    selectinload(Order.items).selectinload(OrderItem.options),
                )
                .order_by(Order.order_date.desc())
            )
            if order_date is not None:
                query = query.where(Order.order_date == order_date)
            order = session.scalars(query).first()
            if order is None:
                return None

            items = []
            for item in order.items:
                options = item.options
                selected_options = []
                if options is not None:
                    selected_options.append(options.sweetness_level)
                    if options.ice_level:
                        selected_options.append(options.ice_level)
                    selected_options.extend(options.toppings or [])
                items.append(
                    {
                        "order_item_id": item.order_item_id,
                        "menu_item_name": (
                            item.menu_item.name if item.menu_item else "รายการสินค้า"
                        ),
                        "quantity": item.quantity,
                        "selected_options": selected_options,
                    }
                )

            return {
                "order_id": order.order_id,
                "items": items,
            }
    except SQLAlchemyError as error:
        raise StaffOrderLoadError("Staff order details could not be loaded") from error


def update_staff_order_status(order_id: str, order_date: date, new_status: str) -> dict[str, Any]:
    """FR-25, FR-26, FR-27: persist only the next allowed status for a paid order."""
    try:
        with SessionLocal.begin() as session:
            order = session.get(Order, (order_date, order_id))
            if order is None or order.payment_status != "success":
                raise StaffOrderNotFoundError

            try:
                next_status = ORDER_STATUS_STEPS[
                    ORDER_STATUS_STEPS.index(order.status) + 1
                ]
            except (ValueError, IndexError) as error:
                raise InvalidStaffOrderTransitionError from error

            if new_status != next_status:
                raise InvalidStaffOrderTransitionError

            changed_at = datetime.now(timezone.utc)
            result = session.execute(
                update(Order)
                .where(
                    Order.order_date == order_date,
                    Order.order_id == order_id,
                    Order.payment_status == "success",
                    Order.status == order.status,
                )
                .values(status=new_status, last_status_change_at=changed_at)
            )
            if result.rowcount != 1:
                raise InvalidStaffOrderTransitionError
            return {
                "order_id": order.order_id,
                "order_date": order.order_date.isoformat(),
                "status": new_status,
                "last_status_change_at": changed_at,
            }
    except SQLAlchemyError as error:
        raise StaffOrderLoadError("Staff order status could not be saved") from error
