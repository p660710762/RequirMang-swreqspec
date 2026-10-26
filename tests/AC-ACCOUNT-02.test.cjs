const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');
const { test } = require('node:test');

test('test_T02_account_page_path_for_AC_ACCOUNT_02', () => {
  // รองรับ FR-02 และ NFR-USE-01: test ของ account ใช้หน้า prototype เดียวกัน
  const accountPagePath = resolve(__dirname, '../features/account/index.html');
  const accountPage = readFileSync(accountPagePath, 'utf8');
  assert.ok(existsSync(accountPagePath));
  assert.match(accountPage, /data-spec="SPEC-ACCOUNT-001"/);
  assert.match(accountPage, /<script src="menu\.js" defer><\/script>/);
});

test('test_AC_ACCOUNT_02_login_success', () => {
  // Given: ผู้ใช้มีบัญชีตัวอย่างและกรอก identifier/password ที่ถูกต้อง
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

  elements.set('login-form', makeElement());
  elements.set('register-form', makeElement());
  elements.set('login-message', makeElement());
  elements.set('register-message', makeElement());
  elements.set('line-panel', makeElement({ hidden: true }));
  elements.set('line-message', makeElement());
  elements.set('account-success', makeElement({ hidden: true }));
  elements.set('success-heading', makeElement());
  elements.set('success-copy', makeElement());
  elements.set('connect-line', makeElement());
  elements.set('fail-line', makeElement());
  elements.set('skip-line', makeElement());
  elements.set('login-identifier', makeElement({ value: 'demo@owlcha.test' }));
  elements.set('login-password', makeElement({ value: 'demo123' }));
  elements.set('register-email', makeElement());
  elements.set('register-phone', makeElement());
  elements.set('register-password', makeElement());

  const accountScript = readFileSync(resolve(__dirname, '../features/account/menu.js'), 'utf8');
  runInNewContext(accountScript, {
    document: {
      getElementById(id) {
        return elements.get(id);
      },
    },
  });

  // When: ผู้ใช้ยืนยันการเข้าสู่ระบบ
  elements.get('login-form').onsubmit({ preventDefault() {} });

  // Then: prototype อนุญาตให้เข้าสู่ระบบและแสดงสถานะสำเร็จ
  assert.equal(elements.get('account-success').hidden, false);
  assert.equal(elements.get('success-heading').textContent, 'เข้าสู่ระบบสำเร็จ');
  assert.match(elements.get('success-copy').textContent, /เข้าสู่ระบบตัวอย่างแล้ว/);
  assert.equal(elements.get('login-message').hidden, true);
});

test('test_AC_ACCOUNT_02_login_phone_only_account', () => {
  // รองรับ FR-03 และ AC-ACCOUNT-02: Login ด้วยเบอร์โทรศัพท์ของบัญชีใน Mock Memory
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
    'login-form', 'register-form', 'login-message', 'register-message',
    'line-message', 'success-heading', 'success-copy', 'connect-line',
    'fail-line', 'skip-line',
  ]) {
    elements.set(id, makeElement());
  }
  elements.set('line-panel', makeElement({ hidden: true }));
  elements.set('account-success', makeElement({ hidden: true }));
  elements.set('register-email', makeElement({ value: '' }));
  elements.set('register-phone', makeElement({ value: '0898765432' }));
  elements.set('register-password', makeElement({ value: 'phone-password' }));
  elements.set('login-identifier', makeElement({ value: '' }));
  elements.set('login-password', makeElement({ value: '' }));

  const accountScript = readFileSync(resolve(__dirname, '../features/account/menu.js'), 'utf8');
  runInNewContext(accountScript, {
    document: {
      getElementById(id) {
        return elements.get(id);
      },
    },
  });

  elements.get('register-form').onsubmit({ preventDefault() {} });
  elements.get('login-identifier').value = '0898765432';
  elements.get('login-password').value = 'phone-password';

  // When: ผู้ใช้ Login ด้วยเบอร์โทรศัพท์และ password ของบัญชีที่สมัคร
  elements.get('login-form').onsubmit({ preventDefault() {} });

  // Then: Login สำเร็จใน Mock Memory
  assert.equal(elements.get('account-success').hidden, false);
  assert.equal(elements.get('success-heading').textContent, 'เข้าสู่ระบบสำเร็จ');
  assert.equal(elements.get('login-message').hidden, true);
});
