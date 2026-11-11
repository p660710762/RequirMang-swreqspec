"""Helpers for exposing the promotion stored on current menu records."""

from datetime import datetime, timezone
from typing import Any


def serialize_promotion(promotion: dict[str, Any] | None) -> dict[str, Any] | None:
    if not isinstance(promotion, dict):
        return promotion
    serialized = dict(promotion)
    for field in ("start_at", "end_at"):
        value = serialized.get(field)
        if isinstance(value, datetime):
            serialized[field] = value.isoformat()
    return serialized


def is_active_promotion(promotion: dict[str, Any] | None, now: datetime | None = None) -> bool:
    if not isinstance(promotion, dict):
        return False
    if promotion.get("status") == "inactive":
        return False
    try:
        start_at = datetime.fromisoformat(str(promotion["start_at"]).replace("Z", "+00:00"))
        end_at = datetime.fromisoformat(str(promotion["end_at"]).replace("Z", "+00:00"))
    except (KeyError, TypeError, ValueError):
        return False
    current = now or datetime.now(timezone.utc)
    if start_at.tzinfo is None or end_at.tzinfo is None:
        return False
    return start_at <= current <= end_at


def promotion_response(
    promotion: dict[str, Any] | None,
    menu_id: int,
    now: datetime | None = None,
) -> dict[str, Any] | None:
    if not is_active_promotion(promotion, now):
        return None
    return {
        "id": promotion.get("promotion_id", promotion.get("id", menu_id)),
        "title": promotion.get("promotion_name", promotion.get("title", "")),
        "discount_value": float(promotion.get("discount_value") or 0),
        "status": "active",
    }
