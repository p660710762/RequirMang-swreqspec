from app.models.order_item import OrderItem, OrderOption
from app.models.payment_transaction import PaymentTransaction
from app.services.history_service import ORDER_SNAPSHOT_STORE, create_order_snapshot
from app.services.menu_service import list_menu_items
from app.services.menu_status_service import update_menu_status


def _existing_menu() -> dict:
    return next(item for item in list_menu_items() if item["menu_id"] == 1)


def test_TC_MENU_MGMT_14_1_old_order_keeps_snapshot_after_sold_out():
    ORDER_SNAPSHOT_STORE.clear()
    menu = _existing_menu()

    # Given มี Order เดิมที่ใช้เมนูและเกิดขึ้นก่อนเมนูถูกเปลี่ยนเป็น “หมด”
    snapshot = create_order_snapshot(
        "order-menu-mgmt-14-1",
        menu["menu_id"],
        snapshot_name=menu["name"],
        snapshot_price=menu["price"],
        snapshot_status_at_order=menu["status"],
    )

    try:
        # When Admin เปลี่ยนสถานะเมนูเป็น “หมด”
        updated = update_menu_status(menu["menu_id"], "sold_out")

        # Then Order เดิมยังคงมีข้อมูลเดิมและสามารถตรวจสอบได้
        assert updated["status"] == "sold_out"
        assert snapshot["snapshot_name"] == menu["name"]
        assert snapshot["snapshot_price"] == menu["price"]
        assert snapshot["snapshot_status_at_order"] == menu["status"]
    finally:
        update_menu_status(menu["menu_id"], menu["status"])


def test_TC_MENU_MGMT_14_2_all_old_orders_keep_snapshots():
    ORDER_SNAPSHOT_STORE.clear()
    menu = _existing_menu()
    snapshots = [
        create_order_snapshot(
            f"order-menu-mgmt-14-2-{index}",
            menu["menu_id"],
            snapshot_name=menu["name"],
            snapshot_price=menu["price"],
            snapshot_status_at_order=menu["status"],
        )
        for index in (1, 2)
    ]

    try:
        # When Admin เปลี่ยนสถานะเมนูเป็น “หมด”
        updated = update_menu_status(menu["menu_id"], "sold_out")

        # Then Order เดิมทุก Order ยังคงมีข้อมูลเดิมและสามารถตรวจสอบได้
        assert updated["status"] == "sold_out"
        assert len(snapshots) == 2
        assert all(snapshot["snapshot_name"] == menu["name"] for snapshot in snapshots)
        assert all(snapshot["snapshot_price"] == menu["price"] for snapshot in snapshots)
        assert all(
            snapshot["snapshot_status_at_order"] == menu["status"]
            for snapshot in snapshots
        )
    finally:
        update_menu_status(menu["menu_id"], menu["status"])
