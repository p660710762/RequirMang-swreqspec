const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');
const { test } = require('node:test');

const appScript = readFileSync(resolve(__dirname, '../app.js'), 'utf8');

function createCatalogContext() {
  const menuListElement = { innerHTML: '' };
  const context = {
    document: {
      getElementById(id) {
        assert.equal(id, 'menu-list');
        return menuListElement;
      },
    },
  };

  runInNewContext(appScript, context);

  return {
    catalog: context.getMenuCatalog(),
    menuListElement,
    getPromotionForMenuItem: context.getPromotionForMenuItem,
    getMenuDetailsWithPromotion: context.getMenuDetailsWithPromotion,
  };
}

test('test_T_01_1_menu_catalog_contains_menu_and_promotion_models', () => {
  // Given: ระบบต้องมีข้อมูลเมนูและโปรโมชั่นในแบบ Model ที่ชัดเจน
  // When: เรียกอ่าน catalog ของเมนูและโปรโมชั่น
  const { catalog } = createCatalogContext();

  // Then: ต้องมีเมนู โปรโมชั่น และความสัมพันธ์เมนู-โปรโมชั่นที่เปิดใช้งาน
  assert.ok(Array.isArray(catalog.menuItems));
  assert.ok(Array.isArray(catalog.promotions));
  assert.ok(Array.isArray(catalog.menuPromotionLinks));
  assert.ok(catalog.menuItems.length > 0);
  assert.ok(catalog.promotions.some((promotion) => promotion.status === 'active'));
  assert.ok(catalog.menuPromotionLinks.some((link) => link.menuId === 1 && link.promotionId === 1));
});

test('test_T_01_2_active_promotion_is_linked_to_menu_item', () => {
  // Given: มีเมนูที่กำหนดกับโปรโมชั่นที่ใช้งานอยู่
  // When: ดึง promotion สำหรับเมนูนั้น
  const { catalog, getPromotionForMenuItem, getMenuDetailsWithPromotion } = createCatalogContext();
  const activePromotion = catalog.menuItems
    .map((item) => ({ item, promotion: getPromotionForMenuItem(item.id) }))
    .find(({ item }) => item.id === 1);

  // Then: ระบบต้องคืน promotion ที่ใช้งานอยู่และคำนวณราคาหลังหักส่วนลดได้
  assert.ok(activePromotion);
  assert.ok(activePromotion.promotion);
  assert.equal(activePromotion.promotion.status, 'active');
  assert.equal(activePromotion.promotion.discountPercent, 10);
  assert.equal(getMenuDetailsWithPromotion([catalog.menuItems[0]])[0].discountedPrice, 41);
});
