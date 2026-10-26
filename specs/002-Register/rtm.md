# RTM: สมัครสมาชิก / เข้าสู่ระบบ (Register & Login)

อ้างอิง: [spec.md](./spec.md) Draft v3 | [plan.md](./plan.md) | [tasks.md](./tasks.md)  
Use case: UC-02 | Spec ID: SPEC-ACCOUNT-001  
สร้างเมื่อ 2569-10-26 | ผลทดสอบล่าสุด: `18 ผ่าน 0 ไม่ผ่าน`

## ขอบเขตและคำเตือน

- RTM นี้ตรวจเฉพาะ UC-02 และ Frontend Prototype ใน `features/account/`
- การสมัครสมาชิก, Login และ LINE Connection เป็น Mock Data ใน Browser Memory
- ไม่มี Backend, API, database, session/token หรือ Authentication จริง
- Mock LINE User ID คือ `mock-line-user-001` และไม่ใช่ LINE User ID จริง
- T-01 ถึง T-08 มีสถานะ `เสร็จ รอทีมตรวจ`
- T-09 และ T-10 เลื่อนไป Release 2
- การสมัครด้วยเบอร์โทรศัพท์อย่างเดียวมี Automated Test แล้ว แต่ยังเป็นหลักฐานใน Mock Prototype
- NFR-SEC-01 มี Test ระดับ Mock เพิ่มขึ้น แต่ยังพิสูจน์ได้ไม่ครบในระดับระบบจริง

## 1. ตามรอยไปข้างหน้า (Requirement → AC → Task → Test → Implementation)

| Requirement | AC | Task | Test Case (ผลล่าสุด) | Implementation | สถานะตามหลักฐาน |
|---|---|---|---|---|---|
| FR-01 สมัครสมาชิกด้วย Email หรือเบอร์โทรศัพท์อย่างน้อยหนึ่งช่องและ password ไม่ว่าง | AC-ACCOUNT-01 | T-03 เสร็จ รอทีมตรวจ | `test_AC_ACCOUNT_01_register_success`, `test_AC_ACCOUNT_01_register_phone_only_success` (ผ่าน) | `features/account/index.html`: `#register-form`; `features/account/menu.js`: register submit, required identifier/password validation | ผ่านใน Mock Prototype สำหรับ Email-only และ phone-only |
| FR-01 ตรวจข้อมูลสมัครสมาชิกและข้อมูลซ้ำ | AC-ACCOUNT-03 | T-05 เสร็จ รอทีมตรวจ | `test_AC_ACCOUNT_03_register_duplicate_identifier`, `test_AC_ACCOUNT_03_register_duplicate_phone` (ผ่าน) | `menu.js`: email/phone duplicate check และข้อความ error | ผ่านใน Mock Prototype สำหรับ Email และ phone |
| FR-02 แสดง Login/Register ในหน้าเดียวและตรวจข้อมูลก่อนสร้างบัญชี | AC-ACCOUNT-01, AC-ACCOUNT-02, AC-ACCOUNT-03 | T-01, T-03, T-04, T-05 เสร็จ รอทีมตรวจ | `test_T02_account_page_structure_and_test_path`, `test_AC_ACCOUNT_01_register_success`, `test_AC_ACCOUNT_02_login_success`, tests ของ AC-03 (ผ่าน) | `index.html`: `#login-form`, `#register-form`; `menu.js`: submit handlers และ validation | ผ่านใน Mock Prototype |
| FR-03 Login ด้วย Email หรือเบอร์โทรศัพท์และ password ที่ถูกต้อง | AC-ACCOUNT-02 | T-04 เสร็จ รอทีมตรวจ | `test_AC_ACCOUNT_02_login_success`, `test_AC_ACCOUNT_02_login_phone_only_account` (ผ่าน) | `menu.js`: `demoAccounts`, login submit และ `finishAccountFlow()` | ผ่านใน Mock Prototype สำหรับ Email และ phone |
| FR-04 ปฏิเสธ Login ที่ไม่ถูกต้องและแสดงข้อความแจ้งเตือน | AC-ACCOUNT-03 | T-05 เสร็จ รอทีมตรวจ | `test_AC_ACCOUNT_03_login_invalid_input` (ผ่าน) | `menu.js`: invalid/empty login branch และ `กรุณากรอกข้อมูลให้ถูกต้อง` | ผ่าน |
| FR-04 ปฏิเสธ identifier ซ้ำและไม่สร้างบัญชีซ้ำ | AC-ACCOUNT-03 | T-05 เสร็จ รอทีมตรวจ | `test_AC_ACCOUNT_03_register_duplicate_identifier` (ผ่าน) | `menu.js`: duplicate branch และ `อีเมล/เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว` | ผ่าน |
| FR-05 จำลอง LINE Connection success/failure และให้เลือกเชื่อมต่อ | AC-ACCOUNT-04, AC-ACCOUNT-05, AC-ACCOUNT-06 | T-06, T-07, T-08 เสร็จ รอทีมตรวจ | `test_AC_ACCOUNT_04_line_connect_success`, `test_AC_ACCOUNT_05_skip_line_connection`, `test_AC_ACCOUNT_06_line_connect_failure` (ผ่าน) | `index.html`: `#line-panel`, `#connect-line`, `#fail-line`, `#skip-line`; `menu.js`: LINE handlers | ผ่านใน Mock Prototype เท่านั้น |
| FR-06 เก็บ Mock LINE User ID และผูกกับบัญชีที่ Login/Register สำเร็จ | AC-ACCOUNT-04 | T-07 เสร็จ รอทีมตรวจ | `test_AC_ACCOUNT_04_line_connect_success` (ผ่าน) | `menu.js`: `MOCK_LINE_USER_ID`, `activeAccount.lineUserId`, `linePanel.dataset.lineUserId` | ผ่านใน Browser Memory เท่านั้น |
| FR-06 Failure ไม่สร้างความสัมพันธ์ใหม่กับ LINE และยังใช้งานต่อได้ | AC-ACCOUNT-06 | T-06, T-08 เสร็จ รอทีมตรวจ | `test_AC_ACCOUNT_06_line_connect_failure` (ผ่าน) | `menu.js`: failure handler ไม่เขียน `lineUserId`; `index.html`: account success/LINE UI | ผ่านใน Mock Prototype |
| NFR-SEC-01 ต้อง Login ก่อนเข้าถึงข้อมูลบัญชี และไม่เก็บ LINE password | ไม่มี AC เฉพาะ | T-01, T-04, T-05, T-07, T-08 เสร็จ รอทีมตรวจ | `test_AC_ACCOUNT_04_line_requires_login_or_register`, `test_AC_ACCOUNT_04_no_line_password_input_or_storage` (ผ่าน) | `menu.js`: guard ก่อนเชื่อม LINE; `index.html`/`menu.js`: ไม่มี LINE password field หรือ storage | มีหลักฐานบางส่วนใน Mock Prototype; ยังพิสูจน์ไม่ครบ |
| NFR-REL-01 LINE failure ไม่กระทบ Login/Register | AC-ACCOUNT-06 | T-06, T-08 เสร็จ รอทีมตรวจ | `test_AC_ACCOUNT_06_line_connect_failure` (ผ่าน) | `menu.js`: failure handler แสดงข้อความโดยไม่เปลี่ยน account success state | ผ่านใน Mock Prototype |
| NFR-USE-01 แสดง Login, Register และ LINE อย่างชัดเจน | ไม่มี AC เฉพาะ | T-01, T-02, T-04 เสร็จ รอทีมตรวจ | โครงสร้าง/path tests ในชุด account (ผ่าน) | `index.html`: layout, forms, `#line-panel`; `shared/styles.css` | ผ่านในระดับโครงสร้าง Prototype |

## 2. ตามรอย Acceptance Criteria

| AC ID | Spec / Flow | Task | Test Case | Implementation ที่เกี่ยวข้อง | ผล |
|---|---|---|---|---|---|
| AC-ACCOUNT-01 | FR-01 / FR-02 สมัครสมาชิกสำเร็จ | T-03 | `test_AC_ACCOUNT_01_register_success`; `test_AC_ACCOUNT_01_register_phone_only_success` | `#register-form`; `menu.js` register handler และ `demoAccounts.push()` | ผ่านใน Mock Prototype |
| AC-ACCOUNT-02 | FR-03 Login สำเร็จ | T-04 | `test_AC_ACCOUNT_02_login_success`; `test_AC_ACCOUNT_02_login_phone_only_account` | `#login-form`; `menu.js` login lookup และ success state | ผ่านใน Mock Prototype |
| AC-ACCOUNT-03 | FR-04 Login ไม่ถูกต้อง/ข้อมูลซ้ำ | T-05 | `test_AC_ACCOUNT_03_login_invalid_input`; `test_AC_ACCOUNT_03_register_duplicate_identifier`; `test_AC_ACCOUNT_03_register_duplicate_phone` | `menu.js` invalid login และ duplicate branches | ผ่านใน Mock Prototype |
| AC-ACCOUNT-04 | FR-05 / FR-06 Mock LINE success | T-07 | `test_AC_ACCOUNT_04_line_connect_success` | `#connect-line`; `MOCK_LINE_USER_ID`; `activeAccount.lineUserId`; `data-line-user-id` | ผ่านใน Browser Memory เท่านั้น |
| AC-ACCOUNT-05 | Alternative Flow 7b ข้าม LINE | T-06 | `test_AC_ACCOUNT_05_skip_line_connection` | `#skip-line`; `menu.js` skip handler | ผ่าน |
| AC-ACCOUNT-06 | Exception Flow 7c LINE failure | T-06, T-08 | `test_AC_ACCOUNT_06_line_connect_failure` | `#fail-line`; `menu.js` failure handler; state ไม่สร้าง Mock ID | ผ่านใน Mock Prototype |

ชุดทดสอบปัจจุบันรันด้วย:

```bash
node --test tests/AC-ACCOUNT-*.test.cjs
```

ผล: **18 tests ผ่าน, 0 ไม่ผ่าน**

## 3. สถานะ Tasks

| Task | ขอบเขต | สถานะจริง |
|---|---|---|
| T-01 | โครงหน้า Account และ shared style | เสร็จ รอทีมตรวจ |
| T-02 | ชุดทดสอบและ path ของ Prototype | เสร็จ รอทีมตรวจ |
| T-03 | Mock Register Flow | เสร็จ รอทีมตรวจ |
| T-04 | Mock Login Flow | เสร็จ รอทีมตรวจ |
| T-05 | Invalid input และ duplicate message | เสร็จ รอทีมตรวจ |
| T-06 | Skip LINE และ failure fallback เบื้องต้น | เสร็จ รอทีมตรวจ |
| T-07 | Mock LINE Connection success และ Mock LINE User ID | เสร็จ รอทีมตรวจ |
| T-08 | ตรวจ LINE failure ไม่สร้างความสัมพันธ์ใหม่ | เสร็จ รอทีมตรวจ |
| T-09 | ยกเลิกการเชื่อมต่อ LINE | เลื่อนไป Release 2 ตาม Q-02 |
| T-10 | เปลี่ยนบัญชี LINE | เลื่อนไป Release 2 ตาม Q-03 |

## 4. NFR และ Constraints ที่ยังต้องระวัง

| รายการ | หลักฐาน | สถานะ |
|---|---|---|
| NFR-SEC-01: ต้อง Login ก่อนเข้าถึงข้อมูลบัญชี | `test_AC_ACCOUNT_04_line_requires_login_or_register` ตรวจ guard ก่อนเชื่อม LINE แต่ยังไม่มี protected endpoint หรือ security test ระดับระบบจริง | มีหลักฐานบางส่วนใน Mock Prototype; ยังพิสูจน์ไม่ครบ |
| NFR-SEC-01: ไม่เก็บ LINE password | `test_AC_ACCOUNT_04_no_line_password_input_or_storage` ตรวจ `index.html` และ `menu.js` แล้วไม่พบ field/storage ของ LINE password | ผ่านใน Mock Prototype; ยังไม่ใช่หลักฐาน security ระดับระบบจริง |
| NFR-REL-01: LINE failure ไม่กระทบ flow หลัก | `test_AC_ACCOUNT_06_line_connect_failure` ผ่าน | ผ่านใน Mock Prototype |
| NFR-USE-01: ขั้นตอนชัดเจน | หน้าเดียวมี Login, Register และ LINE panel; path/markup tests ผ่าน | ผ่านในระดับโครงสร้าง |
| Constraint: Email หรือ phone อย่างน้อยหนึ่งช่อง | validation ใน `menu.js` | ยังขาด test phone-only |
| Constraint: LINE เป็นทางเลือก | skip/failure tests ผ่าน | ผ่านใน Mock Prototype |
| Constraint: Mock LINE ID ผูกกับบัญชีที่ Login/Register สำเร็จ | T-07 และ AC-04 test ผ่าน | ผ่านใน Browser Memory เท่านั้น |
| Constraint: ไม่มี LINE API/Backend/database จริง | source และ plan ระบุ Prototype; tests ใช้ `vm.runInNewContext` | ผ่านตามขอบเขต Prototype |

## 5. งานที่เลื่อนไป Release 2

| Task | เหตุผล | สิ่งที่ยังไม่มีใน Release นี้ |
|---|---|---|
| T-09 ยกเลิกการเชื่อมต่อ LINE | ทีมตอบ Q-02 ให้เลื่อนไป Release ถัดไป | ไม่มีปุ่ม, flow, AC หรือ test สำหรับยกเลิก |
| T-10 เปลี่ยนบัญชี LINE | ทีมตอบ Q-03 ให้เลื่อนไป Release ถัดไป | ไม่มี flow, กติกาการแทนที่ความสัมพันธ์เดิม หรือ test |

การเชื่อมต่อ LINE จริง เช่น LINE Login, OAuth, callback และการบันทึก LINE User ID จริง
ไม่อยู่ใน Release นี้; สิ่งที่มีคือ Mock LINE Connection เท่านั้น

## 6. ตามรอยย้อนกลับ (Implementation/Test → Requirement)

| Implementation หรือ Test | อ้างอิง | ผลตรวจ |
|---|---|---|
| `features/account/index.html`: `#login-form`, `#register-form` | FR-02, NFR-USE-01 | ตรงกับหน้าเดียวของ Prototype |
| `features/account/index.html`: `#line-panel`, `#connect-line`, `#fail-line`, `#skip-line` | FR-05, AC-ACCOUNT-04 ถึง AC-ACCOUNT-06 | ตรงกับ Mock LINE flows |
| `features/account/menu.js`: `demoAccounts`, register/login handlers | FR-01 ถึง FR-04, AC-ACCOUNT-01 ถึง AC-ACCOUNT-03 | ตรงในขอบเขต Mock Data |
| `features/account/menu.js`: `MOCK_LINE_USER_ID`, `activeAccount.lineUserId` | FR-05, FR-06, AC-ACCOUNT-04 | ตรงใน Browser Memory ไม่ใช่ระบบจริง |
| `features/account/menu.js`: failure handler | FR-06, NFR-REL-01, AC-ACCOUNT-06 | ไม่สร้างความสัมพันธ์ใหม่และแสดง failure |
| `tests/AC-ACCOUNT-01.test.cjs` ถึง `tests/AC-ACCOUNT-06.test.cjs` | AC-ACCOUNT-01 ถึง AC-ACCOUNT-06 | มี behavioral tests ครบตามชื่อ AC; รวม 13/13 ผ่าน |
| `tests/AC-ACCOUNT-01.test.cjs`: `test_T02_account_page_structure_and_test_path` และ tests ชื่อ `test_T02_*` | T-01/T-02 และโครงสร้าง AC อื่น | ผลทดสอบใช้ได้ แต่ชื่อบางรายการไม่สะท้อน Task/AC ปัจจุบันชัดเจน |

## 7. ข้อค้นพบและช่องว่าง

| F-ID | ประเภท | รายละเอียด | ผลกระทบ |
|---|---|---|---|
| F-01 | NFR coverage gap | NFR-SEC-01 ยังไม่มี protected endpoint หรือการตรวจสิทธิ์ระดับระบบจริง | ห้ามทำเครื่องหมาย NFR-SEC-01 ว่าผ่านครบ |
| F-02 | Prototype limitation | Mock LINE User ID อยู่เฉพาะ Browser Memory และไม่ใช่การเชื่อมต่อจริง | FR-06 ผ่านเฉพาะ Prototype ไม่ใช่ production |
| F-03 | Naming/documentation gap | Test บางรายการใช้ชื่อ `test_T02_*` แม้ตรวจโครงสร้างของ AC อื่น | ทำให้การอ่าน RTM และการค้นหา test ตาม Task ยากขึ้น แต่ไม่ทำให้ test ล้มเหลว |
| F-04 | Release scope | T-09/T-10 ไม่มี implementation/test ใน Release นี้ | เป็นไปตาม Q-02/Q-03 และไม่ถือเป็น defect ของ Release นี้ |

## สรุปผล

UC-02 มี Traceability ครบในระดับ **Mock Frontend Prototype** สำหรับ FR-01 ถึง FR-06,
NFR-REL-01, NFR-USE-01 และ AC-ACCOUNT-01 ถึง AC-ACCOUNT-06 ตามหลักฐานที่มี
โดยชุดทดสอบปัจจุบันผ่าน **13/13**

อย่างไรก็ตาม ยังไม่ควรสรุปว่า Requirement ทั้งหมดผ่านครบ เนื่องจาก:

1. NFR-SEC-01 ยังพิสูจน์ได้ไม่ครบในระดับ Prototype และไม่มีระบบ Authentication จริง
2. FR-06 เป็น Mock LINE Connection ใน Browser Memory ไม่ใช่ LINE จริง
3. T-09 และ T-10 ถูกเลื่อนไป Release 2
4. Test phone-only และ Mock security ไม่ได้ยืนยันความปลอดภัยระดับ production
5. Test บางรายการยังใช้ชื่อ `test_T02_*` ทำให้การอ่าน Traceability ยากขึ้น
