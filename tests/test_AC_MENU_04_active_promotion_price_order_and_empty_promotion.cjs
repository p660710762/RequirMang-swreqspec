const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');
const { test } = require('node:test');

const appScript = readFileSync(resolve(__dirname, '../app.js'), 'utf8');

function createApiContext() {
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
  };
}

test('test_AC_MENU_04_active_promotion_price_order_and_empty_promotion', () => {
  // Given: ระบบมีโปรโมชั่นที่กำลังใช้งานและเมนูที่มีโปรโมชั่น
  // When: ผู้ใช้เปิดหน้าเมนูและอ่านข้อมูลเมนู/โปรโมชั่นจาก API
  const { readMenuApi, readActivePromotionsApi } = createApiContext();
  const menuPayload = readMenuApi();
  const promotionsPayload = readActivePromotionsApi();

  // Then: API ต้องคืนเฉพาะโปรโมชั่นที่ใช้งานอยู่ และข้อมูลเมนูมีราคาหลังหักโปรโมชั่นที่คำนวณแล้ว
  assert.equal(promotionsPayload.length, 1);
  assert.equal(promotionsPayload[0].status, 'active');
  assert.equal(promotionsPayload[0].id, 1);

  const promoItem = menuPayload.items.find((item) => item.id === 1);
  assert.ok(promoItem, 'Expected menu item with active promotion to be returned');
  assert.ok(promoItem.promotion, 'Expected active promotion data to be included');
  assert.equal(promoItem.promotion.discountPercent, 10);
  assert.equal(promoItem.discountedPrice, 41);
  assert.equal(menuPayload.items[0].id, 1, 'Menu items with active promotion should be ordered first');

  // Then: เมนูที่ไม่มีโปรโมชั่นต้องมีค่า promotion เป็น null และยังคงแสดงข้อมูลปกติ
  const nonPromoItem = menuPayload.items.find((item) => item.id === 4);
  assert.ok(nonPromoItem);
  assert.equal(nonPromoItem.promotion, null);
  assert.equal(nonPromoItem.price, 65);
});

test('test_AC_MENU_04_ui_renders_active_promotions_and_discounted_prices', () => {
  const menuListElement = { innerHTML: '' };
  const context = {
    document: {
      getElementById(id) {
        assert.equal(id, 'menu-list');
        return menuListElement;
      },
      querySelector(selector) {
        if (selector === '#menu-search') {
          return null;
        }
        return null;
      },
    },
  };

  runInNewContext(appScript, context);
  context.renderMenu(context.getMenuCatalog().menuItems);

  const markup = menuListElement.innerHTML;
  assert.match(markup, /<section class="promotion-section"/);
  assert.match(markup, /ลด 10%/);
  assert.match(markup, /฿41/);
  assert.ok(markup.indexOf('aria-label="ชาไทย"') < markup.indexOf('aria-label="มัทฉะลาเต้"'));
  assert.ok(markup.indexOf('aria-label="ชาไทย"') < markup.indexOf('aria-label="กาแฟเย็น"'));
  assert.match(markup, /promotion-badge/);
});
