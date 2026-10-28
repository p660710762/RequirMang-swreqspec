from datetime import date
from decimal import Decimal

from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models.order import Order
from app.models.order_item import OrderItem, OrderOption
from app.models.menu import MenuItemEntity


def test_order_api_uses_sqlite_persistence():
    client = TestClient(app)
    draft = client.post("/api/orders/drafts")
    assert draft.status_code == 201
    reference = draft.json()

    try:
        added = client.post(
            "/api/orders/items",
            json={
                **reference,
                "menu_item_id": 1,
                "quantity": 2,
                "sweetness_level": "หวานปกติ 75%",
            },
        )
        assert added.status_code == 201
        item_id = added.json()["order_item_id"]

        summary = client.get("/api/orders/preview", params=reference)
        assert summary.status_code == 200
        assert summary.json()["items"][0]["quantity"] == 2

        from app.repositories.order_repository import SqliteOrderRepository

        persisted = SqliteOrderRepository().get_order_summary(
            date.fromisoformat(reference["order_date"]), reference["order_id"]
        )
        assert persisted is not None
        assert persisted.items[0].order_item_id == item_id
    finally:
        with SessionLocal.begin() as session:
            order = session.get(
                Order, (date.fromisoformat(reference["order_date"]), reference["order_id"])
            )
            if order is not None:
                session.query(OrderOption).filter(
                    OrderOption.order_item_id.in_(
                        session.query(OrderItem.order_item_id).filter(
                            OrderItem.order_date == order.order_date,
                            OrderItem.order_id == order.order_id,
                        )
                    )
                ).delete(synchronize_session=False)
                session.query(OrderItem).filter(
                    OrderItem.order_date == order.order_date,
                    OrderItem.order_id == order.order_id,
                ).delete(synchronize_session=False)
                session.delete(order)


def test_AC_MENU_MGMT_02_created_menu_is_visible_in_customer_catalog():
    client = TestClient(app)
    menu_name = "ชาเขียว integration test"

    created = client.post(
        "/api/admin/menu",
        headers={"X-User-Id": "admin"},
        json={
            "name": menu_name,
            "price": 55,
            "status": "open",
            "description": "ชาเขียว",
            "image_url": None,
        },
    )
    assert created.status_code == 200
    menu_id = created.json()["menu_id"]

    try:
        admin_items = client.get(
            "/api/admin/menu", headers={"X-User-Id": "admin"}
        ).json()
        customer_items = client.get("/api/menu").json()["items"]

        assert any(item["menu_id"] == menu_id for item in admin_items)
        assert any(
            item["menu_id"] == menu_id and item["name"] == menu_name
            for item in customer_items
        )

        updated = client.patch(
            f"/api/admin/menu/{menu_id}/status",
            headers={"X-User-Id": "admin"},
            json={"status": "sold_out"},
        )
        assert updated.status_code == 200
        customer_item = next(
            item
            for item in client.get("/api/menu").json()["items"]
            if item["menu_id"] == menu_id
        )
        assert customer_item["status"] == "sold_out"
    finally:
        with SessionLocal.begin() as session:
            item = session.get(MenuItemEntity, menu_id)
            if item is not None:
                session.delete(item)


def _delete_order(order_date: date, order_id: str) -> None:
    with SessionLocal.begin() as session:
        order = session.get(Order, (order_date, order_id))
        if order is None:
            return
        item_ids = [
            item.order_item_id
            for item in session.query(OrderItem)
            .filter(OrderItem.order_date == order_date, OrderItem.order_id == order_id)
            .all()
        ]
        if item_ids:
            session.query(OrderOption).filter(OrderOption.order_item_id.in_(item_ids)).delete(
                synchronize_session=False
            )
        session.query(OrderItem).filter(
            OrderItem.order_date == order_date, OrderItem.order_id == order_id
        ).delete(synchronize_session=False)
        session.delete(order)


def test_TC_ORDER_02_sqlite_persists_options_per_item():
    client = TestClient(app)
    draft = client.post("/api/orders/drafts")
    assert draft.status_code == 201
    reference = draft.json()

    try:
        first = client.post(
            "/api/orders/items",
            json={
                **reference,
                "menu_item_id": 1,
                "quantity": 1,
                "sweetness_level": "หวานน้อย 50%",
                "toppings": ["ไข่มุก"],
            },
        )
        second = client.post(
            "/api/orders/items",
            json={
                **reference,
                "menu_item_id": 1,
                "quantity": 2,
                "sweetness_level": "ไม่หวาน",
                "ice_level": "แยกน้ำแข็ง",
            },
        )
        assert first.status_code == 201
        assert second.status_code == 201

        with SessionLocal() as session:
            options = session.query(OrderOption).order_by(OrderOption.order_item_id).all()

        assert [option.sweetness_level for option in options[-2:]] == [
            "หวานน้อย 50%",
            "ไม่หวาน",
        ]
        assert options[-2].toppings == ["ไข่มุก"]
        assert options[-2].ice_level == "ใส่น้ำแข็งปริมาณปกติ"
        assert options[-1].toppings is None
        assert options[-1].ice_level == "แยกน้ำแข็ง"
    finally:
        _delete_order(date.fromisoformat(reference["order_date"]), reference["order_id"])


def test_AC_ORDER_04_and_09_update_delete_and_recalculate_via_sqlite():
    client = TestClient(app)
    menu = next(item for item in client.get("/api/menu").json()["items"] if item["menu_id"] == 1)
    menu_name = menu["name"]
    unit_price = Decimal(menu["effective_price"])
    draft = client.post("/api/orders/drafts")
    assert draft.status_code == 201
    reference = draft.json()
    order_date = date.fromisoformat(reference["order_date"])

    try:
        first = client.post(
            "/api/orders/items",
            json={
                **reference,
                "menu_item_id": 1,
                "quantity": 2,
                "sweetness_level": "หวานปกติ 75%",
            },
        )
        second = client.post(
            "/api/orders/items",
            json={
                **reference,
                "menu_item_id": 1,
                "quantity": 1,
                "sweetness_level": "ไม่หวาน",
            },
        )
        assert first.status_code == 201
        assert second.status_code == 201
        first_item_id = first.json()["order_item_id"]
        second_item_id = second.json()["order_item_id"]

        updated = client.patch(
            f"/api/orders/items/{first_item_id}",
            json={"quantity": 3},
        )

        assert updated.status_code == 200
        assert updated.json()["order_item_id"] == first_item_id
        assert updated.json()["quantity"] == 3
        assert Decimal(updated.json()["total_amount"]) == unit_price * 4

        summary_after_update = client.get(
            "/api/orders/preview", params=reference
        )
        assert summary_after_update.status_code == 200
        updated_items = summary_after_update.json()["items"]
        assert [(item["order_item_id"], item["quantity"], item["line_total"])
                for item in updated_items] == [
                    (first_item_id, 3, str(unit_price * 3)),
                    (second_item_id, 1, str(unit_price)),
                ]
        assert Decimal(summary_after_update.json()["total_amount"]) == unit_price * 4

        with SessionLocal() as session:
            persisted_first = session.get(OrderItem, first_item_id)
            persisted_second = session.get(OrderItem, second_item_id)
            assert persisted_first is not None
            assert persisted_first.quantity == 3
            assert persisted_second is not None
            assert persisted_second.quantity == 1

        deleted = client.patch(
            f"/api/orders/items/{first_item_id}",
            json={"quantity": 0},
        )

        assert deleted.status_code == 200
        assert deleted.json()["order_item_id"] is None
        assert deleted.json()["quantity"] is None
        assert Decimal(deleted.json()["total_amount"]) == unit_price

        summary_after_delete = client.get(
            "/api/orders/preview", params=reference
        )
        assert summary_after_delete.status_code == 200
        assert summary_after_delete.json()["items"] == [{
            "order_item_id": second_item_id,
            "menu_item_id": 1,
            "name": menu_name,
            "quantity": 1,
            "unit_price": str(unit_price),
            "line_total": str(unit_price),
            "regular_price": str(Decimal(menu["price"])),
            "promotion_price": (
                str(Decimal(menu["promotion_price"]))
                if menu["promotion_price"] is not None
                else None
            ),
        }]
        assert Decimal(summary_after_delete.json()["total_amount"]) == unit_price

        with SessionLocal() as session:
            assert session.get(OrderItem, first_item_id) is None
            persisted_second = session.get(OrderItem, second_item_id)
            assert persisted_second is not None
            assert persisted_second.quantity == 1
            order = session.get(Order, (order_date, reference["order_id"]))
            assert order is not None
            assert order.total_amount == unit_price
    finally:
        _delete_order(order_date, reference["order_id"])


def test_AC_ORDER_05_rejects_empty_order_and_does_not_prepare_payment():
    client = TestClient(app)
    draft = client.post("/api/orders/drafts")
    assert draft.status_code == 201
    reference = draft.json()
    order_date = date.fromisoformat(reference["order_date"])

    try:
        response = client.post("/api/orders/confirm", json=reference)

        assert response.status_code == 422
        assert response.json()["detail"] == "Order must contain at least one item"
        with SessionLocal() as session:
            order = session.get(Order, (order_date, reference["order_id"]))
            assert order is not None
            assert order.status == "draft"
    finally:
        _delete_order(order_date, reference["order_id"])


def test_AC_ORDER_05_confirm_valid_order_via_sqlite_and_returns_pending():
    client = TestClient(app)
    draft = client.post("/api/orders/drafts")
    assert draft.status_code == 201
    reference = draft.json()
    order_date = date.fromisoformat(reference["order_date"])

    try:
        added = client.post(
            "/api/orders/items",
            json={
                **reference,
                "menu_item_id": 1,
                "quantity": 1,
                "sweetness_level": "หวานปกติ 75%",
            },
        )
        assert added.status_code == 201
        item_id = added.json()["order_item_id"]

        with SessionLocal() as session:
            order = session.get(Order, (order_date, reference["order_id"]))
            item = session.get(OrderItem, item_id)
            assert order is not None
            assert order.status == "draft"
            assert item is not None
            assert item.options is not None
            assert item.options.sweetness_level == "หวานปกติ 75%"
            assert session.get(MenuItemEntity, item.menu_item_id).status == "open"

        response = client.post("/api/orders/confirm", json=reference)

        assert response.status_code == 200
        assert response.json() == {
            **reference,
            "payment_status": "pending",
        }

        with SessionLocal() as session:
            persisted_order = session.get(Order, (order_date, reference["order_id"]))
            assert persisted_order is not None
            assert persisted_order.status == "draft"
            assert persisted_order.payment_status == "pending"
            assert persisted_order.items[0].order_item_id == item_id
    finally:
        _delete_order(order_date, reference["order_id"])


def test_AC_ORDER_05_rejects_missing_options_before_payment():
    client = TestClient(app)
    draft = client.post("/api/orders/drafts")
    assert draft.status_code == 201
    reference = draft.json()
    order_date = date.fromisoformat(reference["order_date"])

    try:
        added = client.post(
            "/api/orders/items",
            json={
                **reference,
                "menu_item_id": 1,
                "quantity": 1,
                "sweetness_level": "หวานปกติ 75%",
            },
        )
        assert added.status_code == 201
        with SessionLocal.begin() as session:
            session.query(OrderOption).filter(
                OrderOption.order_item_id == added.json()["order_item_id"]
            ).delete(synchronize_session=False)

        response = client.post("/api/orders/confirm", json=reference)

        assert response.status_code == 422
        assert response.json()["detail"] == "Every order item must have sweetness selected"
        with SessionLocal() as session:
            order = session.get(Order, (order_date, reference["order_id"]))
            assert order is not None
            assert order.status == "draft"
    finally:
        _delete_order(order_date, reference["order_id"])


def test_AC_ORDER_11_rejects_one_out_of_stock_item_in_multi_item_order():
    client = TestClient(app)
    draft = client.post("/api/orders/drafts")
    assert draft.status_code == 201
    reference = draft.json()
    order_date = date.fromisoformat(reference["order_date"])

    try:
        with SessionLocal.begin() as session:
            session.add(
                MenuItemEntity(
                    menu_id=2,
                    name="เมนูทดสอบที่สอง",
                    price="50.00",
                    status="open",
                )
            )
        first = client.post(
            "/api/orders/items",
            json={
                **reference,
                "menu_item_id": 1,
                "quantity": 1,
                "sweetness_level": "หวานปกติ 75%",
            },
        )
        second = client.post(
            "/api/orders/items",
            json={
                **reference,
                "menu_item_id": 2,
                "quantity": 1,
                "sweetness_level": "ไม่หวาน",
            },
        )
        assert first.status_code == 201
        assert second.status_code == 201

        with SessionLocal.begin() as session:
            session.get(MenuItemEntity, 2).status = "sold_out"

        response = client.post("/api/orders/confirm", json=reference)

        assert response.status_code == 409
        assert response.json()["detail"] == "Menu item is out of stock; choose another menu"
        with SessionLocal() as session:
            order = session.get(Order, (order_date, reference["order_id"]))
            assert order is not None
            assert order.status == "draft"
    finally:
        _delete_order(order_date, reference["order_id"])
        with SessionLocal.begin() as session:
            menu = session.get(MenuItemEntity, 2)
            if menu is not None:
                session.delete(menu)


def test_AC_ORDER_03_summary_uses_menu_effective_price_without_promotion():
    client = TestClient(app)
    draft = client.post("/api/orders/drafts")
    assert draft.status_code == 201
    reference = draft.json()
    order_date = date.fromisoformat(reference["order_date"])

    try:
        with SessionLocal.begin() as session:
            session.get(MenuItemEntity, 1).promotion_price = "0.75"

        menu_response = client.get("/api/menu")
        assert menu_response.status_code == 200
        menu = next(item for item in menu_response.json()["items"] if item["menu_id"] == 1)
        assert menu["price"] == "1.0000000000"
        assert menu["promotion_price"] == "0.7500000000"
        assert menu["effective_price"] == "0.7500000000"

        added = client.post(
            "/api/orders/items",
            json={
                **reference,
                "menu_item_id": 1,
                "quantity": 2,
                "sweetness_level": "หวานปกติ 75%",
            },
        )
        assert added.status_code == 201
        summary = client.get("/api/orders/preview", params=reference)
        assert summary.status_code == 200
        summary_item = summary.json()["items"][0]
        assert summary_item["regular_price"] == "1.0000000000"
        assert summary_item["promotion_price"] == "0.7500000000"
        assert summary_item["unit_price"] == "0.7500000000"
        assert summary_item["line_total"] == "1.5000000000"
        assert summary.json()["total_amount"] == "1.5000000000"
    finally:
        with SessionLocal.begin() as session:
            session.get(MenuItemEntity, 1).promotion_price = None
        _delete_order(order_date, reference["order_id"])


def test_AC_ORDER_03_summary_uses_regular_price_without_promotion():
    client = TestClient(app)
    draft = client.post("/api/orders/drafts")
    assert draft.status_code == 201
    reference = draft.json()
    order_date = date.fromisoformat(reference["order_date"])

    try:
        added = client.post(
            "/api/orders/items",
            json={
                **reference,
                "menu_item_id": 1,
                "quantity": 1,
                "sweetness_level": "ไม่หวาน",
            },
        )
        assert added.status_code == 201
        summary = client.get("/api/orders/preview", params=reference)
        summary_item = summary.json()["items"][0]
        assert summary_item["regular_price"] == "1.0000000000"
        assert summary_item["promotion_price"] is None
        assert summary_item["unit_price"] == "1.0000000000"
        assert summary.json()["total_amount"] == "1.0000000000"
    finally:
        _delete_order(order_date, reference["order_id"])
