const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');

test('test_T02_account_page_path_for_AC_ACCOUNT_06', () => {
  // รองรับ FR-02: test ของ account ตรวจว่าหน้า prototype มี script และส่วนผลลัพธ์
  const accountPagePath = resolve(__dirname, '../features/account/index.html');
  const accountPage = readFileSync(accountPagePath, 'utf8');
  assert.ok(existsSync(accountPagePath));
  assert.match(accountPage, /<script src="account\.js" defer><\/script>/);
  assert.match(accountPage, /id="line-message"/);
});

test('test_AC_ACCOUNT_06_line_connect_failure', () => {
  // Given: ผู้ใช้ login สำเร็จและเปิดขั้นตอน LINE แบบจำลอง
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
    elements.set(id, makeElement());
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

  // When: ผู้ใช้จำลองการเชื่อมต่อ LINE ไม่สำเร็จ
  elements.get('fail-line').onclick();

  // Then: แสดง failure และไม่ขัดขวางการใช้งาน prototype ต่อ
  assert.equal(elements.get('line-panel').hidden, false);
  assert.equal(elements.get('line-message').textContent, 'เชื่อมต่อ LINE ไม่สำเร็จ แต่ยังสามารถใช้งานต่อได้ตามปกติ');
  assert.equal(elements.get('line-message').hidden, false);
  assert.equal(elements.get('line-panel').dataset.lineUserId, '');
});
