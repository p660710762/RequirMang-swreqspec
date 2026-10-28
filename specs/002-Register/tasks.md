# Tasks: สมัครสมาชิก / เข้าสู่ระบบ (Register & Login)

- Feature: สมัครสมาชิก / เข้าสู่ระบบ (Register & Login)
- Spec ID: SPEC-ACCOUNT-001
- อ้างอิง: [spec.md](./spec.md), [plan.md](./plan.md)
- วันที่: 2569-10-26

สรุป:
- มี 6 เฟส รวม 10 tasks โดยทุกเฟสเป็น vertical slice ของ Frontend Prototype ใน `features/account/`
- Q-01 ได้คำตอบแล้วและกำหนดขอบเขต Mock LINE Connection; Q-02 และ Q-03
  เลื่อนไป Release ถัดไป โดยไม่มีการสร้าง LINE Login, OAuth หรือ callback จริง
- เฟส 1 เป็นเฟสแรกที่ลองใช้งานได้จริง เพราะหน้า account และ Mock Data ที่จำเป็นมีอยู่แล้ว

ขอบเขตทุก task: ใช้เฉพาะ HTML, CSS, Vanilla JavaScript และ Mock Data ใน browser
ไม่สร้าง React, Vite, FastAPI, Backend, API, session/token จริง หรือฐานข้อมูลจริง

### T-00 เตรียมโครงสร้าง React + Vite
- รองรับ: งานพื้นฐานทางเทคนิคของ UC-02 ตาม plan.md และ FR-02, NFR-USE-01
- ตรวจด้วย: ไม่มี AC ตรง ๆ เป็นงานพื้นฐานของ T-01 และ T-02
- ไฟล์ที่แตะ: `frontend/package.json`, `frontend/index.html`, `frontend/src/main.jsx`, `frontend/src/App.jsx` และไฟล์ตั้งค่าที่จำเป็นสำหรับ React + Vite
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: ไม่มี
- เสร็จเมื่อ: มีโครงสร้าง Frontend ที่รัน `npm run dev` ได้และแสดงหน้า React เริ่มต้นได้
- สถานะ: เสร็จ (ทีมยืนยันแล้ว)

### T-01 กำหนด Mock Data และ React State ของบัญชี
- รองรับ: FR-01, FR-03, FR-05, FR-06, NFR-SEC-01
- ตรวจด้วย: ไม่มี AC ตรง ๆ เป็นงานพื้นฐานของ T-03, T-05 และ T-09
- ไฟล์ที่แตะ: `frontend/src/App.jsx` หรือไฟล์ State/Mock Data ภายใต้ `frontend/src/`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-00
- เสร็จเมื่อ: มีโครงสร้าง Mock Account, สถานะผู้ใช้ปัจจุบัน และความสัมพันธ์ Mock LINE ในหน่วยความจำ โดยไม่มี Password ของ LINE
- สถานะ: เสร็จ (ทีมยืนยันแล้ว)

### T-02 จัดชุดทดสอบ account และวิธีเปิด prototype
- รองรับ: FR-02, NFR-USE-01
- ตรวจด้วย: ไม่มี AC ตรง ๆ เป็นงานพื้นฐานของ T-03 ถึง T-10
- ไฟล์ที่แตะ: `tests/AC-ACCOUNT-01.test.cjs`, `tests/AC-ACCOUNT-02.test.cjs`, `tests/AC-ACCOUNT-03.test.cjs`, `tests/AC-ACCOUNT-04.test.cjs`, `tests/AC-ACCOUNT-05.test.cjs`, `tests/AC-ACCOUNT-06.test.cjs`, `specs/002-Register/tasks.md`, `prompt-log.md`
- แบบหน้าจอ: ไม่มี mockup หรือ UI ID ใน spec
- ต้องทำหลัง: T-01
- เสร็จเมื่อ: หน้าเดียวแสดงฟอร์ม Login ด้านบน ปุ่มเข้าสู่ระบบ และส่วนสมัครสมาชิกด้านล่างตาม FR-02
- สถานะ: เสร็จ (ทีมยืนยันแล้ว)

#### จุดตรวจเฟส 0
- test ที่ต้องผ่านทั้งหมด: test ของ account ที่มีอยู่และ test ของ Repo เดิมต้องยังผ่าน
- เปิดระบบ: เปิด `features/account/index.html` ด้วย browser หรือ static file server ตามวิธีที่ทีมใช้อยู่; ไม่มี backend/frontend server
- คนลองเองตาม FR-02:
  Given เปิด `features/account/index.html`
  When ดูหน้า account
  Then เห็นฟอร์ม login และ register ในหน้าเดียว พร้อมป้ายว่าเป็น prototype
- ยังขาด: ไม่มี

## เฟส 1: สมัครสมาชิกสำเร็จ (AC-ACCOUNT-01)

### T-03 ตรวจและปรับ Mock Register Flow
- รองรับ: FR-01, FR-02, FR-04
- ตรวจด้วย: AC-ACCOUNT-01
- ไฟล์ที่แตะ: `features/account/account.js`, `features/account/index.html`, `tests/AC-ACCOUNT-01.test.cjs`, `specs/002-Register/tasks.md`, `prompt-log.md`
- แบบหน้าจอ: ไม่มี mockup หรือ UI ID ใน spec
- ต้องทำหลัง: T-01
- เสร็จเมื่อ: การยืนยันข้อมูลที่มี Email หรือเบอร์โทรศัพท์อย่างน้อยหนึ่งช่องและ Password ไม่ว่างสร้าง Mock Account ได้ และปฏิเสธข้อมูลไม่ครบถ้วน/ซ้ำ
- สถานะ: เสร็จ (ทีมยืนยันแล้ว)

### T-04 แสดงผลสมัครสมาชิกสำเร็จและ Auto-login
- รองรับ: FR-01, FR-02, FR-06, NFR-USE-01
- ตรวจด้วย: AC-ACCOUNT-01
- ไฟล์ที่แตะ: `frontend/src/App.jsx` และไฟล์ UI ภายใต้ `frontend/src/`
- แบบหน้าจอ: ไม่มี Mockup ที่ระบุใน spec
- ต้องทำหลัง: T-02, T-03
- เสร็จเมื่อ: หลังสมัครสำเร็จ UI แสดงสถานะสำเร็จและสถานะผู้ใช้เป็น Auto-login ใน React State โดยไม่ต้องกรอก Login ซ้ำ
- สถานะ: เสร็จ (ทีมยืนยันแล้ว)

#### จุดตรวจเฟส 1
- test ที่ต้องผ่านทั้งหมด: `test_AC_ACCOUNT_01_register_success` และ test ของเฟส 0
- เปิดระบบ: เปิด `features/account/index.html` ด้วย browser หรือ static file server
- คนลองเองตาม AC-ACCOUNT-01:
  Given กรอก Email หรือเบอร์โทรศัพท์อย่างน้อยหนึ่งช่องและรหัสผ่านที่ไม่ว่าง
  When กด “สร้างบัญชี”
  Then แสดงว่าสมัครสมาชิกสำเร็จและเข้าสู่ flow ต่อได้ โดยข้อมูลอยู่ในหน่วยความจำของหน้าเท่านั้น
- ยังขาด: ไม่มี

## เฟส 2: เข้าสู่ระบบสำเร็จ (AC-ACCOUNT-02)

### T-04 ตรวจ Mock Login Flow ด้วยบัญชีตัวอย่างและบัญชีที่สมัคร
- รองรับ: FR-02, FR-03, NFR-USE-01
- ตรวจด้วย: AC-ACCOUNT-02
- ไฟล์ที่แตะ: `frontend/src/App.jsx` และไฟล์ Logic/Mock Data ภายใต้ `frontend/src/`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-01, T-03
- เสร็จเมื่อ: ผู้ใช้ที่มี Mock Account กรอก Email หรือเบอร์โทรศัพท์กับ Password ถูกต้องแล้วถูกตั้งเป็นผู้ใช้ปัจจุบันใน React State
- สถานะ: เสร็จ (ทีมยืนยันแล้ว)

### T-06 แสดงผล Login สำเร็จ
- รองรับ: FR-03, NFR-USE-01
- ตรวจด้วย: AC-ACCOUNT-02
- ไฟล์ที่แตะ: `frontend/src/App.jsx` และไฟล์ UI ภายใต้ `frontend/src/`
- แบบหน้าจอ: ไม่มี Mockup ที่ระบุใน spec
- ต้องทำหลัง: T-02, T-05
- เสร็จเมื่อ: UI แสดงสถานะว่าผู้ใช้เข้าสู่ระบบแล้วเมื่อข้อมูลบัญชีถูกต้อง
- สถานะ: เสร็จ (ทีมยืนยันแล้ว)

#### จุดตรวจเฟส 2
- test ที่ต้องผ่านทั้งหมด: `test_AC_ACCOUNT_02_login_success` และ test ของเฟส 0-1
- เปิดระบบ: เปิด `features/account/index.html` ด้วย browser หรือ static file server
- คนลองเองตาม AC-ACCOUNT-02:
  Given มีบัญชีตัวอย่างหรือบัญชีที่สมัครในหน้าเดียวกัน
  When กรอก identifier และ password ถูกต้องแล้วกด “เข้าสู่ระบบ”
  Then แสดงสถานะเข้าสู่ระบบสำเร็จแบบจำลอง
- ยังขาด: ไม่มี

## เฟส 3: ปฏิเสธข้อมูลไม่ถูกต้องและข้อมูลซ้ำ (AC-ACCOUNT-03)

### T-05 ตรวจ validation และ duplicate message
- รองรับ: FR-01, FR-02, FR-04
- ตรวจด้วย: AC-ACCOUNT-03
- ไฟล์ที่แตะ: `frontend/src/App.jsx` และไฟล์ Logic/Mock Data ภายใต้ `frontend/src/`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-05
- เสร็จเมื่อ: ข้อมูล Login ไม่ถูกต้องหรือไม่ครบถ้วนไม่เปลี่ยนสถานะผู้ใช้เป็น Logged-in และส่งสถานะผิดพลาดให้ UI
- สถานะ: เสร็จ (ทีมยืนยันแล้ว)

### T-08 แสดงข้อความแจ้งเตือน Login ไม่สำเร็จ
- รองรับ: FR-04, NFR-USE-01
- ตรวจด้วย: AC-ACCOUNT-03
- ไฟล์ที่แตะ: `frontend/src/App.jsx` และไฟล์ UI ภายใต้ `frontend/src/`
- แบบหน้าจอ: ไม่มี Mockup ที่ระบุใน spec
- ต้องทำหลัง: T-02, T-07
- เสร็จเมื่อ: UI ปฏิเสธการเข้าสู่ระบบและแสดงข้อความแจ้งเตือนตาม FR-04
- สถานะ: เสร็จ (ทีมยืนยันแล้ว)

#### จุดตรวจเฟส 3
- test ที่ต้องผ่านทั้งหมด: `test_AC_ACCOUNT_03_login_invalid_input` และ test ของเฟส 0-2
- เปิดระบบ: เปิด `features/account/index.html` ด้วย browser หรือ static file server
- คนลองเองตาม AC-ACCOUNT-03:
  Given กรอกข้อมูล login ไม่ถูกต้องหรือว่าง
  When กด “เข้าสู่ระบบ”
  Then ไม่เข้าสู่ระบบและเห็นข้อความ “กรุณากรอกข้อมูลให้ถูกต้อง”
- ยังขาด: ไม่มี

## เฟส 4: ข้าม LINE และรองรับความล้มเหลวแบบจำลอง (AC-ACCOUNT-05, AC-ACCOUNT-06)

### T-09 จำลองการเชื่อมต่อ Mock LINE สำเร็จ
- รองรับ: FR-05, FR-06, NFR-SEC-01
- ตรวจด้วย: AC-ACCOUNT-04
- ไฟล์ที่แตะ: `frontend/src/App.jsx` และไฟล์ Logic/Mock Data ภายใต้ `frontend/src/`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-04, T-06
- เสร็จเมื่อ: เฉพาะผู้ใช้ที่ Login/Register สำเร็จเท่านั้นที่สร้างความสัมพันธ์กับ `mock-line-user-001` ใน React State ได้ และไม่มี LINE Password ในข้อมูล
- สถานะ: เสร็จ (ทีมยืนยันแล้ว)

### T-10 แสดงสถานะ Mock LINE เชื่อมต่อสำเร็จ
- รองรับ: FR-05, FR-06, NFR-USE-01
- ตรวจด้วย: AC-ACCOUNT-04
- ไฟล์ที่แตะ: `frontend/src/App.jsx` และไฟล์ UI ภายใต้ `frontend/src/`
- แบบหน้าจอ: ไม่มี Mockup ที่ระบุใน spec
- ต้องทำหลัง: T-09
- เสร็จเมื่อ: UI แสดงสถานะเชื่อมต่อสำเร็จและใช้ Mock LINE User ID ที่กำหนด โดยไม่เรียก LINE API จริง
- สถานะ: เสร็จ (ทีมยืนยันแล้ว)

#### จุดตรวจเฟส 4
- test ที่ต้องผ่านทั้งหมด: `test_AC_ACCOUNT_05_skip_line_connection`, `test_AC_ACCOUNT_06_line_connect_failure` และ test ของเฟส 0-3
- เปิดระบบ: เปิด `features/account/index.html` ด้วย browser หรือ static file server
- คนลองเองตาม AC-ACCOUNT-05:
  Given login หรือ register สำเร็จและเห็นส่วน LINE
  When กด “ข้ามไปก่อน”
  Then ปิดขั้นตอน LINE และยังใช้ prototype ต่อได้
- ยังขาด: AC-ACCOUNT-06 ตรวจได้เฉพาะ failure แบบจำลอง; ไม่มีการเชื่อมต่อ LINE จริงใน Release นี้

## เฟส 5: Mock LINE Connection และงานที่เลื่อนไป Release ถัดไป

### T-11 สร้าง Mock LINE Skip Flow
- รองรับ: FR-05, FR-05 / UC-02 Alternative Flow 7b
- ตรวจด้วย: AC-ACCOUNT-05
- ไฟล์ที่แตะ: `frontend/src/App.jsx` และไฟล์ Logic/Mock Data ภายใต้ `frontend/src/`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-09
- เสร็จเมื่อ: ผู้ใช้เลือกข้าม LINE ได้โดยไม่สร้างความสัมพันธ์ใหม่และยังอยู่ใน flow การใช้งานต่อได้
- สถานะ: เสร็จ (ทีมยืนยันแล้ว)

### T-08 ตรวจ Mock LINE Connection ล้มเหลว
- รองรับ: FR-05, FR-06, NFR-REL-01
- ตรวจด้วย: AC-ACCOUNT-06
- ไฟล์ที่แตะ: `frontend/src/App.jsx` และไฟล์ UI ภายใต้ `frontend/src/`
- แบบหน้าจอ: ไม่มี Mockup ที่ระบุใน spec
- ต้องทำหลัง: T-09
- เสร็จเมื่อ: เมื่อจำลองการเชื่อมต่อล้มเหลว ระบบไม่บันทึก Mock LINE User ID แสดงสถานะผิดพลาด และยังใช้งาน Prototype ต่อได้
- สถานะ: เสร็จ (ทีมยืนยันแล้ว)

### T-09 เลื่อนการยกเลิกการเชื่อมต่อ LINE
- รองรับ: FR-05, FR-06
- ตรวจด้วย: ไม่มี AC ตรง ๆ เป็นงานที่เลื่อนไป Release ถัดไป
- ไฟล์ที่แตะ: `specs/002-Register/tasks.md` เมื่อเริ่ม Release ถัดไป
- แบบหน้าจอ: ไม่มี mockup หรือ UI ID ใน spec
- ต้องทำหลัง: T-07
- เสร็จเมื่อ: บันทึกว่าไม่รองรับการยกเลิกการเชื่อมต่อ LINE ใน Release นี้ และเลื่อนไป Release ถัดไป โดยไม่สร้าง UI หรือ flow เพิ่ม
- สถานะ: เลื่อนไป Release ถัดไป

### T-10 เลื่อนการเปลี่ยนบัญชี LINE
- รองรับ: FR-05, FR-06
- ตรวจด้วย: ไม่มี AC ตรง ๆ เป็นงานที่เลื่อนไป Release ถัดไป
- ไฟล์ที่แตะ: `specs/002-Register/tasks.md` เมื่อเริ่ม Release ถัดไป
- แบบหน้าจอ: ไม่มี mockup หรือ UI ID ใน spec
- ต้องทำหลัง: T-07
- เสร็จเมื่อ: บันทึกว่าไม่รองรับการเปลี่ยนบัญชี LINE ใน Release นี้ และเลื่อนไป Release ถัดไป โดยไม่สร้าง UI หรือ flow เพิ่ม
- สถานะ: เลื่อนไป Release ถัดไป

## ตารางตรวจความครบ: Acceptance Criteria

| AC ID | task ที่ตรวจ AC นี้ |
|---|---|
| AC-ACCOUNT-01 | T-03 |
| AC-ACCOUNT-02 | T-04 |
| AC-ACCOUNT-03 | T-05 |
| AC-ACCOUNT-04 | T-07 |
| AC-ACCOUNT-05 | T-06 |
| AC-ACCOUNT-06 | T-06, T-08 |

## ตารางตรวจความครบ: Constraints

| Constraint ID | task ที่ทำให้เป็นจริง |
|---|---|
| ไม่มี ID: ลูกค้าต้องสามารถเข้าถึงหน้าสมัครสมาชิกหรือเข้าสู่ระบบได้ | T-01, T-02 |
| ไม่มี ID: Email หรือเบอร์โทรศัพท์ต้องไม่ซ้ำกับบัญชีที่มีอยู่ในระบบ | T-03, T-05 |
| ไม่มี ID: ผู้ใช้สามารถกรอก Email หรือเบอร์โทรศัพท์อย่างน้อยหนึ่งช่อง โดยไม่จำเป็นต้องกรอกทั้งคู่ | T-03, T-05 |
| ไม่มี ID: Password ต้องเป็นไปตามเงื่อนไขที่ระบบกำหนด โดยข้อมูลที่ไม่ว่างถือว่าเป็นข้อมูลที่ถูกต้องสำหรับการเข้าสู่ระบบ | T-03, T-04, T-05 |
| ไม่มี ID: การเชื่อมต่อ LINE เป็นทางเลือก ไม่บังคับต่อการสมัครสมาชิกหรือเข้าสู่ระบบ | T-06, T-07, T-08 |
| ไม่มี ID: ระบบต้องไม่จัดเก็บ Password ของบัญชี LINE | T-06, T-07, T-08 |
| ไม่มี ID: ระบบต้องสามารถเชื่อมโยง Mock LINE User ID `mock-line-user-001` กับบัญชีลูกค้าได้อย่างถูกต้อง | T-07 |
| ไม่มี ID: ข้อมูลส่วนบุคคลที่เกี่ยวกับบัญชี เช่น ชื่อ อีเมล เบอร์โทรศัพท์ ต้องมีการ login ก่อนถึงจะเข้าถึงได้ | T-04, T-05 |

## ตารางตรวจความครบ: FR

| FR ID | AC ที่ตรวจ FR นี้ | เฟส |
|---|---|---|
| FR-01 | AC-ACCOUNT-01, AC-ACCOUNT-03 | เฟส 1, เฟส 3 |
| FR-02 | AC-ACCOUNT-01, AC-ACCOUNT-02, AC-ACCOUNT-03 | เฟส 1, เฟส 2, เฟส 3 |
| FR-03 | AC-ACCOUNT-02, AC-ACCOUNT-03 | เฟส 2, เฟส 3 |
| FR-04 | AC-ACCOUNT-03 | เฟส 3 |
| FR-05 | AC-ACCOUNT-04, AC-ACCOUNT-05, AC-ACCOUNT-06 | เฟส 4, เฟส 5 |
| FR-06 | AC-ACCOUNT-04, AC-ACCOUNT-06 | เฟส 5 |

## สิ่งที่ยังไม่ทำใน Release นี้

| Open Question | task ที่รออยู่ |
|---|---|
| การเชื่อมต่อ LINE จริง เช่น LINE Login, OAuth หรือ callback | ไม่ทำ; ใช้ Mock LINE Connection ตามคำตอบ Q-01 |
| ลูกค้าสามารถยกเลิกการเชื่อมต่อ LINE ภายหลังได้หรือไม่ | T-09 เลื่อนไป Release ถัดไปตาม Q-02 |
| หากลูกค้าเปลี่ยนบัญชี LINE จะต้องดำเนินการเชื่อมต่อใหม่อย่างไร | T-10 เลื่อนไป Release ถัดไปตาม Q-03 |

หมายเหตุ: T-01 ถึง T-08 ดำเนินการแล้วและอยู่ในสถานะเสร็จ รอทีมตรวจ
ส่วน T-09 และ T-10 เลื่อนไป Release 2 ตาม Q-02 และ Q-03
