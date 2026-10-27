# แผนงานสำหรับ Feature: สมัครสมาชิก / เข้าสู่ระบบ (Register & Login)

## 1. สรุปแนวทาง
- Release 1 พัฒนาด้วย React + Vite ใน `frontend/src/` โดยใช้ React State
  และ Mock Data ในหน่วยความจำระหว่างเปิดหน้า Prototype
- ฟีเจอร์นี้จะสร้างหน้าเดียวสำหรับลูกค้าในการสมัครสมาชิกและเข้าสู่ระบบ โดยมีฟอร์ม login ด้านบนและปุ่มสมัครสมาชิกด้านล่าง ตาม FR-02 และ NFR-USE-01
- ระบบจะตรวจสอบข้อมูล Email หรือเบอร์โทรศัพท์ + รหัสผ่าน ก่อนสร้างบัญชีหรืออนุญาตให้เข้าสู่ระบบ ตาม FR-01, FR-03, FR-04
- ระบบจะเก็บข้อมูลบัญชีพื้นฐานและตรวจสอบข้อมูลซ้ำก่อนยอมให้สมัครใหม่ เพื่อป้องกันการสร้างบัญชีซ้ำตาม FR-01, FR-02, FR-04
- ระบบจะมีทางเลือก Mock LINE Connection แบบไม่บังคับ โดย React State จำลองผลสำเร็จ
  ผลล้มเหลว และการข้าม ใช้ Mock LINE User ID `mock-line-user-001`
  และให้ผู้ใช้ข้ามได้ตาม FR-05, FR-06 และ Alternative Flow 7a/7b
- Release 1 ไม่สร้าง API, Backend, Database, JWT หรือ session จริง
  การ Auto-login เป็นสถานะใน React State เท่านั้น

## 2. เทคโนโลยีที่ใช้

| สิ่งที่เลือก | มาจาก | หมายเหตุ |
|---|---|---|
| React + Vite สำหรับหน้าเว็บ | ข้อสรุปของทีมสำหรับ Release 1 | ใช้พัฒนาใน `frontend/src/` และจัดการ UI/React State ของ Login, Register และ Mock LINE |
| Python FastAPI สำหรับ API | ข้อเสนอเดิมของทีม ไม่ใช่ Release 1 | ต้องยืนยันและจัดเป็นงาน Release ถัดไป หากมี Requirement รองรับ; ยังไม่สร้าง |
| ฐานข้อมูลเชิงสัมพันธ์ (เช่น PostgreSQL) | ข้อเสนอเดิมของทีม ไม่ใช่ Release 1 | ต้องยืนยันและจัดเป็นงาน Release ถัดไป; Release 1 ใช้ Mock Data ในหน่วยความจำ |
| JWT หรือ session-based auth | ข้อเสนอเดิมของทีม ไม่ใช่ Release 1 | Auto-login ของ Release 1 ใช้ React State เท่านั้น; JWT/session จริงต้องยืนยันเพิ่มเติม |
| Mock LINE Connection ด้วย React State | คำตอบ Q-01 ของทีม | จำลอง success/failure/skip และใช้ `mock-line-user-001` ในหน่วยความจำ โดยไม่ใช้ LINE API/OAuth/callback |

## 3. โมเดลข้อมูล

โมเดลในตารางนี้เป็นข้อเสนอสำหรับระบบจริง/Release ถัดไป ไม่ใช่สิ่งที่ต้องสร้างใน
Release 1 ซึ่งใช้ React State และ Mock Data ในหน่วยความจำเท่านั้น

| Entity | ฟิลด์หลัก | รองรับ FR / NFR |
|---|---|---|
| Account | `account_id`, `email`, `phone_number`, `password_hash`, `is_verified`, `created_at`, `updated_at` | รองรับ FR-01, FR-02, FR-03, FR-04, NFR-SEC-01 |
| AccountLinkLine | `account_id`, `line_user_id`, `connected_at`, `status` | รองรับ FR-05, FR-06, Alternative Flow 7a, Exception Flow 7c, NFR-REL-01 |
| AuthSession | `session_id`, `account_id`, `issued_at`, `expires_at` | รองรับ FR-03, NFR-SEC-01 |

หมายเหตุโมเดลข้อมูล:
- ผู้ใช้สามารถกรอก Email หรือเบอร์โทรศัพท์อย่างน้อยหนึ่งช่อง โดยไม่จำเป็นต้องกรอกทั้งคู่ ตาม Constraint ใน spec
- ระบบจะเก็บ hash ของ password เท่านั้น และไม่เก็บ Password ของบัญชี LINE ตาม Constraint
- `line_user_id` จะเป็นค่าว่างหรือ null จนกว่าจะเชื่อมต่อ LINE สำเร็จ ตาม FR-05, FR-06 และ Exception Flow 7c
- ข้อมูลส่วนบุคคลที่เกี่ยวกับบัญชี เช่น ชื่อ อีเมล เบอร์โทรศัพท์ จะเข้าถึงได้เฉพาะหลัง login ตาม NFR-SEC-01

## 4. API / หน้าจอ

ส่วน API ด้านล่างเป็นข้อเสนอเดิมสำหรับระบบจริงหรือ Release ถัดไป
ไม่ใช่ขอบเขตการ Implement ของ Release 1 และยังต้องยืนยัน Requirement/Constraints
ก่อนสร้าง

- `GET /auth` — แสดงหน้า login/signup เดียวกัน พร้อมฟอร์ม login ด้านบนและปุ่มสมัครสมาชิกด้านล่าง — รองรับ FR-02, NFR-USE-01
- `POST /api/auth/register` — Input: `email?`, `phone_number?`, `password`; Output: created account / validation error / duplicate error — รองรับ FR-01, FR-02, FR-04, AC-ACCOUNT-01
- `POST /api/auth/login` — Input: `email_or_phone`, `password`; Output: session token หรือ redirect หลัง login สำเร็จ / error message — รองรับ FR-03, FR-04, AC-ACCOUNT-02, AC-ACCOUNT-03
- `POST /api/auth/line/connect` — Input: `account_id`, `line_user_id`; Output: success/failure result และไม่บันทึกเมื่อล้มเหลว — รองรับ FR-05, FR-06, Alternative Flow 7a, AC-ACCOUNT-04, AC-ACCOUNT-06
- `POST /api/auth/line/skip` — Input: `account_id`; Output: continue without line connection — รองรับ Alternative Flow 7b, AC-ACCOUNT-05
- `GET /api/account/profile` หรือ protected endpoint — Output: ข้อมูลบัญชีพื้นฐานหลัง login เท่านั้น — รองรับ NFR-SEC-01

## 5. ตารางตรวจ Constraints

| Constraint ID | ถูกนำไปใช้ที่ไหนใน plan | สถานะ |
|---|---|---|
| ไม่ระบุ ID ใน spec — ลูกค้าต้องสามารถเข้าถึงหน้าสมัครสมาชิกหรือเข้าสู่ระบบได้ | ใช้ในหน้าจอ `GET /auth` และ flow ของ login/register ในหน้าเดียว | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — Email หรือเบอร์โทรศัพท์ต้องไม่ซ้ำกับบัญชีที่มีอยู่ในระบบ | ใช้ใน validation ของ `POST /api/auth/register` และ duplicate-check logic | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — ผู้ใช้สามารถกรอก Email หรือเบอร์โทรศัพท์อย่างน้อยหนึ่งช่อง โดยไม่จำเป็นต้องกรอกทั้งคู่ | ใช้ใน validation สำหรับ input ของ register/login และ error handling | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — Password ต้องเป็นไปตามเงื่อนไขที่ระบบกำหนด โดยข้อมูลที่ไม่ว่างถือว่าเป็นข้อมูลที่ถูกต้องสำหรับการเข้าสู่ระบบ | ใช้ใน register/login validator และ message “กรุณากรอกข้อมูลให้ถูกต้อง” | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — การเชื่อมต่อ LINE เป็นทางเลือก ไม่บังคับต่อการสมัครสมาชิกหรือเข้าสู่ระบบ | ใช้ใน `POST /api/auth/line/connect` และ `POST /api/auth/line/skip` | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — ระบบต้องไม่จัดเก็บ Password ของบัญชี LINE | ใช้ใน model `AccountLinkLine` ให้มีเฉพาะ `line_user_id` และไม่มี password field | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — ระบบต้องสามารถเชื่อมโยง LINE User ID กับบัญชีลูกค้าได้อย่างถูกต้อง | ใช้ใน `AccountLinkLine` และ API connect flow พร้อมตรวจสอบ account_id + line_user_id | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — ข้อมูลส่วนบุคคลที่เกี่ยวกับบัญชี เช่น ชื่อ อีเมล เบอร์โทรศัพท์ ต้องมีการ login ก่อนถึงจะเข้าถึงได้ | ใช้ใน protected endpoint และ auth guard สำหรับ `/api/account/profile` | ใช้แล้ว |

## 6. แผนทดสอบจาก Acceptance Criteria

| AC ID | ชื่อ test | ทดสอบอย่างไร |
|---|---|---|
| AC-ACCOUNT-01 | `test_AC_ACCOUNT_01_register_success` | โจมตี API `POST /api/auth/register` ด้วย email/phone + password ที่ถูกต้อง แล้วตรวจว่าควรสร้างบัญชีและคืน session/token ให้ผู้ใช้เข้าสู่ระบบได้ |
| AC-ACCOUNT-02 | `test_AC_ACCOUNT_02_login_success` | เข้าสู่ระบบด้วยบัญชีที่มีอยู่และข้อมูลถูกต้อง แล้วตรวจว่าระบบอนุญาต login ได้ |
| AC-ACCOUNT-03 | `test_AC_ACCOUNT_03_login_invalid_input` | ส่งข้อมูล login ที่ไม่ถูกต้องหรือว่าง แล้วตรวจว่าระบบปฏิเสธและแสดงข้อความ “กรุณากรอกข้อมูลให้ถูกต้อง” |
| AC-ACCOUNT-04 | `test_AC_ACCOUNT_04_line_connect_success` | เลือกเชื่อมต่อ LINE ให้ callback สำเร็จ แล้วตรวจว่ามีการบันทึก `line_user_id` ผูกกับบัญชีที่ login อยู่ |
| AC-ACCOUNT-05 | `test_AC_ACCOUNT_05_skip_line_connection` | เลือกข้ามขั้นตอน LINE แล้วตรวจว่าระบบให้ใช้งานต่อได้ตามปกติ โดยไม่ติดการเชื่อมต่อ |
| AC-ACCOUNT-06 | `test_AC_ACCOUNT_06_line_connect_failure` | จำลอง LINE connect ล้มเหลว แล้วตรวจว่าระบบไม่บันทึก `line_user_id` และผู้ใช้ยังคงใช้งานได้ต่อ |

## 7. ลำดับงาน

1. วิเคราะห์และกำหนดรูปแบบ validation สำหรับ Email/เบอร์โทรศัพท์/รหัสผ่าน และการตรวจข้อมูลซ้ำ ตาม FR-01, FR-03, FR-04
2. สร้างหน้า login/signup แบบหน้าเดียว พร้อมฟอร์มและข้อความแจ้งเตือนตาม FR-02 และ NFR-USE-01
3. สร้าง API สมัครสมาชิกและตรวจสอบ duplicate check ตาม FR-01, FR-02, AC-ACCOUNT-01
4. สร้าง API เข้าสู่ระบบ พร้อม error handling และ session/token ตาม FR-03, FR-04, AC-ACCOUNT-02, AC-ACCOUNT-03
5. เพิ่ม auth guard และ protected resource สำหรับข้อมูลบัญชีพื้นฐาน ตาม NFR-SEC-01
6. สร้าง flow เชื่อมต่อ LINE แบบ optional และ skip flow ตาม FR-05, FR-06, Alternative Flow 7a/7b, AC-ACCOUNT-04, AC-ACCOUNT-05, AC-ACCOUNT-06
7. ทดสอบ end-to-end กับทุก Acceptance Criteria และตรวจความสอดคล้องกับ Open Questions โดยไม่สร้างฟังก์ชันนอก scope

## 8. สิ่งที่ยังไม่ทำ

- Release 1 ไม่สร้าง LINE Login, LINE OAuth หรือ callback จริง เพราะ Q-01
  ปิดด้วย Mock LINE Connection ใน React State แล้ว
- การยกเลิกการเชื่อมต่อ LINE เลื่อนไป Release 2 ตาม Q-02
- การเปลี่ยนบัญชี LINE เลื่อนไป Release 2 ตาม Q-03
- FastAPI, Database, JWT/session และ API เป็นข้อเสนอสำหรับระบบจริงหรือ Release ถัดไป
  ต้องยืนยัน Requirement/Constraints ก่อน จึงยังไม่สร้างใน Release 1

---

สรุป: Release 1 จะสร้างหน้า React + Vite สำหรับสมัคร/เข้าสู่ระบบแบบหน้าเดียว,
validation และ duplicate-check สำหรับ Mock Data, Auto-login ใน React State,
และ Mock LINE Connection แบบเสริมที่ไม่กระทบต่อการสมัครหรือ login หลัก ตาม spec.md
โดยไม่สร้าง Backend, API, Database, JWT/session หรือ LINE API จริง
