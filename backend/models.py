"""Data models for the order status tracking feature."""

from dataclasses import dataclass


# Supports FR-19 and FR-23 by associating each order with its owner and creation time.
@dataclass(frozen=True)
class Order:
    order_id: str
    user_id: str
    created_at: str
    status: str
    total_amount: int | float
    last_status_change_at: str | None
    is_active: bool


# Supports FR-22 by representing the products and prices belonging to an order.
@dataclass(frozen=True)
class OrderItem:
    order_item_id: str
    order_id: str
    menu_item_id: str
    menu_name: str
    quantity: int
    unit_price: int | float
    line_total: int | float


# Supports FR-21 and NFR-REL-03 by retaining status history and its confirmation state.
@dataclass(frozen=True)
class OrderStatusHistory:
    status_log_id: str
    order_id: str
    status_code: str
    status_name: str
    changed_at: str
    is_confirmed: bool
