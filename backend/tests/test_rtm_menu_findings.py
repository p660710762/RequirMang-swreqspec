from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.main import app
from app.seed import seed_menu_data
from app.services.history_service import ORDER_SNAPSHOT_STORE
from app.services import menu_service


def test_seed_promotion_is_in_the_future():
    now = datetime.now(timezone.utc)
    promotion = seed_menu_data()["promotions"][0]

    assert promotion["start_at"] > now
    assert promotion["end_at"] > promotion["start_at"]


def test_admin_update_is_visible_from_customer_menu_api():
    admin = TestClient(app, headers={"X-User-Id": "admin"})
    created = admin.post(
        "/api/admin/menu",
        json={
            "name": "RTM customer latest",
            "price": 80,
            "status": "open",
            "description": "รายละเอียดก่อนแก้",
        },
    )
    assert created.status_code == 200
    menu_id = created.json()["menu_id"]

    try:
        updated = admin.patch(
            f"/api/admin/menu/{menu_id}",
            json={"price": 70, "description": "รายละเอียดล่าสุด"},
        )
        assert updated.status_code == 200

        customer = TestClient(app)
        response = customer.get("/api/menu")

        assert response.status_code == 200
        item = next(row for row in response.json()["items"] if row["menu_id"] == menu_id)
        assert float(item["price"]) == 70
        assert item["description"] == "รายละเอียดล่าสุด"
    finally:
        admin.delete(f"/api/admin/menu/{menu_id}")


def test_order_api_creates_snapshot_readable_after_menu_status_change():
    ORDER_SNAPSHOT_STORE.clear()
    admin = TestClient(app, headers={"X-User-Id": "admin"})
    customer = TestClient(app, headers={"X-User-Id": "student"})
    created = admin.post(
        "/api/admin/menu",
        json={"name": "RTM old order snapshot", "price": 65, "status": "open"},
    )
    menu_id = created.json()["menu_id"]
    draft = customer.post("/api/orders/drafts")
    draft_data = draft.json()

    try:
        ordered = customer.post(
            "/api/orders/items",
            json={
                **draft_data,
                "menu_item_id": menu_id,
                "quantity": 1,
                "sweetness_level": "หวานปกติ 75%",
                "toppings": ["ไข่มุก"],
                "ice_level": "ไม่ใส่น้ำแข็ง",
            },
        )
        assert ordered.status_code == 201

        changed = admin.patch(
            f"/api/admin/menu/{menu_id}/status",
            json={"status": "sold_out"},
        )
        assert changed.status_code == 200

        history_response = admin.get("/api/admin/menu")
        snapshots = history_response.json()["order_snapshots"]
        snapshot = next(row for row in snapshots if row["menu_id"] == menu_id)
        assert snapshot["snapshot_name"] == "RTM old order snapshot"
        assert snapshot["snapshot_price"] == 65
        assert snapshot["snapshot_status_at_order"] == "open"
    finally:
        admin.delete(f"/api/admin/menu/{menu_id}")


def test_history_is_not_appended_when_menu_transaction_fails(monkeypatch):
    class Item:
        menu_id = 901
        name = "staged"
        price = 40
        status = "open"
        description = None
        image_url = None
        promotion = None
        created_at = None
        updated_at = None

    class Session:
        def __enter__(self):
            return self

        def __exit__(self, *_):
            return False

        def get(self, *_):
            return Item()

        def flush(self):
            raise RuntimeError("commit failed")

    class SessionFactory:
        @staticmethod
        def begin():
            return Session()

    recorded = []
    monkeypatch.setattr(menu_service, "SessionLocal", SessionFactory)
    monkeypatch.setattr(menu_service, "record_menu_history", recorded.append)

    try:
        menu_service.update_menu_item(901, {"price": 41})
    except RuntimeError:
        pass
    else:
        raise AssertionError("expected transaction failure")

    assert recorded == []


def test_create_does_not_append_history_when_menu_transaction_fails(monkeypatch):
    class Session:
        def __enter__(self):
            return self

        def __exit__(self, *_):
            return False

        def add(self, _item):
            return None

        def flush(self):
            raise RuntimeError("commit failed")

    class SessionFactory:
        @staticmethod
        def begin():
            return Session()

    recorded = []
    monkeypatch.setattr(menu_service, "SessionLocal", SessionFactory)
    monkeypatch.setattr(menu_service, "record_menu_history", recorded.append)

    try:
        menu_service.create_menu_item(
            {"name": "staged create", "price": 40, "status": "open"}
        )
    except RuntimeError:
        pass
    else:
        raise AssertionError("expected transaction failure")

    assert recorded == []


def test_status_does_not_append_history_when_menu_transaction_fails(monkeypatch):
    class Item:
        menu_id = 902
        price = 40
        status = "open"
        updated_at = None

    class Session:
        def __enter__(self):
            return self

        def __exit__(self, *_):
            return False

        def get(self, *_):
            return Item()

        def flush(self):
            raise RuntimeError("commit failed")

    class SessionFactory:
        @staticmethod
        def begin():
            return Session()

    recorded = []
    monkeypatch.setattr(menu_service, "SessionLocal", SessionFactory)
    monkeypatch.setattr(menu_service, "record_menu_history", recorded.append)

    try:
        menu_service.set_menu_status(902, "sold_out")
    except RuntimeError:
        pass
    else:
        raise AssertionError("expected transaction failure")

    assert recorded == []


def test_delete_does_not_append_history_or_snapshot_when_menu_transaction_fails(monkeypatch):
    class Item:
        menu_id = 903
        name = "staged delete"
        price = 40
        status = "open"

    class Session:
        def __enter__(self):
            return self

        def __exit__(self, *_):
            return False

        def get(self, *_):
            return Item()

        def delete(self, _item):
            return None

        def flush(self):
            raise RuntimeError("commit failed")

    class SessionFactory:
        @staticmethod
        def begin():
            return Session()

    recorded_history = []
    recorded_snapshots = []
    monkeypatch.setattr(menu_service, "SessionLocal", SessionFactory)
    monkeypatch.setattr(menu_service, "record_menu_history", recorded_history.append)
    monkeypatch.setattr(menu_service, "create_order_snapshot", recorded_snapshots.append)

    try:
        menu_service.delete_menu_item(903)
    except RuntimeError:
        pass
    else:
        raise AssertionError("expected transaction failure")

    assert recorded_history == []
    assert recorded_snapshots == []
