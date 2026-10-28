const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');
const { test } = require('node:test');

const appScript = readFileSync(resolve(__dirname, '../app.js'), 'utf8');
const indexHtml = readFileSync(resolve(__dirname, '../shared/index.html'), 'utf8');
const menuListElement = { innerHTML: '' };

runInNewContext(appScript, {
  document: {
    getElementById(id) {
      assert.equal(id, 'menu-list');
      return menuListElement;
    },
  },
});

function getMenuItemMarkup(name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const article = menuListElement.innerHTML.match(
    new RegExp(`<article class="menu-item" aria-label="${escapedName}">[\\s\\S]*?<\\/article>`),
  );

  assert.ok(article, `Expected menu item "${name}" to be rendered`);
  return article[0];
}

test('AC-MENU-02: หน้าเมนูโหลด app.js และมีพื้นที่แสดงรายการเมนู', () => {
  assert.match(indexHtml, /<div id="menu-list"/);
  assert.match(indexHtml, /<script src="\.\.\/app\.js"><\/script>/);
  assert.match(menuListElement.innerHTML, /<article class="menu-item"/);
});

test('AC-MENU-02: เมนูหมดสต็อกแสดงสถานะ “หมด”', () => {
  const soldOutMenu = getMenuItemMarkup('น้ำส้มคั้น');

  assert.match(soldOutMenu, /<span class="status-badge status-soldout">หมด<\/span>/);
});

test('AC-MENU-02: เมนูหมดสต็อกไม่สามารถกดปุ่มสั่งซื้อได้', () => {
  const soldOutMenu = getMenuItemMarkup('น้ำส้มคั้น');
  const orderButton = soldOutMenu.match(/<button\b[^>]*>[\s\S]*?<\/button>/);

  assert.ok(orderButton, 'Expected sold-out menu to render an order button');
  assert.match(orderButton[0], /<button\b[^>]*\bdisabled(?:\s|>)/);
});

test('AC-MENU-02: เมนูที่เปิดขายแสดงสถานะ “เปิดขาย” และปุ่ม “สั่งซื้อ” ที่ใช้งานได้', () => {
  const availableMenu = getMenuItemMarkup('ชาไทย');
  const orderButton = availableMenu.match(/<button\b[^>]*>[\s\S]*?<\/button>/);

  assert.match(availableMenu, /<span class="status-badge status-available">เปิดขาย<\/span>/);
  assert.ok(orderButton, 'Expected available menu to render an order button');
  assert.match(orderButton[0], />\s*สั่งซื้อ\s*<\/button>/);
  assert.doesNotMatch(orderButton[0], /\bdisabled\b/);
});

function renderMenuWithItems(items) {
  const menuListElement = { innerHTML: '' };
  const renderCall = 'renderMenu(menuItems);';
  const appScriptWithItems = appScript.replace(
    renderCall,
    `renderMenu(${JSON.stringify(items)});`,
  );

  assert.notEqual(appScriptWithItems, appScript, 'Expected app.js to contain its initial render call');

  runInNewContext(appScriptWithItems, {
    document: {
      getElementById(id) {
        assert.equal(id, 'menu-list');
        return menuListElement;
      },
    },
  });

  return menuListElement.innerHTML;
}

function getRenderedMenuItem(markup, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const item = markup.match(
    new RegExp(`<article class="menu-item" aria-label="${escapedName}">[\\s\\S]*?<\\/article>`),
  );

  assert.ok(item, `Expected menu item "${name}" to be rendered`);
  return item[0];
}

test('test_TC_MENU_02_1_show_menu_data_and_status', () => {
  // Given: ระบบมีข้อมูลเครื่องดื่มที่เปิดขายและหมดสต็อก
  // When: ผู้ใช้เปิดหน้ารายการเมนู
  const markup = renderMenuWithItems([
    {
      id: 201,
      name: 'ชาทดสอบพร้อมขาย',
      price: 45,
      description: 'รายละเอียดชาทดสอบพร้อมขาย',
      status: 'open',
    },
    {
      id: 202,
      name: 'ชาทดสอบหมดสต็อก',
      price: 55,
      description: 'รายละเอียดชาทดสอบหมดสต็อก',
      status: 'out_of_stock',
    },
  ]);
  const availableMenu = getRenderedMenuItem(markup, 'ชาทดสอบพร้อมขาย');
  const soldOutMenu = getRenderedMenuItem(markup, 'ชาทดสอบหมดสต็อก');
  const availableOrderButton = availableMenu.match(/<button\b[^>]*>[\s\S]*?<\/button>/);
  const soldOutOrderButton = soldOutMenu.match(/<button\b[^>]*>[\s\S]*?<\/button>/);

  // Then: ระบบแสดงชื่อ ราคา รายละเอียด และสถานะของเครื่องดื่มแต่ละรายการ
  assert.match(availableMenu, /<h2>ชาทดสอบพร้อมขาย<\/h2>/);
  assert.match(availableMenu, /<strong class="price">฿45<\/strong>/);
  assert.match(availableMenu, /<p class="menu-item__description">รายละเอียดชาทดสอบพร้อมขาย<\/p>/);
  assert.match(availableMenu, /<span class="status-badge status-available">เปิดขาย<\/span>/);
  assert.match(soldOutMenu, /<h2>ชาทดสอบหมดสต็อก<\/h2>/);
  assert.match(soldOutMenu, /<strong class="price">฿55<\/strong>/);
  assert.match(soldOutMenu, /<p class="menu-item__description">รายละเอียดชาทดสอบหมดสต็อก<\/p>/);

  // Then: เมนูที่เปิดขายสามารถกดสั่งได้
  assert.ok(availableOrderButton);
  assert.match(availableOrderButton[0], />\s*สั่งซื้อ\s*<\/button>/);
  assert.doesNotMatch(availableOrderButton[0], /\bdisabled\b/);

  // Then: เมนูหมดสต็อกแสดงสถานะ “หมด”
  assert.match(soldOutMenu, /<span class="status-badge status-soldout">หมด<\/span>/);

  // Then: เมนูหมดสต็อกไม่สามารถกดสั่งได้
  assert.ok(soldOutOrderButton);
  assert.match(soldOutOrderButton[0], /\bdisabled(?:\s|>)/);
});

test('test_TC_MENU_02_2_show_sold_out_menu', () => {
  // Given: ระบบมีข้อมูลเครื่องดื่มที่มีสถานะหมดสต็อก
  // When: ผู้ใช้เปิดหน้ารายการเมนู
  const markup = renderMenuWithItems([
    {
      id: 203,
      name: 'น้ำทดสอบหมดสต็อก',
      price: 60,
      description: 'รายละเอียดน้ำทดสอบหมดสต็อก',
      status: 'out_of_stock',
    },
  ]);
  const soldOutMenu = getRenderedMenuItem(markup, 'น้ำทดสอบหมดสต็อก');
  const orderButton = soldOutMenu.match(/<button\b[^>]*>[\s\S]*?<\/button>/);

  // Then: ระบบแสดงชื่อ ราคา รายละเอียด และสถานะของเมนู
  assert.match(soldOutMenu, /<h2>น้ำทดสอบหมดสต็อก<\/h2>/);
  assert.match(soldOutMenu, /<strong class="price">฿60<\/strong>/);
  assert.match(soldOutMenu, /<p class="menu-item__description">รายละเอียดน้ำทดสอบหมดสต็อก<\/p>/);

  // Then: สถานะเป็น “หมด”
  assert.match(soldOutMenu, /<span class="status-badge status-soldout">หมด<\/span>/);

  // Then: ไม่สามารถกดสั่งเมนูนี้ได้
  assert.ok(orderButton);
  assert.match(orderButton[0], /\bdisabled(?:\s|>)/);
});

test('test_TC_MENU_02_3_show_single_available_menu', () => {
  // Given: ระบบมีข้อมูลเครื่องดื่มที่เปิดขาย 1 รายการ
  // When: ผู้ใช้เปิดหน้ารายการเมนู
  const markup = renderMenuWithItems([
    {
      id: 204,
      name: 'ชาเดี่ยวพร้อมขาย',
      price: 70,
      description: 'รายละเอียดชาเดี่ยวพร้อมขาย',
      status: 'open',
    },
  ]);
  const availableMenu = getRenderedMenuItem(markup, 'ชาเดี่ยวพร้อมขาย');
  const orderButton = availableMenu.match(/<button\b[^>]*>[\s\S]*?<\/button>/);

  // Then: ระบบแสดงชื่อ ราคา รายละเอียด และสถานะของเครื่องดื่ม
  assert.equal((markup.match(/<article class="menu-item"/g) || []).length, 1);
  assert.match(availableMenu, /<h2>ชาเดี่ยวพร้อมขาย<\/h2>/);
  assert.match(availableMenu, /<strong class="price">฿70<\/strong>/);
  assert.match(availableMenu, /<p class="menu-item__description">รายละเอียดชาเดี่ยวพร้อมขาย<\/p>/);
  assert.match(availableMenu, /<span class="status-badge status-available">เปิดขาย<\/span>/);

  // Then: เมนูที่เปิดขายสามารถกดสั่งได้
  assert.ok(orderButton);
  assert.match(orderButton[0], />\s*สั่งซื้อ\s*<\/button>/);
  assert.doesNotMatch(orderButton[0], /\bdisabled\b/);
});
