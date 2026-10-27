from fastapi import FastAPI

from .routes.orders import menu_router, router as orders_router


# รองรับ FR-06, FR-10 และ FR-11 โดยโหลด route boundary ของ Order
app = FastAPI()
app.include_router(orders_router)
app.include_router(menu_router)
