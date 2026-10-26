const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');

const accountPagePath = resolve(__dirname, '../features/account/index.html');
const accountPage = readFileSync(accountPagePath, 'utf8');

test('test_T02_account_page_structure_and_test_path', () => {
  // รองรับ FR-02 และ NFR-USE-01: ชุดทดสอบต้องชี้ไปยังหน้า account จริง
  assert.ok(existsSync(accountPagePath));
  assert.match(accountPage, /<form id="login-form"/);
  assert.match(accountPage, /<form id="register-form"/);
  assert.match(accountPage, /<script src="account\.js" defer><\/script>/);
  assert.match(accountPage, /<link rel="stylesheet" href="\.\.\/\.\.\/shared\/styles\.css"\s*\/>/);
});

test('test_AC_ACCOUNT_01_register_success', () => {
  // Given: ผู้ใช้กรอก Email และ password ที่ถูกต้องในหน้า prototype
  const elements = new Map();
  const makeElement = (initial = {}) => ({
    addEventListener(eventName, handler) {
      this[`on${eventName}`] = handler;
    },
    scrollIntoView() {},
    reset() {
      this.resetCalled = true;
    },
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
  elements.set('register-email', makeElement({ value: 'new@owlcha.test' }));
  elements.set('register-phone', makeElement({ value: '' }));
  elements.set('register-password', makeElement({ value: 'new-password' }));
  elements.set('login-identifier', makeElement());
  elements.set('login-password', makeElement());

  const accountScript = readFileSync(resolve(__dirname, '../features/account/account.js'), 'utf8');
  runInNewContext(accountScript, {
    document: {
      getElementById(id) {
        return elements.get(id);
      },
    },
  });

  // When: ผู้ใช้ยืนยันการสมัครสมาชิก
  elements.get('register-form').onsubmit({ preventDefault() {} });

  // Then: สร้างบัญชีใน memory และให้เข้าสู่ flow ต่อได้ทันที
  assert.equal(elements.get('register-form').resetCalled, true);
  assert.equal(elements.get('account-success').hidden, false);
  assert.equal(elements.get('success-heading').textContent, 'สมัครสมาชิกสำเร็จ');
  assert.equal(elements.get('line-panel').hidden, false);
  assert.match(elements.get('success-copy').textContent, /เข้าสู่ระบบได้ทันที/);
});

test('test_AC_ACCOUNT_01_register_phone_only_success', () => {
  // รองรับ FR-01 และ AC-ACCOUNT-01: สมัครด้วยเบอร์โทรศัพท์อย่างเดียวใน Mock Memory
  const elements = new Map();
  const makeElement = (initial = {}) => ({
    addEventListener(eventName, handler) {
      this[`on${eventName}`] = handler;
    },
    scrollIntoView() {},
    reset() {
      this.resetCalled = true;
    },
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
    'fail-line', 'skip-line', 'login-identifier', 'login-password',
  ]) {
    elements.set(id, makeElement());
  }
  elements.set('line-panel', makeElement({ hidden: true }));
  elements.set('account-success', makeElement({ hidden: true }));
  elements.set('register-email', makeElement({ value: '' }));
  elements.set('register-phone', makeElement({ value: '0812345678' }));
  elements.set('register-password', makeElement({ value: 'phone-password' }));

  const accountScript = readFileSync(resolve(__dirname, '../features/account/account.js'), 'utf8');
  runInNewContext(accountScript, {
    document: {
      getElementById(id) {
        return elements.get(id);
      },
    },
  });

  // When: ผู้ใช้ยืนยันการสมัครสมาชิก
  elements.get('register-form').onsubmit({ preventDefault() {} });

  // Then: สร้างบัญชีสำเร็จโดยไม่ต้องกรอก Email
  assert.equal(elements.get('register-form').resetCalled, true);
  assert.equal(elements.get('account-success').hidden, false);
  assert.equal(elements.get('success-heading').textContent, 'สมัครสมาชิกสำเร็จ');
  assert.equal(elements.get('line-panel').hidden, false);
  assert.match(elements.get('success-copy').textContent, /เข้าสู่ระบบได้ทันที/);
});
