"""Authorization dependency for menu management routes.

References: NFR-SEC-05, AC-MENU-MGMT-13.
"""

from fastapi import Depends, HTTPException

from backend.app.auth import get_current_user


def require_admin(user: dict[str, str] = Depends(get_current_user)) -> dict[str, str]:
    """NFR-SEC-05: allow only mock users with the Admin role."""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user