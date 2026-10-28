from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import select

from ..database import SessionLocal
from ..models.menu import MenuItemEntity
from ..models.order import Order
from ..models.order_item import OrderItem, OrderOption
from ..models.payment_transaction import PaymentTransaction


class OrderNumberExhaustedError(Exception):
    """Raised when every Order number for the current date is in use."""


class MockPaymentOrderNotFoundError(Exception):
    """Raised when a mock payment targets an order not owned by the caller."""


class MockPaymentOrderNotReadyError(Exception):
    """Raised when a mock payment targets an empty or already processed order."""


@dataclass
class RepositoryMenuItem:
    menu_id: int
    name: str
    status: str
    price: Decimal
    promotion_price: Decimal | None
    description: str | None = None
    image_url: str | None = None

    @property
    def effective_price(self) -> Decimal:
        return self.promotion_price if self.promotion_price is not None else self.price


@dataclass
class RepositoryDraft:
    order_date: date
    order_id: str


@dataclass
class RepositoryItem:
    order_item_id: int
    order_date: date
    order_id: str
    menu_item_id: int
    quantity: int
    name: str
    unit_price: Decimal
    line_total: Decimal
    regular_price: Decimal
    promotion_price: Decimal | None


@dataclass
class RepositoryOption:
    order_item_id: int
    sweetness_level: str
    toppings: list[str] | None
    ice_level: str


@dataclass
class RepositorySummary:
    items: list[RepositoryItem]
    total_amount: Decimal


@dataclass
class RepositoryUpdate:
    item: RepositoryItem | None
    sweetness_level: str | None
    toppings: list[str] | None
    ice_level: str | None
    total_amount: Decimal


@dataclass
class RepositoryPaymentPreparation:
    order_date: date
    order_id: str
    payment_status: str = "pending"


def _item_record(item: OrderItem) -> RepositoryItem:
    return RepositoryItem(
        item.order_item_id,
        item.order_date,
        item.order_id,
        item.menu_item_id,
        item.quantity,
        item.menu_item.name,
        Decimal(item.unit_price),
        Decimal(item.line_total),
        Decimal(item.menu_item.price),
        item.menu_item.promotion_price,
    )


class SqliteMenuRepository:
    """อ่านเมนูจาก SQLite เดียวกับที่ Order ใช้จริง."""

    def get_menu_item(self, menu_id: int) -> RepositoryMenuItem | None:
        with SessionLocal() as session:
            item = session.get(MenuItemEntity, menu_id)
            if item is None:
                return None
            return RepositoryMenuItem(
                item.menu_id, item.name, item.status, Decimal(item.price),
                item.promotion_price, item.description, item.image_url,
            )

    def list_menu_items(self) -> list[RepositoryMenuItem]:
        with SessionLocal() as session:
            return [
                RepositoryMenuItem(
                    item.menu_id, item.name, item.status, Decimal(item.price),
                    item.promotion_price, item.description, item.image_url,
                )
                for item in session.scalars(select(MenuItemEntity)).all()
            ]


class SqliteOrderRepository:
    """จัดเก็บ draft, รายการ และตัวเลือกด้วย transaction ของ SQLite."""

    def create_draft(self, owner_user_id: str | None = None) -> RepositoryDraft:
        today = date.today()
        with SessionLocal.begin() as session:
            used = session.scalars(
                select(Order.order_id).where(Order.order_date == today)
            ).all()
            next_number = next(
                (number for number in range(1, 1000) if f"{number:03}" not in used),
                None,
            )
            if next_number is None:
                raise OrderNumberExhaustedError
            draft = Order(
                order_date=today,
                order_id=f"{next_number:03}",
                status="draft",
                total_amount=Decimal("0"),
                payment_status="pending",
                owner_user_id=owner_user_id,
            )
            session.add(draft)
            return RepositoryDraft(today, draft.order_id)

    def _get_order(self, session, order_date: date, order_id: str) -> Order | None:
        return session.get(Order, (order_date, order_id))

    def add_item_to_draft(self, order_date, order_id, menu_item, quantity):
        with SessionLocal.begin() as session:
            order = self._get_order(session, order_date, order_id)
            if order is None:
                order = Order(order_date=order_date, order_id=order_id, status="draft",
                              total_amount=Decimal("0"), payment_status="pending")
                session.add(order)
                session.flush()
            item = OrderItem(
                order_date=order_date, order_id=order_id,
                menu_item_id=menu_item.menu_id, quantity=quantity,
                unit_price=menu_item.effective_price,
                line_total=menu_item.effective_price * quantity,
            )
            session.add(item)
            session.flush()
            order.total_amount += item.line_total
            return RepositoryItem(item.order_item_id, order_date, order_id,
                                  menu_item.menu_id, quantity, menu_item.name,
                                  menu_item.effective_price, item.line_total,
                                  menu_item.price, menu_item.promotion_price)

    def save_item_options(self, order_item_id, sweetness_level, toppings, ice_level):
        with SessionLocal.begin() as session:
            option = session.scalar(select(OrderOption).where(OrderOption.order_item_id == order_item_id))
            if option is None:
                option = OrderOption(order_item_id=order_item_id)
                session.add(option)
            option.sweetness_level = sweetness_level
            option.toppings = toppings
            option.ice_level = ice_level
            session.flush()
            return RepositoryOption(order_item_id, sweetness_level, toppings, ice_level)

    def _summary(self, session, order):
        items = [_item_record(item) for item in order.items]
        return RepositorySummary(items, sum((item.line_total for item in items), Decimal("0")))

    def get_order_summary(self, order_date, order_id):
        with SessionLocal() as session:
            order = self._get_order(session, order_date, order_id)
            return None if order is None else self._summary(session, order)

    def get_order_options(self, order_date, order_id):
        with SessionLocal() as session:
            order = self._get_order(session, order_date, order_id)
            if order is None:
                return None
            return [
                RepositoryOption(option.order_item_id, option.sweetness_level,
                                 option.toppings, option.ice_level)
                for item in order.items if (option := item.options) is not None
            ]

    def update_item(self, order_item_id, quantity, sweetness_level, toppings, ice_level):
        with SessionLocal.begin() as session:
            item = session.get(OrderItem, order_item_id)
            if item is None:
                from ..services.order_service import OrderDraftNotFoundError
                raise OrderDraftNotFoundError
            order = self._get_order(session, item.order_date, item.order_id)
            if quantity == 0:
                if item.options is not None:
                    session.delete(item.options)
                session.delete(item)
                session.flush()
                updated = None
            else:
                if quantity is not None:
                    item.quantity = quantity
                    item.line_total = item.unit_price * quantity
                option = item.options
                if option is not None:
                    if sweetness_level is not None:
                        option.sweetness_level = sweetness_level
                    if toppings is not None:
                        option.toppings = toppings
                    if ice_level is not None:
                        option.ice_level = ice_level
                updated = _item_record(item)
            order.total_amount = sum((candidate.line_total for candidate in order.items
                                      if candidate.order_item_id != order_item_id or updated),
                                     Decimal("0"))
            option = item.options if updated else None
            return RepositoryUpdate(
                updated,
                option.sweetness_level if option else None,
                option.toppings if option else None,
                option.ice_level if option else None,
                Decimal(order.total_amount),
            )

    def prepare_payment(self, order_date, order_id):
        return RepositoryPaymentPreparation(order_date, order_id)

    def complete_mock_payment(self, order_date, order_id, owner_user_id):
        with SessionLocal.begin() as session:
            order = self._get_order(session, order_date, order_id)
            if order is None or order.owner_user_id != owner_user_id:
                raise MockPaymentOrderNotFoundError
            if not order.items or order.payment_status != "pending":
                raise MockPaymentOrderNotReadyError

            paid_at = datetime.now(timezone.utc)
            order.payment_status = "success"
            order.status = "PENDING_ACCEPT"
            order.paid_at = paid_at
            order.last_status_change_at = paid_at
            session.add(
                PaymentTransaction(
                    order_date=order_date,
                    order_id=order_id,
                    payment_result="success",
                    reference_key=f"mock-success:{order_date.isoformat()}:{order_id}",
                )
            )
            return {
                "order_date": order_date,
                "order_id": order_id,
                "payment_status": "success",
                "status": order.status,
                "paid_at": paid_at,
            }


menu_repository = SqliteMenuRepository()
order_repository = SqliteOrderRepository()
