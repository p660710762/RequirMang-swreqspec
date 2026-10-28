# แผนงานสำหรับ Feature: สั่งเครื่องดื่มออนไลน์ (Online Beverage Ordering)

## 1. สรุปแนวทาง
- ฟีเจอร์นี้จะสร้างกระบวนการเลือกเมนู กำหนดจำนวนและตัวเลือกเครื่องดื่ม แล้วจัดรวมเป็น Order ก่อนยืนยันคำสั่งซื้อ ตาม FR-06, FR-07, FR-08 และ FR-09
- ผู้ใช้หลักคือ นักศึกษา / ลูกค้า ที่เลือกเครื่องดื่มที่เปิดขายและปรับจำนวนหรือตัวเลือกของสินค้าให้ตรงกับความต้องการ ก่อนเข้าสู่ขั้นตอนชำระเงินตาม FR-10 และ FR-11
- ระบบจะตรวจสอบความครบถ้วนของ Order ก่อนให้ยืนยันคำสั่งซื้อ และเมื่อชำระเงินสำเร็จจึงสร้าง Order พร้อมหมายเลข Order ที่ unique ต่อวัน ตาม FR-10, FR-11 และ FR-12
- การออกแบบจะประกอบด้วยหน้าเมนูและหน้าตรวจสอบ Order, API สำหรับเพิ่ม/แก้ไข/ยืนยัน Order, และ flow ชำระเงิน QR แบบมีเวลา 5 นาที ตาม NFR-22, NFR-23 และ NFR-24
- แผนนี้จะไม่สร้างฟังก์ชันนอก scope เช่น จัดการผู้ใช้งาน, จัดการ Order ของพนักงาน, การยกเลิก Order, และตรวจสอบสถานะ Order เนื่องจากสิ่งเหล่านี้ถูกกำหนดไว้ใน Out of scope

## 2. เทคโนโลยีที่ใช้

| สิ่งที่เลือก | มาจาก | หมายเหตุ |
|---|---|---|
| React (Vite) สำหรับหน้าเมนูและหน้าตรวจสอบ Order | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้สร้าง UI สำหรับเลือกเมนู, แก้ไขจำนวน, ตรวจสอบยอดรวม และแสดง QR payment |
| Python FastAPI สำหรับ API สั่งซื้อและชำระเงิน | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้จัดการ Order validation, payment flow, และสร้างหมายเลข Order |
| SQLite สำหรับ Order draft และรายการสินค้า | ทีมเลือกเอง ไม่ได้มาจาก spec; ผู้ใช้เลือก SQLite เมื่อ 2569-10-28 | ใช้เก็บ Order draft, รายการสินค้า และตัวเลือก; ไฟล์เริ่มต้นคือ `backend/orders.sqlite3` และตั้ง path ได้ด้วย `ORDER_DATABASE_PATH` |
| QR payment flow แบบมี timeout 5 นาที | ทีมเลือกเอง ไม่ได้มาจาก spec | รองรับ Constraint ว่าระบบต้องมี QR code และหากเกินเวลา Order จะไม่ถูกดำเนินการต่อ |
| Session/JWT สำหรับผู้ใช้ที่เลือก Order และยืนยันชำระเงิน | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้รักษาความสัมพันธ์ระหว่างหน้าและ Order ที่กำลังดำเนินการ |

## 3. โมเดลข้อมูล

| Entity | ฟิลด์หลัก | รองรับ FR / NFR |
|---|---|---|
| MenuItem | `menu_item_id`, `name`, `status`, `price`, `promotion_price`, `is_available` | รองรับ FR-06, FR-08, AC-ORDER-01, AC-ORDER-03, ASM-01 |
| Order | `order_date`, `order_id`, `status`, `created_at`, `total_amount`, `paid_at`, `payment_status` | รองรับ FR-08, FR-10, FR-11, FR-12, NFR-23, NFR-24 |
| OrderItem | `order_item_id`, `order_date`, `order_id`, `menu_item_id`, `quantity`, `unit_price`, `line_total` | รองรับ FR-06, FR-07, FR-08, FR-09, AC-ORDER-02, AC-ORDER-04 |
| OrderOption | `order_option_id`, `order_item_id`, `sweetness_level`, `toppings`, `ice_level` | รองรับ FR-07, AC-ORDER-02, ASM-08, ASM-09 |
| PaymentTransaction | `payment_id`, `order_date`, `order_id`, `qr_code`, `expires_at`, `payment_result`, `reference_key` | รองรับ FR-11, FR-12, AC-ORDER-06, AC-ORDER-07, NFR-23 |

หมายเหตุโมเดลข้อมูล:
- จะไม่มีฟิลด์สำหรับข้อมูลผู้ใช้งานหรือพนักงานใน feature นี้ เนื่องจาก Out of scope
- `Order` ใช้ composite primary key (`order_date`, `order_id`) โดย `order_id` เป็นหมายเลข 3 หลักที่เริ่มใหม่ในแต่ละวัน; `OrderItem` และ `PaymentTransaction` อ้างถึงคีย์ทั้งสองฟิลด์นี้
- `OrderItem.menu_item_id` อ้างถึง `menu_items.menu_id`
- `sweetness_level` เป็นข้อมูลที่ต้องเลือกทุกครั้ง และ `ice_level` จะมีค่า default เป็น “ใส่น้ำแข็งปริมาณปกติ” เมื่อผู้ใช้ไม่เลือก ตาม FR-07 และ ASM-09
- เมื่อ `quantity = 0` จะไม่เก็บ item บน Order อีกต่อไป และจะคำนวณยอดรวมใหม่ตาม FR-09 และ AC-ORDER-04
- `payment_status` จะมีค่าเพียง “pending / success / failed / timeout” ตาม Constraint และ Exception Flow

## 4. API / หน้าจอ

- `GET /menu` — Output: รายการเครื่องดื่มที่เปิดขายพร้อมราคาและสถานะ — รองรับ FR-06, AC-ORDER-01
- `POST /api/orders/items` — Input: `menu_item_id`, `quantity`, `sweetness_level`, `toppings?`, `ice_level?`; Output: item ที่เพิ่มเข้ารายการ Order — รองรับ FR-06, FR-07, AC-ORDER-01, AC-ORDER-02
- `PATCH /api/orders/items/{order_item_id}` — Input: quantity / option อัปเดต; Output: OrderItem ที่ปรับปรุงแล้วและยอดรวมใหม่ — รองรับ FR-08, FR-09, Alternative Flow 4a, AC-ORDER-04, AC-ORDER-09
- `GET /api/orders/preview` — Output: รายการสินค้า จำนวน ราคา และยอดรวมของ Order — รองรับ FR-08, AC-ORDER-03
- `POST /api/orders/confirm` — Input: `order_id` หรือ current cart snapshot; Output: redirect ไปหน้า QR payment/ขั้นตอนชำระเงิน — รองรับ FR-10, AC-ORDER-05
- `POST /api/payments/qr` — Input: `order_id`; Output: QR code, expiry time 5 นาที, reference key — รองรับ FR-11, AC-ORDER-06
- `POST /api/payments/callback` — Input: payment result; Output: success/failure status; หากไม่สำเร็จ ไม่สร้าง Order ที่สมบูรณ์ — รองรับ FR-12, Exception Flow 6a, AC-ORDER-07, AC-ORDER-10, NFR-23
- `GET /api/orders/{order_id}` — Output: Order ID, รายละเอียดสินค้า, สถานะชำระเงิน, and created order summary — รองรับ FR-12, NFR-24, AC-ORDER-07
- `GET /orders/additional` หรือ กลับไปหน้าเมนู — Output: หน้าเมนูเพิ่มเติมสำหรับให้สั่งต่อ — รองรับ Alternative Flow 3a, AC-ORDER-08

## 5. ตารางตรวจ Constraints

| Constraint ID | ถูกนำไปใช้ที่ไหนใน plan | สถานะ |
|---|---|---|
| ไม่ระบุ ID ใน spec — ผู้ใช้ต้องเลือกเครื่องดื่มที่มีสถานะเปิดขายก่อนจึงสามารถสั่งซื้อได้ | ใช้ใน `GET /menu` และ validation ก่อนเพิ่ม item ไปยัง Order | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — จำนวนสินค้าที่สั่งต้องเป็นจำนวนเต็มที่มากกว่า 0 | ใช้ใน `POST /api/orders/items` และ `PATCH /api/orders/items/{order_item_id}` | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — ระบบต้องตรวจสอบข้อมูล Order ก่อนสร้างคำสั่งซื้อ | ใช้ใน `POST /api/orders/confirm` และ validation ก่อนยืนยัน Order | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — การสร้าง Order จะถือว่าสำเร็จเมื่อการชำระเงินสำเร็จ | ใช้ใน `POST /api/payments/callback` และ flow สร้าง Order หลัง success | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — หากการชำระเงินไม่สำเร็จ ระบบต้องไม่สร้าง Order ที่สมบูรณ์ | ใช้ใน payment callback logic และ error status handling | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — หากสินค้าหมดอัตโนมัติ ระบบต้องแสดงข้อความแจ้งว่าสินค้าหมดและให้ผู้ใช้เปลี่ยนเมนู | ใช้ใน validation inventory และ UI error message | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — ระบบรองรับการชำระเงินออนไลน์ด้วยคิวอาร์โค้ดแบบมีเวลาจำกัด 5 นาที | ใช้ใน `POST /api/payments/qr` และ timeout logic | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — หากผู้ใช้ชำระไม่ทันเวลาที่กำหนด Order จะไม่ถูกดำเนินการต่อ | ใช้ใน payment expiry validation และ status timeout | ใช้แล้ว |

## 6. แผนทดสอบจาก Acceptance Criteria

| AC ID | ชื่อ test | ทดสอบอย่างไร |
|---|---|---|
| AC-ORDER-01 | `test_AC_ORDER_01_add_item_to_order` | เปิดรายการเมนูที่มีสถานะเปิดขาย แล้วเลือกเครื่องดื่มหนึ่งรายการ ตรวจสอบว่ารายการถูกเพิ่มเข้าสู่ Order |
| AC-ORDER-02 | `test_AC_ORDER_02_save_item_options` | เลือกเครื่องดื่มแล้วกำหนดจำนวนและตัวเลือก toppings / ความหวาน / น้ำแข็ง ตรวจสอบว่าข้อมูลถูกบันทึกและ sweetness required | 
| AC-ORDER-03 | `test_AC_ORDER_03_show_order_summary` | เปิดหน้าตรวจสอบ Order แล้วตรวจสอบว่าแสดงชื่อเครื่องดื่ม จำนวน ราคา และยอดรวม พร้อมค่าราคาโปรโมชั่นที่ลดอยู่ |
| AC-ORDER-04 | `test_AC_ORDER_04_update_quantity_or_remove_item` | แก้ไขจำนวนเป็น 0 หรือลบรายการ แล้วตรวจสอบว่ายอดรวมปรับใหม่และรายการหายออกจาก Order |
| AC-ORDER-05 | `test_AC_ORDER_05_confirm_order_to_payment` | เมื่อ Order มีรายการอย่างน้อย 1 รายการและระดับความหวานครบถ้วน ให้กดยืนยันแล้วตรวจสอบว่าถูกส่งเข้าสู่ขั้นตอนชำระเงิน |
| AC-ORDER-06 | `test_AC_ORDER_06_show_qr_with_timeout` | ยืนยัน Order แล้วเรียก QR payment ตรวจสอบว่ามี QR ชัดเจนและมี expiry time 5 นาที | 
| AC-ORDER-07 | `test_AC_ORDER_07_create_order_after_payment_success` | จำลองการชำระเงินสำเร็จ แล้วตรวจสอบว่าระบบสร้าง Order พร้อม Order ID และแสดงรายละเอียดคำสั่งซื้อ |
| AC-ORDER-08 | `test_AC_ORDER_08_return_to_menu_for_more_items` | ตั้งค่าให้ผู้ใช้ต้องการสั่งเพิ่มจาก Order แล้วตรวจสอบว่าระบบกลับไปหน้าเมนูได้ |
| AC-ORDER-09 | `test_AC_ORDER_09_recalculate_total_after_edit` | แก้ไขจำนวนหรืออัปเดตตัวเลือกแล้วตรวจสอบยอดรวมจะแสดงค่าที่ถูกต้องทันที |
| AC-ORDER-10 | `test_AC_ORDER_10_failed_payment_does_not_create_complete_order` | จำลองการชำระเงินไม่สำเร็จ แล้วตรวจสอบว่าระบบไม่สร้าง Order ที่สมบูรณ์และแจ้งให้ทำใหม่ |
| AC-ORDER-11 | `test_AC_ORDER_11_show_out_of_stock_message` | ปรับ stock เป็นหมดอัตโนมัติ แล้วตรวจสอบว่าระบบแสดงข้อความว่าสินค้าหมดและให้เปลี่ยนเมนู |
| AC-ORDER-12 | `test_AC_ORDER_12_duplicate_payment_not_create_duplicate_order` | จำลองการชำระเงินซ้ำในครั้งเดียว แล้วตรวจสอบว่าระบบสร้าง Order ได้เพียง 1 รายการเท่านั้น |

## 7. ลำดับงาน

1. กำหนด model สำหรับเมนู, Order, OrderItem, OrderOption และ PaymentTransaction ตาม FR-06, FR-07, FR-08, FR-11 และ FR-12
2. สร้างหน้าเมนูและหน้าตรวจสอบ Order พร้อม UI สำหรับเลือกจำนวน, ตัวเลือก, หยิบสินค้าเข้า Order, และแสดงยอดรวม ตาม FR-06, FR-07, FR-08 และ AC-ORDER-01 ถึง AC-ORDER-03
3. สร้าง API เพิ่ม/แก้ไขสินค้าใน Order และ validation สำหรับจำนวน > 0, removal เมื่อจำนวนเป็น 0, และ recalculation ตาม FR-09, Alternative Flow 4a, AC-ORDER-04 และ AC-ORDER-09
4. สร้างขั้นตอนยืนยัน Order และตรวจสอบความครบถ้วนก่อนชำระเงินตาม FR-10 และ AC-ORDER-05
5. สร้าง flow QR payment และ timeout 5 นาที พร้อม handling สำหรับ failed/timeout ตาม FR-11, Exception Flow 6a, AC-ORDER-06 และ AC-ORDER-10
6. สร้าง logic สร้าง Order หลังชำระเงินสำเร็จ พร้อม unique Order ID ต่อวันและแสดงรายละเอียดคำสั่งซื้อ ตาม FR-12, NFR-23, NFR-24 และ AC-ORDER-07, AC-ORDER-12
7. ทดสอบ end-to-end กับ Acceptance Criteria ทั้งหมด และตรวจว่าระบบไม่เกิน scope เช่น ไม่มีฟังก์ชันยกเลิก/ดูสถานะ/จัดการพนักงานตาม Out of scope

## 8. สิ่งที่ยังไม่ทำ

- ไม่มี Open Questions ใน spec.md ปัจจุบัน
  - ส่วนที่เกี่ยวข้องกับข้อนี้จะยังไม่สร้างจนกว่าจะได้คำตอบ

---

สรุป: แผนงานนี้จะสร้างระบบเลือกสินค้าและสั่งซื้อแบบ end-to-end ตั้งแต่เมนูจนถึงชำระเงินและสร้าง Order โดยยึด FR, NFR และ AC ของ spec อย่างเคร่งครัด และไม่ขยาย scope ออกจาก Out of scope ที่กำหนดไว้
