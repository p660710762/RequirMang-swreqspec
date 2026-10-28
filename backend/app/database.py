from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

DEFAULT_DATABASE_URL = (
    f"sqlite:///{Path(__file__).resolve().parents[1] / 'order.sqlite3'}"
)


def _database_url() -> str:
    if url := os.getenv("ORDER_DATABASE_URL"):
        return url
    if path := os.getenv("ORDER_DATABASE_PATH"):
        return f"sqlite:///{path}"
    return DEFAULT_DATABASE_URL


DATABASE_URL = _database_url()


def _create_engine(url: str) -> Engine:
    return create_engine(
        url,
        connect_args={"check_same_thread": False} if url.startswith("sqlite") else {},
    )


engine = _create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def configure_database() -> None:
    global DATABASE_URL, engine
    url = _database_url()
    if url == DATABASE_URL:
        return
    engine.dispose()
    engine = _create_engine(url)
    SessionLocal.configure(bind=engine)
    DATABASE_URL = url
    init_database()


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
        missing_columns = {
            "promotion_price": "NUMERIC",
            "promotion": "JSON",
            "created_at": "DATETIME",
            "updated_at": "DATETIME",
        }
        with engine.begin() as connection:
            for name, column_type in missing_columns.items():
                if name not in columns:
                    connection.execute(
                        text(f"ALTER TABLE menu_items ADD COLUMN {name} {column_type}")
                    )
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
