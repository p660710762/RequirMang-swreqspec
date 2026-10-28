# แผนงานสำหรับ Feature: รับแจ้งเตือนเครื่องดื่มพร้อมรับ (Order Ready Notification)

## 1. สรุปแนวทาง
- ฟีเจอร์นี้จะตรวจสอบเมื่อ Order เปลี่ยนสถานะเป็น “พร้อมรับสินค้า” และตรวจสอบว่าเป้าหมายมี LINE User ID ที่ถูกต้องก่อนส่งข้อความตาม FR-19 และ FR-20
- ผู้ใช้หลักคือ ลูกค้า / นักศึกษา ที่เคยเชื่อมต่อบัญชี LINE กับระบบแล้ว และต้องได้รับแจ้งเตือนเมื่อเครื่องดื่มพร้อมรับสินค้า ตาม FR-21 และ AC-NOTIFICATION-01
- ระบบจะส่งข้อความผ่าน LINE Notification Service แบบสั้น ๆ ตามรูปแบบ “Order 123 พร้อมรับสินค้า” และบันทึกผลการส่งว่า สำเร็จ หรือไม่สำเร็จ ตาม FR-21 และ FR-22
- หาก LINE User ID ว่างหรือไม่ถูกต้อง ระบบจะไม่ส่งแจ้งเตือนย้อนหลังอัตโนมัติ แม้ลูกค้าจะเชื่อมต่อ LINE ภายหลังและ Order ยังคงเป็น “พร้อมรับสินค้า” ตาม clarifying decision ที่ถูกบันทึกใน spec v2
- หาก LINE Notification Service ส่งไม่สำเร็จ ระบบจะบันทึกว่า failed โดยไม่ retry อัตโนมัติทันที และไม่เปลี่ยนสถานะ Order ตาม FR-22, Exception Flow 4a และ NFR-REL-01
- การส่งซ้ำจะใช้ `order_id` เป็น idempotency key และอนุญาตเฉพาะกรณี failed เท่านั้น ตาม FR-23 และ AC-NOTIFICATION-04
- แผนนี้จะไม่สร้างการสมัครสมาชิก การเชื่อมต่อบัญชี LINE การอัปเดตสถานะ Order หรือการส่งโปรโมชั่นทั่วไป เพราะกำหนดไว้ใน Out of scope และ spec ระบุชัดว่าฟีเจอร์นี้รับผิดชอบเฉพาะการแจ้งเตือนเมื่อ Order พร้อมรับสินค้าเท่านั้น

## 2. เทคโนโลยีที่ใช้

| สิ่งที่เลือก | มาจาก | หมายเหตุ |
|---|---|---|
| React (Vite) สำหรับหน้าตรวจสอบสถานะส่งแจ้งเตือน/ผลการส่ง | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้แสดงสถานะการส่งแจ้งเตือน และผลลัพธ์สำหรับผู้ดูแล/ทีมงานหากมีหน้า monitoring ในอนาคต |
| Python FastAPI สำหรับ API ตรวจสอบสถานะ Order และส่งข้อความ LINE | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้เป็นชั้น orchestration สำหรับตรวจสอบ Order, ตรวจสอบ LINE User ID, และเรียก LINE Notification Service |
| LINE Notification Service | ทีมเลือกเอง ไม่ได้มาจาก spec | spec ระบุว่าต้องส่งผ่าน LINE Notification Service แต่ไม่ได้ระบุ vendor หรือ SDK ที่แน่นอน จึงยังคงใช้แนวทางสากรณทั่วไปตาม spec |
| ฐานข้อมูลเชิงสัมพันธ์ (เช่น PostgreSQL) | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้เก็บข้อความแจ้งเตือน, Order status, LINE User ID reference, และผลการส่งแบบ idempotent |
| Notification delivery log + idempotency key | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้รับประกันว่ามีเพียงหนึ่งข้อความต่อ Order ที่มีสถานะพร้อมรับสินค้าเมื่อส่งสำเร็จแล้ว ตาม FR-23 และ NFR-REL-02 |

## 3. โมเดลข้อมูล

| Entity | ฟิลด์หลัก | รองรับ FR / NFR |
|---|---|---|
| OrderReadyEvent | `order_id`, `status`, `status_changed_at`, `user_id`, `line_user_id` | รองรับ FR-19, FR-20, AC-NOTIFICATION-01, AC-NOTIFICATION-02 |
| NotificationLog | `notification_id`, `order_id`, `line_user_id`, `message_text`, `status`, `sent_at`, `result_code`, `retry_allowed`, `idempotency_key` | รองรับ FR-21, FR-22, FR-23, NFR-REL-02, AC-NOTIFICATION-01, AC-NOTIFICATION-03, AC-NOTIFICATION-04 |
| LineConnection | `user_id`, `line_user_id`, `connected_at`, `is_active` | รองรับ FR-20, Alternative Flow 3a, AC-NOTIFICATION-02 |
| Order | `order_id`, `current_status`, `last_status_change_at` | รองรับ FR-19, FR-23, NFR-REL-01, AC-NOTIFICATION-03 |

หมายเหตุโมเดลข้อมูล:
- `retry_allowed` จะถูกเก็บเป็นข้อมูลที่ระบุว่าไม่อนุญาตให้ retry อัตโนมัติทันทีหลัง failed เนื่องจาก spec v2 ระบุชัดว่า “ไม่ retry อัตโนมัติทันที” และ “บันทึกผลล้มเหลวโดยไม่เปลี่ยนสถานะ Order”
- `idempotency_key` จะใช้ `order_id` เพื่อป้องกันการส่งซ้ำเมื่อส่งสำเร็จแล้ว และให้ retry ได้เฉพาะกรณีที่ status เป็น failed เท่านั้น
- `line_user_id` จะถูกเก็บเป็นข้อมูลของการเชื่อมต่อ LINE และอาจเป็น NULL หรือว่างได้ หากลูกค้ายังไม่ได้เชื่อมต่อ LINE ตาม FR-20 และ Alternative Flow 3a
- `status` ของ NotificationLog จะมีค่าเป็น `success` หรือ `failed` ตาม FR-22 และ AC-NOTIFICATION-03
- `Order` จะไม่เก็บข้อมูลการส่งแอดมินหรือโปรโมชั่นเพิ่มเติม เนื่องจาก Out of scope

## 4. API / หน้าจอ

- `POST /api/notifications/dispatch-ready-order` — Input: `order_id`; Output: `dispatch_result`, `line_user_id_checked`, `message_sent` — รองรับ FR-19, FR-20, AC-NOTIFICATION-01, AC-NOTIFICATION-02
- `POST /api/notifications/send` — Input: `order_id`, `line_user_id`, `message_text`; Output: `success|failed`, `notification_id`, `result_code` — รองรับ FR-21, FR-22, AC-NOTIFICATION-01, AC-NOTIFICATION-03
- `GET /api/notifications/{order_id}/status` — Output: last send status, retry flag, result summary — รองรับ FR-22, FR-23, NFR-REL-02, AC-NOTIFICATION-03, AC-NOTIFICATION-04
- `POST /api/notifications/callback` — Input: LINE response payload; Output: `success|failed` และ log บันทึกผล — รองรับ FR-22, Exception Flow 4a, AC-NOTIFICATION-03
- `GET /notifications` — Output: หน้าควบคุม/ตรวจสอบสถานะการส่งแจ้งเตือน (ถ้ามี UI สำหรับตรวจสอบ) — รองรับ NFR-REL-02, ไม่บังคับสอดคล้องกับ scope แต่ถูกใช้เพื่อ monitor หากทีมเลือกสร้าง UI

## 5. ตารางตรวจ Constraints

| Constraint ID | ถูกนำไปใช้ที่ไหนใน plan | สถานะ |
|---|---|---|
| ไม่ระบุ ID ใน spec — Order ต้องมีสถานะ “พร้อมรับสินค้า” ก่อนเริ่มการแจ้งเตือน | ใช้ใน `POST /api/notifications/dispatch-ready-order` และ validation ของ `Order.status` ก่อนส่งข้อความ | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — ลูกค้าต้องเชื่อมต่อบัญชีกับ LINE และมี LINE User ID หากต้องการรับแจ้งเตือน | ใช้ใน `LineConnection` validation และ guard ก่อนส่ง LINE message | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — ระบบต้องส่งแจ้งเตือนเพียงครั้งเดียวต่อ Order ที่มีสถานะ “พร้อมรับสินค้า” เมื่อส่งสำเร็จแล้ว | ใช้ใน `NotificationLog` + idempotency check และ `GET /api/notifications/{order_id}/status` | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — หาก LINE Notification Service ไม่สามารถส่งข้อความได้ ต้องไม่เปลี่ยนสถานะ Order | ใช้ใน callback/error handling และ logic ที่ไม่ปรับปรุง `Order.current_status` เมื่อส่งไม่สำเร็จ | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — การส่งซ้ำอนุญาตเฉพาะกรณีส่งไม่สำเร็จเท่านั้น ไม่ใช่กรณีส่งสำเร็จแล้ว | ใช้ใน `retry_allowed` และ `NotificationLog` เพื่อป้องกัน retry อัตโนมัติเมื่อส่งสำเร็จแล้ว | ใช้แล้ว |

## 6. แผนทดสอบจาก Acceptance Criteria

| AC ID | ชื่อ test | ทดสอบอย่างไร |
|---|---|---|
| AC-NOTIFICATION-01 | `test_AC_NOTIFICATION_01_send_line_when_ready_and_linked` | สร้าง Order ที่สถานะเป็น “พร้อมรับสินค้า” และมี LINE User ID ถูกต้อง แล้วตรวจสอบว่าระบบส่งข้อความผ่าน LINE Notification Service และมีหมายเลข Order ในข้อความ |
| AC-NOTIFICATION-02 | `test_AC_NOTIFICATION_02_do_not_send_when_line_not_connected` | สร้าง Order ที่สถานะเป็น “พร้อมรับสินค้า” แต่ไม่มี LINE User ID หรือเป็นค่าว่าง แล้วตรวจสอบว่าไม่มีข้อความถูกส่งและสถานะ Order ยังคงเป็น “พร้อมรับสินค้า” |
| AC-NOTIFICATION-03 | `test_AC_NOTIFICATION_03_record_failed_delivery_without_changing_status` | จำลอง LINE Notification Service ส่งไม่สำเร็จ แล้วตรวจสอบว่าระบบบันทึกผลการส่งเป็นไม่สำเร็จและไม่เปลี่ยนสถานะ Order จาก “พร้อมรับสินค้า” |
| AC-NOTIFICATION-04 | `test_AC_NOTIFICATION_04_prevent_duplicate_delivery` | จำลอง Order เดิมที่เคยส่งสำเร็จแล้ว ทำให้ระบบตรวจพบเหตุการณ์แจ้งเตือนซ้ำ แล้วตรวจสอบว่าระบบไม่ส่งข้อความซ้ำ |

## 7. ลำดับงาน

1. กำหนด schema สำหรับ `OrderReadyEvent`, `NotificationLog`, และ `LineConnection` ตาม FR-19, FR-20, FR-21, FR-22 และ NFR-REL-02
2. สร้าง API ตรวจสอบ Order ที่มีสถานะ “พร้อมรับสินค้า” และตรวจสอบการเชื่อมต่อ LINE ก่อนเริ่มแจ้งเตือนตาม FR-19, FR-20 และ AC-NOTIFICATION-01, AC-NOTIFICATION-02
3. สร้าง logic ส่งข้อความผ่าน LINE Notification Service พร้อม payload ที่สั้นและมีหมายเลข Order ตาม FR-21 และ AC-NOTIFICATION-01
4. สร้าง mechanism บันทึกผลการส่งว่า `success` หรือ `failed` และยืนยันว่าไม่เปลี่ยนสถานะ Order เมื่อส่งไม่สำเร็จตาม FR-22, Exception Flow 4a และ AC-NOTIFICATION-03
5. สร้าง idempotency protection เพื่อให้ส่งได้เพียงครั้งเดียวต่อ Order ที่ส่งสำเร็จแล้วตาม FR-23, Alternative Flow 5a และ AC-NOTIFICATION-04
6. ทดสอบ end-to-end สำหรับ Acceptance Criteria ทั้ง 4 ข้อต่อไปด้วยการจำลองสถานะพร้อมรับสินค้า, LINE User ID ว่าง, LINE ส่งไม่สำเร็จ, และ duplicate notification

## 8. ข้อสรุปตาม spec v2 ที่ถูกยืนยันแล้ว

- ข้อความแจ้งเตือนเป็นข้อความสั้น ๆ เช่น “Order 123 พร้อมรับสินค้า” และไม่รวมข้อมูลเพิ่มเติมที่ไม่จำเป็น
- หากส่ง LINE ไม่สำเร็จ ระบบจะบันทึกผลว่า failed เท่านั้น โดยไม่ retry อัตโนมัติทันที และไม่เปลี่ยนสถานะ Order
- หาก LINE User ID ว่างหรือไม่ถูกต้อง ระบบจะไม่ส่งแจ้งเตือนย้อนหลังอัตโนมัติ แม้ลูกค้าจะเชื่อมต่อ LINE ภายหลัง
- การป้องกันการส่งซ้ำใช้ `order_id` เป็น key และอนุญาตให้ retry เฉพาะเมื่อสถานะเป็น failed
- ระบบต้องบันทึกผลการส่งใน Log หรือฐานข้อมูลเพื่อให้ผู้ดูแลตรวจสอบได้

---

สรุป: แผนงานนี้จะสร้างระบบแจ้งเตือนเมื่อ Order เปลี่ยนสถานะเป็น “พร้อมรับสินค้า” โดยยึด FR, NFR, constraints และ AC ของ spec v2 อย่างเคร่งครัด โดยเฉพาะการตรวจสอบ LINE User ID, การป้องกันการส่งซ้ำด้วย `order_id`, การบันทึก failed delivery, และการไม่เปลี่ยนสถานะ Order หากการส่งไม่สำเร็จ
