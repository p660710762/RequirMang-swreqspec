"""Data schemas for the Menu Management feature.

References: FR-42, FR-43, FR-44, FR-45, FR-49, NFR-REL-08, NFR-REL-09.
"""

from dataclasses import asdict, dataclass
from datetime import datetime


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
        """FR-42: return menu fields for the admin view and API layer."""
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
        """FR-44: return promotion fields for menu management."""
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
        """FR-49: return historical menu data without changing order snapshots."""
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
        """FR-49: return the original menu values attached to an order."""
        return asdict(self)