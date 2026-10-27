from datetime import date
from decimal import Decimal
from typing import Annotated, Literal

from fastapi import APIRouter
from fastapi import Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator

from ..services.order_service import (
    MenuItemNotFoundError,
    MenuItemUnavailableError,
    DraftOrderReference,
    InvalidOrderOptionsError,
    MenuRepository,
    OrderDraftService,
    OrderDraftNotFoundError,
    OrderItemRecord,
    OrderItemUpdateRecord,
    OrderOptionRecord,
    OrderNotReadyError,
    OrderOutOfStockError,
    OrderRepository,
    OrderSummaryRecord,
    OrderService,
)


# รองรับ FR-06, FR-10 และ FR-11; endpoint behavior อยู่ใน tasks ที่ตามมา
router = APIRouter(prefix="/api/orders", tags=["orders"])
menu_router = APIRouter(tags=["menu"])

SweetnessLevel = Literal[
    "หวานปกติ 75%", "หวานน้อย 50%", "เพิ่มหวาน 100%", "ไม่หวาน"
]
Topping = Literal[
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
]
IceLevel = Literal["น้ำแข็งน้อย (ปริมาณน้ำเท่าเดิม)", "ไม่ใส่น้ำแข็ง", "แยกน้ำแข็ง"]


# รองรับ FR-06 และ Constraint จำนวนเต็มมากกว่า 0 สำหรับการเพิ่มรายการใน draft
class AddOrderItemRequest(BaseModel):
    order_date: date
    order_id: str = Field(pattern=r"^[0-9]{3}$")
    menu_item_id: int = Field(gt=0)
    quantity: int = Field(gt=0, strict=True)
    sweetness_level: SweetnessLevel
    toppings: list[Topping] | None = None
    ice_level: IceLevel | None = None

    @field_validator("order_id")
    @classmethod
    def reject_zero_order_id(cls, value: str) -> str:
        if value == "000":
            raise ValueError("order_id must be between 001 and 999")
        return value


# รองรับ FR-06 โดยส่งผล OrderItem ที่ถูกเพิ่มกลับไปยังผู้ใช้
class AddedOrderItemResponse(BaseModel):
    order_item_id: int
    order_date: date
    order_id: str
    menu_item_id: int
    quantity: int
    sweetness_level: str
    toppings: list[str] | None
    ice_level: str


# รองรับ FR-06 ด้วย reference สำหรับ Order ที่ backend จองไว้
class DraftOrderResponse(BaseModel):
    order_date: date
    order_id: str


# รองรับ FR-06 โดยให้หน้าจอเลือกจากรายการเมนูที่เปิดขาย
class MenuItemResponse(BaseModel):
    menu_id: int
    name: str
    status: str
    price: Decimal


# รองรับ FR-06 ด้วย contract รายการเมนูของ SPEC-MENU-001
class MenuResponse(BaseModel):
    items: list[MenuItemResponse]


# รองรับ FR-08 และ AC-ORDER-03 โดยคืนรายละเอียดราคาต่อรายการ
class OrderSummaryItemResponse(BaseModel):
    order_item_id: int
    menu_item_id: int
    name: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal


# รองรับ FR-08 และ AC-ORDER-03 โดยคืนรายการและยอดรวมของ draft
class OrderSummaryResponse(BaseModel):
    order_date: date
    order_id: str
    items: list[OrderSummaryItemResponse]
    total_amount: Decimal


# รองรับ FR-07 และ FR-09 สำหรับการแก้จำนวนหรือตัวเลือกก่อนยืนยัน Order
class UpdateOrderItemRequest(BaseModel):
    quantity: int | None = Field(default=None, ge=0, strict=True)
    sweetness_level: SweetnessLevel | None = None
    toppings: list[Topping] | None = None
    ice_level: IceLevel | None = None


# รองรับ FR-08 และ FR-09 โดยคืนรายการที่แก้ไขและยอดรวมใหม่
class UpdatedOrderItemResponse(BaseModel):
    order_item_id: int | None
    quantity: int | None
    sweetness_level: str | None
    toppings: list[str] | None
    ice_level: str | None
    total_amount: Decimal


# รองรับ FR-10 และ FR-11 โดยคืนผลการตรวจ Order ก่อนเข้าสู่การชำระเงิน
class ConfirmOrderRequest(BaseModel):
    order_date: date
    order_id: str = Field(pattern=r"^[0-9]{3}$")


# รองรับ FR-11 โดยส่ง Order ที่พร้อมเข้าสู่ขั้นตอนชำระเงิน
class ConfirmOrderResponse(BaseModel):
    order_date: date
    order_id: str
    payment_status: Literal["pending"]


def get_menu_repository() -> MenuRepository:
    # รองรับ FR-06; การติดตั้งระบบจริงต้อง inject repository ของเมนู
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Menu repository is not configured",
    )


def get_order_repository() -> OrderRepository:
    # รองรับ FR-06; การติดตั้งระบบจริงต้อง inject repository ของ draft Order
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Order repository is not configured",
    )


def get_order_service(
    menu_repository: Annotated[MenuRepository, Depends(get_menu_repository)],
    order_repository: Annotated[OrderRepository, Depends(get_order_repository)],
) -> OrderService:
    # รองรับ FR-06 โดยแยกการเพิ่มรายการและตรวจสถานะเมนูออกจาก route
    return OrderService(menu_repository, order_repository)


def get_order_draft_service(
    order_repository: Annotated[OrderRepository, Depends(get_order_repository)],
) -> OrderDraftService:
    # รองรับ FR-06 โดยแยกการจอง draft ออกจาก route
    return OrderDraftService(order_repository)


@menu_router.get("/api/menu", response_model=MenuResponse)
def list_menu_items(
    menu_repository: Annotated[MenuRepository, Depends(get_menu_repository)],
) -> MenuResponse:
    # รองรับ FR-06 โดยคืนรายการเมนูและสถานะให้หน้าเลือกเครื่องดื่ม
    return MenuResponse(
        items=[
            MenuItemResponse(
                menu_id=item.menu_id,
                name=item.name,
                status=item.status,
                price=item.price,
            )
            for item in menu_repository.list_menu_items()
        ]
    )


@router.post(
    "/drafts",
    response_model=DraftOrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_draft_order(
    service: Annotated[OrderDraftService, Depends(get_order_draft_service)],
) -> DraftOrderResponse:
    # รองรับ FR-06 โดยจองหมายเลข draft ผ่าน backend ก่อนให้ client เพิ่มรายการ
    draft: DraftOrderReference = service.create_draft()
    return DraftOrderResponse(order_date=draft.order_date, order_id=draft.order_id)


@router.get("/preview", response_model=OrderSummaryResponse)
def get_order_summary(
    order_date: date,
    order_id: Annotated[str, Query(pattern=r"^[0-9]{3}$")],
    service: Annotated[OrderService, Depends(get_order_service)],
) -> OrderSummaryResponse:
    # รองรับ FR-08 โดยอ่าน summary จาก service สำหรับ draft ที่ผู้ใช้กำลังตรวจสอบ
    try:
        summary: OrderSummaryRecord = service.get_summary(order_date, order_id)
    except OrderDraftNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order draft not found",
        ) from exc

    return OrderSummaryResponse(
        order_date=order_date,
        order_id=order_id,
        items=[
            OrderSummaryItemResponse(
                order_item_id=item.order_item_id,
                menu_item_id=item.menu_item_id,
                name=item.name,
                quantity=item.quantity,
                unit_price=item.unit_price,
                line_total=item.line_total,
            )
            for item in summary.items
        ],
        total_amount=summary.total_amount,
    )


@router.post("/confirm", response_model=ConfirmOrderResponse)
def confirm_order(
    request: ConfirmOrderRequest,
    service: Annotated[OrderService, Depends(get_order_service)],
) -> ConfirmOrderResponse:
    # รองรับ FR-10 และ FR-11 โดยไม่เริ่มชำระเงินหาก Order หรือสต็อกไม่พร้อม
    try:
        result = service.confirm_order(request.order_date, request.order_id)
    except OrderDraftNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order draft not found",
        ) from exc
    except OrderNotReadyError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except OrderOutOfStockError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Menu item is out of stock; choose another menu",
        ) from exc

    return ConfirmOrderResponse(
        order_date=result.order_date,
        order_id=result.order_id,
        payment_status="pending",
    )


@router.post(
    "/items",
    response_model=AddedOrderItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_order_item(
    request: AddOrderItemRequest,
    service: Annotated[OrderService, Depends(get_order_service)],
) -> AddedOrderItemResponse:
    # รองรับ FR-06: เพิ่มเมนูที่เปิดขายลง draft Order เท่านั้น
    try:
        item: OrderItemRecord = service.add_item(
            request.order_date,
            request.order_id,
            request.menu_item_id,
            request.quantity,
        )
        options: OrderOptionRecord = service.save_item_options(
            item.order_item_id,
            request.sweetness_level,
            request.toppings,
            request.ice_level,
        )
    except MenuItemNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found",
        ) from exc
    except MenuItemUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Menu item is not available for ordering",
        ) from exc

    return AddedOrderItemResponse(
        order_item_id=item.order_item_id,
        order_date=item.order_date,
        order_id=item.order_id,
        menu_item_id=item.menu_item_id,
        quantity=item.quantity,
        sweetness_level=options.sweetness_level,
        toppings=options.toppings,
        ice_level=options.ice_level,
    )


@router.patch(
    "/items/{order_item_id}",
    response_model=UpdatedOrderItemResponse,
)
def update_order_item(
    order_item_id: int,
    request: UpdateOrderItemRequest,
    service: Annotated[OrderService, Depends(get_order_service)],
) -> UpdatedOrderItemResponse:
    # รองรับ FR-07 และ FR-09 โดยแก้หรือลบรายการก่อนยืนยันคำสั่งซื้อ
    try:
        result: OrderItemUpdateRecord = service.update_item(
            order_item_id,
            request.quantity,
            request.sweetness_level,
            request.toppings,
            request.ice_level,
        )
    except InvalidOrderOptionsError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except OrderDraftNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order item not found",
        ) from exc

    item = result.item
    return UpdatedOrderItemResponse(
        order_item_id=item.order_item_id if item else None,
        quantity=item.quantity if item else None,
        sweetness_level=result.sweetness_level,
        toppings=result.toppings,
        ice_level=result.ice_level,
        total_amount=result.total_amount,
    )
