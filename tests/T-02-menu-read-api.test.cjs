const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');
const { test } = require('node:test');

const appScript = readFileSync(resolve(__dirname, '../app.js'), 'utf8');

function buildApiContext() {
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
    readMenuApi: context.readMenuApi,
    readActivePromotionsApi: context.readActivePromotionsApi,
    getMenuCatalog: context.getMenuCatalog,
  };
}

test('test_T_02_1_menu_api_returns_menu_and_active_promotions', () => {
  // Given: ระบบมีเมนูและโปรโมชั่นพร้อมใช้งาน
  // When: เรียก API สำหรับอ่านข้อมูลเมนูและโปรโมชั่น
  const { readMenuApi, readActivePromotionsApi } = buildApiContext();
  const menuPayload = readMenuApi();
  const promotionsPayload = readActivePromotionsApi();

  // Then: API ต้องคืนเมนูที่เปิดให้แสดงทั้งขายได้และหมดสต็อก พร้อมข้อมูล promotion ที่ใช้งานอยู่
  assert.equal(menuPayload.items.length, 4);
  assert.ok(menuPayload.items.every((item) => item.name && item.status));
  assert.equal(promotionsPayload.length, 1);
  assert.equal(promotionsPayload[0].id, 1);
  assert.equal(menuPayload.items[0].promotion.discountPercent, 10);
  assert.equal(menuPayload.items[0].discountedPrice, 41);
});

test('test_T_02_2_read_api_is_read_only_and_uses_latest_catalog', () => {
  // Given: API อ่านข้อมูลจำลองและไม่มีฟังก์ชันแก้ไขข้อมูล
  // When: ดึง payload หลายครั้งแล้วลองแก้ทีละส่วน
  const { readMenuApi, getMenuCatalog } = buildApiContext();
  const firstPayload = readMenuApi();
  firstPayload.items[0].name = 'มีการแก้ไข';
  const secondPayload = readMenuApi();

  // Then: การแก้ไข payload ไม่กระทบ catalog และข้อมูลที่อ่านต่อไปต้องเป็นข้อมูลล่าสุดจาก catalog
  assert.equal(secondPayload.items[0].name, getMenuCatalog().menuItems[0].name);
  assert.notEqual(firstPayload.items[0].name, secondPayload.items[0].name);
  assert.equal(typeof readMenuApi, 'function');
  assert.equal(typeof getMenuCatalog, 'function');
});
