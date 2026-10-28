import pytest


@pytest.fixture(autouse=True)
def isolate_menu_management_database(monkeypatch, tmp_path):
    """Keep AC-MENU-MGMT tests from persisting test menu fixtures to the user database."""
    monkeypatch.delenv("ORDER_DATABASE_URL", raising=False)
    monkeypatch.setenv("ORDER_DATABASE_PATH", str(tmp_path / "menu-tests.sqlite3"))

    from backend.app.database import configure_database

    configure_database()
    yield

    monkeypatch.undo()
    configure_database()
