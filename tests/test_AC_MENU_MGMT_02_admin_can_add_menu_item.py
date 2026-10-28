import unittest

from backend.app.config import MENU_STATUS_OPEN, required_menu_fields
from backend.app.models import MenuItem


class TestMenuManagementMenuSchema(unittest.TestCase):
    def test_AC_MENU_MGMT_02_admin_can_add_menu_item(self):
        """FR-43: menu schema accepts required fields and optional description/image."""
        item = MenuItem(menu_id=2, name="เมนูตัวอย่าง", price=1.0, status=MENU_STATUS_OPEN)
        data = item.to_dict()

        self.assertTrue(all(field in data and data[field] is not None for field in required_menu_fields))
        self.assertIsNone(data["description"])
        self.assertIsNone(data["image_url"])


if __name__ == "__main__":
    unittest.main()