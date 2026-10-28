from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv(
    "ORDER_DATABASE_URL",
    f"sqlite:///{Path(__file__).resolve().parents[1] / 'order.sqlite3'}",
)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def init_database() -> None:
    """สร้างตาราง persistence ของ Order และเมนูที่ Order อ้างอิง."""
    from .models.menu import MenuItemEntity
    from .models.order import Base
    from .models.order_item import OrderItem, OrderOption
    from .models.payment_transaction import PaymentTransaction

    Base.metadata.create_all(bind=engine)
    if "menu_items" in inspect(engine).get_table_names():
        columns = {
            column["name"] for column in inspect(engine).get_columns("menu_items")
        }
        if "promotion_price" not in columns:
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE menu_items ADD COLUMN promotion_price NUMERIC"))
    with SessionLocal.begin() as session:
        if session.query(MenuItemEntity).count() == 0:
            from .seed import seed_menu_data

            session.add_all(
                [
                    MenuItemEntity(
                        menu_id=item["menu_id"],
                        name=item["name"],
                        price=item["price"],
                        status=item["status"],
                    )
                    for item in seed_menu_data()["menu_items"]
                ]
            )
