from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKeyConstraint, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .order import Base


class PaymentTransaction(Base):
    # รองรับ FR-11, FR-12 และ NFR-23 โดยผูก transaction กับ Order ที่เกี่ยวข้อง
    __tablename__ = "payment_transactions"
    __table_args__ = (
        ForeignKeyConstraint(
            ["order_date", "order_id"],
            ["orders.order_date", "orders.order_id"],
            name="fk_payment_transactions_order",
        ),
    )

    payment_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_date: Mapped[date] = mapped_column(Date, nullable=False)
    order_id: Mapped[str] = mapped_column(String(3), nullable=False)
    qr_code: Mapped[str | None] = mapped_column(Text)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    payment_result: Mapped[str | None] = mapped_column(String)
    reference_key: Mapped[str | None] = mapped_column(String)

    order: Mapped[Order] = relationship(back_populates="payment_transactions")
