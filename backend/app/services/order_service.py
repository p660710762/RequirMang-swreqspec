from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Protocol


SWEETNESS_LEVELS = frozenset(
    {"หวานปกติ 75%", "หวานน้อย 50%", "เพิ่มหวาน 100%", "ไม่หวาน"}
)
ICE_LEVELS = frozenset(
    {
        "น้ำแข็งน้อย (ปริมาณน้ำเท่าเดิม)",
        "ไม่ใส่น้ำแข็ง",
        "แยกน้ำแข็ง",
        "ใส่น้ำแข็งปริมาณปกติ",
    }
)
TOPPINGS = frozenset(
    {
        "ไข่มุก",
        "ดับเบิ้ลไข่มุก",
        "เจลลี่ผลไม้",
        "ดับเบิ้ลเจลลี่ผลไม้",
        "บุกขาว",
        "ดับเบิ้ลบุกขาว",
        "คริสตัลใส",
        "ดับเบิ้ลคริสตัลใส",
        "คริสตัลบราวชูการ์",
        "ชีส",
        "ดับเบิ้ลชีส",
        "ซอสบราวน์ชูการ์",
        "ชีสครันช์",
        "ครันช์",
    }
)
DEFAULT_ICE_LEVEL = "ใส่น้ำแข็งปริมาณปกติ"


class MenuItemRecord(Protocol):
    # รองรับ FR-06 โดยให้ service ตรวจสถานะจากข้อมูลเมนูที่ repository ส่งคืน
    menu_id: int
    name: str
    status: str
    price: Decimal


class MenuRepository(Protocol):
    # รองรับ FR-06 โดยอ่านข้อมูลเมนูจาก repository ที่ inject เข้ามา
    def get_menu_item(self, menu_id: int) -> MenuItemRecord | None: ...

    # รองรับ FR-06 โดยให้ผู้ใช้เลือกเมนูจากรายการเมนูจริง
    def list_menu_items(self) -> list[MenuItemRecord]: ...


class OrderRepository(Protocol):
    # รองรับ FR-06 โดยจองหมายเลข draft จาก backend ก่อนเพิ่มรายการ
    def create_draft(self) -> DraftOrderReference: ...

    # รองรับ FR-06 และ Constraint: เพิ่มรายการลงใน draft Order ที่ระบุเท่านั้น
    def add_item_to_draft(
        self,
        order_date: date,
        order_id: str,
        menu_item: MenuItemRecord,
        quantity: int,
    ) -> OrderItemRecord: ...

    # รองรับ FR-07 โดยบันทึกตัวเลือกแยกตาม OrderItem
    def save_item_options(
        self,
        order_item_id: int,
        sweetness_level: str,
        toppings: list[str] | None,
        ice_level: str,
    ) -> OrderOptionRecord: ...

    # รองรับ FR-08 โดยอ่านรายการและยอดรวมของ draft ที่ระบุ
    def get_order_summary(
        self, order_date: date, order_id: str
    ) -> OrderSummaryRecord | None: ...

    # รองรับ FR-10 โดยอ่านตัวเลือกที่จำเป็นก่อนเริ่มชำระเงิน
    def get_order_options(
        self, order_date: date, order_id: str
    ) -> list[OrderOptionRecord] | None: ...

    # รองรับ FR-11 โดยเริ่มขั้นตอนชำระเงินหลังตรวจ Order และสต็อกแล้ว
    def prepare_payment(
        self, order_date: date, order_id: str
    ) -> PaymentPreparationRecord: ...

    # รองรับ FR-09 โดยแก้รายการหรือลบเมื่อ quantity เป็นศูนย์ พร้อมยอดรวมใหม่
    def update_item(
        self,
        order_item_id: int,
        quantity: int | None,
        sweetness_level: str | None,
        toppings: list[str] | None,
        ice_level: str | None,
    ) -> OrderItemUpdateRecord: ...


class DraftOrderReference(Protocol):
    # รองรับ FR-06 โดยคืน reference ที่ API ใช้ระบุ draft Order
    order_date: date
    order_id: str


class OrderItemRecord(Protocol):
    # รองรับ FR-06 โดยระบุผล OrderItem ที่เพิ่มลงใน draft
    order_item_id: int
    order_date: date
    order_id: str
    menu_item_id: int
    quantity: int


class OrderOptionRecord(Protocol):
    order_item_id: int
    sweetness_level: str
    toppings: list[str] | None
    ice_level: str


class OrderSummaryItemRecord(Protocol):
    # รองรับ FR-08 โดยคืนชื่อ จำนวน และราคาของ OrderItem
    order_item_id: int
    menu_item_id: int
    name: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal


class OrderSummaryRecord(Protocol):
    # รองรับ FR-08 โดยคืนรายการและยอดรวมที่ repository คำนวณจาก draft
    items: list[OrderSummaryItemRecord]
    total_amount: Decimal


class OrderItemUpdateRecord(Protocol):
    # รองรับ FR-08 และ FR-09 โดยคืนรายการที่แก้ไขและยอดรวมล่าสุด
    item: OrderItemRecord | None
    sweetness_level: str | None
    toppings: list[str] | None
    ice_level: str | None
    total_amount: Decimal


class PaymentPreparationRecord(Protocol):
    # รองรับ FR-11 โดยคืนข้อมูลสำหรับขั้นตอนชำระเงินที่ยังรอดำเนินการ
    order_date: date
    order_id: str
    payment_status: str


class MenuItemNotFoundError(Exception):
    """เมนูที่ร้องขอไม่มีอยู่ในรายการเมนู."""


class MenuItemUnavailableError(Exception):
    """เมนูที่ร้องขอไม่ได้เปิดขาย."""


class InvalidOrderOptionsError(ValueError):
    """ตัวเลือกเครื่องดื่มไม่ตรงกับข้อกำหนด FR-07."""


class OrderDraftNotFoundError(Exception):
    """ไม่พบ draft Order ที่ร้องขอ."""


class OrderNotReadyError(Exception):
    """Order ยังไม่ครบเงื่อนไขก่อนเข้าสู่การชำระเงิน."""


class OrderOutOfStockError(Exception):
    """มีรายการที่ไม่เปิดขายระหว่างตรวจซ้ำก่อนชำระเงิน."""


class OrderService:
    """เพิ่มเฉพาะเมนูที่เปิดขายลง draft Order ตาม FR-06."""

    def __init__(
        self, menu_repository: MenuRepository, order_repository: OrderRepository
    ) -> None:
        self._menu_repository = menu_repository
        self._order_repository = order_repository

    def add_item(
        self,
        order_date: date,
        order_id: str,
        menu_id: int,
        quantity: int,
    ) -> OrderItemRecord:
        # รองรับ FR-06 และ Constraint ที่อนุญาตให้สั่งเฉพาะเมนูเปิดขาย
        menu_item = self._menu_repository.get_menu_item(menu_id)
        if menu_item is None:
            raise MenuItemNotFoundError
        if menu_item.status != "open":
            raise MenuItemUnavailableError

        return self._order_repository.add_item_to_draft(
            order_date, order_id, menu_item, quantity
        )

    def save_item_options(
        self,
        order_item_id: int,
        sweetness_level: str | None,
        toppings: list[str] | None = None,
        ice_level: str | None = None,
    ) -> OrderOptionRecord:
        # รองรับ FR-07: ต้องเลือกระดับความหวาน และ toppings/น้ำแข็งเป็นตัวเลือกเสริม
        if (
            not isinstance(sweetness_level, str)
            or sweetness_level not in SWEETNESS_LEVELS
        ):
            raise InvalidOrderOptionsError("A valid sweetness level is required")
        if toppings is not None and any(topping not in TOPPINGS for topping in toppings):
            raise InvalidOrderOptionsError("One or more toppings are invalid")
        resolved_ice_level = (
            DEFAULT_ICE_LEVEL if ice_level is None else ice_level
        )
        if (
            not isinstance(resolved_ice_level, str)
            or resolved_ice_level not in ICE_LEVELS
        ):
            raise InvalidOrderOptionsError("The ice level is invalid")

        return self._order_repository.save_item_options(
            order_item_id,
            sweetness_level,
            toppings,
            resolved_ice_level,
        )

    def get_summary(self, order_date: date, order_id: str) -> OrderSummaryRecord:
        # รองรับ FR-08 โดยอ่านรายการและยอดรวมจาก draft ที่ระบุ
        summary = self._order_repository.get_order_summary(order_date, order_id)
        if summary is None:
            raise OrderDraftNotFoundError
        return summary

    def update_item(
        self,
        order_item_id: int,
        quantity: int | None = None,
        sweetness_level: str | None = None,
        toppings: list[str] | None = None,
        ice_level: str | None = None,
    ) -> OrderItemUpdateRecord:
        # รองรับ FR-07 และ FR-09 โดยตรวจค่าที่แก้ก่อนคำนวณยอดรวมใหม่
        if quantity is not None and (not isinstance(quantity, int) or quantity < 0):
            raise ValueError("quantity must be a non-negative integer")
        if sweetness_level is not None and sweetness_level not in SWEETNESS_LEVELS:
            raise InvalidOrderOptionsError("A valid sweetness level is required")
        if toppings is not None and any(topping not in TOPPINGS for topping in toppings):
            raise InvalidOrderOptionsError("One or more toppings are invalid")
        if ice_level is not None and ice_level not in ICE_LEVELS:
            raise InvalidOrderOptionsError("The ice level is invalid")

        return self._order_repository.update_item(
            order_item_id, quantity, sweetness_level, toppings, ice_level
        )

    def confirm_order(
        self, order_date: date, order_id: str
    ) -> PaymentPreparationRecord:
        # รองรับ FR-10 และ FR-11 โดยตรวจรายการ ความหวาน และสถานะเมนูก่อนชำระเงิน
        summary = self._order_repository.get_order_summary(order_date, order_id)
        if summary is None:
            raise OrderDraftNotFoundError
        if not summary.items:
            raise OrderNotReadyError("Order must contain at least one item")

        options = self._order_repository.get_order_options(order_date, order_id)
        if options is None or len(options) != len(summary.items):
            raise OrderNotReadyError("Every order item must have sweetness selected")
        if any(not option.sweetness_level for option in options):
            raise OrderNotReadyError("Every order item must have sweetness selected")

        unavailable_menu_ids = [
            item.menu_item_id
            for item in summary.items
            if (
                self._menu_repository.get_menu_item(item.menu_item_id) is None
                or self._menu_repository.get_menu_item(item.menu_item_id).status != "open"
            )
        ]
        if unavailable_menu_ids:
            raise OrderOutOfStockError

        return self._order_repository.prepare_payment(order_date, order_id)


class OrderDraftService:
    """สร้าง draft และจองเลขอ้างอิงผ่าน repository ตาม FR-06 และ FR-12."""

    def __init__(self, order_repository: OrderRepository) -> None:
        self._order_repository = order_repository

    def create_draft(self) -> DraftOrderReference:
        # รองรับ FR-06: หมายเลข draft ถูกจองฝั่ง backend ไม่สร้างจาก client
        return self._order_repository.create_draft()
