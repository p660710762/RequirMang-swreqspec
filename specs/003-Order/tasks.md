# Tasks: สั่งเครื่องดื่มออนไลน์ (Online Beverage Ordering)

- Feature: สั่งเครื่องดื่มออนไลน์
- Spec ID: SPEC-ORDER-001
- อ้างอิง: [spec.md](./spec.md), [plan.md](./plan.md)
- วันที่: 2569-10-26
- สรุป: 5 เฟส รวม 17 tasks; เฟสแรกที่ลองใช้งานได้จริงคือเฟส 1 หลังเพิ่มเครื่องดื่มและตรวจสอบ Order ได้
- มี 2 tasks ที่รอการตัดสินใจ/ยืนยัน: T-15 รอ Q-01 และ T-16 รอผู้รับผิดชอบ Spec ยืนยัน NFR-22/NFR-26
- เฟส 0 มีเฉพาะฐานราก; เฟส 1–3 เรียงตามเส้นทางสั่งซื้อ; เฟส 4 รวมงานที่ยังรอคำตอบ

> ขอบเขตเอกสาร: `spec.md` และ `plan.md` มีส่วน Requirements, Acceptance Criteria, Assumptions และ Open Questions ซ้ำกัน โดยเนื้อหา AC ซ้ำตรงกัน แต่ Open Questions มีทั้งส่วนว่างและส่วนที่มี 5 ข้อ รายการด้านล่างยึดรายการ 5 ข้อที่ปรากฏในไฟล์ และระบุข้อขัดแย้งที่ต้องปรับในเอกสารต้นทางก่อนเริ่มงานที่เกี่ยวข้อง
> `plan.md` ไม่ระบุคำสั่งเปิดระบบหรือคำสั่งทดสอบ และในขณะจัดทำยังไม่มี source files ใต้ `frontend/src/`; จึงไม่สมมติคำสั่งรันหรือ test runner ใหม่

## เฟส 0: ฐานรากของ Order (FR-06, FR-07, FR-08, FR-11, FR-12)

### T-01 สร้างโมเดล Order และรายการ
- รองรับ: FR-06, FR-07, FR-08, FR-09, FR-10, FR-11, FR-12, NFR-23
- ตรวจด้วย: ไม่มี AC ตรง ๆ เป็นงานพื้นฐานของ T-03 ถึง T-13
- ไฟล์ที่แตะ: `backend/app/models/order.py`, `backend/app/models/order_item.py`, `backend/app/models/payment_transaction.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: ไม่มี
- เสร็จเมื่อ: โมเดลรองรับ Order ที่มีหลาย OrderItems และตัวเลือกของแต่ละรายการผูกกับ OrderItem ตาม Entity Model ใน plan.md
- สถานะ: เสร็จ

### T-02 เตรียมโครง API สำหรับ Order
- รองรับ: FR-06, FR-10, FR-11
- ตรวจด้วย: ไม่มี AC ตรง ๆ เป็นงานพื้นฐานของ T-03 ถึง T-13
- ไฟล์ที่แตะ: `backend/app/main.py`, `backend/app/routes/orders.py`, `backend/app/services/order_service.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-01
- เสร็จเมื่อ: แอป FastAPI โหลด route สำหรับ Order ได้และแยกการตรวจสอบ/ดำเนินการ Order ไว้ใน service ตาม plan.md
- สถานะ: เสร็จ

#### จุดตรวจเฟส 0
- test ที่ต้องผ่านทั้งหมด: ยังไม่มี AC test ตรง ๆ; test พื้นฐานของแอปและโมเดลต้องผ่าน
- เปิดระบบ: plan.md ยังไม่ระบุคำสั่งเปิด backend/frontend จึงต้องยืนยันคำสั่งก่อนทดลองระบบจริง
- คนลองเองตาม FR-06/FR-07:
  Given โครง FastAPI และโมเดล Order ถูกสร้าง
  When แอปเริ่มทำงาน
  Then route ของ Order ถูกโหลดโดยไม่มีข้อผิดพลาด
- ยังขาด: ยังไม่มีหน้าจอหรือ flow ที่ผู้ใช้ทดลองได้

## เฟส 1: เลือกเครื่องดื่มและตรวจสอบ Order (AC-ORDER-01, AC-ORDER-02, AC-ORDER-03, AC-ORDER-08)

### T-03 เพิ่มเครื่องดื่มที่เปิดขายเข้า Order
- รองรับ: FR-06
- ตรวจด้วย: AC-ORDER-01 — `test_AC_ORDER_01_add_item_to_order`
- ไฟล์ที่แตะ: `backend/app/routes/orders.py`, `backend/app/services/order_service.py`, `backend/tests/test_order_flow.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-02
- เสร็จเมื่อ: เครื่องดื่มที่เปิดขายถูกเพิ่มเป็น OrderItem และเครื่องดื่มที่ไม่เปิดขายไม่สามารถเพิ่มได้
- สถานะ: เสร็จ

### T-04 บันทึกตัวเลือกแยกตาม OrderItem
- รองรับ: FR-07
- ตรวจด้วย: AC-ORDER-02 — `test_AC_ORDER_02_save_item_options`
- ไฟล์ที่แตะ: `backend/app/models/order_item.py`, `backend/app/services/order_service.py`, `backend/tests/test_order_flow.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-01, T-03
- เสร็จเมื่อ: แต่ละ OrderItem บันทึกจำนวนและตัวเลือกของตนเองได้ โดยบังคับเลือกระดับความหวานและใช้ค่าเริ่มต้นน้ำแข็งตาม spec.md
- สถานะ: เสร็จ

### T-05 สร้างหน้าจอเลือกเครื่องดื่มและตัวเลือก
- รองรับ: FR-06, FR-07
- ตรวจด้วย: AC-ORDER-01 — `test_AC_ORDER_01_add_item_to_order`; AC-ORDER-02 — `test_AC_ORDER_02_save_item_options`
- ไฟล์ที่แตะ: `frontend/src/pages/OrderPage.jsx`, `frontend/src/api/client.js`, `frontend/src/pages/OrderPage.test.jsx`
- แบบหน้าจอ: ไม่มี mockup ระบุใน spec.md
- ต้องทำหลัง: T-03, T-04
- เสร็จเมื่อ: ผู้ใช้เลือกเมนูที่เปิดขาย กำหนดจำนวนและตัวเลือก แล้วเพิ่มเข้า Order ผ่าน API โดย test หน้าจอจำลอง client
- สถานะ: เสร็จ

### T-06 แสดงสรุป Order และกลับไปเลือกเพิ่ม
- รองรับ: FR-06, FR-08
- ตรวจด้วย: AC-ORDER-03 — `test_AC_ORDER_03_show_order_summary`; AC-ORDER-08 — `test_AC_ORDER_08_return_to_menu_for_more_items`
- ไฟล์ที่แตะ: `backend/app/routes/orders.py`, `backend/app/services/order_service.py`, `frontend/src/pages/OrderPage.jsx`, `frontend/src/api/client.js`, `frontend/src/pages/OrderPage.test.jsx`, `backend/tests/test_order_flow.py`
- แบบหน้าจอ: ไม่มี mockup ระบุใน spec.md
- ต้องทำหลัง: T-05
- เสร็จเมื่อ: หน้าตรวจสอบแสดงชื่อเครื่องดื่ม จำนวน ราคา และยอดรวม และกลับไปเพิ่มรายการได้โดยยังมีรายการเดิมอยู่
- สถานะ: เสร็จ

### T-17 เปิดหน้า Order ผ่าน route แยก
- รองรับ: FR-06, FR-08
- ตรวจด้วย: test ว่า `/order` แสดงหน้า Order และ `/` ยังคงแสดงหน้า Admin
- ไฟล์ที่แตะ: `frontend/src/main.jsx`, `frontend/src/main.test.jsx`, `specs/003-Order/tasks.md`, `prompt-log.md`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-05, T-06
- เสร็จเมื่อ: ผู้ใช้เปิดหน้า Order ได้โดยตรงที่ `/order` และหน้า Admin ยังเปิดได้ที่ `/`
- สถานะ: เสร็จ 

### T-18 ปรับ UI Order ให้ใกล้เคียง mockup
- รองรับ: FR-06, FR-08
- ตรวจด้วย: `test_AC_ORDER_03_show_order_summary` และ test ว่าพื้นที่ตัวอย่างชำระเงินไม่สามารถกดใช้งานได้
- ไฟล์ที่แตะ: `frontend/src/pages/OrderPage.jsx`, `frontend/src/pages/OrderPage.test.jsx`, `frontend/src/styles.css`, `specs/003-Order/tasks.md`, `prompt-log.md`
- แบบหน้าจอ: `specs/mockups/Order/Screenshot 2026-10-27 155722.png` ใช้เป็นแนวทางการจัดวาง; รายละเอียดการชำระเงินเป็น placeholder เท่านั้น
- ต้องทำหลัง: T-06
- เสร็จเมื่อ: หน้าสรุป Order จัดเป็นแผงตะกร้ากับแผงตัวอย่างยืนยัน/ชำระเงินแบบ responsive โดยคงการแสดงรายการและยอดรวม และปุ่มตัวอย่างชำระเงินไม่เรียกการทำงานใด
- สถานะ: เสร็จ 

#### จุดตรวจเฟส 1
- test ที่ต้องผ่านทั้งหมด: `test_AC_ORDER_01_add_item_to_order`, `test_AC_ORDER_02_save_item_options`, `test_AC_ORDER_03_show_order_summary`, `test_AC_ORDER_08_return_to_menu_for_more_items` และ test ของเฟส 0 ต้องยังผ่าน
- เปิดระบบ: plan.md ยังไม่ระบุคำสั่งเปิด backend/frontend; ต้องยืนยันก่อนทดลองเชื่อมต่อระบบจริง
- คนลองเองตาม AC-ORDER-03:
  Given มีเครื่องดื่มที่เปิดขายและ Order มีหลาย OrderItems ซึ่งตั้งตัวเลือกต่างกัน
  When เปิดหน้าตรวจสอบ Order
  Then เห็นรายการ ตัวเลือกของแต่ละรายการ จำนวน ราคา และยอดรวม และกลับไปเลือกเครื่องดื่มเพิ่มได้
- ยังขาด: การแก้ไข Order การตรวจสต็อกก่อนจ่าย และการชำระเงินจริง

## เฟส 2: แก้ไข ตรวจสต็อก และยืนยัน Order (AC-ORDER-04, AC-ORDER-05, AC-ORDER-09, AC-ORDER-11)

### T-07 แก้ไขจำนวนและตัวเลือกพร้อมคำนวณยอดรวมใหม่
- รองรับ: FR-07, FR-08, FR-09
- ตรวจด้วย: AC-ORDER-04 — `test_AC_ORDER_04_update_quantity_or_remove_item`; AC-ORDER-09 — `test_AC_ORDER_09_recalculate_total_after_edit`
- ไฟล์ที่แตะ: `backend/app/routes/orders.py`, `backend/app/services/order_service.py`, `backend/app/repositories/order_repository.py`, `backend/tests/test_order_flow.py`, `backend/tests/test_order_sqlite_repository.py`, `specs/003-Order/tasks.md`, `prompt-log.md`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-06
- เสร็จเมื่อ: การแก้ไขจำนวนหรือตัวเลือกคำนวณยอดรวมใหม่ และจำนวน 0 ลบ OrderItem ตาม FR-09
- สถานะ: เสร็จ

### T-08 ยืนยัน Order และตรวจสต็อกซ้ำก่อนเริ่มชำระเงิน
- รองรับ: FR-10, FR-11
- ตรวจด้วย: AC-ORDER-05 — `test_AC_ORDER_05_confirm_order_to_payment`; AC-ORDER-11 — `test_AC_ORDER_11_show_out_of_stock_message`
- ไฟล์ที่แตะ: `backend/app/routes/orders.py`, `backend/app/services/order_service.py`, `backend/tests/test_order_flow.py`, `backend/tests/test_order_sqlite_repository.py`, `specs/003-Order/tasks.md`, `prompt-log.md`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-07
- เสร็จเมื่อ: ก่อนเริ่มชำระเงินระบบตรวจรายการและสต็อกซ้ำ หากรายการใดไม่พร้อมระบบไม่เริ่มชำระเงินและส่งผลให้หน้าจอแจ้งลูกค้าเปลี่ยนเมนู
- สถานะ: เสร็จ

### T-09 แสดงการแก้ไข Order และยอดรวมใหม่
- รองรับ: FR-08, FR-09
- ตรวจด้วย: AC-ORDER-04 — `test_AC_ORDER_04_update_quantity_or_remove_item`; AC-ORDER-09 — `test_AC_ORDER_09_recalculate_total_after_edit`
- ไฟล์ที่แตะ: `frontend/src/pages/OrderPage.jsx`, `frontend/src/api/client.js`, `frontend/src/pages/OrderPage.test.jsx`
- แบบหน้าจอ: ไม่มี mockup ระบุใน spec.md
- ต้องทำหลัง: T-07
- เสร็จเมื่อ: ผู้ใช้แก้จำนวนหรือตัวเลือกจากหน้าจอแล้วเห็นรายการและยอดรวมที่ปรับใหม่
- สถานะ: เสร็จ

### T-10 แสดงผลตรวจสต็อกและยืนยัน Order
- รองรับ: FR-10, FR-11
- ตรวจด้วย: AC-ORDER-05 — `test_AC_ORDER_05_confirm_order_to_payment`; AC-ORDER-11 — `test_AC_ORDER_11_show_out_of_stock_message`
- ไฟล์ที่แตะ: `frontend/src/pages/OrderPage.jsx`, `frontend/src/api/client.js`, `frontend/src/pages/OrderPage.test.jsx`
- แบบหน้าจอ: ไม่มี mockup ระบุใน spec.md
- ต้องทำหลัง: T-08, T-09
- เสร็จเมื่อ: หน้าจอแจ้งรายการที่สต็อกไม่พร้อมและไม่พาผู้ใช้ไปชำระเงิน หรือส่ง Order ที่ครบถ้วนไปยังขั้นตอนชำระเงิน
- สถานะ: เสร็จ 

#### จุดตรวจเฟส 2
- test ที่ต้องผ่านทั้งหมด: `test_AC_ORDER_04_update_quantity_or_remove_item`, `test_AC_ORDER_05_confirm_order_to_payment`, `test_AC_ORDER_09_recalculate_total_after_edit`, `test_AC_ORDER_11_show_out_of_stock_message` และ tests ของเฟสก่อนหน้าต้องยังผ่าน
- เปิดระบบ: plan.md ยังไม่ระบุคำสั่งเปิด backend/frontend; ต้องยืนยันก่อนทดลองเชื่อมต่อระบบจริง
- คนลองเองตาม AC-ORDER-05:
  Given Order มีอย่างน้อยหนึ่งรายการ ตัวเลือกความหวานครบ และรายการยังมีสต็อก
  When ผู้ใช้ยืนยัน Order
  Then ระบบเริ่มขั้นตอนชำระเงิน; หากจำลองว่าสต็อกหมดก่อนยืนยัน ระบบแจ้งให้เปลี่ยนเมนูและไม่เริ่มชำระเงิน
- ยังขาด: การสร้าง QR จาก Payment Gateway ที่ทีมอนุมัติ

## เฟส 3: ชำระเงินและสร้าง Order (AC-ORDER-06, AC-ORDER-07, AC-ORDER-10, AC-ORDER-12)

### T-19 แก้ backend foundation และเพิ่ม test ของตัวเลือก Order
- รองรับ: FR-06, FR-07, FR-08, FR-09 และ AC-ORDER-02
- ตรวจด้วย: `test_TC_ORDER_02_1_save_all_item_options`, `test_TC_ORDER_02_2_save_minimum_quantity_without_optional_options`, `test_TC_ORDER_02_3_save_toppings_with_default_ice`, `test_TC_ORDER_02_4_reject_missing_sweetness`
- ไฟล์ที่แตะ: `backend/pytest.ini`, `backend/app/database.py`, `backend/app/models.py`, `backend/app/models/__init__.py`, `backend/app/models/menu.py`, `backend/app/models/order_item.py`, `backend/app/repositories/__init__.py`, `backend/app/repositories/order_repository.py`, `backend/app/main.py`, `backend/app/routes/orders.py`, `backend/app/routes/menu.py`, `backend/app/services/menu_service.py`, `backend/app/services/menu_status_service.py`, `backend/app/services/menu_validation.py`, `backend/app/middleware/auth_guard.py`, `backend/app/seed.py`, `backend/tests/test_order_flow.py`, `backend/tests/test_order_sqlite_repository.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-08
- เสร็จเมื่อ: `cd backend && pytest -v` เก็บและรัน test ได้, Order API ไม่ตอบ 503 จาก dependency placeholder, และ test case ตัวเลือก AC-ORDER-02 ครบ 4 แถว
- สถานะ: เสร็จ รอทีมตรวจ

### T-11 สร้างคำขอ QR พร้อมเวลาหมดอายุ
- รองรับ: FR-11
- ตรวจด้วย: AC-ORDER-06 — `test_AC_ORDER_06_show_qr_with_timeout`
- ไฟล์ที่แตะ: `backend/app/routes/payments.py`, `backend/app/services/payment_gateway.py`, `backend/tests/test_order_payment.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-10
- เสร็จเมื่อ: payment service ส่ง QR และเวลาหมดอายุ 5 นาทีผ่าน gateway interface โดยทดสอบด้วย fake gateway ได้ และเมื่อหมดเวลา Order ไม่ถูกดำเนินการต่อ
- สถานะ: พร้อมทำ

### T-12 รับผลชำระเงินและป้องกันการสร้าง Order เมื่อชำระไม่สำเร็จ
- รองรับ: FR-11, FR-12, NFR-23
- ตรวจด้วย: AC-ORDER-10 — `test_AC_ORDER_10_failed_payment_does_not_create_complete_order`
- ไฟล์ที่แตะ: `backend/app/routes/payments.py`, `backend/app/services/payment_gateway.py`, `backend/app/services/order_service.py`, `backend/tests/test_order_payment.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-11
- เสร็จเมื่อ: ผล failed หรือ timeout ไม่สร้าง Order ที่สมบูรณ์ และส่งผลลัพธ์ให้หน้าจอแจ้งผู้ใช้ได้
- สถานะ: พร้อมทำ

### T-13 สร้าง Order หลังยืนยันผลสำเร็จเพียงครั้งเดียว
- รองรับ: FR-12, NFR-23, NFR-24
- ตรวจด้วย: AC-ORDER-07 — `test_AC_ORDER_07_create_order_after_payment_success`; AC-ORDER-12 — `test_AC_ORDER_12_duplicate_payment_not_create_duplicate_order`
- ไฟล์ที่แตะ: `backend/app/services/order_service.py`, `backend/app/routes/payments.py`, `backend/app/routes/orders.py`, `backend/tests/test_order_payment.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-12
- เสร็จเมื่อ: ผล success ที่ตรวจสอบได้สร้าง Order พร้อมหมายเลขเรียงลำดับ 001-999 ต่อวันและรายละเอียดถูกต้อง โดย callback ซ้ำไม่สร้าง Order ซ้ำ
- สถานะ: พร้อมทำ

### T-14 แสดง QR ผลชำระเงิน และรายละเอียด Order
- รองรับ: FR-11, FR-12, NFR-24
- ตรวจด้วย: AC-ORDER-06 — `test_AC_ORDER_06_show_qr_with_timeout`; AC-ORDER-07 — `test_AC_ORDER_07_create_order_after_payment_success`; AC-ORDER-10 — `test_AC_ORDER_10_failed_payment_does_not_create_complete_order`
- ไฟล์ที่แตะ: `frontend/src/pages/PaymentPage.jsx`, `frontend/src/pages/OrderResultPage.jsx`, `frontend/src/api/client.js`, `frontend/src/pages/PaymentPage.test.jsx`, `frontend/src/pages/OrderResultPage.test.jsx`
- แบบหน้าจอ: ไม่มี mockup ระบุใน spec.md
- ต้องทำหลัง: T-11, T-12, T-13
- เสร็จเมื่อ: ผู้ใช้เห็น QR พร้อมเวลาหมดอายุ ผล failed/timeout หรือหมายเลข Order และผลชำระเงินหลัง success ตามผลจาก API
- สถานะ: พร้อมทำ

#### จุดตรวจเฟส 3
- test ที่ต้องผ่านทั้งหมด: `test_AC_ORDER_06_show_qr_with_timeout`, `test_AC_ORDER_07_create_order_after_payment_success`, `test_AC_ORDER_10_failed_payment_does_not_create_complete_order`, `test_AC_ORDER_12_duplicate_payment_not_create_duplicate_order` และ tests ของเฟสก่อนหน้าต้องยังผ่าน
- เปิดระบบ: plan.md ยังไม่ระบุคำสั่งเปิด backend/frontend; ต้องยืนยันก่อนทดลองเชื่อมต่อระบบจริง
- คนลองเองตาม AC-ORDER-07:
  Given Order ผ่านการตรวจสอบและ gateway ส่งผล success ที่ตรวจสอบได้
  When ระบบรับผลชำระเงิน
  Then สร้าง Order เพียงหนึ่งรายการ แสดงหมายเลขและรายละเอียด Order; ผล failed หรือ timeout ต้องไม่สร้าง Order ที่สมบูรณ์
- ยังขาด: การเชื่อมต่อ Opn Payments จริงรอ Q-01; การทดสอบกับ gateway จริงยังไม่เกิดขึ้น

## เฟส 4: รอคำตอบและการยืนยันขอบเขต

### T-15 ยืนยัน Payment Gateway และการใช้ PromptPay ใน Test Mode
- รองรับ: FR-11, FR-12
- ตรวจด้วย: AC-ORDER-06 — `test_AC_ORDER_06_show_qr_with_timeout`; AC-ORDER-07 — `test_AC_ORDER_07_create_order_after_payment_success`; AC-ORDER-10 — `test_AC_ORDER_10_failed_payment_does_not_create_complete_order`
- ไฟล์ที่แตะ: `backend/app/services/payment_gateway.py`, `backend/app/routes/payments.py`, `backend/tests/test_order_payment.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-11, T-12, T-13, T-14
- เสร็จเมื่อ: ผู้รับผิดชอบยืนยันหรือแก้ข้อเสนอ Opn Payments (Omise) สำหรับสาธิต/ทดสอบ และยืนยันขอบเขตที่ใช้ได้ใน Test Mode ก่อนเชื่อมต่อจริง โดยไม่ถือว่ามีการสมัครหรือทดสอบสำเร็จแล้ว
- สถานะ: รอ Q-01

### T-16 ยืนยันการปรับ NFR-22 และ NFR-26 ให้ตรงกับ Scope
- รองรับ: NFR-22, NFR-26
- ตรวจด้วย: ไม่มี AC ตรง ๆ เป็นงานยืนยันขอบเขตและเกณฑ์ NFR ก่อนทดสอบ
- ไฟล์ที่แตะ: `specs/003-Order/spec.md`, `specs/003-Order/plan.md`, `specs/003-Order/tasks.md`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: ไม่มี
- เสร็จเมื่อ: ผู้รับผิดชอบ Spec ยืนยันถ้อยคำที่ไม่รวมการตรวจสอบสถานะ Order ซึ่งอยู่ใน Out of scope; ข้อเสนอคือวัด NFR-22 กับหน้ารายการเมนูและหน้าตรวจสอบ Order และปรับ NFR-26 ให้ทดสอบการค้นหาเมนู การสร้าง Order และการรับผลชำระเงินโดยไม่เพิ่มการตรวจสถานะ
- สถานะ: รอการยืนยันจากผู้รับผิดชอบ Spec

## ตารางตรวจความครบ

### Acceptance Criteria

| AC ID | task ที่ตรวจ AC นี้ |
|---|---|
| AC-ORDER-01 | T-03, T-05 |
| AC-ORDER-02 | T-04, T-05 |
| AC-ORDER-03 | T-06 |
| AC-ORDER-04 | T-07, T-09 |
| AC-ORDER-05 | T-08, T-10 |
| AC-ORDER-06 | T-11, T-14, T-15 |
| AC-ORDER-07 | T-13, T-14, T-15 |
| AC-ORDER-08 | T-06 |
| AC-ORDER-09 | T-07, T-09 |
| AC-ORDER-10 | T-12, T-14, T-15 |
| AC-ORDER-11 | T-08, T-10 |
| AC-ORDER-12 | T-13 |

### Constraints

| Constraint ID | task ที่ทำให้เป็นจริง |
|---|---|
| ไม่มี ID ใน spec — ผู้ใช้ต้องเลือกเครื่องดื่มที่มีสถานะเปิดขาย | T-03, T-05 |
| ไม่มี ID ใน spec — จำนวนสินค้าที่สั่งต้องเป็นจำนวนเต็มที่มากกว่า 0 | T-04, T-07 |
| ไม่มี ID ใน spec — ระบบต้องตรวจสอบข้อมูล Order ก่อนสร้างคำสั่งซื้อ | T-08 |
| ไม่มี ID ใน spec — การสร้าง Order จะถือว่าสำเร็จเมื่อการชำระเงินสำเร็จ | T-12, T-13 |
| ไม่มี ID ใน spec — หากการชำระเงินไม่สำเร็จ ระบบต้องไม่สร้าง Order ที่สมบูรณ์ | T-12, T-14 |
| ไม่มี ID ใน spec — หากสินค้าหมดอัตโนมัติ ระบบต้องแจ้งว่าสินค้าหมดและให้ผู้ใช้เปลี่ยนเมนู | T-08, T-10 |
| ไม่มี ID ใน spec — QR มีเวลาจำกัด 5 นาที | T-11, T-14 |
| ไม่มี ID ใน spec — หากชำระไม่ทันเวลา Order จะไม่ถูกดำเนินการต่อ | T-11, T-12 |

### FR Traceability

| FR ID | AC ที่ตรวจ FR นี้ | เฟส |
|---|---|---|
| FR-06 | AC-ORDER-01, AC-ORDER-08 | เฟส 1 |
| FR-07 | AC-ORDER-02 | เฟส 1, 2 |
| FR-08 | AC-ORDER-03, AC-ORDER-09 | เฟส 1, 2 |
| FR-09 | AC-ORDER-04, AC-ORDER-09 | เฟส 2 |
| FR-10 | AC-ORDER-05 | เฟส 2 |
| FR-11 | AC-ORDER-06, AC-ORDER-10 | เฟส 2, 3 |
| FR-12 | AC-ORDER-07 | เฟส 3 |

## สิ่งที่ยังไม่ทำ / Open Questions

| Open Question จาก spec.md | แนวทาง/สถานะตามคำสั่งทีม | task ที่เกี่ยวข้อง |
|---|---|---|
| ช่องทางการชำระเงินออนไลน์ที่ระบบจะรองรับมีอะไรบ้าง | เสนอ Opn Payments (Omise) สำหรับสาธิตและทดสอบด้วย Test Mode; เอกสารทางการมีตัวอย่าง PromptPay source โดยใช้ test key และระบุการทดสอบด้วยคำขอ API แต่ยังไม่ยืนยันการเปิดใช้ PromptPay ในบัญชีหรือการจำลองการจ่ายเงินจริง จึงรอผู้รับผิดชอบยืนยันก่อนเชื่อมต่อจริง. อ้างอิง: [Opn PromptPay documentation](https://docs.omise.co/promptpay) | T-15 (รอ Q-01) |
| จำเป็นต้องให้ผู้ใช้กรอกข้อมูลส่วนตัวก่อนชำระเงินหรือไม่ | ใช้เฉพาะข้อมูลลูกค้าที่ Spec เดิมกำหนด ไม่เพิ่มฟิลด์ส่วนตัวเอง; plan.md มี `user_id` ใน Entity Order ซึ่งต้องได้รับการยืนยัน/ปรับให้ไม่กลายเป็นการเพิ่มข้อมูลลูกค้า | T-01; ต้องปรับ plan.md ก่อน implement หาก `user_id` ไม่ได้มาจาก Spec |
| Order สามารถสั่งเครื่องดื่มหลายรายการที่มีตัวเลือกแตกต่างกันได้หรือไม่ | กำหนดให้ Order มีหลาย OrderItems และแต่ละ OrderItem เก็บตัวเลือกของตนเอง สอดคล้องกับ Entity Model ใน plan.md และ AC-ORDER-02; ควรบันทึกข้อสรุปนี้ใน Spec/Plan ให้ตรงกัน | T-01, T-04 |
| โปรโมชั่นจาก UC-01 จะถูกนำมาคำนวณใน Order โดยอัตโนมัติหรือไม่ | ใช้อัตโนมัติเฉพาะเมื่อ UC-01/Spec กำหนดกติกาชัดเจน; เมื่อไม่มีกติกาให้ไม่คำนวณ/ใช้โปรโมชั่นอัตโนมัติ และแสดงเฉพาะราคาที่ได้รับจากรายการเมนู. ข้อนี้ขัดกับ FR-08/ASM-10 ที่มีข้อความเรื่องราคาโปรโมชั่น จึงต้องปรับ Spec/Plan ให้สอดคล้องก่อน implement การแสดงราคาส่วนลด | T-06; ต้องปรับ Spec/Plan ให้ตรงกัน |
| หากสินค้าใน Order หมดสต็อกระหว่างการสั่งซื้อ ระบบจะดำเนินการอย่างไร | ตรวจสต็อกซ้ำก่อนยืนยันรายการเพื่อเริ่มชำระเงิน; หากไม่พอให้แจ้งลูกค้าและไม่เริ่มชำระเงินสำหรับรายการที่ไม่พร้อม. แนวทางนี้ต้องเพิ่มให้ตรงกันใน Spec/Plan ก่อน implement | T-08, T-10 |

### Decision Records และข้อที่ต้องปรับในเอกสารต้นทาง

- Q-01: Opn Payments (Omise) เป็นข้อเสนอสำหรับ Test Mode ไม่ใช่การอนุมัติ vendor หรือหลักฐานการสมัคร/ทดสอบจริง; ยืนยัน PromptPay sandbox behavior และการเปิดใช้กับผู้ให้บริการก่อนเชื่อมต่อจริง
- Q-02: ไม่เพิ่มข้อมูลลูกค้า; ตรวจ `user_id` ใน Entity Model ของ plan.md ให้สอดคล้องกับ Spec และ Out of scope
- Q-03: หนึ่ง Order มีหลาย OrderItems และตัวเลือกเป็นของแต่ละ OrderItem; โครงสร้างใน plan.md รองรับ แต่ควรเพิ่มคำตัดสินลง Spec ให้ชัด
- Q-04: ไม่มีการใช้โปรโมชั่นอัตโนมัติหากไม่มีสูตร/กติกาใน UC-01 หรือ Spec; FR-08 และ ASM-10 ยังกล่าวถึงราคาโปรโมชั่น จึงต้องแก้ถ้อยคำใน Spec/Plan ก่อนปิดข้อขัดแย้ง
- Q-05: ตรวจสต็อกอีกครั้งก่อนเริ่มชำระเงิน และปฏิเสธการเริ่มชำระเมื่อรายการไม่พร้อม; แนวทางนี้ยังไม่ระบุชัดใน AC ปัจจุบัน จึงต้องบันทึกใน Spec/Plan ก่อนถือว่าปิดประเด็น
- NFR-22/NFR-26: ข้อความปัจจุบันกล่าวถึงการตรวจสอบสถานะ Order ซึ่งเป็น Out of scope; ข้อเสนอแก้ไขใน T-16 ยังต้องได้รับการยืนยันจากผู้รับผิดชอบ Spec

> **ข้อกำหนดก่อนเริ่ม implement:** ต้องบันทึก Decision Records ที่ยังไม่อยู่ใน Spec/Plan ให้ตรงกัน และรับการยืนยัน T-15/T-16 ก่อนทำงานที่ขึ้นกับ vendor หรือ NFR ที่ขัดกับ Scope; สถานะ tasks ข้างต้นไม่ได้หมายความว่างานเสร็จหรือทดสอบผ่านแล้ว
