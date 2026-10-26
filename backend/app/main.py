"""FastAPI entry point for Menu Management.

References: FR-42, FR-43, FR-45, FR-46, FR-47.
"""

from fastapi import FastAPI

from backend.app.routes.menu import router as menu_router


app = FastAPI(title="Menu Management API")
app.include_router(menu_router)