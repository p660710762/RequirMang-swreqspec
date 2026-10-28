from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal
import re

from sqlalchemy import CheckConstraint, Date, DateTime, Numeric, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, validates


class Base(DeclarativeBase):
    """ฐาน ORM สำหรับโมเดล Order ตาม FR-06 ถึง FR-12 และ NFR-23."""


class Order(Base):
    # รองรับ FR-08, FR-10, FR-11, FR-12 และ NFR-23
    __tablename__ = "orders"
    __table_args__ = (
        CheckConstraint(
            "payment_status IN ('pending', 'success', 'failed', 'timeout')",
            name="ck_orders_payment_status",
        ),
    )

    order_date: Mapped[date] = mapped_column(Date, primary_key=True)
    order_id: Mapped[str] = mapped_column(String(3), primary_key=True)
    status: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    total_amount: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    payment_status: Mapped[str] = mapped_column(String, nullable=False)
    owner_user_id: Mapped[str | None] = mapped_column(String, nullable=True)
    last_status_change_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )

    items: Mapped[list[OrderItem]] = relationship(back_populates="order")
    payment_transactions: Mapped[list[PaymentTransaction]] = relationship(
        back_populates="order"
    )

    @validates("order_id")
    def validate_order_id(self, _key: str, value: str) -> str:
        # รองรับ FR-12: หมายเลข Order เป็นเลขสามหลักตั้งแต่ 001 ถึง 999
        if (
            not isinstance(value, str)
            or not re.fullmatch(r"[0-9]{3}", value)
            or value == "000"
        ):
            raise ValueError("order_id must be a three-digit number from 001 to 999")
        return value
