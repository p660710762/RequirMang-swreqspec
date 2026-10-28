from decimal import Decimal

from backend.app.database import SessionLocal
from backend.app.models.menu import MenuItemEntity
from backend.app.models.order import Order
from backend.app.models.order_item import OrderItem, OrderOption


def add_staff_order(
    order_id,
    created_at,
    status,
    *,
    order_date=None,
    owner_user_id=None,
    items=(),
):
    with SessionLocal.begin() as session:
        order = Order(
            order_date=order_date or created_at.date(),
            order_id=order_id,
            status=status,
            created_at=created_at,
            total_amount=sum(
                (
                    Decimal(str(item.get("unit_price", 0)))
                    * item.get("quantity", 1)
                    for item in items
                ),
                Decimal("0"),
            ),
            payment_status="success",
            owner_user_id=owner_user_id,
        )
        session.add(order)
        session.flush()

        for index, item_data in enumerate(items):
            menu_item_id = item_data.get("menu_item_id", 9000 + index)
            menu_item = session.get(MenuItemEntity, menu_item_id)
            if menu_item is None:
                menu_item = MenuItemEntity(
                    menu_id=menu_item_id,
                    name=item_data["menu_item_name"],
                    price=Decimal(str(item_data.get("unit_price", 0))),
                    status="open",
                )
                session.add(menu_item)
                session.flush()
            order_item = OrderItem(
                order_date=order.order_date,
                order_id=order.order_id,
                menu_item_id=menu_item_id,
                quantity=item_data.get("quantity", 1),
                unit_price=Decimal(str(item_data.get("unit_price", 0))),
                line_total=(
                    Decimal(str(item_data.get("unit_price", 0)))
                    * item_data.get("quantity", 1)
                ),
            )
            session.add(order_item)
            session.flush()

            selected_options = item_data.get("selected_options", [])
            if selected_options:
                session.add(
                    OrderOption(
                        order_item_id=order_item.order_item_id,
                        sweetness_level=selected_options[0],
                        ice_level=selected_options[1]
                        if len(selected_options) > 1
                        else "ใส่น้ำแข็งปริมาณปกติ",
                        toppings=selected_options[2:] or None,
                    )
                )
