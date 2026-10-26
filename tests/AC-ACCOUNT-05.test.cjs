const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');

test('test_T02_account_page_path_for_AC_ACCOUNT_05', () => {
  // รองรับ FR-02 และ NFR-USE-01: test ของ account ใช้ asset path ที่มีอยู่จริง
  const accountPagePath = resolve(__dirname, '../features/account/index.html');
  const accountPage = readFileSync(accountPagePath, 'utf8');
  const scriptPath = resolve(__dirname, '../features/account/menu.js');
  const stylePath = resolve(__dirname, '../shared/styles.css');
  assert.ok(existsSync(accountPagePath));
  assert.ok(existsSync(scriptPath));
  assert.ok(existsSync(stylePath));
  assert.match(accountPage, /href="\.\.\/\.\.\/shared\/styles\.css"/);
});

test('test_AC_ACCOUNT_05_skip_line_connection', () => {
  // Given: ผู้ใช้ login สำเร็จและเห็นขั้นตอน LINE ใน prototype
  const elements = new Map();
  const makeElement = (initial = {}) => ({
    addEventListener(eventName, handler) {
      this[`on${eventName}`] = handler;
    },
    scrollIntoView() {},
    reset() {},
    hidden: false,
    textContent: '',
    className: '',
    value: '',
    validity: { typeMismatch: false },
    ...initial,
  });

  for (const id of [
    'login-form',
    'register-form',
    'login-message',
    'register-message',
    'line-message',
    'success-heading',
    'success-copy',
    'connect-line',
    'fail-line',
    'skip-line',
    'register-email',
    'register-phone',
    'register-password',
  ]) {
    elements.set(id, makeElement());
  }
  elements.set('line-panel', makeElement({ hidden: true }));
  elements.set('account-success', makeElement({ hidden: true }));
  elements.set('login-identifier', makeElement({ value: 'demo@owlcha.test' }));
  elements.set('login-password', makeElement({ value: 'demo123' }));

  const accountScript = readFileSync(resolve(__dirname, '../features/account/menu.js'), 'utf8');
  runInNewContext(accountScript, {
    document: {
      getElementById(id) {
        return elements.get(id);
      },
    },
  });
  elements.get('login-form').onsubmit({ preventDefault() {} });

  // When: ผู้ใช้กด “ข้ามไปก่อน”
  elements.get('skip-line').onclick();

  // Then: ปิดขั้นตอน LINE และยังใช้ prototype ต่อได้
  assert.equal(elements.get('line-panel').hidden, true);
  assert.match(elements.get('success-copy').textContent, /ยังใช้งานต้นแบบต่อได้ตามปกติ/);
});
