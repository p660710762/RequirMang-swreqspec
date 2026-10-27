import { useState } from 'react';

export const MOCK_LINE_USER_ID = 'mock-line-user-001';

const initialMockAccounts = [];

const normalizeIdentifier = (value) => value.trim().toLowerCase();

// รองรับ FR-01 และ FR-02: ตรวจข้อมูลสมัครสมาชิกก่อนสร้าง Mock Account
export function validateRegistration({ email = '', phone = '', password = '' }, accounts = []) {
  const normalizedEmail = normalizeIdentifier(email);
  const normalizedPhone = normalizeIdentifier(phone);

  if ((!normalizedEmail && !normalizedPhone) || !password.trim()) {
    return { valid: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' };
  }

  const duplicate = accounts.some((account) => (
    (normalizedEmail && normalizeIdentifier(account.email) === normalizedEmail)
    || (normalizedPhone && normalizeIdentifier(account.phone) === normalizedPhone)
  ));

  if (duplicate) {
    return { valid: false, error: 'อีเมล/เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว' };
  }

  return { valid: true, error: '' };
}

// รองรับ FR-01 และ FR-03: จัดรูปข้อมูลบัญชี Mock สำหรับ React State
export function createMockAccount({ email = '', phone = '', password }) {
  return {
    id: crypto.randomUUID(),
    email,
    phone,
    password,
  };
}

// รองรับ FR-01 และ FR-02: สร้าง Mock Account เมื่อข้อมูลผ่านการตรวจสอบ
export function registerMockAccount(input, accounts = []) {
  const validation = validateRegistration(input, accounts);

  if (!validation.valid) {
    return { account: null, error: validation.error };
  }

  return {
    account: createMockAccount({
      email: input.email.trim(),
      phone: input.phone.trim(),
      password: input.password,
    }),
    error: '',
  };
}

// รองรับ FR-03: ตรวจข้อมูลบัญชี Mock และคืนผู้ใช้เมื่อข้อมูล Login ถูกต้อง
export function loginMockAccount({ email = '', phone = '', password = '' }, accounts = []) {
  const normalizedEmail = normalizeIdentifier(email);
  const normalizedPhone = normalizeIdentifier(phone);

  if ((!normalizedEmail && !normalizedPhone) || !password.trim()) {
    return null;
  }

  return accounts.find((account) => {
    const matchesIdentifier = (
      (normalizedEmail && normalizeIdentifier(account.email) === normalizedEmail)
      || (normalizedPhone && normalizeIdentifier(account.phone) === normalizedPhone)
    );

    return matchesIdentifier && account.password === password;
  }) || null;
}

// รองรับ FR-05 และ FR-06: จัดรูปความสัมพันธ์ Mock LINE โดยไม่มี LINE Password
export function createMockLineLink(accountId) {
  return {
    accountId,
    lineUserId: MOCK_LINE_USER_ID,
  };
}

// รองรับ FR-05, FR-06 และ NFR-SEC-01: เชื่อม Mock LINE ได้เฉพาะผู้ใช้ที่ Login/Register สำเร็จ
export function connectMockLine(currentAccount, lineLinks = []) {
  if (!currentAccount) {
    return { link: null, lineLinks };
  }

  const existingLink = lineLinks.find((link) => link.accountId === currentAccount.id);

  if (existingLink) {
    return { link: existingLink, lineLinks };
  }

  const link = createMockLineLink(currentAccount.id);
  return { link, lineLinks: [...lineLinks, link] };
}

// รองรับ FR-05 และ Alternative Flow 7b: ข้าม Mock LINE โดยไม่สร้างความสัมพันธ์
export function skipMockLine(lineLinks = []) {
  return { lineLinks, skipped: true };
}

// รองรับ FR-05, UC-02 Exception Flow 7c และ NFR-REL-01: จำลอง LINE ล้มเหลวโดยไม่บันทึก User ID
export function failMockLine(lineLinks = []) {
  return {
    lineLinks,
    failed: true,
    error: 'เชื่อมต่อ LINE ไม่สำเร็จ แต่ยังใช้งาน Prototype ต่อได้',
  };
}

// รองรับ FR-01, FR-03, FR-05, FR-06 และ NFR-SEC-01: เก็บข้อมูล Prototype ในหน่วยความจำ
export function useAccountPrototypeState() {
  const [accounts, setAccounts] = useState(initialMockAccounts);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [lineLinks, setLineLinks] = useState([]);

  return {
    accounts,
    setAccounts,
    currentAccount,
    setCurrentAccount,
    lineLinks,
    setLineLinks,
  };
}

// รองรับ FR-02 และ NFR-USE-01: แสดงโครงหน้า Login/Register หน้าเดียว
export default function App() {
  const {
    accounts,
    setAccounts,
    currentAccount,
    setCurrentAccount,
    lineLinks,
    setLineLinks,
  } = useAccountPrototypeState();
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [loginIdentity, setLoginIdentity] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');
  const [loginError, setLoginError] = useState('');
  const [lineSuccess, setLineSuccess] = useState('');
  const [lineSkipped, setLineSkipped] = useState('');
  const [lineError, setLineError] = useState('');

  const handleRegister = (event) => {
    event.preventDefault();
    const result = registerMockAccount(
      { email: registerEmail, phone: registerPhone, password: registerPassword },
      accounts,
    );

    if (!result.account) {
      setRegisterError(result.error);
      setRegisterSuccess('');
      return;
    }

    setAccounts((currentAccounts) => [...currentAccounts, result.account]);
    setCurrentAccount(result.account);
    setRegisterError('');
    setRegisterSuccess('สมัครสมาชิกสำเร็จ และเข้าสู่ระบบแล้ว');
  };

  const handleLogin = (event) => {
    event.preventDefault();
    const account = loginMockAccount(
      { email: loginIdentity, phone: loginIdentity, password: loginPassword },
      accounts,
    );

    if (account) {
      setCurrentAccount(account);
      setLoginSuccess('เข้าสู่ระบบสำเร็จ');
      setLoginError('');
      return;
    }

    setLoginSuccess('');
    setLoginError('กรุณากรอกข้อมูลให้ถูกต้อง');
  };

  const handleMockLineConnect = () => {
    const result = connectMockLine(currentAccount, lineLinks);

    if (!result.link) {
      return;
    }

    setLineLinks(result.lineLinks);
    setLineSuccess(`เชื่อมต่อ LINE สำเร็จ: ${result.link.lineUserId}`);
  };

  const handleMockLineSkip = () => {
    const result = skipMockLine(lineLinks);

    setLineLinks(result.lineLinks);
    setLineSkipped('ข้ามการเชื่อมต่อ LINE แล้ว และใช้งาน Prototype ต่อได้');
  };

  const handleMockLineFailure = () => {
    const result = failMockLine(lineLinks);

    setLineLinks(result.lineLinks);
    setLineError(result.error);
  };

  return (
    <main>
      <h1>Account Prototype</h1>
      <p>
        {currentAccount
          ? 'สถานะ: Auto-login ใน Prototype'
          : 'ยังไม่มีผู้ใช้ปัจจุบัน'}
      </p>

      {currentAccount && (
        <section aria-labelledby="line-heading">
          <h2 id="line-heading">เชื่อมต่อ LINE</h2>
          <button type="button" onClick={handleMockLineConnect}>
            เชื่อมต่อ Mock LINE
          </button>
          <button type="button" onClick={handleMockLineSkip}>
            ข้ามการเชื่อมต่อ LINE
          </button>
          <button type="button" onClick={handleMockLineFailure}>
            จำลองการเชื่อมต่อล้มเหลว
          </button>
          {lineSuccess && <p role="status">{lineSuccess}</p>}
          {lineSkipped && <p role="status">{lineSkipped}</p>}
          {lineError && <p role="alert">{lineError}</p>}
        </section>
      )}

      <section aria-labelledby="login-heading">
        <h2 id="login-heading">เข้าสู่ระบบ</h2>
        <form onSubmit={handleLogin}>
          <label htmlFor="login-identity">อีเมลหรือเบอร์โทรศัพท์</label>
          <input
            id="login-identity"
            name="loginIdentity"
            value={loginIdentity}
            onChange={(event) => setLoginIdentity(event.target.value)}
          />
          <label htmlFor="login-password">รหัสผ่าน</label>
          <input
            id="login-password"
            name="loginPassword"
            type="password"
            value={loginPassword}
            onChange={(event) => setLoginPassword(event.target.value)}
          />
          <button type="submit">เข้าสู่ระบบ</button>
          {loginSuccess && <p role="status">{loginSuccess}</p>}
          {loginError && <p role="alert">{loginError}</p>}
        </form>
      </section>

      <section aria-labelledby="register-heading">
        <h2 id="register-heading">สมัครสมาชิก</h2>
        <form onSubmit={handleRegister}>
          <label htmlFor="register-email">อีเมล</label>
          <input
            id="register-email"
            name="registerEmail"
            type="email"
            value={registerEmail}
            onChange={(event) => setRegisterEmail(event.target.value)}
          />
          <label htmlFor="register-phone">เบอร์โทรศัพท์</label>
          <input
            id="register-phone"
            name="registerPhone"
            type="tel"
            value={registerPhone}
            onChange={(event) => setRegisterPhone(event.target.value)}
          />
          <label htmlFor="register-password">รหัสผ่าน</label>
          <input
            id="register-password"
            name="registerPassword"
            type="password"
            value={registerPassword}
            onChange={(event) => setRegisterPassword(event.target.value)}
          />
          <button type="submit">สมัครสมาชิก</button>
          {registerSuccess && <p role="status">{registerSuccess}</p>}
          {registerError && <p role="alert">{registerError}</p>}
        </form>
      </section>
    </main>
  );
}
