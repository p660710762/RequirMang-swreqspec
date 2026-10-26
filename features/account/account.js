const demoAccounts = [
  { email: 'demo@owlcha.test', phone: '', password: 'demo123' },
];
const MOCK_LINE_USER_ID = 'mock-line-user-001';

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginMessage = document.getElementById('login-message');
const registerMessage = document.getElementById('register-message');
const linePanel = document.getElementById('line-panel');
const lineMessage = document.getElementById('line-message');
const accountSuccess = document.getElementById('account-success');
const successHeading = document.getElementById('success-heading');
const successCopy = document.getElementById('success-copy');
let activeAccount = null;

function setMessage(element, text, type = '') {
  element.textContent = text;
  element.className = `form-message ${type}`.trim();
  element.hidden = !text;
}

function finishAccountFlow(account, heading, copy) {
  activeAccount = account;
  successHeading.textContent = heading;
  successCopy.textContent = copy;
  accountSuccess.hidden = false;
  linePanel.hidden = false;
  linePanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  setMessage(loginMessage, '');
  const identifier = document.getElementById('login-identifier').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;

  const account = demoAccounts.find((entry) =>
    (entry.email && entry.email.toLowerCase() === identifier || entry.phone === identifier)
      && entry.password === password,
  );

  if (!identifier || !password || !account) {
    setMessage(loginMessage, 'กรุณากรอกข้อมูลให้ถูกต้อง', 'error');
    return;
  }

  finishAccountFlow(account, 'เข้าสู่ระบบสำเร็จ', 'เข้าสู่ระบบตัวอย่างแล้ว ข้อมูลบัญชีนี้ไม่มีการเชื่อมต่อกับบริการจริง');
});

registerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  setMessage(registerMessage, '');

  const email = document.getElementById('register-email').value.trim();
  const phone = document.getElementById('register-phone').value.trim();
  const password = document.getElementById('register-password').value;
  const emailInput = document.getElementById('register-email');

  if ((!email && !phone) || !password || emailInput.validity.typeMismatch) {
    setMessage(registerMessage, 'กรุณากรอก Email หรือเบอร์โทรศัพท์อย่างน้อยหนึ่งช่อง และรหัสผ่านให้ถูกต้อง', 'error');
    return;
  }

  const duplicate = demoAccounts.some((account) =>
    (email && account.email.toLowerCase() === email.toLowerCase())
      || (phone && account.phone === phone),
  );
  if (duplicate) {
    setMessage(registerMessage, 'อีเมล/เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว', 'error');
    return;
  }

  const account = { email, phone, password };
  demoAccounts.push(account);
  registerForm.reset();
  setMessage(registerMessage, '');
  finishAccountFlow(account, 'สมัครสมาชิกสำเร็จ', 'สร้างบัญชีตัวอย่างแล้วและเข้าสู่ระบบได้ทันที (ข้อมูลอยู่ในหน่วยความจำของหน้านี้เท่านั้น)');
});

// รองรับ FR-05 และ FR-06: จำลองการเชื่อมต่อ LINE เฉพาะบัญชีที่ผ่าน login/register
document.getElementById('connect-line').addEventListener('click', () => {
  if (!activeAccount) {
    setMessage(lineMessage, 'กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อนเชื่อมต่อ LINE', 'error');
    return;
  }
  activeAccount.lineUserId = MOCK_LINE_USER_ID;
  linePanel.dataset.lineUserId = MOCK_LINE_USER_ID;
  setMessage(lineMessage, 'เชื่อมต่อสำเร็จและบันทึก LINE User ID จำลองแล้ว ไม่มีการเชื่อมต่อ LINE จริง', 'success');
});

document.getElementById('fail-line').addEventListener('click', () => {
  setMessage(lineMessage, 'เชื่อมต่อ LINE ไม่สำเร็จ แต่ยังสามารถใช้งานต่อได้ตามปกติ', 'error');
});

document.getElementById('skip-line').addEventListener('click', () => {
  linePanel.hidden = true;
  setMessage(lineMessage, '');
  successCopy.textContent = 'ข้ามการเชื่อมต่อ LINE ได้ และยังใช้งานต้นแบบต่อได้ตามปกติ';
});
