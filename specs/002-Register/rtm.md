# RTM: สมัครสมาชิก / เข้าสู่ระบบ (Register & Login)

อ้างอิง: [spec.md](./spec.md) `SPEC-ACCOUNT-001` `Draft v2` | [tasks.md](./tasks.md) | [test-cases.md](./test-cases.md)
สร้างด้วย `/verify` เมื่อ 2569-10-27 13:20 | test: 0 ผ่าน 0 ไม่ผ่าน (รันไม่ได้)

## 1. ตามรอยไปข้างหน้า (requirement ไป โค้ด ไป test)

| ID | AC | task | โค้ด (ไฟล์: ฟังก์ชัน) | test (ผล) | สถานะ |
|---|---|---|---|---|---|
| FR-01 | AC-ACCOUNT-01 | T-03, T-04 | `frontend/src/App.jsx`: `validateRegistration`, `registerMockAccount`, `handleRegister` | `test_AC_ACCOUNT_01_register_success`, `test_AC_ACCOUNT_01_register_phone_only`, `test_AC_ACCOUNT_01_register_without_identifier`, `test_AC_ACCOUNT_01_register_without_password` (รันไม่ได้) | ช่องโหว่ |
| FR-02 | AC-ACCOUNT-01 | T-02, T-03, T-04 | `frontend/src/App.jsx`: `App`, `validateRegistration`, `registerMockAccount` | `test_AC_ACCOUNT_01_*` (รันไม่ได้; ไม่มี UI assertion) | ช่องโหว่ |
| FR-03 | AC-ACCOUNT-02 | T-05, T-06 | `frontend/src/App.jsx`: `loginMockAccount`, `handleLogin` | `test_AC_ACCOUNT_02_login_with_email`, `test_AC_ACCOUNT_02_login_with_phone` (รันไม่ได้) | ช่องโหว่ |
| FR-04 | AC-ACCOUNT-03 | T-07, T-08 | `frontend/src/App.jsx`: `loginMockAccount`, `handleLogin`, `validateRegistration` | `test_AC_ACCOUNT_02_login_with_invalid_password`, `test_AC_ACCOUNT_02_login_with_unknown_identifier`, `test_AC_ACCOUNT_03_*` (รันไม่ได้; ไม่ assert ข้อความ UI และไม่มี test duplicate registration) | ช่องโหว่ |
| FR-05 | AC-ACCOUNT-04, AC-ACCOUNT-05, AC-ACCOUNT-06 | T-09, T-11, T-12 | `frontend/src/App.jsx`: `connectMockLine`, `skipMockLine`, `failMockLine`, `handleMockLineConnect`, `handleMockLineSkip`, `handleMockLineFailure` | `test_AC_ACCOUNT_04_*`, `test_AC_ACCOUNT_05_*`, `test_AC_ACCOUNT_06_*` (รันไม่ได้; ไม่ assert UI ครบ) | ช่องโหว่ |
| FR-06 | AC-ACCOUNT-04 | T-09, T-10 | `frontend/src/App.jsx`: `createMockLineLink`, `connectMockLine`, `handleMockLineConnect` | `test_AC_ACCOUNT_04_line_connect_after_register`, `test_AC_ACCOUNT_04_line_connect_after_login` (รันไม่ได้; ไม่ assert UI/หน่วยความจำผ่าน component) | ช่องโหว่ |
| NFR-SEC-01 | ไม่มี AC โดยตรง | T-01, T-09 | `frontend/src/App.jsx`: `connectMockLine`, `useAccountPrototypeState`, conditional LINE UI | `test_AC_ACCOUNT_04_line_connect_without_account` (รันไม่ได้); ไม่มี test การป้องกันข้อมูลส่วนบุคคล | ช่องโหว่ |
| NFR-REL-01 | AC-ACCOUNT-06 | T-12 | `frontend/src/App.jsx`: `failMockLine`, `handleMockLineFailure` | `test_AC_ACCOUNT_06_line_connect_failure_after_login`, `test_AC_ACCOUNT_06_line_connect_failure_after_register` (รันไม่ได้; `failed` ไม่พิสูจน์การใช้งานต่อ) | ช่องโหว่ |
| NFR-USE-01 | ไม่มี AC โดยตรง | T-02, T-04, T-06, T-08, T-10, T-12 | `frontend/src/App.jsx`: `App` และข้อความสถานะใน UI | ไม่มี UI test ที่รันได้; test helper ไม่ตรวจข้อความ/ลำดับหน้าจอ | ช่องโหว่ |
| Constraint: เข้าถึงหน้าสมัครสมาชิก/เข้าสู่ระบบ | ไม่มี AC โดยตรง | T-02 | `frontend/src/App.jsx`: `App` | ไม่มี UI test ที่รันได้ | ช่องโหว่ |
| Constraint: Email/เบอร์โทรศัพท์ไม่ซ้ำ | AC-ACCOUNT-01, AC-ACCOUNT-03 | T-03 | `frontend/src/App.jsx`: `validateRegistration` | ไม่มี test ตรวจ duplicate registration โดยตรง (รันไม่ได้) | ช่องโหว่ |
| Constraint: ใช้ Email หรือเบอร์โทรศัพท์อย่างน้อยหนึ่งช่อง | AC-ACCOUNT-01, AC-ACCOUNT-02 | T-03, T-05 | `frontend/src/App.jsx`: `validateRegistration`, `loginMockAccount` | test register/login บางกรณี (รันไม่ได้) | ช่องโหว่ |
| Constraint: Password ไม่ว่างสำหรับการเข้าสู่ระบบ | AC-ACCOUNT-01, AC-ACCOUNT-02, AC-ACCOUNT-03 | T-03, T-05 | `frontend/src/App.jsx`: `validateRegistration`, `loginMockAccount` | `test_AC_ACCOUNT_01_register_without_password`, `test_AC_ACCOUNT_03_login_without_password` (รันไม่ได้) | ช่องโหว่ |
| Constraint: LINE เป็นทางเลือก | AC-ACCOUNT-05, AC-ACCOUNT-06 | T-11, T-12 | `frontend/src/App.jsx`: `skipMockLine`, `failMockLine` | `test_AC_ACCOUNT_05_*`, `test_AC_ACCOUNT_06_*` (รันไม่ได้; ไม่ตรวจ UI flow) | ช่องโหว่ |
| Constraint: ไม่จัดเก็บ Password ของบัญชี LINE | AC-ACCOUNT-04 | T-01, T-09 | `frontend/src/App.jsx`: `createMockLineLink` | `test_AC_ACCOUNT_04_*` (รันไม่ได้; ไม่มี assertion ตรวจว่าไม่มี password field) | ช่องโหว่ |
| Constraint: เชื่อมโยง LINE User ID กับบัญชีลูกค้า | AC-ACCOUNT-04 | T-09, T-10 | `frontend/src/App.jsx`: `createMockLineLink`, `connectMockLine` | `test_AC_ACCOUNT_04_line_connect_after_register`, `test_AC_ACCOUNT_04_line_connect_after_login` (รันไม่ได้) | ช่องโหว่ |
| Constraint: ข้อมูลส่วนบุคคลต้อง Login ก่อนเข้าถึง | ไม่มี AC โดยตรง | T-05, T-09 | ไม่พบ protected profile/data-access flow ใน `frontend/src/` | ไม่มี test | ช่องโหว่ |

## 2. ตามรอยย้อนกลับ (โค้ด ไป requirement)

| โค้ด (ไฟล์: ฟังก์ชัน หรือ endpoint) | อ้าง ID | ตรงกับข้อความใน spec ไหม | หมายเหตุ |
|---|---|---|---|
| `frontend/src/App.jsx`: `validateRegistration` | FR-01, FR-02, FR-04 | ตรงบางส่วน | ตรวจ identifier/password และ duplicate แต่ข้อความกรณีข้อมูลไม่ครบไม่ใช่ข้อความที่ FR-04 ระบุ |
| `frontend/src/App.jsx`: `registerMockAccount`, `createMockAccount` | FR-01, FR-06 | ตรงบางส่วน | สร้าง Mock Account และตั้ง current account ผ่าน handler แต่เก็บ password บัญชีเป็น plain value ใน Mock State |
| `frontend/src/App.jsx`: `loginMockAccount` | FR-03, FR-04 | ตรง | ตรวจ email/phone และ password ในหน่วยความจำ |
| `frontend/src/App.jsx`: `connectMockLine`, `createMockLineLink` | FR-05, FR-06, NFR-SEC-01 | ตรง | ปฏิเสธเมื่อไม่มี current account และสร้างเฉพาะ `accountId`/`lineUserId` |
| `frontend/src/App.jsx`: `skipMockLine` | FR-05, Alternative Flow 7b | ตรง | คืนความสัมพันธ์เดิมและไม่สร้าง link ใหม่ |
| `frontend/src/App.jsx`: `failMockLine` | FR-05, Exception Flow 7c, NFR-REL-01 | ตรงบางส่วน | ไม่เพิ่ม link และคืนข้อความใช้งานต่อ แต่ไม่มีการจำลอง/ตรวจการใช้งานต่อจริง |
| `frontend/src/App.jsx`: `useAccountPrototypeState` | FR-05, FR-06, Q-01 | ตรง | ใช้ React State ในหน่วยความจำตาม Release 1 |
| `frontend/src/App.jsx`: `handleRegister`, `handleLogin` | FR-01 ถึง FR-04, FR-06 | ตรงบางส่วน | มี UI success/error flow แต่ยังไม่มี UI test ที่ตรวจผลจริง |
| `frontend/src/App.jsx`: `handleMockLineConnect`, `handleMockLineSkip`, `handleMockLineFailure` | FR-05, FR-06, NFR-REL-01 | ตรงบางส่วน | มีปุ่ม/ข้อความสำหรับ success, skip, failure; เงื่อนไขแสดงส่วน LINE เฉพาะเมื่อมี current account |
| `frontend/src/main.jsx`: `createRoot` | FR-02, NFR-USE-01 | ตรง | Mounts หน้า Prototype; ไม่มีพฤติกรรมนอก spec ที่มีนัยสำคัญ |

## 3. ข้อค้นพบ

ชนิด: AC ไม่มี test / test อ่อน / โค้ดไม่มี FR / FR ไม่มี AC / เดา Q-xx / ละเมิด Constraint / ตัวเลขไม่ตรง spec / อ้าง ID ผิดเรื่อง  
ตัวเลือกทีมตัดสิน: `ยืนยันข้อค้นพบ` / `ไม่ใช่ข้อผิดพลาด` / `ถามผู้ใช้/ทีมเพิ่มเติม`

| F-ID | ชนิด | อยู่ที่ | ขัดกับ | รายละเอียด | ทีมตัดสิน | เหตุผล/แนวทางแก้ไข | สถานะ |
|---|---|---|---|---|---|---|---|
| F-002 | test อ่อน | `frontend/src/__tests__/AC-ACCOUNT-01.test.jsx` บรรทัด 13-360 | AC-ACCOUNT-01 ถึง AC-ACCOUNT-06 | Automated Tests เรียก helper โดยตรง ไม่ render `App`; จึงยังไม่ตรวจข้อความ/สถานะและการโต้ตอบบน UI โดยตรงตาม Then เช่น สมัครสำเร็จ, Login alert, LINE status, skip/failure UI. Manual UI Test ผ่าน Browser ของ React Prototype วันที่ 27/10/2569 บน Branch `Account` ผ่าน 8/8 กรณี: Login ด้วยรหัสผ่านไม่ถูกต้อง, สมัครสมาชิกด้วย Email ซ้ำ, สมัครสมาชิกด้วยเบอร์โทรศัพท์ซ้ำ, สมัครสมาชิกโดยไม่กรอก Email และเบอร์โทรศัพท์, สมัครสมาชิกโดยไม่กรอกรหัสผ่าน, เชื่อมต่อ Mock LINE สำเร็จ, ข้ามการเชื่อมต่อ Mock LINE และจำลองการเชื่อมต่อ Mock LINE ล้มเหลว | ยืนยันข้อค้นพบ | มติทีมยอมรับ Manual UI Test สำหรับ Release 1. หลักฐาน: Manual UI Test ผ่าน 8/8 กรณี, Automated Helper Tests ผ่าน 21/21 และ Build ผ่าน. ยอมรับข้อจำกัดว่าไม่มี Automated UI Tests สำหรับ Render/Interaction โดยตรง; การปิดนี้เป็นการยอมรับขอบเขตการทดสอบ ไม่ใช่การเพิ่ม Automated UI Tests | ปิดตามมติทีม |
| F-005 | FR ไม่มี AC | `spec.md` FR-04 และ NFR-SEC-01 | AC-ACCOUNT-03 และ traceability | ขอบเขต Release 1 เป็น React + Vite Mock Prototype ใช้ React State/Mock Data ในหน่วยความจำ ไม่มี Backend, Database หรือ LINE API จริง. ส่วน duplicate registration มี Test Cases และ Automated Tests แล้วตาม `FR-04` และ `AC-ACCOUNT-01`; การเชื่อม Mock LINE หลัง Login/Register และการไม่เก็บ LINE Password มี Tests แล้วตาม `FR-05`/`FR-06` และ Constraint/NFR-SEC-01. การตรวจสิทธิ์และความปลอดภัยของข้อมูลใน Backend, Database, Session/Token และ Protected Endpoint อยู่นอกขอบเขต Release 1 | ยืนยันข้อค้นพบ | มติทีมยอมรับการตรวจสอบเฉพาะความสามารถที่จำลองได้ใน Mock Prototype: ตรวจ Duplicate Registration, Mock LINE หลัง Login/Register และการไม่เก็บ Password ใน Mock LINE Link. ส่วน NFR-SEC-01 ที่ต้องใช้ Backend ยังไม่ได้ทดสอบและไม่ได้ถือว่าผ่าน; ทีมยอมรับข้อจำกัดและติดตามส่วนที่เหลือสำหรับการพัฒนาระบบจริงในอนาคต | ปิดตามมติทีม |

## 4. แก้แล้ว

| F-ID | แก้อย่างไร | รู้ได้อย่างไร |
|---|---|---|
| F-001 | ติดตั้ง Vitest 2.1.9 และเพิ่ม `npm test` ใน `frontend/package.json` | ทดสอบจริงวันที่ 27/10/2569 บน Branch `Account`: รัน `npm test` ผ่าน 19/19 Tests และรัน `npm run build` ผ่าน; หลักฐานนี้ยืนยันการรัน Automated Tests ได้ แต่ไม่ได้ยืนยันว่า UI Tests ผ่าน เนื่องจาก Tests ปัจจุบันตรวจ Helper เป็นหลัก |
| F-004 | เพิ่ม `TC-ACCOUNT-01-5` สำหรับ Email ซ้ำ และ `TC-ACCOUNT-01-6` สำหรับเบอร์โทรศัพท์ซ้ำ พร้อมเพิ่ม Automated Tests สำหรับทั้ง 2 กรณี | ตรวจสอบผลการรันจริงด้วย `cd frontend && npm test` ผ่าน 21/21 Tests; หลักฐานนี้ครอบคลุม duplicate registration ตาม FR-04 และ AC-ACCOUNT-01 |
| F-003 | ดำเนินการ Manual Test flow Mock LINE ล้มเหลวและข้ามขั้นตอนหลังสมัครสมาชิกสำเร็จและ Auto-login | Manual Test วันที่ 27/10/2569 บน Branch `Account`: (1) สมัครสมาชิกสำเร็จและ Auto-login (2) กด “จำลองการเชื่อมต่อล้มเหลว” (3) แสดง “เชื่อมต่อ LINE ไม่สำเร็จ แต่ยังใช้งาน Prototype ต่อได้” (4) กด “ข้ามการเชื่อมต่อ LINE” ได้ (5) แสดง “ข้ามการเชื่อมต่อ LINE แล้ว และใช้งาน Prototype ต่อได้” (6) สถานะยังเป็น “Auto-login ใน Prototype” ไม่ถูก Logout; ผลผ่านตามขอบเขตการจำลอง Mock LINE ล้มเหลวและข้ามขั้นตอน แต่ไม่ได้ยืนยันการใช้งานฟีเจอร์อื่นทั้งหมด |
| F-006 | เพิ่ม Assertion ใน Tests ของ AC-ACCOUNT-04 เพื่อตรวจว่า Mock LINE link ไม่มี field `password` ตาม Constraint ของ Spec ที่ห้ามจัดเก็บ Password ของบัญชี LINE | รันจริงด้วย `cd frontend && npm test` ผ่าน 21/21 Tests; Assertion ใหม่ผ่านทั้งกรณีเชื่อมต่อหลังสมัครสมาชิกและหลัง Login และไม่ได้แก้ `frontend/src/App.jsx` |
| F-002 | มติทีมยอมรับ Manual UI Test สำหรับ Release 1 แทนการเพิ่ม Automated UI Tests | Manual UI Test ผ่าน 8/8 กรณี, Automated Helper Tests ผ่าน 21/21 และ Build ผ่าน; คงข้อจำกัดว่าไม่มี Automated UI Tests สำหรับ Render/Interaction โดยตรง |
| F-005 | มติทีมยอมรับการตรวจเฉพาะความสามารถที่จำลองได้ใน Mock Prototype | มีหลักฐาน Duplicate Registration, Mock LINE หลัง Login/Register และการไม่เก็บ Password ใน Mock LINE Link; ส่วน NFR-SEC-01 ที่ต้องใช้ Backend, Database, Session/Token หรือ Protected Endpoint ยังไม่ได้ทดสอบและไม่ได้ถือว่าผ่าน โดยติดตามสำหรับระบบจริงในอนาคต |
