const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');

const accountScript = readFileSync(resolve(__dirname, '../features/account/menu.js'), 'utf8');

function createAccountContext(values = {}) {
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

  const defaults = {
    'login-form': makeElement(),
    'register-form': makeElement(),
    'login-message': makeElement(),
    'register-message': makeElement(),
    'line-panel': makeElement({ hidden: true }),
    'line-message': makeElement(),
    'account-success': makeElement({ hidden: true }),
    'success-heading': makeElement(),
    'success-copy': makeElement(),
    'connect-line': makeElement(),
    'fail-line': makeElement(),
    'skip-line': makeElement(),
    'login-identifier': makeElement(),
    'login-password': makeElement(),
    'register-email': makeElement(),
    'register-phone': makeElement(),
    'register-password': makeElement(),
  };

  for (const [id, element] of Object.entries(defaults)) {
    elements.set(id, element);
  }
  for (const [id, value] of Object.entries(values)) {
    elements.set(id, makeElement({ value }));
  }

  runInNewContext(accountScript, {
    document: {
      getElementById(id) {
        return elements.get(id);
      },
    },
  });

  return elements;
}

test('test_T02_account_page_path_for_AC_ACCOUNT_03', () => {
  // รองรับ FR-02 และ NFR-USE-01: test ของ account ตรวจ markup จาก path จริง
  const accountPagePath = resolve(__dirname, '../features/account/index.html');
  const accountPage = readFileSync(accountPagePath, 'utf8');
  assert.ok(existsSync(accountPagePath));
  assert.match(accountPage, /id="login-message"/);
  assert.match(accountPage, /id="register-message"/);
});

test('test_AC_ACCOUNT_03_login_invalid_input', () => {
  // Given: ผู้ใช้กรอกข้อมูล login ว่างหรือไม่ตรงกับ Mock Data
  for (const values of [
    { 'login-identifier': '', 'login-password': '' },
    { 'login-identifier': 'unknown@owlcha.test', 'login-password': 'wrong-password' },
  ]) {
    const elements = createAccountContext(values);

    // When: ผู้ใช้ยืนยันการเข้าสู่ระบบ
    elements.get('login-form').onsubmit({ preventDefault() {} });

    // Then: ไม่เข้าสู่ระบบและแสดงข้อความตาม FR-04
    assert.equal(elements.get('account-success').hidden, true);
    assert.equal(elements.get('login-message').textContent, 'กรุณากรอกข้อมูลให้ถูกต้อง');
    assert.equal(elements.get('login-message').hidden, false);
  }
});

test('test_AC_ACCOUNT_03_register_duplicate_identifier', () => {
  // Given: ผู้ใช้กรอก Email ที่มีอยู่ใน Mock Data และ password ไม่ว่าง
  const elements = createAccountContext({
    'register-email': 'demo@owlcha.test',
    'register-password': 'another-password',
  });

  // When: ผู้ใช้ยืนยันการสมัครสมาชิก
  elements.get('register-form').onsubmit({ preventDefault() {} });

  // Then: ไม่สร้างบัญชีซ้ำและแสดงข้อความตาม FR-04
  assert.equal(elements.get('account-success').hidden, true);
  assert.equal(elements.get('register-form').resetCalled, undefined);
  assert.equal(elements.get('register-message').textContent, 'อีเมล/เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว');
  assert.equal(elements.get('register-message').hidden, false);
});

test('test_AC_ACCOUNT_03_register_duplicate_phone', () => {
  // รองรับ FR-04 และ AC-ACCOUNT-03: ป้องกันเบอร์โทรศัพท์ซ้ำใน Mock Memory
  const elements = createAccountContext({
    'register-email': '',
    'register-phone': '0823456789',
    'register-password': 'phone-password',
  });

  elements.get('register-form').onsubmit({ preventDefault() {} });
  elements.get('register-form').resetCalled = undefined;
  elements.get('register-email').value = '';
  elements.get('register-phone').value = '0823456789';
  elements.get('register-password').value = 'another-password';

  // When: ผู้ใช้ยืนยันการสมัครด้วยเบอร์โทรศัพท์เดิม
  elements.get('register-form').onsubmit({ preventDefault() {} });

  // Then: ไม่สร้างบัญชีซ้ำและแจ้งข้อความตาม FR-04
  assert.equal(elements.get('success-heading').textContent, 'สมัครสมาชิกสำเร็จ');
  assert.equal(elements.get('register-form').resetCalled, undefined);
  assert.equal(elements.get('register-message').textContent, 'อีเมล/เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว');
  assert.equal(elements.get('register-message').hidden, false);
});
