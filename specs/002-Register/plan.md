# แผนงานสำหรับ Feature: สมัครสมาชิก / เข้าสู่ระบบ (Register & Login)

## 1. ขอบเขตและสถานะของแผน

ฟีเจอร์นี้เป็น Frontend Prototype ของ UC-02 ตาม `SPEC-ACCOUNT-001` โดยใช้
HTML, CSS และ JavaScript แบบเดิมของ Repo ร่วมกับ Mock Data ในหน่วยความจำของ
browser เท่านั้น ไม่มี backend, API จริง, React, Vite, FastAPI หรือฐานข้อมูลจริง

Prototype นี้จำลองเฉพาะพฤติกรรมที่ตรวจได้จาก Acceptance Criteria:

- สมัครสมาชิกด้วย Email หรือเบอร์โทรศัพท์อย่างน้อยหนึ่งช่องและรหัสผ่านที่ไม่ว่าง
- ตรวจสอบข้อมูลไม่ครบ/ไม่ถูกต้องและข้อมูลซ้ำก่อนเพิ่มบัญชีจำลอง
- เข้าสู่ระบบด้วย Email หรือเบอร์โทรศัพท์และรหัสผ่านของบัญชีจำลอง
- แสดงข้อความเมื่อเข้าสู่ระบบไม่สำเร็จ
- ข้ามขั้นตอน LINE ได้ และจำลองผลสำเร็จ/ล้มเหลวของการเชื่อมต่อ LINE
- เมื่อเชื่อมต่อสำเร็จ ให้เก็บ Mock LINE User ID `mock-line-user-001`
  ใน Browser Memory และผูกกับบัญชีที่ Login/Register สำเร็จเท่านั้น
- เมื่อเชื่อมต่อล้มเหลว ห้ามสร้างความสัมพันธ์ใหม่กับ LINE และต้องใช้งาน Prototype ต่อได้

การสมัครสมาชิกและการเข้าสู่ระบบในแผนนี้ **ไม่ใช่ Authentication จริง**:
ข้อมูลบัญชีอยู่ในตัวแปร JavaScript ระหว่างการเปิดหน้านี้เท่านั้น ไม่มีการส่งข้อมูล
ออกจาก browser ไม่มีการสร้าง session/token จริง และไม่ใช้แทนระบบ production

ทีมยืนยัน Q-01 แล้วว่า Release นี้ใช้ Mock LINE Connection เท่านั้น
โดยไม่สร้าง OAuth/callback หรือเรียก LINE API จริง ส่วนการยกเลิกและการเปลี่ยนบัญชี LINE
ตาม Q-02 และ Q-03 เลื่อนไป Release ถัดไป

## 2. เทคโนโลยีและโครงสร้างที่ใช้จริง

| ส่วน | เทคโนโลยี/ตำแหน่ง | การใช้งานใน Prototype |
|---|---|---|
| หน้า account | HTML ใน `features/account/index.html` | แสดงฟอร์ม login/register และส่วนเลือกเชื่อมต่อหรือข้าม LINE ในหน้าเดียว |
| พฤติกรรม account | Vanilla JavaScript ใน `features/account/account.js` | จัดการ event, validation, mock accounts, duplicate check และข้อความผลลัพธ์ |
| รูปแบบหน้า | CSS กลางใน `shared/styles.css` | ใช้ style ที่มีอยู่แล้วโดยไม่สร้าง framework หรือไฟล์ style ซ้ำใน feature |
| ข้อมูลทดสอบ | Mock Data ใน `features/account/account.js` | เก็บบัญชีตัวอย่างและบัญชีที่สมัครระหว่างการเปิดหน้านี้ใน memory เท่านั้น |
| การตรวจสอบ | Node.js test ที่ `tests/` ตาม runner ที่ Repo มีอยู่ | ตรวจ source/markup และพฤติกรรม prototype เท่าที่ทำได้โดยไม่เพิ่ม backend |

ไม่ใช้และไม่สร้างในงานนี้:

- `frontend/src/`, React, Vite หรือ `frontend/src/api/client.js`
- `backend/`, FastAPI, `main.py` หรือ REST endpoint
- PostgreSQL, migration, schema จริง หรือฐานข้อมูลถาวร
- JWT, session จริง หรือระบบ Authentication จริง
- LINE Login, LINE OAuth, callback webhook หรือการเรียกบริการ LINE จริง

ไฟล์ที่เกี่ยวข้องกับฟีเจอร์นี้มีเฉพาะ:

- `features/account/index.html`
- `features/account/account.js`
- `shared/styles.css` เฉพาะเมื่อจำเป็นต้องใช้ style ที่เกี่ยวข้องกับหน้า account
- `tests/AC-ACCOUNT-*.test.cjs` หรือไฟล์ test ของ account ที่ทีมสร้างภายหลัง

ห้ามแก้ feature อื่นและห้ามแก้ `shared/index.html` หากไม่จำเป็นต่อ UC-02

## 3. การออกแบบ Mock Data และข้อจำกัด

ใช้รายการบัญชีจำลองใน `features/account/account.js` โดยมีข้อมูลตัวอย่างขั้นต่ำสำหรับ
ลอง login และเพิ่มบัญชีระหว่างการเปิดหน้า:

- ตัวระบุบัญชี: `email` หรือ `phone`
- รหัสผ่าน: ใช้เฉพาะเพื่อจำลองการเปรียบเทียบภายใน browser
- ไม่บันทึกข้อมูลลงไฟล์, localStorage, cookie, server หรือฐานข้อมูล

การมี password ใน Mock Data มีไว้เพื่อจำลอง AC เท่านั้น ไม่ใช่การจัดเก็บ password
ของระบบจริง และต้องแสดงสถานะต้นแบบให้ผู้ใช้ทราบตามข้อความในหน้า account

การตรวจสอบจำลองต้องรักษาพฤติกรรมตาม spec:

- Register ต้องมี Email หรือเบอร์โทรศัพท์อย่างน้อยหนึ่งช่อง และ password ไม่ว่าง
- Email ที่กรอกต้องผ่าน native HTML email validation ที่มีอยู่
- Email หรือเบอร์โทรศัพท์ซ้ำต้องไม่เพิ่มบัญชีและแสดง
  “อีเมล/เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว”
- Login ที่ identifier หรือ password ว่าง/ไม่ตรงบัญชีต้องไม่สำเร็จและแสดง
  “กรุณากรอกข้อมูลให้ถูกต้อง”
- การสมัครสำเร็จต้องแสดงว่าสามารถเข้าสู่ระบบได้ทันทีใน prototype

## 4. หน้าจอและ Flow

### 4.1 หน้า account

`features/account/index.html` เป็นหน้าเดียวสำหรับ FR-02:

- ส่วน login อยู่ด้านบน/ด้านซ้ายตาม layout ปัจจุบัน พร้อมปุ่มเข้าสู่ระบบ
- ส่วน register อยู่ด้านล่าง/ด้านขวาตาม layout ปัจจุบัน พร้อมปุ่มสร้างบัญชี
- ใช้ `../../shared/styles.css`
- โหลด `account.js` ด้วย script ของหน้า Account
- แสดงข้อความว่าเป็น Prototype และไม่เชื่อมระบบบัญชีจริง

### 4.2 Register Flow

เมื่อ submit `#register-form` ใน `features/account/account.js`:

1. อ่าน Email, เบอร์โทรศัพท์ และ password จาก form
2. ตรวจว่ามี Email หรือเบอร์โทรศัพท์อย่างน้อยหนึ่งช่อง, password ไม่ว่าง และ Email
   ผ่าน native validation
3. ตรวจ Email/เบอร์โทรศัพท์ซ้ำใน Mock Data
4. ถ้าไม่ซ้ำ เพิ่มบัญชีลงใน memory และแสดงสถานะสมัครสำเร็จ
5. เปิดส่วนต่อเนื่องของ account flow เพื่อให้ลอง login หรือเลือกขั้นตอน LINE

Flow นี้รองรับ FR-01, FR-02, FR-04 และ AC-ACCOUNT-01 โดยเป็นการจำลองใน browser

### 4.3 Login Flow

เมื่อ submit `#login-form`:

1. อ่าน identifier และ password
2. ค้นหา Email หรือเบอร์โทรศัพท์ที่ตรงกับ Mock Data
3. ถ้าไม่พบหรือข้อมูลว่าง ให้คงสถานะไม่ login และแสดงข้อความตาม FR-04
4. ถ้าพบ ให้แสดงสถานะ login สำเร็จในหน้า prototype และเปิด flow ต่อเนื่อง

Flow นี้รองรับ FR-02, FR-03, FR-04, NFR-SEC-01 และ AC-ACCOUNT-02 ถึง
AC-ACCOUNT-03 ในขอบเขตที่เป็นการจำลองหน้าจอ ไม่ใช่การคุ้มครองข้อมูลจริง

### 4.4 LINE Flow

ส่วน `#line-panel` เป็นทางเลือกตาม FR-05 และ Alternative Flow 7a/7b:

- ปุ่มเชื่อมต่อสำเร็จและปุ่มเชื่อมต่อล้มเหลวเป็นการจำลองผลลัพธ์เท่านั้น
- ปุ่มข้ามต้องปิด/จบขั้นตอน LINE และให้ผู้ใช้ใช้ prototype ต่อได้
- ห้ามระบุหรือสมมติว่าใช้ LINE Login, OAuth หรือ callback รูปแบบใด
- Mock LINE User ID ใช้ค่า `mock-line-user-001` เฉพาะใน Browser Memory
- ห้ามอ้างว่ามีการบันทึก LINE User ID จริง
- การเชื่อมต่อสำเร็จต้องผูกกับบัญชีที่ Login/Register สำเร็จเท่านั้น
- การเชื่อมต่อล้มเหลวต้องไม่สร้างความสัมพันธ์ใหม่กับ LINE

งานที่เกี่ยวข้องกับรูปแบบการเชื่อมต่อจริงไม่อยู่ใน Release นี้
ส่วนการยกเลิกการเชื่อมต่อและการเปลี่ยนบัญชี LINE ถูกเลื่อนไป Release ถัดไป:

| Open Question | งานที่เกี่ยวข้อง | สถานะ |
|---|---|---|
| Q-01 รูปแบบการเชื่อมบัญชี LINE | ใช้ Mock LINE Connection และ Mock LINE User ID `mock-line-user-001` ใน Browser Memory | ตอบแล้ว |
| Q-02 การยกเลิกการเชื่อมต่อ LINE | ไม่รองรับใน Release นี้ | เลื่อน Release ถัดไป |
| Q-03 การเปลี่ยนบัญชี LINE | ไม่รองรับใน Release นี้ | เลื่อน Release ถัดไป |

## 5. การรองรับ Requirements และ Constraints

| รายการ | ตำแหน่ง/วิธีจำลอง |
|---|---|
| FR-01 | `#register-form` และ validation ใน `features/account/account.js` |
| FR-02 | หน้าเดียวใน `features/account/index.html` มี login และ register |
| FR-03 | การค้นหา Mock Data ด้วย Email หรือเบอร์โทรศัพท์ใน `account.js` |
| FR-04 | ข้อความ error ของ login และ duplicate register ใน `account.js` |
| FR-05 | ส่วน `#line-panel` และปุ่มเชื่อมต่อ/ข้ามแบบจำลอง |
| FR-06 | เก็บ Mock LINE User ID `mock-line-user-001` ใน Browser Memory และผูกกับบัญชีที่ Login/Register สำเร็จ; ไม่ใช่การเชื่อมต่อจริง |
| NFR-SEC-01 | จำกัดการแสดงสถานะข้อมูล account ไว้หลัง flow login/register ในหน้า prototype; ไม่อ้างว่าเป็น security จริง |
| NFR-REL-01 | จำลอง LINE failure แล้วให้ flow account ใช้งานต่อได้ |
| NFR-USE-01 | จัดวางขั้นตอน login, register และ LINE ให้เห็นชัดในหน้าเดียว |
| Constraint: เข้าถึงหน้าสมัคร/login ได้ | เปิด `features/account/index.html` |
| Constraint: identifier ไม่ซ้ำ | duplicate check ใน `account.js` |
| Constraint: Email หรือ phone อย่างน้อยหนึ่งช่อง | register validation ใน `account.js` |
| Constraint: password ไม่ว่าง | register/login validation ใน `account.js` |
| Constraint: LINE เป็นทางเลือก | ปุ่ม skip และ failure ไม่ขัดขวาง flow หลัก |
| Constraint: ไม่เก็บ Password ของบัญชี LINE | ไม่มี field หรือ Mock Data สำหรับ LINE password |
| Constraint: เชื่อมโยง LINE User ID | ผูก Mock LINE User ID `mock-line-user-001` กับบัญชีที่ Login/Register สำเร็จใน Browser Memory |
| Constraint: ข้อมูลส่วนบุคคลต้อง login ก่อน | แสดงผล account หลัง flow สำเร็จใน prototype เท่านั้น; ไม่มี protected endpoint จริง |

## 6. แผนการทดสอบ

ใช้ test runner และรูปแบบที่มีอยู่ใน Repo โดยไม่เพิ่ม framework ใหม่:

| AC ID | ชื่อ test | ขอบเขตการตรวจ |
|---|---|---|
| AC-ACCOUNT-01 | `test_AC_ACCOUNT_01_register_success` | ตรวจหน้า register และจำลองการเพิ่มบัญชีที่มี Email/phone กับ password ถูกต้อง |
| AC-ACCOUNT-02 | `test_AC_ACCOUNT_02_login_success` | ตรวจ Mock Data และจำลอง login ด้วยข้อมูลที่ถูกต้อง |
| AC-ACCOUNT-03 | `test_AC_ACCOUNT_03_login_invalid_input` | จำลองข้อมูลว่าง/ไม่ตรงและตรวจข้อความ “กรุณากรอกข้อมูลให้ถูกต้อง” |
| AC-ACCOUNT-04 | `test_AC_ACCOUNT_04_line_connect_success` | ตรวจ Mock LINE Connection success, สถานะ UI และ Mock LINE User ID ใน Browser Memory; ไม่ใช่การทดสอบ LINE จริง |
| AC-ACCOUNT-05 | `test_AC_ACCOUNT_05_skip_line_connection` | จำลองการกดข้ามและตรวจว่ายังใช้ prototype ต่อได้ |
| AC-ACCOUNT-06 | `test_AC_ACCOUNT_06_line_connect_failure` | จำลองความล้มเหลว ไม่สร้างความสัมพันธ์ใหม่ และตรวจว่าไม่ขัดขวางการใช้งานต่อ |

การทดสอบต้องไม่ตรวจหรืออ้างว่ามี API, session/token, database หรือ Authentication
จริง และต้องไม่แก้ test ของ feature อื่น

## 7. ลำดับการทำงาน

1. ตรวจ markup และข้อความ trace ใน `features/account/index.html` ให้ครอบคลุม FR/AC
2. ตรวจหรือปรับ validation, duplicate check และ mock login ใน
   `features/account/account.js`
3. ตรวจ Mock LINE Connection success/failure, การผูก Mock LINE User ID กับบัญชีที่สำเร็จ และไม่ให้ failure ขัดขวาง flow หลัก
4. เขียน/ปรับเฉพาะ test ของ account ใน `tests/` ตาม AC ทั้ง 6 ข้อ
5. รัน test ที่เกี่ยวข้องกับ account และตรวจว่า feature อื่นไม่ถูกแก้ไข

## 8. สิ่งที่ยังไม่ทำ

- ไม่สร้างระบบสมัครสมาชิกหรือ login จริง
- ไม่สร้าง backend, API, React, Vite, FastAPI หรือฐานข้อมูล
- ไม่สร้างการเข้ารหัส password หรือระบบ session จริง เพราะอยู่นอกขอบเขต Frontend Prototype นี้
- ไม่สร้าง LINE OAuth/Login, callback หรือการเชื่อมต่อบริการ LINE จริง
- ไม่สร้างการยกเลิกหรือเปลี่ยนบัญชี LINE ใน Release นี้ตาม Q-02 และ Q-03
- ไม่ทำการยกเลิกการเชื่อมต่อหรือเปลี่ยนบัญชี LINE ใน Release นี้
- ไม่ทำการจัดการข้อมูลส่วนตัวหลัง login, เปลี่ยน password หรือ LINE notification service
- ไม่แก้ไข Feature ของสมาชิกคนอื่น

สรุป: แผนนี้ใช้เฉพาะ HTML, CSS และ JavaScript ที่มีอยู่ใน Repo โดยให้
`features/account/` เป็นหน้าและ logic ของ UC-02 และใช้ `shared/styles.css` เป็น
style กลาง การทำงานทั้งหมดเป็น Mock Data/Frontend Prototype และส่วน LINE ที่ติด
Q-01 ถึง Q-03 ได้รับคำตอบจากทีมแล้ว: Q-01 ใช้ Mock LINE Connection ใน Release นี้
ส่วน Q-02 และ Q-03 เลื่อนไป Release ถัดไป
