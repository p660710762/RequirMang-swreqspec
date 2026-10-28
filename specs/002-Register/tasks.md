# Tasks: สมัครสมาชิก / เข้าสู่ระบบ (Register & Login)

- Feature: UC-02 สมัครสมาชิก / เข้าสู่ระบบ
- Spec ID: `SPEC-ACCOUNT-001`
- อ้างอิง: [spec.md](./spec.md), [plan.md](./plan.md)
- วันที่: 2569-10-26

Release 1 แบ่งเป็น 6 เฟส รวม 13 tasks และทุก task พร้อมทำ
ไม่มี task ที่รอ Open Question เพราะ Q-01 ถึง Q-03 ได้คำตอบจากทีมแล้ว
เฟสแรกที่ลองใช้งานได้จริงคือเฟส 1 สมัครสมาชิกสำเร็จและ Auto-login แบบ Prototype

## เฟส 0: ฐานรากของ React Prototype (ไม่มี AC ตรง)

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

### T-02 สร้างโครงหน้า Login/Register หน้าเดียว
- รองรับ: FR-02, NFR-USE-01
- ตรวจด้วย: ไม่มี AC ตรง ๆ เป็นงานพื้นฐานของ T-03 และ T-05
- ไฟล์ที่แตะ: `frontend/src/App.jsx` และไฟล์ UI ภายใต้ `frontend/src/`
- แบบหน้าจอ: ไม่มี Mockup ที่ระบุใน spec
- ต้องทำหลัง: T-01
- เสร็จเมื่อ: หน้าเดียวแสดงฟอร์ม Login ด้านบน ปุ่มเข้าสู่ระบบ และส่วนสมัครสมาชิกด้านล่างตาม FR-02
- สถานะ: เสร็จ (ทีมยืนยันแล้ว)

#### จุดตรวจเฟส 0
- test ที่ต้องผ่านทั้งหมด: `test_AC_ACCOUNT_01_register_success`, `test_AC_ACCOUNT_02_login_success`, `test_AC_ACCOUNT_03_login_invalid_input`, `test_AC_ACCOUNT_04_line_connect_success`, `test_AC_ACCOUNT_05_skip_line_connection`, `test_AC_ACCOUNT_06_line_connect_failure`
- เปิดระบบ: คำสั่งเปิดหน้าจอตาม `frontend/package.json` ของ Branch `Account`
- คนลองเองตาม FR-02:
  Given เปิดหน้า Prototype
  When ดูหน้า Login/Register
  Then เห็นฟอร์ม Login อยู่ด้านบนและปุ่มสมัครสมาชิกแยกอยู่ด้านล่าง
- ยังขาด: ไม่มี

## เฟส 1: สมัครสมาชิกสำเร็จและ Auto-login (AC-ACCOUNT-01)

### T-03 สร้าง Validation และ Register Mock Flow
- รองรับ: FR-01, FR-02
- ตรวจด้วย: AC-ACCOUNT-01
- ไฟล์ที่แตะ: `frontend/src/App.jsx` และไฟล์ Logic/Mock Data ภายใต้ `frontend/src/`
- แบบหน้าจอ: ไม่มี
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
- test ที่ต้องผ่านทั้งหมด: `test_AC_ACCOUNT_01_register_success`
- เปิดระบบ: คำสั่งเปิดหน้าจอตาม `frontend/package.json` ของ Branch `Account`
- คนลองเองตาม AC-ACCOUNT-01:
  Given กรอก Email หรือเบอร์โทรศัพท์อย่างน้อยหนึ่งช่องและ Password ที่ไม่ว่าง
  When กดยืนยันการสมัครสมาชิก
  Then เห็นสถานะสมัครสมาชิกสำเร็จและเข้าสู่ flow ต่อได้ทันทีโดยไม่ต้องกรอก Login ซ้ำ
- ยังขาด: ไม่มี

## เฟส 2: เข้าสู่ระบบด้วยบัญชีเดิม (AC-ACCOUNT-02)

### T-05 สร้าง Login Mock Flow และตรวจบัญชี
- รองรับ: FR-03
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
- test ที่ต้องผ่านทั้งหมด: `test_AC_ACCOUNT_01_register_success`, `test_AC_ACCOUNT_02_login_success`
- เปิดระบบ: คำสั่งเปิดหน้าจอตาม `frontend/package.json` ของ Branch `Account`
- คนลองเองตาม AC-ACCOUNT-02:
  Given มี Mock Account และกรอกข้อมูลบัญชีถูกต้อง
  When กดยืนยันการเข้าสู่ระบบ
  Then ระบบอนุญาตให้เข้าสู่ระบบและแสดงสถานะผู้ใช้ที่เข้าสู่ระบบแล้ว
- ยังขาด: ไม่มี

## เฟส 3: ปฏิเสธข้อมูลเข้าสู่ระบบ (AC-ACCOUNT-03)

### T-07 ตรวจสอบข้อมูล Login ไม่ถูกต้อง
- รองรับ: FR-04, UC-02 Exception Flow 4a
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
- test ที่ต้องผ่านทั้งหมด: `test_AC_ACCOUNT_01_register_success`, `test_AC_ACCOUNT_02_login_success`, `test_AC_ACCOUNT_03_login_invalid_input`
- เปิดระบบ: คำสั่งเปิดหน้าจอตาม `frontend/package.json` ของ Branch `Account`
- คนลองเองตาม AC-ACCOUNT-03:
  Given กรอกข้อมูลเข้าสู่ระบบไม่ถูกต้อง
  When กดยืนยันการเข้าสู่ระบบ
  Then ระบบปฏิเสธการเข้าสู่ระบบและแสดงข้อความแจ้งเตือน
- ยังขาด: ไม่มี

## เฟส 4: เชื่อมต่อ Mock LINE สำเร็จ (AC-ACCOUNT-04)

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
- test ที่ต้องผ่านทั้งหมด: `test_AC_ACCOUNT_01_register_success`, `test_AC_ACCOUNT_02_login_success`, `test_AC_ACCOUNT_03_login_invalid_input`, `test_AC_ACCOUNT_04_line_connect_success`
- เปิดระบบ: คำสั่งเปิดหน้าจอตาม `frontend/package.json` ของ Branch `Account`
- คนลองเองตาม AC-ACCOUNT-04:
  Given Login/Register สำเร็จและเลือกเชื่อมต่อ LINE
  When จำลองผลการเชื่อมต่อสำเร็จ
  Then UI แสดงสถานะสำเร็จและผูก `mock-line-user-001` กับบัญชีในหน่วยความจำ
- ยังขาด: ไม่มี

## เฟส 5: ข้าม LINE และรองรับการเชื่อมต่อล้มเหลว (AC-ACCOUNT-05, AC-ACCOUNT-06)

### T-11 สร้าง Mock LINE Skip Flow
- รองรับ: FR-05, FR-05 / UC-02 Alternative Flow 7b
- ตรวจด้วย: AC-ACCOUNT-05
- ไฟล์ที่แตะ: `frontend/src/App.jsx` และไฟล์ Logic/Mock Data ภายใต้ `frontend/src/`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-09
- เสร็จเมื่อ: ผู้ใช้เลือกข้าม LINE ได้โดยไม่สร้างความสัมพันธ์ใหม่และยังอยู่ใน flow การใช้งานต่อได้
- สถานะ: เสร็จ (ทีมยืนยันแล้ว)

### T-12 สร้าง Mock LINE Failure Flow และแสดงผล
- รองรับ: FR-05, UC-02 Exception Flow 7c, NFR-REL-01, NFR-USE-01
- ตรวจด้วย: AC-ACCOUNT-06
- ไฟล์ที่แตะ: `frontend/src/App.jsx` และไฟล์ UI ภายใต้ `frontend/src/`
- แบบหน้าจอ: ไม่มี Mockup ที่ระบุใน spec
- ต้องทำหลัง: T-09
- เสร็จเมื่อ: เมื่อจำลองการเชื่อมต่อล้มเหลว ระบบไม่บันทึก Mock LINE User ID แสดงสถานะผิดพลาด และยังใช้งาน Prototype ต่อได้
- สถานะ: เสร็จ (ทีมยืนยันแล้ว)

#### จุดตรวจเฟส 5
- test ที่ต้องผ่านทั้งหมด: `test_AC_ACCOUNT_01_register_success`, `test_AC_ACCOUNT_02_login_success`, `test_AC_ACCOUNT_03_login_invalid_input`, `test_AC_ACCOUNT_04_line_connect_success`, `test_AC_ACCOUNT_05_skip_line_connection`, `test_AC_ACCOUNT_06_line_connect_failure`
- เปิดระบบ: คำสั่งเปิดหน้าจอตาม `frontend/package.json` ของ Branch `Account`
- คนลองเองตาม AC-ACCOUNT-05:
  Given ลูกค้าไม่ต้องการเชื่อมต่อ LINE
  When เลือกข้ามขั้นตอนการเชื่อมต่อ LINE
  Then ลูกค้ายังคงใช้งาน Prototype ต่อได้ตามปกติ
- คนลองเองตาม AC-ACCOUNT-06:
  Given ลูกค้าเลือกเชื่อมต่อ LINE
  When จำลองผลการเชื่อมต่อล้มเหลว
  Then ไม่มีการบันทึก Mock LINE User ID และยังใช้งาน Prototype ต่อได้
- ยังขาด: ไม่มี

## ตารางตรวจความครบ

### Acceptance Criteria

| AC ID | task ที่ตรวจ AC นี้ |
|---|---|
| AC-ACCOUNT-01 | T-03, T-04 |
| AC-ACCOUNT-02 | T-05, T-06 |
| AC-ACCOUNT-03 | T-07, T-08 |
| AC-ACCOUNT-04 | T-09, T-10 |
| AC-ACCOUNT-05 | T-11 |
| AC-ACCOUNT-06 | T-12 |

### Constraints

| Constraint ID | task ที่ทำให้เป็นจริง |
|---|---|
| ลูกค้าต้องสามารถเข้าถึงหน้าสมัครสมาชิกหรือเข้าสู่ระบบได้ | T-02 |
| Email หรือเบอร์โทรศัพท์ต้องไม่ซ้ำกับบัญชีที่มีอยู่ในระบบ | T-03 |
| ผู้ใช้กรอก Email หรือเบอร์โทรศัพท์อย่างน้อยหนึ่งช่องได้ | T-03, T-05 |
| Password ที่ไม่ว่างถือว่าเป็นข้อมูลที่ถูกต้องตามเงื่อนไข Prototype | T-03, T-05 |
| การเชื่อมต่อ LINE เป็นทางเลือก ไม่บังคับ | T-11, T-12 |
| ระบบต้องไม่จัดเก็บ Password ของบัญชี LINE | T-01, T-09 |
| ระบบต้องเชื่อมโยง LINE User ID กับบัญชีลูกค้าได้ถูกต้อง | T-09, T-10 |
| ข้อมูลส่วนบุคคลต้องมีการ Login ก่อนเข้าถึง | T-05, T-09 |

### Functional Requirements

| FR ID | AC ที่ตรวจ FR นี้ | เฟส |
|---|---|---|
| FR-01 | AC-ACCOUNT-01 | เฟส 1 |
| FR-02 | AC-ACCOUNT-01 | เฟส 0-1 |
| FR-03 | AC-ACCOUNT-02 | เฟส 2 |
| FR-04 | AC-ACCOUNT-03 | เฟส 3 |
| FR-05 | AC-ACCOUNT-04, AC-ACCOUNT-05, AC-ACCOUNT-06 | เฟส 4-5 |
| FR-06 | AC-ACCOUNT-04 | เฟส 4 |

### Quality Requirements

| NFR ID | task ที่รองรับ | เฟส |
|---|---|---|
| NFR-SEC-01 | T-01, T-09 | เฟส 0, 4 |
| NFR-REL-01 | T-12 | เฟส 5 |
| NFR-USE-01 | T-02, T-04, T-06, T-08, T-10, T-12 | เฟส 0-5 |

## สิ่งที่ยังไม่ทำ

- Q-01 ปิดแล้ว: Release 1 ใช้ Mock LINE Connection ด้วย React State และ `mock-line-user-001` ในหน่วยความจำ ไม่ใช้ LINE API, OAuth หรือ callback จริง
  - จึงไม่มี task ที่รอ Q-01
- Q-02: การยกเลิกการเชื่อมต่อ LINE ไม่รองรับใน Release 1 และเลื่อนไป Release 2
  - จึงไม่มี task ใน Release 1
- Q-03: การเปลี่ยนบัญชี LINE ไม่รองรับใน Release 1 และเลื่อนไป Release 2
  - จึงไม่มี task ใน Release 1
- FastAPI, Database, JWT/session และ API เป็นข้อเสนอสำหรับระบบจริงหรือ Release ถัดไปตาม plan.md
  - ไม่สร้าง task ใน Release 1
