const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');

test('test_T02_account_page_path_for_AC_ACCOUNT_04', () => {
  // รองรับ FR-02: test ของ account ค้นพบส่วนต่อเนื่องของหน้าเดียวกัน
  const accountPagePath = resolve(__dirname, '../features/account/index.html');
  const accountPage = readFileSync(accountPagePath, 'utf8');
  assert.ok(existsSync(accountPagePath));
  assert.match(accountPage, /id="line-panel"/);
  assert.match(accountPage, /id="account-success"/);
});

test('test_AC_ACCOUNT_04_line_connect_success', () => {
  // Given: ผู้ใช้ Login/Register สำเร็จและเห็นขั้นตอน LINE
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
    dataset: {},
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
    elements.set(id, makeElement({ hidden: id === 'account-success' }));
  }
  elements.set('line-panel', makeElement({ hidden: true, dataset: { lineUserId: '' } }));
  elements.set('account-success', makeElement({ hidden: true }));
  elements.set('login-identifier', makeElement({ value: 'demo@owlcha.test' }));
  elements.set('login-password', makeElement({ value: 'demo123' }));

  const accountScript = readFileSync(resolve(__dirname, '../features/account/account.js'), 'utf8');
  runInNewContext(accountScript, {
    document: {
      getElementById(id) {
        return elements.get(id);
      },
    },
  });
  elements.get('login-form').onsubmit({ preventDefault() {} });

  // When: ผู้ใช้กดจำลองเชื่อมต่อ LINE
  elements.get('connect-line').onclick();

  // Then: แสดงสถานะสำเร็จและผูก Mock LINE User ID ใน Browser Memory กับบัญชีที่สำเร็จ
  assert.equal(elements.get('line-message').hidden, false);
  assert.match(elements.get('line-message').textContent, /เชื่อมต่อสำเร็จ/);
  assert.equal(elements.get('line-panel').dataset.lineUserId, 'mock-line-user-001');
});

test('test_AC_ACCOUNT_04_line_requires_login_or_register', () => {
  // รองรับ NFR-SEC-01 และ FR-06: ห้ามสร้างความสัมพันธ์ LINE ก่อน Login/Register
  const elements = new Map();
  const makeElement = (initial = {}) => ({
    addEventListener(eventName, handler) {
      this[`on${eventName}`] = handler;
    },
    scrollIntoView() {},
    hidden: false,
    textContent: '',
    className: '',
    value: '',
    validity: { typeMismatch: false },
    dataset: {},
    ...initial,
  });

  for (const id of [
    'login-form', 'register-form', 'login-message', 'register-message',
    'line-message', 'account-success', 'success-heading', 'success-copy',
    'connect-line', 'fail-line', 'skip-line', 'login-identifier',
    'login-password', 'register-email', 'register-phone', 'register-password',
  ]) {
    elements.set(id, makeElement({ hidden: id === 'account-success' }));
  }
  elements.set('line-panel', makeElement({ hidden: true, dataset: { lineUserId: '' } }));

  const accountScript = readFileSync(resolve(__dirname, '../features/account/account.js'), 'utf8');
  runInNewContext(accountScript, {
    document: {
      getElementById(id) {
        return elements.get(id);
      },
    },
  });

  // When: ผู้ใช้ที่ยังไม่ Login/Register กดเชื่อมต่อ LINE
  elements.get('connect-line').onclick();

  // Then: ไม่สร้างความสัมพันธ์ใหม่และไม่แสดง success
  assert.equal(elements.get('line-message').textContent, 'กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อนเชื่อมต่อ LINE');
  assert.equal(elements.get('line-message').hidden, false);
  assert.equal(elements.get('line-panel').dataset.lineUserId, '');
  assert.equal(elements.get('account-success').hidden, true);
});

test('test_AC_ACCOUNT_04_no_line_password_input_or_storage', () => {
  // รองรับ NFR-SEC-01: Prototype ต้องไม่รับหรือเก็บ Password ของบัญชี LINE
  const accountPage = readFileSync(resolve(__dirname, '../features/account/index.html'), 'utf8');
  const accountScript = readFileSync(resolve(__dirname, '../features/account/account.js'), 'utf8');

  assert.doesNotMatch(accountPage, /(?:line|LINE)[^<]*(?:password|รหัสผ่าน)/i);
  assert.doesNotMatch(accountPage, /id=["'][^"']*(?:line|LINE)[^"']*password/i);
  assert.doesNotMatch(accountScript, /(?:line|LINE)[A-Za-z_-]*(?:password|รหัสผ่าน)/i);
  assert.doesNotMatch(accountScript, /password[A-Za-z_-]*(?:line|LINE)/i);
});
