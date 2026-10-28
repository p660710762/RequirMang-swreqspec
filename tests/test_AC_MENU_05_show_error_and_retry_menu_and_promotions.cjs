const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');
const { test } = require('node:test');

const appScript = readFileSync(resolve(__dirname, '../app.js'), 'utf8');

function createMenuLoadContext() {
  const menuListElement = {
    innerHTML: '',
    listeners: {},
    addEventListener(event, callback) {
      this.listeners[event] = callback;
    },
    dispatchClick() {
      if (this.listeners.click) {
        this.listeners.click({ target: { closest: (selector) => (selector === '.retry-button' ? { classList: { contains: () => true } } : null) } });
      }
    },
  };
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
  return { context, menuListElement };
}

test('test_AC_MENU_05_show_error_and_retry_menu_and_promotions', () => {
  // Given: ระบบไม่สามารถโหลดข้อมูลเมนูหรือโปรโมชั่นได้
  const { context, menuListElement } = createMenuLoadContext();
  context.readMenuApi = () => {
    throw new Error('menu load failed');
  };
  context.readActivePromotionsApi = () => {
    throw new Error('promotion load failed');
  };

  // When: ผู้ใช้เปิดหน้ารายการเมนูและระบบเกิดข้อผิดพลาด
  context.loadMenuFromApi();

  // Then: ระบบจะแสดงข้อความแจ้งว่าดาวน์โหลดข้อมูลไม่ได้ พร้อมปุ่ม “ลองใหม่” และไม่แสดงข้อมูลที่ยังไม่ยืนยันจากระบบ
  assert.match(menuListElement.innerHTML, /ไม่สามารถโหลดข้อมูลได้/);
  assert.match(menuListElement.innerHTML, /<button[^>]*class="retry-button"[^>]*>ลองใหม่<\/button>/);

  // When: ผู้ใช้กดปุ่มลองใหม่ และข้อมูลเรียกโหลดได้สำเร็จ
  context.readMenuApi = () => ({
    items: [
      {
        id: 10,
        name: 'ชาไทย',
        price: 45,
        description: 'ชาล้วนเข้มข้น',
        status: 'open',
        promotion: null,
        discountedPrice: 45,
      },
    ],
  });
  context.readActivePromotionsApi = () => [];
  menuListElement.dispatchClick();

  // Then: ระบบโหลดข้อมูลเมนูและโปรโมชั่นใหม่ และเริ่มแสดงผลที่ยืนยันแล้วแทนข้อความ error
  assert.match(menuListElement.innerHTML, /ชาไทย/);
  assert.doesNotMatch(menuListElement.innerHTML, /ไม่สามารถโหลดข้อมูลได้/);
});
