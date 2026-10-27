from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    Date,
    ForeignKey,
    ForeignKeyConstraint,
    Integer,
    JSON,
    Numeric,
    String,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .order import Base


class OrderItem(Base):
    # รองรับ FR-06, FR-07, FR-08, FR-09 และ Constraint จำนวนต้องมากกว่า 0
    __tablename__ = "order_items"
    __table_args__ = (
        ForeignKeyConstraint(
            ["order_date", "order_id"],
            ["orders.order_date", "orders.order_id"],
            name="fk_order_items_order",
        ),
        CheckConstraint("quantity > 0", name="ck_order_items_quantity_positive"),
    )

    order_item_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_date: Mapped[date] = mapped_column(Date, nullable=False)
    order_id: Mapped[str] = mapped_column(String(3), nullable=False)
    menu_item_id: Mapped[int] = mapped_column(
        ForeignKey("menu_items.menu_id"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Numeric, nullable=False)

    order: Mapped[Order] = relationship(back_populates="items")
    options: Mapped[OrderOption | None] = relationship(
        back_populates="order_item", uselist=False
    )


class OrderOption(Base):
    # รองรับ FR-07 โดยผูกตัวเลือกและระดับความหวานที่จำเป็นกับ OrderItem แต่ละรายการ
    __tablename__ = "order_options"
    __table_args__ = (
        CheckConstraint(
            "sweetness_level IN ('หวานปกติ 75%', 'หวานน้อย 50%', "
            "'เพิ่มหวาน 100%', 'ไม่หวาน')",
            name="ck_order_options_sweetness_level",
        ),
        CheckConstraint(
            "ice_level IN ('น้ำแข็งน้อย (ปริมาณน้ำเท่าเดิม)', 'ไม่ใส่น้ำแข็ง', "
            "'แยกน้ำแข็ง', 'ใส่น้ำแข็งปริมาณปกติ')",
            name="ck_order_options_ice_level",
        ),
    )

    order_option_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_item_id: Mapped[int] = mapped_column(
        ForeignKey("order_items.order_item_id"), nullable=False, unique=True
    )
    sweetness_level: Mapped[str] = mapped_column(String, nullable=False)
    toppings: Mapped[list[str] | None] = mapped_column(JSON)
    ice_level: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="ใส่น้ำแข็งปริมาณปกติ",
        server_default=text("'ใส่น้ำแข็งปริมาณปกติ'"),
    )

    order_item: Mapped[OrderItem] = relationship(back_populates="options")
