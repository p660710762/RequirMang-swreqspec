const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');
const { test } = require('node:test');

const appScript = readFileSync(resolve(__dirname, '../app.js'), 'utf8');

function renderWithApiData(items) {
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
  context.renderMenu(items);
  return menuListElement.innerHTML;
}

test('test_AC_MENU_01_show_items_and_empty_state', () => {
  // Given: ระบบมีรายการเมนูที่เปิดให้แสดงบนหน้าร้าน
  // When: หน้าเมนูโหลดข้อมูลจาก API
  const markupWithItems = renderWithApiData([
    {
      id: 1,
      name: 'ชาไทยทดสอบ',
      price: 45,
      description: 'รายละเอียดชาไทยทดสอบ',
      status: 'open',
    },
    {
      id: 2,
      name: 'น้ำส้มคั้นทดสอบ',
      price: 55,
      description: 'รายละเอียดน้ำส้มคั้นทดสอบ',
      status: 'out_of_stock',
    },
  ]);

  // Then: ระบบแสดงรายการเมนูที่มีอยู่
  assert.match(markupWithItems, /aria-label="ชาไทยทดสอบ"/);
  assert.match(markupWithItems, /aria-label="น้ำส้มคั้นทดสอบ"/);

  // Given: ระบบไม่มีรายการเมนูเลย
  // When: หน้าเมนูโหลดข้อมูลจาก API
  const emptyMarkup = renderWithApiData([]);

  // Then: ระบบแสดงข้อความ “ขณะนี้ไม่มีรายการเครื่องดื่ม”
  assert.match(emptyMarkup, /ขณะนี้ไม่มีรายการเครื่องดื่ม/);
});
