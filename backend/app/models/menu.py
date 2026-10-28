from __future__ import annotations

from decimal import Decimal

from sqlalchemy import Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .order import Base


class MenuItemEntity(Base):
    """ข้อมูลเมนูที่ Order อ่านจาก persistence ตาม FR-06 และ FR-08."""

    __tablename__ = "menu_items"

    menu_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    promotion_price: Mapped[Decimal | None] = mapped_column(Numeric, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False)

    order_items: Mapped[list["OrderItem"]] = relationship(
        back_populates="menu_item"
    )
