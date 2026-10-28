from datetime import datetime, timezone
import uuid

from fastapi.testclient import TestClient

from backend.app.main import app
from staff_order_test_support import add_staff_order


def test_AC_STATUS_01_staff_updates_order_and_customer_sees_latest_status(
    monkeypatch,
):
    monkeypatch.setenv("APP_ENV", "test")
    customer_id = str(uuid.uuid4())
    order_date = datetime.now(timezone.utc).date()
    add_staff_order(
        "006",
        datetime.now(timezone.utc),
        "PENDING_ACCEPT",
        order_date=order_date,
        owner_user_id=customer_id,
    )

    client = TestClient(app)
    staff_headers = {"X-User-Id": "staff"}
    customer_headers = {"X-Test-User": customer_id}

    for next_status in ("PREPARING", "READY_FOR_PICKUP", "PICKED_UP"):
        update_response = client.patch(
            "/api/staff/orders/006/status",
            params={"order_date": order_date.isoformat()},
            headers=staff_headers,
            json={"new_status": next_status},
        )
        assert update_response.status_code == 200
        assert update_response.json()["status"] == next_status

        customer_status = client.get(
            "/api/orders/006/status",
            params={"order_date": order_date.isoformat()},
            headers=customer_headers,
        )
        assert customer_status.status_code == 200
        assert customer_status.json()["current_status"] == next_status
        if next_status in {"READY_FOR_PICKUP", "PICKED_UP"}:
            assert customer_status.json()["latest_status_time"] is not None

    finished_order = client.patch(
        "/api/staff/orders/006/status",
        params={"order_date": order_date.isoformat()},
        headers=staff_headers,
        json={"new_status": "PREPARING"},
    )
    assert finished_order.status_code == 409


def test_AC_STATUS_01_staff_status_update_rejects_skipped_and_unauthorized_changes(
    monkeypatch,
):
    monkeypatch.setenv("APP_ENV", "test")
    order_date = datetime.now(timezone.utc).date()
    add_staff_order(
        "007",
        datetime.now(timezone.utc),
        "PENDING_ACCEPT",
        order_date=order_date,
    )
    client = TestClient(app)
    params = {"order_date": order_date.isoformat()}

    skipped_status = client.patch(
        "/api/staff/orders/007/status",
        params=params,
        headers={"X-User-Id": "staff"},
        json={"new_status": "READY_FOR_PICKUP"},
    )
    unauthorized = client.patch(
        "/api/staff/orders/007/status",
        params=params,
        headers={"X-User-Id": "student"},
        json={"new_status": "PREPARING"},
    )
    unchanged_status = client.get(
        "/api/orders/007/status",
        params=params,
        headers={"X-Test-User": "customer-a"},
    )

    assert skipped_status.status_code == 409
    assert unauthorized.status_code == 403
    assert unchanged_status.status_code == 404
