"""Data schemas shared by Menu Management and Order features."""

from dataclasses import asdict, dataclass
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Integer, JSON, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .order import Base


@dataclass
class MenuItem:
    """FR-42, FR-43, FR-45: menu data with optional description and image."""

    menu_id: int
    name: str
    price: float
    status: str
    description: str | None = None
    image_url: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class Promotion:
    """FR-44: promotion data with required start and end datetimes."""

    promotion_id: int
    menu_id: int
    promotion_name: str
    discount_value: float
    is_active: bool
    start_at: datetime
    end_at: datetime

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class MenuHistory:
    """FR-49, NFR-REL-08: retain required previous and updated menu values."""

    history_id: int
    menu_id: int
    old_price: float
    new_price: float
    old_status: str
    new_status: str
    updated_by: str
    updated_at: datetime

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class OrderSnapshot:
    """FR-49, NFR-REL-09: preserve menu values used by an existing order."""

    order_id: int
    menu_id: int
    snapshot_price: float
    snapshot_name: str
    snapshot_status_at_order: str

    def to_dict(self) -> dict:
        return asdict(self)


class MenuItemEntity(Base):
    """Persisted menu record used by Order APIs (FR-06 and FR-08)."""

    __tablename__ = "menu_items"

    menu_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    promotion_price: Mapped[Decimal | None] = mapped_column(Numeric, nullable=True)
    promotion: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="menu_item")
