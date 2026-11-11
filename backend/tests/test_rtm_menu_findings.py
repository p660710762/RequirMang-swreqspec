from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.main import app
from app.database import SessionLocal
from app.models.menu import MenuItemEntity
from app.seed import seed_menu_data
from app.services.history_service import ORDER_SNAPSHOT_STORE
from app.services import menu_service
from app.services.menu_validation import validate_menu_payload


@pytest.fixture(autouse=True)
def remove_rtm_test_menus():
    def cleanup():
        with SessionLocal.begin() as session:
            session.execute(
                delete(MenuItemEntity).where(MenuItemEntity.name.like("RTM %"))
            )

    cleanup()
    yield
    cleanup()


def test_seed_has_no_sample_promotion():
    assert seed_menu_data()["promotions"] == []


def test_current_minute_is_accepted_for_promotion_start():
    current_minute = datetime.now(timezone.utc).replace(second=0, microsecond=0)
    validated = validate_menu_payload(
        {
            "name": "current minute",
            "price": 100,
            "status": "open",
            "promotion": {
                "promotion_name": "เริ่มตอนนี้",
                "discount_value": 10,
                "start_at": current_minute.isoformat(),
                "end_at": (current_minute + timedelta(minutes=1)).isoformat(),
            },
        }
    )
    assert validated["promotion"]["start_at"] == current_minute.isoformat()


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


def test_admin_promotion_is_visible_from_customer_menu_and_active_promotions_api():
    admin = TestClient(app, headers={"X-User-Id": "admin"})
    created = admin.post(
        "/api/admin/menu",
        json={"name": "RTM shared promotion", "price": 100, "status": "open"},
    )
    assert created.status_code == 200
    menu_id = created.json()["menu_id"]

    try:
        start_at = datetime.now(timezone.utc) + timedelta(days=1)
        end_at = start_at + timedelta(hours=1)
        updated = admin.patch(
            f"/api/admin/menu/{menu_id}",
            json={
                "promotion": {
                    "promotion_name": "ลดหน้าร้าน",
                    "discount_value": 25,
                    "start_at": start_at.isoformat(),
                    "end_at": end_at.isoformat(),
                }
            },
        )
        assert updated.status_code == 200

        with SessionLocal.begin() as session:
            item_entity = session.get(MenuItemEntity, menu_id)
            item_entity.promotion = {
                **item_entity.promotion,
                "start_at": (
                    datetime.now(timezone.utc) - timedelta(minutes=1)
                ).isoformat(),
                "end_at": (
                    datetime.now(timezone.utc) + timedelta(hours=1)
                ).isoformat(),
            }
            session.flush()

        customer = TestClient(app)
        menu_response = customer.get("/api/menu")
        item = next(row for row in menu_response.json()["items"] if row["menu_id"] == menu_id)
        assert item["promotion"] == {
            "id": menu_id,
            "title": "ลดหน้าร้าน",
            "discount_value": 25,
            "status": "active",
        }
        assert float(item["effective_price"]) == 75

        promotions_response = customer.get("/api/promotions/active")
        assert promotions_response.json() == [item["promotion"]]
    finally:
        admin.delete(f"/api/admin/menu/{menu_id}")


def test_deleted_menu_promotion_is_hidden_from_customer_active_promotions():
    admin = TestClient(app, headers={"X-User-Id": "admin"})
    created = admin.post(
        "/api/admin/menu",
        json={"name": "RTM deleted promotion", "price": 100, "status": "open"},
    )
    assert created.status_code == 200
    menu_id = created.json()["menu_id"]

    try:
        start_at = datetime.now(timezone.utc) + timedelta(days=1)
        end_at = datetime.now(timezone.utc) + timedelta(hours=1)
        updated = admin.patch(
            f"/api/admin/menu/{menu_id}",
            json={
                "promotion": {
                    "promotion_name": "โปรโมชั่นเมนูที่จะลบ",
                    "discount_value": 10,
                    "start_at": start_at.isoformat(),
                    "end_at": end_at.isoformat(),
                }
            },
        )
        assert updated.status_code == 400

        with SessionLocal.begin() as session:
            item_entity = session.get(MenuItemEntity, menu_id)
            item_entity.promotion = {
                "promotion_name": "โปรโมชั่นเมนูที่จะลบ",
                "discount_value": 10,
                "start_at": start_at.isoformat(),
                "end_at": end_at.isoformat(),
            }

        assert admin.delete(f"/api/admin/menu/{menu_id}").status_code == 200
        promotions = TestClient(app).get("/api/promotions/active")
        assert all(promotion["id"] != menu_id for promotion in promotions.json())
    finally:
        admin.delete(f"/api/admin/menu/{menu_id}")


def test_promotion_without_discount_can_be_loaded():
    admin = TestClient(app, headers={"X-User-Id": "admin"})
    created = admin.post(
        "/api/admin/menu",
        json={"name": "RTM promotion without discount", "price": 100, "status": "open"},
    )
    assert created.status_code == 200
    menu_id = created.json()["menu_id"]

    try:
        start_at = datetime.now(timezone.utc) + timedelta(days=1)
        end_at = start_at + timedelta(hours=1)
        updated = admin.patch(
            f"/api/admin/menu/{menu_id}",
            json={
                "promotion": {
                    "promotion_name": "โปรโมชั่นไม่ลดราคา",
                    "discount_value": None,
                    "start_at": start_at.isoformat(),
                    "end_at": end_at.isoformat(),
                }
            },
        )
        assert updated.status_code == 200
        with SessionLocal.begin() as session:
            item_entity = session.get(MenuItemEntity, menu_id)
            item_entity.promotion = {
                **item_entity.promotion,
                "start_at": (
                    datetime.now(timezone.utc) - timedelta(minutes=1)
                ).isoformat(),
                "end_at": (
                    datetime.now(timezone.utc) + timedelta(hours=1)
                ).isoformat(),
            }

        customer = TestClient(app)
        menu_response = customer.get("/api/menu")
        assert menu_response.status_code == 200
        item = next(row for row in menu_response.json()["items"] if row["menu_id"] == menu_id)
        assert item["promotion"]["discount_value"] == 0
        assert float(item["effective_price"]) == 100

        promotions_response = customer.get("/api/promotions/active")
        assert promotions_response.status_code == 200
        assert next(row for row in promotions_response.json() if row["id"] == menu_id)["discount_value"] == 0
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
