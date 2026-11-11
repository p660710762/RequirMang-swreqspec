"""Placeholder seed records for the Menu Management admin view.

References: FR-42, FR-43, FR-44, FR-49, NFR-REL-08, NFR-REL-09.
"""

from datetime import datetime, timezone

from .config import MENU_STATUS_OPEN, MENU_STATUS_SOLD_OUT
from .models import MenuHistory, MenuItem, OrderSnapshot


def seed_menu_data() -> dict[str, list[dict]]:
    """FR-42: provide the prepared menu records for admin and customer views."""
    now = datetime.now(timezone.utc)
    menu_items = [
        MenuItem(1, "ชานมไต้หวัน", 29.0, MENU_STATUS_OPEN, None, "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSIOPerk3RdzkYDN5WPoo_LtNTEeC4ZZBXSTBnd_e38eScSdkFRhfDk14sw&s=10", now, now),
        MenuItem(2, "ชาแอปเปิ้ล", 29.0, MENU_STATUS_OPEN, "กาแฟคั่วหอมเข้ม เติมความสดชื่นด้วยน้ำแข็ง", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRnN4RCUKNjh-0BzpGOn7yHrXjY7ky7lGU6rl6IvpwfXilbHBNJvtL4DV1&s=10", now, now),
        MenuItem(3, "ชานมบราวน์ชูก้า", 39.0, MENU_STATUS_OPEN, "เอสเพรสโซ่เข้มข้น ผสมนมเนียนนุ่ม", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbl51P-k7alnIswx0T0EXDJbI_jG4TL28wEuspSHsDxHbgQ6F0UgzPaw3o&s=10", now, now),
        MenuItem(4, "นมสด", 39.0, MENU_STATUS_OPEN, None, "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTx_VZwMDbs1cqb11g9QkoOkkMVuAZfKIsBRZMpD3yQEa3O7sKmXvIzsnzH&s=10", now, now),
        MenuItem(5, "ชาไทย", 34.0, MENU_STATUS_OPEN, "ชาไทยหอมเข้ม รสหวานกำลังดี", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS7O0-P94cPDv24hUnLjxue_oEt2jm4HYmgVQtFHpJC20jUns_6uUbi5lSi&s=10", now, now),
        MenuItem(6, "โกโก้", 34.0, MENU_STATUS_OPEN, "โกโก้เข้มข้น หอมมัน พร้อมความหวานพอดี", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBwsj-3zY0Y-wEqEvUCdu01aLgj8O8UQAOPtSIDcdyHJY0ipVySe2F2vW8&s=10", now, now),
        MenuItem(7, "ชาเขียว", 34.0, MENU_STATUS_OPEN, None, "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5n3HNOI7SiSwnkzQKIqyIC5jXSq6qOQySM91FLzwBRz1PMdnThnIP0rg4&s=10", now, now),
    ]
    menu_item = menu_items[0]
    history = MenuHistory(
        history_id=1,
        menu_id=menu_item.menu_id,
        old_price=1.0,
        new_price=1.0,
        old_status=MENU_STATUS_OPEN,
        new_status=MENU_STATUS_OPEN,
        updated_by="admin",
        updated_at=now,
    )
    snapshot = OrderSnapshot(
        order_id=1,
        menu_id=menu_item.menu_id,
        snapshot_price=menu_item.price,
        snapshot_name=menu_item.name,
        snapshot_status_at_order=MENU_STATUS_SOLD_OUT,
    )

    return {
        "menu_items": [item.to_dict() for item in menu_items],
        "promotions": [],
        "menu_history": [history.to_dict()],
        "order_snapshots": [snapshot.to_dict()],
    }