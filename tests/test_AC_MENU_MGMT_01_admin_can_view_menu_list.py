import unittest

from backend.app.config import MENU_STATUS_OPEN, MENU_STATUS_SOLD_OUT
from backend.app.seed import seed_menu_data


class TestMenuManagementSeed(unittest.TestCase):
    def test_AC_MENU_MGMT_01_admin_can_view_menu_list(self):
        """FR-42: seed provides menu data and related records for an admin view."""
        data = seed_menu_data()

        self.assertTrue(data["menu_items"])
        self.assertTrue(data["promotions"])
        self.assertTrue(data["menu_history"])
        self.assertTrue(data["order_snapshots"])
        for item in data["menu_items"]:
            self.assertTrue({"menu_id", "name", "price", "status"}.issubset(item))
            self.assertIn(item["status"], {MENU_STATUS_OPEN, MENU_STATUS_SOLD_OUT})


if __name__ == "__main__":
    unittest.main()