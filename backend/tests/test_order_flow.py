from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from fastapi.testclient import TestClient
import pytest
from sqlalchemy import Column, Integer, Table, create_engine, event, select
from sqlalchemy.orm import Session

from app.main import app
from app.models.order import Base, Order
from app.models.order_item import OrderItem, OrderOption
from app.models.payment_transaction import PaymentTransaction
from app.routes.orders import get_menu_repository, get_order_repository
from app.services.order_service import InvalidOrderOptionsError, OrderService


@dataclass
class FakeMenuItem:
    menu_id: int
    status: str
    price: Decimal
    name: str = "เครื่องดื่มทดสอบ"


@dataclass
class FakeDraftOrder:
    order_date: date
    order_id: str


@dataclass
class FakeOrderItem:
    order_item_id: int
    order_date: date
    order_id: str
    menu_item_id: int
    quantity: int
    name: str
    unit_price: Decimal
    line_total: Decimal


@dataclass
class FakeOrderOption:
    order_item_id: int
    sweetness_level: str
    toppings: list[str] | None
    ice_level: str


@dataclass
class FakeOrderSummary:
    items: list[FakeOrderItem]
    total_amount: Decimal


class FakeMenuRepository:
    def __init__(self, menu_item: FakeMenuItem) -> None:
        self.menu_item = menu_item

    def get_menu_item(self, menu_id: int) -> FakeMenuItem | None:
        return self.menu_item if self.menu_item.menu_id == menu_id else None

    def list_menu_items(self) -> list[FakeMenuItem]:
        return [self.menu_item]


class FakeOrderRepository:
    def __init__(self) -> None:
        self.added_items: list[FakeOrderItem] = []
        self.saved_options: dict[int, FakeOrderOption] = {}
        self.drafts: list[FakeDraftOrder] = []
        self.menu_items: dict[int, FakeMenuItem] = {}
        self.item_options: dict[int, FakeOrderOption] = {}
        self.payment_prepared = False

    def create_draft(self) -> FakeDraftOrder:
        draft = FakeDraftOrder(
            order_date=date(2026, 10, 27),
            order_id=f"{len(self.drafts) + 1:03}",
        )
        self.drafts.append(draft)
        return draft

    def add_item_to_draft(
        self,
        order_date: date,
        order_id: str,
        menu_item: FakeMenuItem,
        quantity: int,
    ) -> FakeOrderItem:
        item = FakeOrderItem(
            order_item_id=len(self.added_items) + 1,
            order_date=order_date,
            order_id=order_id,
            menu_item_id=menu_item.menu_id,
            quantity=quantity,
            name=menu_item.name,
            unit_price=menu_item.price,
            line_total=menu_item.price * quantity,
        )
        self.added_items.append(item)
        return item

    def save_item_options(
        self,
        order_item_id: int,
        sweetness_level: str,
        toppings: list[str] | None,
        ice_level: str,
    ) -> FakeOrderOption:
        option = FakeOrderOption(
            order_item_id=order_item_id,
            sweetness_level=sweetness_level,
            toppings=toppings,
            ice_level=ice_level,
        )
        self.saved_options[order_item_id] = option
        self.item_options[order_item_id] = option
        return option

    def update_item(
        self,
        order_item_id: int,
        quantity: int | None,
        sweetness_level: str | None,
        toppings: list[str] | None,
        ice_level: str | None,
    ):
        item = next(
            (candidate for candidate in self.added_items
             if candidate.order_item_id == order_item_id),
            None,
        )
        if item is None:
            from app.services.order_service import OrderDraftNotFoundError
            raise OrderDraftNotFoundError
        if quantity == 0:
            self.added_items.remove(item)
            updated_item = None
        else:
            if quantity is not None:
                item.quantity = quantity
                item.line_total = item.unit_price * quantity
            option = self.item_options.get(order_item_id)
            if option:
                if sweetness_level is not None:
                    option.sweetness_level = sweetness_level
                if toppings is not None:
                    option.toppings = toppings
                if ice_level is not None:
                    option.ice_level = ice_level
            updated_item = item
        return type(
            "FakeOrderItemUpdate",
            (),
            {
                "item": updated_item,
                "sweetness_level": (
                    self.item_options[order_item_id].sweetness_level
                    if updated_item
                    else None
                ),
                "toppings": (
                    self.item_options[order_item_id].toppings
                    if updated_item
                    else None
                ),
                "ice_level": (
                    self.item_options[order_item_id].ice_level
                    if updated_item
                    else None
                ),
                "total_amount": sum(
                    (candidate.line_total for candidate in self.added_items),
                    Decimal("0.00"),
                ),
            },
        )()

    def get_order_summary(
        self, order_date: date, order_id: str
    ) -> FakeOrderSummary | None:
        items = [
            item
            for item in self.added_items
            if item.order_date == order_date and item.order_id == order_id
        ]
        if not items and not any(
            draft.order_date == order_date and draft.order_id == order_id
            for draft in self.drafts
        ):
            return None
        return FakeOrderSummary(
            items=items,
            total_amount=sum((item.line_total for item in items), Decimal("0.00")),
        )

    def get_order_options(
        self, order_date: date, order_id: str
    ) -> list[FakeOrderOption] | None:
        if not any(
            item.order_date == order_date and item.order_id == order_id
            for item in self.added_items
        ):
            return [] if any(
                draft.order_date == order_date and draft.order_id == order_id
                for draft in self.drafts
            ) else None
        return [
            self.item_options[item.order_item_id]
            for item in self.added_items
            if item.order_date == order_date and item.order_id == order_id
        ]

    def prepare_payment(self, order_date: date, order_id: str):
        self.payment_prepared = True
        return type(
            "FakePaymentPreparation",
            (),
            {
                "order_date": order_date,
                "order_id": order_id,
                "payment_status": "pending",
            },
        )()


def build_client(menu_status: str) -> tuple[TestClient, FakeOrderRepository]:
    menu_item = FakeMenuItem(menu_id=17, status=menu_status, price=Decimal("65.00"))
    menu_repository = FakeMenuRepository(menu_item)
    order_repository = FakeOrderRepository()
    order_repository.menu_items[menu_item.menu_id] = menu_item
    app.dependency_overrides[get_menu_repository] = lambda: menu_repository
    app.dependency_overrides[get_order_repository] = lambda: order_repository
    return TestClient(app), order_repository


def test_AC_ORDER_01_add_item_to_order():
    client, order_repository = build_client("open")
    try:
        response = client.post(
            "/api/orders/items",
            json={
                "order_date": "2026-10-27",
                "order_id": "001",
                "menu_item_id": 17,
                "quantity": 2,
                "sweetness_level": "หวานปกติ 75%",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 201
    assert response.json() == {
        "order_item_id": 1,
        "order_date": "2026-10-27",
        "order_id": "001",
        "menu_item_id": 17,
        "quantity": 2,
        "sweetness_level": "หวานปกติ 75%",
        "toppings": None,
        "ice_level": "ใส่น้ำแข็งปริมาณปกติ",
    }
    assert len(order_repository.added_items) == 1
    assert order_repository.saved_options[1].sweetness_level == "หวานปกติ 75%"


def test_AC_ORDER_01_cannot_add_unavailable_menu():
    client, order_repository = build_client("out_of_stock")
    try:
        response = client.post(
            "/api/orders/items",
            json={
                "order_date": "2026-10-27",
                "order_id": "001",
                "menu_item_id": 17,
                "quantity": 1,
                "sweetness_level": "หวานปกติ 75%",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 409
    assert response.json()["detail"] == "Menu item is not available for ordering"
    assert order_repository.added_items == []


def test_AC_ORDER_01_rejects_non_positive_quantity():
    client, order_repository = build_client("open")
    try:
        response = client.post(
            "/api/orders/items",
            json={
                "order_date": "2026-10-27",
                "order_id": "001",
                "menu_item_id": 17,
                "quantity": 0,
                "sweetness_level": "หวานปกติ 75%",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 422
    assert order_repository.added_items == []


def test_AC_ORDER_02_save_item_options():
    client, order_repository = build_client("open")
    try:
        response = client.post(
            "/api/orders/items",
            json={
                "order_date": "2026-10-27",
                "order_id": "001",
                "menu_item_id": 17,
                "quantity": 2,
                "sweetness_level": "หวานน้อย 50%",
                "toppings": ["ไข่มุก", "ชีส"],
                "ice_level": "แยกน้ำแข็ง",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 201
    assert response.json()["sweetness_level"] == "หวานน้อย 50%"
    assert response.json()["toppings"] == ["ไข่มุก", "ชีส"]
    assert response.json()["ice_level"] == "แยกน้ำแข็ง"
    assert order_repository.saved_options[1] == FakeOrderOption(
        order_item_id=1,
        sweetness_level="หวานน้อย 50%",
        toppings=["ไข่มุก", "ชีส"],
        ice_level="แยกน้ำแข็ง",
    )


def test_AC_ORDER_03_show_order_summary():
    client, order_repository = build_client("open")
    try:
        add_response = client.post(
            "/api/orders/items",
            json={
                "order_date": "2026-10-27",
                "order_id": "001",
                "menu_item_id": 17,
                "quantity": 2,
                "sweetness_level": "หวานปกติ 75%",
            },
        )
        response = client.get(
            "/api/orders/preview",
            params={"order_date": "2026-10-27", "order_id": "001"},
        )
    finally:
        app.dependency_overrides.clear()

    assert add_response.status_code == 201
    assert response.status_code == 200
    assert response.json() == {
        "order_date": "2026-10-27",
        "order_id": "001",
        "items": [
            {
                "order_item_id": 1,
                "menu_item_id": 17,
                "name": "เครื่องดื่มทดสอบ",
                "quantity": 2,
                "unit_price": "65.00",
                "line_total": "130.00",
            }
        ],
        "total_amount": "130.00",
    }


def test_AC_ORDER_03_summary_not_found_for_empty_draft():
    client, _order_repository = build_client("open")
    try:
        response = client.get(
            "/api/orders/preview",
            params={"order_date": "2026-10-27", "order_id": "001"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 404


def test_AC_ORDER_04_update_quantity_or_remove_item():
    client, order_repository = build_client("open")
    try:
        add_response = client.post(
            "/api/orders/items",
            json={
                "order_date": "2026-10-27",
                "order_id": "001",
                "menu_item_id": 17,
                "quantity": 2,
                "sweetness_level": "หวานปกติ 75%",
            },
        )
        response = client.patch("/api/orders/items/1", json={"quantity": 1})
    finally:
        app.dependency_overrides.clear()

    assert add_response.status_code == 201
    assert response.status_code == 200
    assert response.json()["quantity"] == 1
    assert response.json()["total_amount"] == "65.00"
    assert order_repository.added_items[0].quantity == 1


def test_AC_ORDER_09_recalculate_total_after_edit():
    client, order_repository = build_client("open")
    try:
        client.post(
            "/api/orders/items",
            json={
                "order_date": "2026-10-27",
                "order_id": "001",
                "menu_item_id": 17,
                "quantity": 2,
                "sweetness_level": "หวานปกติ 75%",
            },
        )
        response = client.patch("/api/orders/items/1", json={"quantity": 0})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {
        "order_item_id": None,
        "quantity": None,
        "sweetness_level": None,
        "toppings": None,
        "ice_level": None,
        "total_amount": "0.00",
    }
    assert order_repository.added_items == []


def test_AC_ORDER_09_update_item_options_without_changing_total():
    client, order_repository = build_client("open")
    try:
        client.post(
            "/api/orders/items",
            json={
                "order_date": "2026-10-27",
                "order_id": "001",
                "menu_item_id": 17,
                "quantity": 2,
                "sweetness_level": "หวานปกติ 75%",
            },
        )
        response = client.patch(
            "/api/orders/items/1",
            json={
                "sweetness_level": "ไม่หวาน",
                "toppings": ["ไข่มุก"],
                "ice_level": "ไม่ใส่น้ำแข็ง",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["quantity"] == 2
    assert response.json()["sweetness_level"] == "ไม่หวาน"
    assert response.json()["toppings"] == ["ไข่มุก"]
    assert response.json()["ice_level"] == "ไม่ใส่น้ำแข็ง"
    assert response.json()["total_amount"] == "130.00"
    assert order_repository.item_options[1].sweetness_level == "ไม่หวาน"


def test_AC_ORDER_05_confirm_order_to_payment():
    client, order_repository = build_client("open")
    try:
        client.post("/api/orders/drafts")
        client.post(
            "/api/orders/items",
            json={
                "order_date": "2026-10-27",
                "order_id": "001",
                "menu_item_id": 17,
                "quantity": 1,
                "sweetness_level": "หวานปกติ 75%",
            },
        )
        response = client.post(
            "/api/orders/confirm",
            json={"order_date": "2026-10-27", "order_id": "001"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {
        "order_date": "2026-10-27",
        "order_id": "001",
        "payment_status": "pending",
    }
    assert order_repository.payment_prepared is True


def test_AC_ORDER_11_show_out_of_stock_message():
    client, order_repository = build_client("open")
    try:
        client.post("/api/orders/drafts")
        client.post(
            "/api/orders/items",
            json={
                "order_date": "2026-10-27",
                "order_id": "001",
                "menu_item_id": 17,
                "quantity": 1,
                "sweetness_level": "หวานปกติ 75%",
            },
        )
        order_repository.menu_items[17].status = "out_of_stock"
        response = client.post(
            "/api/orders/confirm",
            json={"order_date": "2026-10-27", "order_id": "001"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 409
    assert response.json()["detail"] == "Menu item is out of stock; choose another menu"
    assert order_repository.payment_prepared is False


def test_T05_create_draft_reserves_order_number():
    client, order_repository = build_client("open")
    try:
        first_response = client.post("/api/orders/drafts")
        second_response = client.post("/api/orders/drafts")
    finally:
        app.dependency_overrides.clear()

    assert first_response.status_code == 201
    assert first_response.json() == {
        "order_date": "2026-10-27",
        "order_id": "001",
    }
    assert second_response.status_code == 201
    assert second_response.json()["order_id"] == "002"
    assert len(order_repository.drafts) == 2


def test_T05_lists_menu_items_for_order_page():
    client, _order_repository = build_client("open")
    try:
        response = client.get("/api/menu")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {
        "items": [
            {
                "menu_id": 17,
                "name": "เครื่องดื่มทดสอบ",
                "status": "open",
                "price": "65.00",
            }
        ]
    }


@pytest.mark.parametrize(
    ("sweetness_level", "toppings", "ice_level"),
    [
        (None, None, None),
        ("invalid", None, None),
        ("หวานปกติ 75%", ["invalid topping"], None),
        ("หวานปกติ 75%", None, "invalid ice"),
        ("หวานปกติ 75%", None, ""),
    ],
)
def test_AC_ORDER_02_rejects_invalid_item_options(
    sweetness_level: str | None,
    toppings: list[str] | None,
    ice_level: str | None,
):
    service = OrderService(
        FakeMenuRepository(
            FakeMenuItem(menu_id=17, status="open", price=Decimal("65.00"))
        ),
        FakeOrderRepository(),
    )

    with pytest.raises(InvalidOrderOptionsError):
        service.save_item_options(
            order_item_id=101,
            sweetness_level=sweetness_level,
            toppings=toppings,
            ice_level=ice_level,
        )


def test_AC_ORDER_02_persists_options_for_each_order_item():
    Table(
        "menu_items",
        Base.metadata,
        Column("menu_id", Integer, primary_key=True),
    )
    engine = create_engine("sqlite:///:memory:")

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(connection, _record):
        connection.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(engine)

    with Session(engine) as session:
        session.execute(Base.metadata.tables["menu_items"].insert().values(menu_id=17))
        order = Order(
            order_date=date(2026, 10, 27),
            order_id="001",
            status="pending",
            total_amount=Decimal("130.00"),
            payment_status="pending",
            items=[
                OrderItem(
                    menu_item_id=17,
                    quantity=1,
                    unit_price=Decimal("65.00"),
                    line_total=Decimal("65.00"),
                    options=OrderOption(
                        sweetness_level="หวานปกติ 75%",
                        toppings=["ไข่มุก", "ชีส"],
                    ),
                ),
                OrderItem(
                    menu_item_id=17,
                    quantity=1,
                    unit_price=Decimal("65.00"),
                    line_total=Decimal("65.00"),
                    options=OrderOption(
                        sweetness_level="ไม่หวาน",
                        ice_level="ไม่ใส่น้ำแข็ง",
                    ),
                ),
            ],
        )
        session.add(order)
        session.commit()
        session.expire_all()

        saved_options = session.scalars(
            select(OrderOption).order_by(OrderOption.order_item_id)
        ).all()

    assert len(saved_options) == 2
    assert saved_options[0].sweetness_level == "หวานปกติ 75%"
    assert saved_options[0].toppings == ["ไข่มุก", "ชีส"]
    assert saved_options[0].ice_level == "ใส่น้ำแข็งปริมาณปกติ"
    assert saved_options[1].sweetness_level == "ไม่หวาน"
    assert saved_options[1].toppings is None
    assert saved_options[1].ice_level == "ไม่ใส่น้ำแข็ง"


def test_TC_ORDER_01_1_add_open_menu_item():
    # Given ผู้ใช้เปิดรายการเมนูและมีเครื่องดื่มที่เปิดขาย
    client, order_repository = build_client("open")
    try:
        # When ผู้ใช้เลือกเครื่องดื่มที่เปิดขาย
        response = client.post(
            "/api/orders/items",
            json={
                "order_date": "2026-10-27",
                "order_id": "001",
                "menu_item_id": 17,
                "quantity": 1,
                "sweetness_level": "หวานปกติ 75%",
            },
        )
    finally:
        app.dependency_overrides.clear()

    # Then ระบบเพิ่มเครื่องดื่มที่เลือกเข้าสู่รายการ Order
    assert response.status_code == 201
    assert len(order_repository.added_items) == 1
    assert order_repository.added_items[0].menu_item_id == 17


def test_TC_ORDER_01_3_add_only_open_menu_item():
    # Given ผู้ใช้เปิดรายการเมนูและมีเครื่องดื่มที่เปิดขายเพียง 1 รายการ
    client, order_repository = build_client("open")
    try:
        # When ผู้ใช้เลือกเครื่องดื่มที่เปิดขายนั้น
        response = client.post(
            "/api/orders/items",
            json={
                "order_date": "2026-10-27",
                "order_id": "001",
                "menu_item_id": 17,
                "quantity": 1,
                "sweetness_level": "ไม่หวาน",
            },
        )
    finally:
        app.dependency_overrides.clear()

    # Then ระบบเพิ่มเครื่องดื่มที่เลือกเข้าสู่รายการ Order
    assert response.status_code == 201
    assert len(order_repository.added_items) == 1


def test_TC_ORDER_01_4_reject_unavailable_menu_item():
    # Given ผู้ใช้เปิดรายการเมนูและไม่มีเครื่องดื่มที่เปิดขาย โดยมีเฉพาะเครื่องดื่มที่หมด/ไม่เปิดขาย
    client, order_repository = build_client("out_of_stock")
    try:
        # When ผู้ใช้พยายามเลือกเครื่องดื่มที่ไม่เปิดขาย
        response = client.post(
            "/api/orders/items",
            json={
                "order_date": "2026-10-27",
                "order_id": "001",
                "menu_item_id": 17,
                "quantity": 1,
                "sweetness_level": "หวานปกติ 75%",
            },
        )
    finally:
        app.dependency_overrides.clear()

    # Then ระบบไม่เพิ่มเครื่องดื่มที่ไม่เปิดขายเข้าสู่ Order
    assert response.status_code == 409
    assert order_repository.added_items == []
