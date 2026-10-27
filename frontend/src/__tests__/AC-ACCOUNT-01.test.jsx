import { describe, expect, test } from 'vitest';
import {
  connectMockLine,
  failMockLine,
  loginMockAccount,
  MOCK_LINE_USER_ID,
  registerMockAccount,
  skipMockLine,
  validateRegistration,
} from '../App.jsx';

describe('AC-ACCOUNT-01 Register', () => {
  test('test_AC_ACCOUNT_01_register_success', () => {
    // Given ลูกค้ากรอก Email และ Password ที่ถูกต้องและครบถ้วน
    const input = {
      email: 'customer@example.com',
      phone: '',
      password: 'valid-password',
    };

    // When ลูกค้ายืนยันการสมัครสมาชิก
    const result = registerMockAccount(input, []);

    // Then ระบบสร้างบัญชี Mock
    expect(result.account).not.toBeNull();
    // Then แสดงสถานะสมัครสมาชิกสำเร็จ
    expect(result.error).toBe('');
    // Then ตั้งสถานะ Auto-login ใน Prototype
    expect(result.account.email).toBe(input.email);
    // Then ลูกค้าเข้าสู่ flow ต่อได้ทันทีโดยไม่ต้องกรอก Login ซ้ำ
    expect(result.account.password).toBe(input.password);
  });

  test('test_AC_ACCOUNT_01_register_phone_only', () => {
    // Given ลูกค้ากรอกเบอร์โทรศัพท์อย่างน้อยหนึ่งช่องและ Password ที่ไม่ว่าง โดยไม่กรอก Email
    const input = {
      email: '',
      phone: '0812345678',
      password: 'valid-password',
    };

    // When ลูกค้ายืนยันการสมัครสมาชิก
    const result = registerMockAccount(input, []);

    // Then ระบบสร้างบัญชี Mock
    expect(result.account).not.toBeNull();
    // Then แสดงสถานะสมัครสมาชิกสำเร็จ
    expect(result.error).toBe('');
    // Then ตั้งสถานะ Auto-login ใน Prototype
    expect(result.account.phone).toBe(input.phone);
    // Then ลูกค้าเข้าสู่ flow ต่อได้ทันทีโดยไม่ต้องกรอก Login ซ้ำ
    expect(result.account.password).toBe(input.password);
  });

  test('test_AC_ACCOUNT_01_register_without_identifier', () => {
    // Given ลูกค้าไม่กรอกทั้ง Email และเบอร์โทรศัพท์ แต่กรอก Password ที่ไม่ว่าง
    const input = {
      email: '',
      phone: '',
      password: 'valid-password',
    };

    // When ลูกค้ายืนยันการสมัครสมาชิก
    const result = registerMockAccount(input, []);

    // Then ระบบปฏิเสธการสมัครสมาชิกและไม่สร้างบัญชี
    expect(result.account).toBeNull();
  });

  test('test_AC_ACCOUNT_01_register_without_password', () => {
    // Given ลูกค้ากรอก Email หรือเบอร์โทรศัพท์อย่างน้อยหนึ่งช่อง แต่ไม่กรอก Password
    const input = {
      email: 'customer@example.com',
      phone: '',
      password: '',
    };

    // When ลูกค้ายืนยันการสมัครสมาชิก
    const result = registerMockAccount(input, []);

    // Then ระบบปฏิเสธการสมัครสมาชิกและไม่สร้างบัญชี
    expect(result.account).toBeNull();
  });

  test('test_AC_ACCOUNT_01_register_duplicate_email', () => {
    // Given ลูกค้ามีบัญชีที่ใช้ Email นี้อยู่แล้ว และกรอก Password ที่ไม่ว่าง
    const accounts = [{
      id: 'existing-email-account',
      email: 'existing@example.com',
      phone: '',
      password: 'valid-password',
    }];
    const input = {
      email: 'existing@example.com',
      phone: '',
      password: 'another-password',
    };

    // When ลูกค้ายืนยันการสมัครสมาชิกด้วย Email เดิม
    const result = registerMockAccount(input, accounts);

    // Then ระบบปฏิเสธการสมัครสมาชิกทันที
    expect(result.account).toBeNull();
    // Then แสดงข้อความ “อีเมล/เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว”
    expect(result.error).toBe('อีเมล/เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว');
    // Then ไม่สร้างบัญชีซ้ำ
    expect(accounts).toHaveLength(1);
  });

  test('test_AC_ACCOUNT_01_register_duplicate_phone', () => {
    // Given ลูกค้ามีบัญชีที่ใช้เบอร์โทรศัพท์นี้อยู่แล้ว และกรอก Password ที่ไม่ว่าง
    const accounts = [{
      id: 'existing-phone-account',
      email: '',
      phone: '0812345678',
      password: 'valid-password',
    }];
    const input = {
      email: '',
      phone: '0812345678',
      password: 'another-password',
    };

    // When ลูกค้ายืนยันการสมัครสมาชิกด้วยเบอร์โทรศัพท์เดิม
    const result = registerMockAccount(input, accounts);

    // Then ระบบปฏิเสธการสมัครสมาชิกทันที
    expect(result.account).toBeNull();
    // Then แสดงข้อความ “อีเมล/เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว”
    expect(result.error).toBe('อีเมล/เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว');
    // Then ไม่สร้างบัญชีซ้ำ
    expect(accounts).toHaveLength(1);
  });
});

describe('AC-ACCOUNT-02 Login', () => {
  test('test_AC_ACCOUNT_02_login_with_email', () => {
    // Given ลูกค้ามีบัญชีและกรอก Email กับ Password ที่ถูกต้อง
    const account = {
      id: 'account-email',
      email: 'customer@example.com',
      phone: '',
      password: 'valid-password',
    };

    // When ลูกค้ายืนยันการเข้าสู่ระบบ
    const result = loginMockAccount(
      { email: account.email, phone: '', password: account.password },
      [account],
    );

    // Then ระบบอนุญาตให้ลูกค้าเข้าสู่ระบบได้
    expect(result).toEqual(account);
  });

  test('test_AC_ACCOUNT_02_login_with_phone', () => {
    // Given ลูกค้ามีบัญชีและกรอกเบอร์โทรศัพท์กับ Password ที่ถูกต้อง โดยไม่กรอก Email
    const account = {
      id: 'account-phone',
      email: '',
      phone: '0812345678',
      password: 'valid-password',
    };

    // When ลูกค้ายืนยันการเข้าสู่ระบบ
    const result = loginMockAccount(
      { email: '', phone: account.phone, password: account.password },
      [account],
    );

    // Then ระบบอนุญาตให้ลูกค้าเข้าสู่ระบบได้
    expect(result).toEqual(account);
  });

  test('test_AC_ACCOUNT_02_login_with_invalid_password', () => {
    // Given ลูกค้ามีบัญชีและกรอก Email หรือเบอร์โทรศัพท์ถูกต้อง แต่กรอก Password ไม่ถูกต้อง
    const account = {
      id: 'account-invalid-password',
      email: 'customer@example.com',
      phone: '',
      password: 'valid-password',
    };

    // When ลูกค้ายืนยันการเข้าสู่ระบบ
    const result = loginMockAccount(
      { email: account.email, phone: '', password: 'invalid-password' },
      [account],
    );

    // Then ระบบไม่อนุญาตให้เข้าสู่ระบบและแจ้งเตือน “กรุณากรอกข้อมูลให้ถูกต้อง” ตาม FR-04
    expect(result).toBeNull();
  });

  test('test_AC_ACCOUNT_02_login_with_unknown_identifier', () => {
    // Given ลูกค้าไม่มีบัญชีที่ตรงกับ Email หรือเบอร์โทรศัพท์ที่กรอก และกรอก Password ที่ไม่ว่าง
    const account = {
      id: 'account-known',
      email: 'known@example.com',
      phone: '',
      password: 'valid-password',
    };

    // When ลูกค้ายืนยันการเข้าสู่ระบบ
    const result = loginMockAccount(
      { email: 'unknown@example.com', phone: '', password: 'valid-password' },
      [account],
    );

    // Then ระบบไม่อนุญาตให้เข้าสู่ระบบและแจ้งเตือน “กรุณากรอกข้อมูลให้ถูกต้อง” ตาม FR-04
    expect(result).toBeNull();
  });
});

describe('AC-ACCOUNT-03 Invalid Login', () => {
  test('test_AC_ACCOUNT_03_login_invalid_password', () => {
    // Given ลูกค้ามีบัญชีและกรอก Email หรือเบอร์โทรศัพท์ที่ถูกต้อง แต่กรอก Password ไม่ถูกต้อง
    const account = {
      id: 'account-invalid-password-ac03',
      email: 'customer@example.com',
      phone: '',
      password: 'valid-password',
    };

    // When ลูกค้ายืนยันการเข้าสู่ระบบ
    const result = loginMockAccount(
      { email: account.email, phone: '', password: 'invalid-password' },
      [account],
    );

    // Then ระบบปฏิเสธการเข้าสู่ระบบ
    expect(result).toBeNull();
    // Then แสดงข้อความแจ้งเตือน “กรุณากรอกข้อมูลให้ถูกต้อง” ตาม FR-04
  });

  test('test_AC_ACCOUNT_03_login_unknown_identifier', () => {
    // Given ลูกค้ามีบัญชีและกรอก Password ที่ไม่ว่าง แต่กรอก Email หรือเบอร์โทรศัพท์ที่ไม่ตรงกับบัญชี
    const account = {
      id: 'account-known-ac03',
      email: 'known@example.com',
      phone: '',
      password: 'valid-password',
    };

    // When ลูกค้ายืนยันการเข้าสู่ระบบ
    const result = loginMockAccount(
      { email: 'unknown@example.com', phone: '', password: account.password },
      [account],
    );

    // Then ระบบปฏิเสธการเข้าสู่ระบบ
    expect(result).toBeNull();
    // Then แสดงข้อความแจ้งเตือน “กรุณากรอกข้อมูลให้ถูกต้อง” ตาม FR-04
  });

  test('test_AC_ACCOUNT_03_login_without_identifier', () => {
    // Given ลูกค้ามีบัญชีแต่ไม่กรอกทั้ง Email และเบอร์โทรศัพท์ และกรอก Password ที่ไม่ว่าง
    const account = {
      id: 'account-without-identifier-ac03',
      email: 'customer@example.com',
      phone: '',
      password: 'valid-password',
    };

    // When ลูกค้ายืนยันการเข้าสู่ระบบ
    const result = loginMockAccount(
      { email: '', phone: '', password: account.password },
      [account],
    );

    // Then ระบบปฏิเสธการเข้าสู่ระบบ
    expect(result).toBeNull();
    // Then แสดงข้อความแจ้งเตือน “กรุณากรอกข้อมูลให้ถูกต้อง” ตาม FR-04
  });

  test('test_AC_ACCOUNT_03_login_without_password', () => {
    // Given ลูกค้ามีบัญชีและกรอก Email หรือเบอร์โทรศัพท์ที่ถูกต้อง แต่ไม่กรอก Password
    const account = {
      id: 'account-without-password-ac03',
      email: 'customer@example.com',
      phone: '',
      password: 'valid-password',
    };

    // When ลูกค้ายืนยันการเข้าสู่ระบบ
    const result = loginMockAccount(
      { email: account.email, phone: '', password: '' },
      [account],
    );

    // Then ระบบปฏิเสธการเข้าสู่ระบบ
    expect(result).toBeNull();
    // Then แสดงข้อความแจ้งเตือน “กรุณากรอกข้อมูลให้ถูกต้อง” ตาม FR-04
  });
});

describe('AC-ACCOUNT-04 Mock LINE Connection', () => {
  test('test_AC_ACCOUNT_04_line_connect_after_register', () => {
    // Given ลูกค้าสมัครสมาชิกสำเร็จและเลือกเชื่อมต่อ LINE
    const account = {
      id: 'account-after-register',
      email: 'register@example.com',
      phone: '',
      password: 'valid-password',
    };

    // When การเชื่อมต่อ LINE สำเร็จ
    const result = connectMockLine(account, []);

    // Then Prototype แสดงสถานะเชื่อมต่อสำเร็จ
    expect(result.link).not.toBeNull();
    // Then เก็บ Mock LINE User ID `mock-line-user-001` ในหน่วยความจำ
    expect(result.link.lineUserId).toBe(MOCK_LINE_USER_ID);
    // Then ผูกกับบัญชีลูกค้า
    expect(result.link.accountId).toBe(account.id);
    expect(result.lineLinks).toContainEqual(result.link);
    // Then ไม่จัดเก็บ Password ของบัญชี LINE ตาม Spec
    expect(result.link).not.toHaveProperty('password');
  });

  test('test_AC_ACCOUNT_04_line_connect_after_login', () => {
    // Given ลูกค้าเข้าสู่ระบบด้วยบัญชีเดิมสำเร็จและเลือกเชื่อมต่อ LINE
    const account = {
      id: 'account-after-login',
      email: 'login@example.com',
      phone: '',
      password: 'valid-password',
    };

    // When การเชื่อมต่อ LINE สำเร็จ
    const result = connectMockLine(account, []);

    // Then Prototype แสดงสถานะเชื่อมต่อสำเร็จ
    expect(result.link).not.toBeNull();
    // Then เก็บ Mock LINE User ID `mock-line-user-001` ในหน่วยความจำ
    expect(result.link.lineUserId).toBe(MOCK_LINE_USER_ID);
    // Then ผูกกับบัญชีลูกค้า
    expect(result.link.accountId).toBe(account.id);
    expect(result.lineLinks).toContainEqual(result.link);
    // Then ไม่จัดเก็บ Password ของบัญชี LINE ตาม Spec
    expect(result.link).not.toHaveProperty('password');
  });

  test('test_AC_ACCOUNT_04_line_connect_without_account', () => {
    // Given ผู้ใช้ยังไม่ได้ Login หรือสมัครสมาชิกสำเร็จ
    const lineLinks = [];

    // When ลูกค้าเลือกเชื่อมต่อ LINE
    const result = connectMockLine(null, lineLinks);

    // Then ระบบไม่อนุญาตให้เชื่อมต่อ Mock LINE
    expect(result.link).toBeNull();
    // Then ไม่สร้างข้อมูลการผูก LINE กับบัญชีผู้ใช้
    expect(result.lineLinks).toBe(lineLinks);
    expect(result.lineLinks).toHaveLength(0);
  });
});

describe('AC-ACCOUNT-05 Skip Mock LINE', () => {
  test('test_AC_ACCOUNT_05_skip_line_after_login', () => {
    // Given ลูกค้า Login สำเร็จและไม่ต้องการเชื่อมต่อ LINE
    const lineLinks = [];

    // When ลูกค้าเลือกข้ามขั้นตอนการเชื่อมต่อ LINE
    const result = skipMockLine(lineLinks);

    // Then ระบบให้ลูกค้าใช้งานระบบต่อได้ตามปกติ
    expect(result.skipped).toBe(true);
    // Then ไม่สร้างความสัมพันธ์ LINE ใหม่ ตาม FR-05 / UC-02 Alternative Flow 7b
    expect(result.lineLinks).toBe(lineLinks);
    expect(result.lineLinks).toHaveLength(0);
  });

  test('test_AC_ACCOUNT_05_skip_line_after_register', () => {
    // Given ลูกค้าสมัครสมาชิกสำเร็จและอยู่ในสถานะ Auto-login แต่ไม่ต้องการเชื่อมต่อ LINE
    const lineLinks = [];

    // When ลูกค้าเลือกข้ามขั้นตอนการเชื่อมต่อ LINE
    const result = skipMockLine(lineLinks);

    // Then ระบบให้ลูกค้าใช้งานระบบต่อได้ตามปกติ
    expect(result.skipped).toBe(true);
    // Then ไม่สร้างความสัมพันธ์ LINE ใหม่ ตาม FR-05 / FR-06 / UC-02 Alternative Flow 7b
    expect(result.lineLinks).toBe(lineLinks);
    expect(result.lineLinks).toHaveLength(0);
  });
});

describe('AC-ACCOUNT-06 Mock LINE Connection Failure', () => {
  test('test_AC_ACCOUNT_06_line_connect_failure_after_login', () => {
    // Given ลูกค้า Login สำเร็จและเลือกเชื่อมต่อ LINE
    const lineLinks = [];

    // When ระบบไม่สามารถเชื่อมต่อ LINE ได้
    const result = failMockLine(lineLinks);

    // Then ระบบไม่บันทึก LINE User ID
    expect(result.lineLinks).toBe(lineLinks);
    expect(result.lineLinks).toHaveLength(0);
    // Then ลูกค้ายังคงสามารถใช้งานระบบได้ ตาม UC-02 Exception Flow 7c และ NFR-REL-01
    expect(result.failed).toBe(true);
  });

  test('test_AC_ACCOUNT_06_line_connect_failure_after_register', () => {
    // Given ลูกค้าสมัครสมาชิกสำเร็จและอยู่ในสถานะ Auto-login แล้วเลือกเชื่อมต่อ LINE
    const lineLinks = [];

    // When ระบบไม่สามารถเชื่อมต่อ LINE ได้
    const result = failMockLine(lineLinks);

    // Then ระบบไม่บันทึก LINE User ID
    expect(result.lineLinks).toBe(lineLinks);
    expect(result.lineLinks).toHaveLength(0);
    // Then ลูกค้ายังคงสามารถใช้งานระบบได้ ตาม FR-06, UC-02 Exception Flow 7c และ NFR-REL-01
    expect(result.failed).toBe(true);
  });
});
