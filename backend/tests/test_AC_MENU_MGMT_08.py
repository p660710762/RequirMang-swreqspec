from app.models.order import Order
from app.models.order_item import OrderItem, OrderOption
from app.models.payment_transaction import PaymentTransaction
from app.services.history_service import (
    ORDER_SNAPSHOT_STORE,
    create_order_snapshot,
)
from app.services.menu_service import list_menu_items, update_menu_item


def _existing_menu() -> dict:
    return next(item for item in list_menu_items() if item["menu_id"] == 1)


def test_TC_MENU_MGMT_08_1_old_order_keeps_original_menu_data():
    ORDER_SNAPSHOT_STORE.clear()
    menu = _existing_menu()

    # Given มี Order ที่เกิดขึ้นก่อนการแก้ไขข้อมูลเมนู และเก็บชื่อ ราคา และสถานะเดิมไว้
    snapshot = create_order_snapshot(
        "order-menu-mgmt-08-1",
        menu["menu_id"],
        snapshot_name=menu["name"],
        snapshot_price=menu["price"],
        snapshot_status_at_order=menu["status"],
    )

    try:
        # When Admin แก้ไขราคาและสถานะของเมนู
        update_menu_item(
            menu["menu_id"],
            {"price": 60, "status": "sold_out"},
        )

        # Then ข้อมูล Order เดิมยังตรวจสอบได้และไม่เปลี่ยนแปลงโดยอัตโนมัติ
        assert snapshot["snapshot_name"] == menu["name"]
        assert snapshot["snapshot_price"] == menu["price"]
        assert snapshot["snapshot_status_at_order"] == menu["status"]
    finally:
        update_menu_item(
            menu["menu_id"],
            {
                "price": menu["price"],
                "status": menu["status"],
                "description": menu["description"],
                "image_url": menu["image_url"],
            },
        )


def test_TC_MENU_MGMT_08_2_old_order_survives_single_menu_change():
    ORDER_SNAPSHOT_STORE.clear()
    menu = _existing_menu()

    # Given มี Order ที่เกิดขึ้นก่อนการแก้ไขข้อมูลเมนู และ Admin จะแก้ไขเพียงราคา
    snapshot = create_order_snapshot(
        "order-menu-mgmt-08-2",
        menu["menu_id"],
        snapshot_name=menu["name"],
        snapshot_price=menu["price"],
        snapshot_status_at_order=menu["status"],
    )

    try:
        # When Admin บันทึกการแก้ไขราคาเพียงรายการเดียว
        update_menu_item(menu["menu_id"], {"price": menu["price"] + 1})

        # Then ข้อมูล Order เดิมยังตรวจสอบได้และไม่ถูกเปลี่ยนแปลงโดยอัตโนมัติ
        assert snapshot["snapshot_name"] == menu["name"]
        assert snapshot["snapshot_price"] == menu["price"]
        assert snapshot["snapshot_status_at_order"] == menu["status"]
    finally:
        update_menu_item(
            menu["menu_id"],
            {
                "price": menu["price"],
                "status": menu["status"],
                "description": menu["description"],
                "image_url": menu["image_url"],
            },
        )
