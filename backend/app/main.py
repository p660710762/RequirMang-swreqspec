"""FastAPI entry point for Menu Management and Order APIs.

References: FR-06, FR-10, FR-11, FR-42, FR-43, FR-45, FR-46, FR-47.
"""

from fastapi import FastAPI

from .routes.menu import public_router as menu_public_router
from .routes.menu import router as menu_management_router
from .routes.orders import menu_router as public_menu_router
from .routes.orders import router as orders_router


app = FastAPI(title="Menu Management and Order API")

app.include_router(menu_management_router)
app.include_router(public_menu_router)
app.include_router(menu_public_router)
app.include_router(orders_router)
