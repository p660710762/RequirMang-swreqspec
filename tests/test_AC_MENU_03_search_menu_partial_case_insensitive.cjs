const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');
const { test } = require('node:test');

const appScript = readFileSync(resolve(__dirname, '../app.js'), 'utf8');

function createAppContext() {
  const menuListElement = { innerHTML: '' };
  const searchInput = {
    value: '',
    listeners: {},
    addEventListener(event, callback) {
      this.listeners[event] = callback;
    },
    dispatch(value) {
      this.value = value;
      if (this.listeners.input) {
        this.listeners.input({ target: this });
      }
    },
  };

  const context = {
    document: {
      getElementById(id) {
        if (id === 'menu-list') {
          return menuListElement;
        }
        return null;
      },
      querySelector(selector) {
        if (selector === '#menu-search') {
          return searchInput;
        }
        return null;
      },
    },
  };

  runInNewContext(appScript, context);
  return { context, menuListElement, searchInput };
}

test('test_AC_MENU_03_search_menu_partial_case_insensitive', () => {
  const { context, menuListElement, searchInput } = createAppContext();
  const items = [
    { id: 101, name: 'Thai Tea', price: 55, description: 'Tea with milk', status: 'open' },
    { id: 102, name: 'Lemon Soda', price: 40, description: 'Fresh lemon', status: 'open' },
  ];

  context.menuItems = items;
  searchInput.dispatch('thai');
  assert.match(menuListElement.innerHTML, /Thai Tea/);
  assert.doesNotMatch(menuListElement.innerHTML, /Lemon Soda/);

  searchInput.dispatch('THAI');
  assert.match(menuListElement.innerHTML, /Thai Tea/);

  searchInput.dispatch('คำค้นที่ไม่มีเมนู');
  assert.match(menuListElement.innerHTML, /ไม่พบเมนู/);

  // API helper coverage for partial and case-insensitive matching.
  const matches = context.searchMenuApi('thai', items);
  const upperMatches = context.searchMenuApi('THAI', items);
  const noResults = context.searchMenuApi('คำค้นที่ไม่มีเมนู', items);

  assert.equal(matches.items.length, 1);
  assert.equal(matches.items[0].name, 'Thai Tea');
  assert.equal(upperMatches.items.length, 1);
  assert.equal(upperMatches.items[0].name, 'Thai Tea');
  assert.equal(noResults.items.length, 0);
  assert.equal(noResults.message, 'ไม่พบเมนู');
});
