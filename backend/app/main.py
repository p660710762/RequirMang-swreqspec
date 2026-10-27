"""FastAPI entry point for Menu Management and Order APIs.

References: FR-06, FR-10, FR-11, FR-42, FR-43, FR-45, FR-46, FR-47.
"""

from fastapi import FastAPI

from .routes.menu import router as menu_management_router
from .routes.orders import menu_router as public_menu_router
from .routes.orders import router as orders_router


app = FastAPI(title="Menu Management and Order API")

# รองรับ FR-42, FR-43, FR-45, FR-46 และ FR-47 สำหรับ API จัดการเมนูของ Admin
app.include_router(menu_management_router)
# รองรับ FR-06 สำหรับ API รายการเมนูที่ใช้ในหน้าเลือกเครื่องดื่ม
app.include_router(public_menu_router)
# รองรับ FR-06, FR-10 และ FR-11 สำหรับ API ของ Order
app.include_router(orders_router)