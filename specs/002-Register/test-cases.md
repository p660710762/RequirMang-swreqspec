# Test cases: สมัครสมาชิก / เข้าสู่ระบบ (Register & Login)

อ้างอิง: [spec.md](./spec.md) SPEC-ACCOUNT-001 Draft v3, [plan.md](./plan.md), [tasks.md](./tasks.md), [rtm.md](./rtm.md)

เอกสารนี้แยกผลการตรวจเป็น:

- `node:test`: Automated Test ที่รันกับ Mock Data และ Browser Memory ด้วย `node --test`
- `คน`: Manual Test สำหรับตรวจหน้าจอ/การใช้งานจริง ซึ่งยังไม่มีหลักฐานการรันในรอบนี้
- Prototype นี้ไม่ใช่ Authentication จริง ไม่มี Backend, Database, session/token หรือ LINE API จริง
- T-09 และ T-10 เป็นงาน Deferred ไป Release 2 จึงไม่จัดทำเป็น Test ที่ผ่านใน Release นี้

ผล Automated Test ล่าสุด:

```text
node --test tests/AC-ACCOUNT-*.test.cjs
18 ผ่าน, 0 ไม่ผ่าน
```

| TC ID | AC | แบบ | Given | When | Then (ตรวจอะไรบ้าง) | ตรวจด้วย | ชื่อ test | Actual Result (หลักฐาน) | สถานะ | หมายเหตุ |
|---|---|---|---|---|---|---|---|---|---|---|
| TC-ACCOUNT-01-1 | AC-ACCOUNT-01 (FR-01, FR-02) | ทางปกติ: Email | ผู้ใช้กรอก Email `new@owlcha.test` และ password ที่ไม่ว่าง โดยไม่กรอกเบอร์โทรศัพท์ | ผู้ใช้กดยืนยันการสมัครสมาชิก | ระบบสร้างบัญชีใน Mock Data; แสดง `สมัครสมาชิกสำเร็จ`; แสดงว่าสามารถเข้าสู่ระบบได้ทันที; เปิด flow LINE ต่อได้ (FR-01, AC-ACCOUNT-01) | node:test | `test_AC_ACCOUNT_01_register_success` | ผ่านจาก `tests/AC-ACCOUNT-01.test.cjs`: ตรวจ `account-success.hidden === false`, heading `สมัครสมาชิกสำเร็จ`, `line-panel.hidden === false`, ข้อความ `เข้าสู่ระบบได้ทันที` และ form reset | Pass | ตรวจเฉพาะ Mock Prototype และ Browser Memory |
| TC-ACCOUNT-01-2 | AC-ACCOUNT-01 (FR-01, Constraint identifier อย่างน้อยหนึ่งช่อง) | ขอบเขต: phone-only | ผู้ใช้ไม่กรอก Email กรอกเบอร์โทรศัพท์ `0812345678` และ password `phone-password` | ผู้ใช้กดยืนยันการสมัครสมาชิก | ระบบสร้างบัญชีสำเร็จโดยไม่บังคับให้กรอก Email; แสดง `สมัครสมาชิกสำเร็จ`; ให้เข้าสู่ flow ต่อได้ (FR-01, AC-ACCOUNT-01) | node:test | `test_AC_ACCOUNT_01_register_phone_only_success` | ผ่านจาก `tests/AC-ACCOUNT-01.test.cjs`: ตรวจ success heading, success panel, LINE panel และข้อความเข้าสู่ระบบต่อ | Pass | ปิดช่องว่าง phone-only ใน RTM |
| TC-ACCOUNT-01-3 | AC-ACCOUNT-01 (FR-01, FR-02) | ทางผิด: ไม่มี identifier | ผู้ใช้ไม่กรอกทั้ง Email และเบอร์โทรศัพท์ หรือกรอก password ว่าง | ผู้ใช้กดยืนยันการสมัครสมาชิก | ระบบต้องตรวจสอบความครบถ้วนก่อนสร้างบัญชี (FR-01, FR-02); ข้อความผลลัพธ์เฉพาะกรณีนี้ไม่ได้ระบุไว้ใน AC โดยตรง | node:test | — | ยังไม่มี Test Case เฉพาะในชุด `AC-ACCOUNT-*.test.cjs` ที่ยืนยัน branch นี้โดยตรง | Not Run | ต้องเพิ่ม Test เมื่อทีมอนุมัติข้อความ/หลักฐานที่ต้องการ หากจะตรวจข้อความเฉพาะต้องไม่เดาจาก Spec |
| TC-ACCOUNT-02-1 | AC-ACCOUNT-02 (FR-03) | ทางปกติ: Email | มีบัญชี Mock `demo@owlcha.test` และ password `demo123` | ผู้ใช้กรอกข้อมูลถูกต้องและกดยืนยัน Login | ระบบอนุญาตให้เข้าสู่ระบบแบบจำลองและแสดง `เข้าสู่ระบบสำเร็จ` (FR-03, AC-ACCOUNT-02) | node:test | `test_AC_ACCOUNT_02_login_success` | ผ่านจาก `tests/AC-ACCOUNT-02.test.cjs`: ตรวจ success panel, heading `เข้าสู่ระบบสำเร็จ`, ข้อความตัวอย่าง และ login message ถูกซ่อน | Pass | ไม่ใช่ session หรือ Authentication จริง |
| TC-ACCOUNT-02-2 | AC-ACCOUNT-02 (FR-03) | ขอบเขต: phone login | สมัครบัญชีใน Browser Memory ด้วยเบอร์โทรศัพท์ `0898765432` และ password `phone-password` สำเร็จ | ผู้ใช้ Login ด้วยเบอร์โทรศัพท์และ password เดิม | ระบบอนุญาตให้เข้าสู่ระบบแบบจำลองและแสดง `เข้าสู่ระบบสำเร็จ` (FR-03, AC-ACCOUNT-02) | node:test | `test_AC_ACCOUNT_02_login_phone_only_account` | ผ่านจาก `tests/AC-ACCOUNT-02.test.cjs`: register phone-only แล้ว Login ด้วย phone ตรวจ success heading และไม่มี login error | Pass | ยืนยัน branch phone identifier |
| TC-ACCOUNT-03-1 | AC-ACCOUNT-03 (FR-04, Exception Flow 4a) | ทางผิด: Login ไม่ถูกต้อง | ผู้ใช้กรอก identifier ว่าง/ไม่ตรงบัญชี หรือ password ไม่ตรง | ผู้ใช้กดยืนยัน Login | ระบบไม่อนุญาตให้เข้าสู่ระบบและแสดง `กรุณากรอกข้อมูลให้ถูกต้อง` (FR-04, AC-ACCOUNT-03) | node:test | `test_AC_ACCOUNT_03_login_invalid_input` | ผ่านจาก `tests/AC-ACCOUNT-03.test.cjs`: ทดสอบทั้งค่าว่างและบัญชีที่ไม่ตรง ตรวจ success panel ยังซ่อนและข้อความแจ้งเตือนตรงตาม Spec | Pass | ครอบคลุม invalid input ที่มีอยู่ใน Test |
| TC-ACCOUNT-03-2 | AC-ACCOUNT-03 (FR-04, Exception Flow 4b) | ทางผิด: Email ซ้ำ | มีบัญชี Mock `demo@owlcha.test` อยู่แล้ว ผู้ใช้กรอก Email เดิมและ password ใหม่ | ผู้ใช้กดยืนยันสมัครสมาชิก | ระบบปฏิเสธทันที ไม่สร้างบัญชีซ้ำ และแสดง `อีเมล/เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว` (FR-04, AC-ACCOUNT-03) | node:test | `test_AC_ACCOUNT_03_register_duplicate_identifier` | ผ่านจาก `tests/AC-ACCOUNT-03.test.cjs`: ตรวจ success panel ยังซ่อน, form ไม่ reset และข้อความ duplicate แสดง | Pass | ตรวจ duplicate Email |
| TC-ACCOUNT-03-3 | AC-ACCOUNT-03 (FR-04, Constraint identifier ไม่ซ้ำ) | ขอบเขต: phone ซ้ำ | มีบัญชี Mock ที่สมัครด้วยเบอร์โทรศัพท์ `0823456789` แล้ว ผู้ใช้กรอกเบอร์เดิมและ password ใหม่โดยไม่กรอก Email | ผู้ใช้กดยืนยันสมัครสมาชิกอีกครั้ง | ระบบปฏิเสธ ไม่สร้างบัญชีซ้ำ และแสดง `อีเมล/เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว` (FR-04, AC-ACCOUNT-03) | node:test | `test_AC_ACCOUNT_03_register_duplicate_phone` | ผ่านจาก `tests/AC-ACCOUNT-03.test.cjs`: สมัคร phone-only ครั้งแรก แล้วตรวจ duplicate ครั้งที่สองโดย success state ไม่เปิดและข้อความ duplicate แสดง | Pass | ปิดช่องว่าง duplicate phone |
| TC-ACCOUNT-04-1 | AC-ACCOUNT-04 (FR-05, FR-06) | ทางปกติ: Mock LINE success | ผู้ใช้ Login สำเร็จด้วยบัญชี Mock และเห็น LINE panel | ผู้ใช้กด `จำลองเชื่อมต่อ LINE` | Prototype แสดงสถานะเชื่อมต่อสำเร็จ; เก็บ `mock-line-user-001` ใน Browser Memory; ผูกกับบัญชีที่ Login สำเร็จ (FR-05, FR-06, AC-ACCOUNT-04) | node:test | `test_AC_ACCOUNT_04_line_connect_success` | ผ่านจาก `tests/AC-ACCOUNT-04.test.cjs`: ตรวจ success message และ `linePanel.dataset.lineUserId === mock-line-user-001` หลัง Login | Pass | ไม่เรียก LINE API จริง |
| TC-ACCOUNT-04-2 | AC-ACCOUNT-04 / NFR-SEC-01 (FR-06, Constraint ต้อง Login/Register ก่อนผูก LINE) | ทางผิด: ยังไม่ Login/Register | ไม่มี active account และยังไม่มีการสมัครหรือ Login | ผู้ใช้กด `จำลองเชื่อมต่อ LINE` | ระบบไม่สร้างความสัมพันธ์ใหม่; ไม่บันทึก Mock LINE User ID; แสดง `กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อนเชื่อมต่อ LINE` (NFR-SEC-01 ในระดับ Prototype) | node:test | `test_AC_ACCOUNT_04_line_requires_login_or_register` | ผ่านจาก `tests/AC-ACCOUNT-04.test.cjs`: ตรวจ guard message, `data-line-user-id` ว่าง และ account success ยังซ่อน | Pass | เป็นหลักฐาน Mock เท่านั้น ไม่ใช่ protected endpoint |
| TC-ACCOUNT-04-3 | AC-ACCOUNT-04 / NFR-SEC-01 (Constraint ไม่เก็บ LINE Password) | ตรวจข้อมูลใน Prototype | หน้า Account และ script ไม่มี field หรือ logic สำหรับ LINE Password | ตรวจ source ของ `index.html` และ `menu.js` | ไม่มี input/field สำหรับ LINE Password; ไม่มีการรับหรือจัดเก็บ LINE Password; ใช้เฉพาะ Mock LINE User ID (NFR-SEC-01) | node:test | `test_AC_ACCOUNT_04_no_line_password_input_or_storage` | ผ่านจาก `tests/AC-ACCOUNT-04.test.cjs`: regex assertions ไม่พบ LINE password input หรือ storage ในหน้าและ script | Pass | ไม่ใช่การทดสอบ secret handling ของระบบจริง |
| TC-ACCOUNT-04-4 | AC-ACCOUNT-04 / NFR-SEC-01 | Manual UI | ผู้ใช้เปิด `features/account/index.html` หลัง Login/Register สำเร็จ | ผู้ใช้ดู LINE panel และข้อความสถานะ | ควรเห็นสถานะเชื่อมต่อสำเร็จและขั้นตอน LINE ชัดเจนตาม NFR-USE-01; ต้องไม่เห็นช่อง LINE Password | คน | — | ยังไม่มีบันทึกผล Manual หรือภาพหลักฐานในรอบนี้ | Not Run | Automated Test ตรวจ DOM/state ได้ แต่ไม่แทนการตรวจด้วยคน |
| TC-ACCOUNT-05-1 | AC-ACCOUNT-05 (Alternative Flow 7b, FR-05) | ทางปกติ: ข้าม LINE | ผู้ใช้ Login สำเร็จและเห็น LINE panel; การเชื่อมต่อ LINE เป็นทางเลือก | ผู้ใช้กด `ข้ามไปก่อน` | ระบบปิดขั้นตอน LINE และยังให้ใช้งาน Prototype ต่อได้ (AC-ACCOUNT-05) | node:test | `test_AC_ACCOUNT_05_skip_line_connection` | ผ่านจาก `tests/AC-ACCOUNT-05.test.cjs`: ตรวจ `line-panel.hidden === true` และข้อความว่ายังใช้งานต้นแบบต่อได้ตามปกติ | Pass | ไม่มีการผูก Mock LINE ID |
| TC-ACCOUNT-06-1 | AC-ACCOUNT-06 (FR-05, FR-06, NFR-REL-01, Exception Flow 7c) | ทางผิด: Mock LINE failure | ผู้ใช้ Login สำเร็จและเลือกเชื่อมต่อ LINE แต่เลือกจำลองผลล้มเหลว | ผู้ใช้กด `จำลองเชื่อมต่อไม่สำเร็จ` | ระบบแสดงข้อความ failure; ไม่บันทึก LINE User ID; ไม่สร้างความสัมพันธ์ใหม่; ผู้ใช้ยังใช้งาน Prototype ต่อได้ (AC-ACCOUNT-06, NFR-REL-01) | node:test | `test_AC_ACCOUNT_06_line_connect_failure` | ผ่านจาก `tests/AC-ACCOUNT-06.test.cjs`: ตรวจข้อความ `เชื่อมต่อ LINE ไม่สำเร็จ แต่ยังสามารถใช้งานต่อได้ตามปกติ`, message แสดง, panel ยังอยู่ และ `data-line-user-id` ว่าง | Pass | Failure เป็น Mock เท่านั้น |
| TC-ACCOUNT-06-2 | AC-ACCOUNT-06 / NFR-REL-01 | Manual UI | ผู้ใช้เปิดหน้า Prototype และ Login/Register สำเร็จ | ผู้ใช้ทดลองเลือก failure แล้วทดลองใช้ flow หลักต่อ | ควรเห็นข้อความ failure และยังใช้งาน flow หลักต่อได้ โดยไม่มีการเรียกบริการ LINE จริง | คน | — | ยังไม่มีบันทึกผล Manual หรือภาพหลักฐานในรอบนี้ | Not Run | Automated Test มีหลักฐาน behavior ใน Mock แล้ว แต่ยังไม่ใช่ Manual Evidence |

## สรุปผลตาม Acceptance Criteria

| AC | Automated Test | Manual Test | สถานะหลักฐาน |
|---|---:|---:|---|
| AC-ACCOUNT-01 | ผ่าน 2 รายการ | ยังไม่รัน | ผ่านใน Mock Prototype; branch ไม่มี identifier/password ว่างยังไม่มี Test เฉพาะ |
| AC-ACCOUNT-02 | ผ่าน 2 รายการ | ยังไม่รัน | ผ่านใน Mock Prototype ทั้ง Email และ phone |
| AC-ACCOUNT-03 | ผ่าน 3 รายการ | ยังไม่รัน | ผ่านใน Mock Prototype สำหรับ invalid login, duplicate Email และ duplicate phone |
| AC-ACCOUNT-04 | ผ่าน 3 รายการ | ยังไม่รัน | ผ่านใน Mock Prototype; LINE success และ NFR-SEC guard/ไม่มี LINE password มีหลักฐานระดับ Mock |
| AC-ACCOUNT-05 | ผ่าน 1 รายการ | ยังไม่รัน | ผ่านใน Mock Prototype |
| AC-ACCOUNT-06 | ผ่าน 1 รายการ | ยังไม่รัน | ผ่านใน Mock Prototype; ไม่ใช่การเชื่อม LINE จริง |

## ข้อจำกัดและงาน Deferred

- `NFR-SEC-01` ยังไม่ผ่านครบในระดับระบบจริง เพราะไม่มี Backend, protected endpoint, session/token, database access control หรือ Authentication จริงใน Prototype นี้
- การตรวจ NFR-SEC-01 ในเอกสารนี้ยืนยันได้เฉพาะ guard ก่อนเชื่อม LINE และการไม่มี LINE Password ใน source
- T-09 การยกเลิกการเชื่อมต่อ LINE และ T-10 การเปลี่ยนบัญชี LINE ถูก Deferred ไป Release 2 ตาม Q-02 และ Q-03 จึงไม่มีผล Pass ในเอกสารนี้
- ไม่มี Test Case ใดอ้างว่าเชื่อม LINE จริง, ใช้ OAuth, ใช้ฐานข้อมูลจริง หรือพิสูจน์ security production
- TC-ACCOUNT-01-3 เป็น `Not Run` เนื่องจากยังไม่มี Automated Test ที่ยืนยัน branch นี้โดยตรง และ Spec ไม่ได้กำหนดข้อความเฉพาะสำหรับกรณีข้อมูลไม่ครบ
