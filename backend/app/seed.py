"""Placeholder seed records for the Menu Management admin view.

References: FR-42, FR-43, FR-44, FR-49, NFR-REL-08, NFR-REL-09.
"""

from datetime import datetime, timedelta, timezone

from .config import MENU_STATUS_OPEN, MENU_STATUS_SOLD_OUT
from .models import MenuHistory, MenuItem, OrderSnapshot, Promotion


def seed_menu_data() -> dict[str, list[dict]]:
    """FR-42: provide initial menu records for admin and customer views."""
    now = datetime.now(timezone.utc)
    promotion_start = now + timedelta(days=1)
    promotion_end = promotion_start + timedelta(days=7)
    menu_items = [
        MenuItem(1, "ชาเขียวมัทฉะ", 85.0, MENU_STATUS_OPEN, "ชาเขียวมัทฉะเข้มข้น หอมละมุน", "https://images-ext-1.discordapp.net/external/0aCCY_6ziq2qKpjZeyW9nYufczvYmLmHLNic_4jifuc/https/www.bluemochatea.com/wp-content/uploads/2020/03/%25E0%25B8%258A%25E0%25B8%25B2%25E0%25B9%2580%25E0%25B8%2582%25E0%25B8%25B5%25E0%25B8%25A2%25E0%25B8%25A7%25E0%25B8%259B%25E0%25B8%25B1%25E0%25B8%2594%25E0%25B9%2580%25E0%25B8%259B%25E0%25B9%2588%25E0%25B8%25B2.jpg?format=webp", now, now),
        MenuItem(2, "อเมริกาโน่เย็น", 45.0, MENU_STATUS_OPEN, "กาแฟคั่วหอมเข้ม เติมความสดชื่นด้วยน้ำแข็ง", "https://media.discordapp.net/attachments/1555975574030123132/1565084510905958521/coconut_coffee_in_cafe_1024x1024.png?ex=6ae39e09&is=6ae24c89&hm=332a1454b095f8927d405c744a61d359c34674ea2542939131c803ed3d6254bc&=&format=webp&quality=lossless", now, now),
        MenuItem(3, "ลาเต้เย็น", 55.0, MENU_STATUS_OPEN, "เอสเพรสโซ่เข้มข้น ผสมนมเนียนนุ่ม", "https://media.discordapp.net/attachments/1555975574030123132/1565084188468711636/9qouf4swhzge.png?ex=6ae39dbc&is=6ae24c3c&hm=8ef1fd3eeee6540fdc8f20893a02375e43f83f7053bfd3df423e5d84029724f7&=&format=webp&quality=lossless", now, now),
        MenuItem(4, "คาปูชิโน่เย็น", 55.0, MENU_STATUS_OPEN, "กาแฟนุ่มละมุน ท็อปด้วยฟองนมเนื้อเบา", "https://media.discordapp.net/attachments/1555975574030123132/1565083139968204860/BANNER_E0B884E0B8B2E0B89BE0B8B9E0B88AE0B8B4E0B982E0B899E0B98820E0B980E0B8A2E0B987E0B89920540x40020px.png?ex=6ae39cc2&is=6ae24b42&hm=53d78096820e595cb2b308ebb622581abde873d952719a560548f3afce36b940&=&format=webp&quality=lossless", now, now),
        MenuItem(5, "ชาไทยเย็น", 40.0, MENU_STATUS_OPEN, "ชาไทยหอมเข้ม รสหวานกำลังดี", "https://images-ext-1.discordapp.net/external/FKGYW9gO8kTArVysOZlZkMHbdWokXlJu5VryXv7gBpE/https/static.thairath.co.th/media/dFQROr7oWzulq5Fa7HfdTOtnHeMBcbjKXYhVG3rPw3pO6V3x4NvJYyie6iJ2kNdfmiT.jpg?format=webp", now, now),
        MenuItem(6, "โกโก้เย็น", 45.0, MENU_STATUS_OPEN, "โกโก้เข้มข้น หอมมัน พร้อมความหวานพอดี", "https://media.discordapp.net/attachments/1555975574030123132/1565083905525284864/images.png?ex=6ae39d78&is=6ae24bf8&hm=02db45ab96c5695b474f7f8486c41dfc54b2afab382e2cb81e58042d04fdfe82&=&format=webp&quality=lossless", now, now),
    ]
    menu_items = [
        MenuItem(1, "ชานมไต้หวัน", 29.0, MENU_STATUS_OPEN, None, "https://media.discordapp.net/attachments/1555975574030123132/1565086191597002802/image.png?ex=6ae39f99&is=6ae24e19&hm=c05e6aee069400af465fb1e4a7bdd7d43957d4aef62995b199730a5f728192c2&=&format=webp&quality=lossless&width=768&height=1024", now, now),
        MenuItem(2, "ชาแอปเปิ้ล", 29.0, MENU_STATUS_OPEN, "กาแฟคั่วหอมเข้ม เติมความสดชื่นด้วยน้ำแข็ง", "https://images-ext-1.discordapp.net/external/hHIzEQ5swfgEtN6s-H5HcSp4ST5T7XTMi7Aon82-kcA/https/img.wongnai.com/p/256x256/2022/09/29/0c9bbc0a782b4c23924dcdc4f8541ee3.jpg?format=webp", now, now),
        MenuItem(3, "ชานมบราวน์ชูก้า", 39.0, MENU_STATUS_OPEN, "เอสเพรสโซ่เข้มข้น ผสมนมเนียนนุ่ม", "https://media.discordapp.net/attachments/1555975574030123132/1565088727708074106/images.png?ex=6ae3a1f6&is=6ae25076&hm=dc7fab010ec9328a34c7c5ab7d1e2671f4acf5eb612b6e6e3433ebfaa1fe74ed&=&format=webp&quality=lossless", now, now),
        MenuItem(4, "นมสด", 39.0, MENU_STATUS_OPEN, None, "https://images-ext-1.discordapp.net/external/wpi1wMKa7QQm9WrwQ72bFqnhFcBZWmcEWpjBYGJ76Rs/%3Fq%3Dtbn%3AANd9GcTx_VZwMDbs1cqb11g9QkoOkkMVuAZfKIsBRZMpD3yQEa3O7sKmXvIzsnzH%26s%3D10/https/encrypted-tbn0.gstatic.com/images?format=webp", now, now),
        MenuItem(5, "ชาไทย", 34.0, MENU_STATUS_OPEN, "ชาไทยหอมเข้ม รสหวานกำลังดี", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzxW3AItEUHEaBKRkHRJLAfaSVh9v9VuoPgX5-MCl4Xc1zl3-chHMvp8Al&s=10", now, now),
        MenuItem(6, "โกโก้", 34.0, MENU_STATUS_OPEN, "โกโก้เข้มข้น หอมมัน พร้อมความหวานพอดี", "https://media.discordapp.net/attachments/1555975574030123132/1565087819905507529/image.png?ex=6ae3a11e&is=6ae24f9e&hm=9384d376acdd3111524224d105d59cbd101136ce0e403bf6e0186076e7e5e6d3&=&format=webp&quality=lossless&width=1024&height=1024", now, now),
        MenuItem(7, "ชาเขียว", 34.0, MENU_STATUS_OPEN, None, "https://media.discordapp.net/attachments/1555975574030123132/1565085730504441887/images.png?ex=6ae39f2c&is=6ae24dac&hm=120adc6d44ad0699dcfacb0d5d66d181810a2816d6c8d401307909d97798c606&=&format=webp&quality=lossless", now, now),
    ]
    menu_item = menu_items[0]
    promotion = Promotion(
        promotion_id=1,
        menu_id=menu_item.menu_id,
        promotion_name="โปรโมชันวันนี้",
        discount_value=10,
        is_active=True,
        start_at=promotion_start,
        end_at=promotion_end,
    )
    history = MenuHistory(
        history_id=1,
        menu_id=menu_item.menu_id,
        old_price=menu_item.price,
        new_price=menu_item.price,
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
        "promotions": [promotion.to_dict()],
        "menu_history": [history.to_dict()],
        "order_snapshots": [snapshot.to_dict()],
    }