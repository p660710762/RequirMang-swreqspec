"""Validation for required menu fields.

References: FR-43, FR-46, ASM-10.
"""

import math
from datetime import datetime, timezone
import re
from typing import Any

from backend.app.config import MENU_STATUS_OPEN, MENU_STATUS_SOLD_OUT, required_menu_fields


ISO_DATETIME_WITH_TIMEZONE = re.compile(
    r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$"
)


def _validate_promotion_datetime(promotion: dict[str, Any]) -> dict[str, Any]:
    """FR-44, ASM-14: require valid timezone-aware promotion boundaries."""
    promotion_name = promotion.get("promotion_name")
    discount_value = promotion.get("discount_value")
    if discount_value is not None and (not isinstance(promotion_name, str) or not promotion_name.strip()):
        raise ValueError("Promotion name is required")
    start_at = promotion.get("start_at")
    end_at = promotion.get("end_at")
    if not start_at or not end_at:
        raise ValueError("Promotion start_at and end_at are required")
    if not isinstance(start_at, str) or not ISO_DATETIME_WITH_TIMEZONE.fullmatch(start_at):
        raise ValueError("Promotion start_at must be ISO 8601 datetime with timezone")
    if not isinstance(end_at, str) or not ISO_DATETIME_WITH_TIMEZONE.fullmatch(end_at):
        raise ValueError("Promotion end_at must be ISO 8601 datetime with timezone")

    start = datetime.fromisoformat(start_at.replace("Z", "+00:00"))
    end = datetime.fromisoformat(end_at.replace("Z", "+00:00"))
    if end < start:
        raise ValueError("Promotion end_at must not be before start_at")
    if start < datetime.now(timezone.utc):
        raise ValueError("Promotion start_at must not be in the past")
    if end < datetime.now(timezone.utc):
        raise ValueError("Promotion end_at must not be in the past")
    validated = dict(promotion)
    if isinstance(promotion_name, str):
        validated["promotion_name"] = promotion_name.strip()
    return validated


def validate_menu_payload(payload: dict[str, Any], *, partial: bool = False) -> dict[str, Any]:
    """FR-43, FR-46: validate required fields and preserve optional fields."""
    validated = dict(payload)
    fields_to_require = () if partial else required_menu_fields
    missing = [field for field in fields_to_require if validated.get(field) in (None, "")]
    if missing:
        raise ValueError(f"Missing required menu fields: {', '.join(missing)}")

    if "name" in validated and validated["name"] is not None:
        if not isinstance(validated["name"], str) or not validated["name"].strip():
            raise ValueError("Menu name is required")
        validated["name"] = validated["name"].strip()

    if "price" in validated and validated["price"] is not None:
        try:
            validated["price"] = float(validated["price"])
        except (TypeError, ValueError) as exc:
            raise ValueError("Menu price must be numeric") from exc
        if not math.isfinite(validated["price"]):
            raise ValueError("Menu price must be numeric")
        if validated["price"] <= 0:
            raise ValueError("Menu price must be greater than 0")

    if "status" in validated and validated["status"] is not None:
        if validated["status"] not in {MENU_STATUS_OPEN, MENU_STATUS_SOLD_OUT}:
            raise ValueError("Menu status must be either 'open' or 'sold_out'")

    if "promotion" in validated:
        if validated["promotion"] is None:
            return validated
        if not isinstance(validated["promotion"], dict):
            raise ValueError("Menu promotion must be an object")
        validated["promotion"] = _validate_promotion_datetime(validated["promotion"])

    return validated
