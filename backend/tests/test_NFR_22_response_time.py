import os
import socket
import sqlite3
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from statistics import quantiles
from urllib.request import Request, urlopen

import pytest

from backend.database import initialize_database


ROOT = Path(__file__).resolve().parents[2]


def _free_port():
    with socket.socket() as connection:
        connection.bind(("127.0.0.1", 0))
        return connection.getsockname()[1]


def _request_duration(url):
    started = time.perf_counter()
    request = Request(url, headers={"X-Test-User": "customer-a"})
    with urlopen(request, timeout=10) as response:
        assert response.status == 200
        response.read()
    return time.perf_counter() - started


@pytest.fixture
def local_server(tmp_path):
    database_path = tmp_path / "orders.sqlite"
    connection = sqlite3.connect(database_path)
    initialize_database(connection)
    with connection:
        connection.execute(
            """
            INSERT INTO orders (
                order_id, user_id, created_at, status, total_amount,
                last_status_change_at, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            ("nfr-order", "sample-user", "2026-10-25T09:00:00", "PREPARING", 50, None, 1),
        )
        connection.execute(
            """
            INSERT INTO order_items (
                order_item_id, order_id, menu_item_id, menu_name,
                quantity, unit_price, line_total
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            ("nfr-item", "nfr-order", "menu-a", "ชาไทย", 1, 50, 50),
        )
        connection.execute(
            """
            INSERT INTO order_status_history (
                status_log_id, order_id, status_code, status_name,
                changed_at, is_confirmed
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            ("nfr-status", "nfr-order", "PREPARING", "กำลังเตรียม", "2026-10-25T09:00:00", 1),
        )
    connection.close()

    port = _free_port()
    environment = {
        **os.environ,
        "APP_ENV": "test",
        "ORDER_DATABASE_PATH": str(database_path),
    }
    log_path = tmp_path / "uvicorn.log"
    log_file = log_path.open("w")
    process = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "backend.app.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            str(port),
        ],
        cwd=ROOT,
        env=environment,
        stdout=log_file,
        stderr=subprocess.STDOUT,
    )
    base_url = f"http://127.0.0.1:{port}"
    try:
        for _ in range(50):
            try:
                _request_duration(f"{base_url}/api/orders")
                break
            except Exception:
                time.sleep(0.1)
        else:
            raise RuntimeError("uvicorn did not start")
        yield base_url
    finally:
        process.terminate()
        process.wait(timeout=10)
        log_file.close()


def test_NFR_22_response_time(local_server):
    endpoints = (
        "/api/orders",
        "/api/orders/nfr-order",
        "/api/orders/nfr-order/status",
    )

    for endpoint in endpoints:
        with ThreadPoolExecutor(max_workers=100) as executor:
            try:
                durations = list(
                    executor.map(
                        _request_duration,
                        [f"{local_server}{endpoint}"] * 100,
                    )
                )
            except Exception as error:
                raise AssertionError(f"{endpoint} request failed: {error}") from error
        p95 = quantiles(durations, n=100, method="inclusive")[94]
        assert p95 <= 2, f"{endpoint} p95={p95:.3f}s exceeds 2 seconds"
