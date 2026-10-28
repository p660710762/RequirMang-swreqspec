"""Authorization dependency for menu management routes.

References: NFR-SEC-05, AC-MENU-MGMT-13.
"""

from fastapi import Depends, HTTPException

from ..auth import get_current_user


def require_admin(user: dict[str, str] = Depends(get_current_user)) -> dict[str, str]:
    """NFR-SEC-05: allow only mock users with the Admin role."""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")


def require_staff(user: dict[str, str] = Depends(get_current_user)) -> dict[str, str]:
    """FR-29 and Staff-access constraint: allow only authenticated Staff users."""
    if user.get("role") != "staff":
        raise HTTPException(status_code=403, detail="Staff access required")
    return user