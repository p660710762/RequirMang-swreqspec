"""Configuration values for menu management.

References: FR-43, FR-45, FR-46, FR-49, ASM-09, ASM-10, ASM-11, ASM-14,
NFR-REL-08, NFR-REL-09.
"""

from typing import Final


# Constraint: staff order history is available for up to 7 days.
STAFF_ORDER_RETENTION_DAYS: Final[int] = 7


MENU_STATUS_OPEN: Final[str] = "open"
MENU_STATUS_SOLD_OUT: Final[str] = "sold_out"
VALID_MENU_STATUSES: Final[tuple[str, ...]] = (MENU_STATUS_OPEN, MENU_STATUS_SOLD_OUT)

required_menu_fields: Final[tuple[str, ...]] = ("name", "price", "status")
retain_order_snapshot: Final[bool] = True
transactional_save: Final[bool] = True

promotion_start_datetime: Final[str] = "start_at"
promotion_end_datetime: Final[str] = "end_at"
promotion_datetime_format: Final[str] = "ISO 8601 with timezone"
promotion_requires_datetime: Final[bool] = True