"""Mock identity provider for Menu Management.

References: NFR-SEC-05, AC-MENU-MGMT-13.
"""

from fastapi import Header, HTTPException


MOCK_USERS = {
    "admin": {"user_id": "admin", "role": "admin"},
    "staff": {"user_id": "staff", "role": "staff"},
    "student": {"user_id": "student", "role": "student"},
}


def get_current_user(x_user_id: str | None = Header(default=None)) -> dict[str, str]:
    """NFR-SEC-05: resolve the request's configured mock identity."""
    if x_user_id is None or x_user_id not in MOCK_USERS:
        raise HTTPException(status_code=401, detail="Authentication required")
    return MOCK_USERS[x_user_id]