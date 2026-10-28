# Tasks: ชำระเงินออนไลน์ (Online Payment)

- Feature: ชำระเงินออนไลน์
- Spec ID: SPEC-PAYMENT-001
- อ้างอิง: [spec.md](./spec.md), [plan.md](./plan.md)
- วันที่: 2569-10-26
- สรุป: 5 เฟส รวม 12 tasks; เฟสแรกที่ลองใช้งานได้คือเฟส 1 เมื่อแสดงยอดชำระเงินของ Order
- มี 1 task รอคำตอบจากทีม: T-12 รอ Q-01 เรื่องการยืนยัน Payment Gateway
- เฟส 0 เป็นฐานราก; เฟส 1–3 ครอบคลุมการแสดงยอด การสร้าง QR และผลการชำระเงิน; เฟส 4 รอการเลือก Gateway

> ใน Spec มีหัวข้อ Open Questions แต่ไม่มีรายการคำถาม ส่วน Plan ระบุว่ายังไม่เลือกชื่อ Payment Gateway และต้องรอคำตอบก่อนเชื่อมต่อ vendor จริง จึงติดตามประเด็นนี้เป็น Q-01 ตามบริบทการตัดสินใจของทีม งานในเฟสก่อนหน้าจะทดสอบด้วย Gateway จำลองเท่านั้น
>
> Plan ไม่ได้ระบุคำสั่งเปิดระบบหรือคำสั่งทดสอบ และยังไม่มี mockup; ช่องคำสั่งในจุดตรวจจึงระบุให้ทีมยืนยันแทนการคาดเดา

## เฟส 0: ฐานราก Payment (FR-13, FR-14, FR-16, FR-17, FR-18)

### T-01 สร้างโมเดลและโครง API สำหรับ Payment
- รองรับ: FR-13, FR-14, FR-15, FR-16, FR-17, FR-18, NFR-SEC-01, NFR-REL-01, NFR-REL-02
- ตรวจด้วย: ไม่มี AC ตรง ๆ เป็นงานพื้นฐานของ T-02 ถึง T-11
- ไฟล์ที่แตะ: `backend/app/main.py`, `backend/app/models/payment.py`, `backend/app/routes/payments.py`, `backend/app/services/payment_service.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: ไม่มี
- เสร็จเมื่อ: แอป FastAPI โหลดโมเดลและ route ของ Payment ได้ และข้อมูลที่บันทึกแยก payment session, transaction, reference key และสถานะตาม Entity ใน plan.md
- สถานะ: พร้อมทำ

#### จุดตรวจเฟส 0
- test ที่ต้องผ่านทั้งหมด: test การโหลดแอปและโมเดลพื้นฐาน; ยังไม่มี AC test ตรง ๆ
- เปิดระบบ: Plan ไม่ระบุคำสั่งเปิด backend/frontend ให้ทีมยืนยัน
- คนลองเองตาม FR-13:
  Given มีโครง API และโมเดล Payment
  When เริ่มแอป backend
  Then แอปโหลด route สำหรับ Payment ได้โดยไม่มีข้อผิดพลาด
- ยังขาด: การแสดงยอดชำระเงินและ Payment Gateway

## เฟส 1: ตรวจสอบยอดชำระเงินก่อนจ่าย (AC-PAYMENT-01)

### T-02 ดึงยอดชำระเงินของ Order ที่พร้อมชำระ
- รองรับ: FR-13
- ตรวจด้วย: AC-PAYMENT-01 — `test_AC_PAYMENT_01_show_order_total_before_payment`
- ไฟล์ที่แตะ: `backend/app/routes/payments.py`, `backend/app/services/payment_service.py`, `backend/tests/test_payment_flow.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-01
- เสร็จเมื่อ: API แสดง Order ID และยอดที่ถูกต้อง และปฏิเสธ Order ที่ไม่มีรายการหรือยอดไม่ถูกต้องตาม Constraint
- สถานะ: พร้อมทำ

### T-03 แสดงยอดชำระเงินก่อนเริ่ม Payment
- รองรับ: FR-13
- ตรวจด้วย: AC-PAYMENT-01 — `test_AC_PAYMENT_01_show_order_total_before_payment`
- ไฟล์ที่แตะ: `frontend/src/pages/PaymentPage.jsx`, `frontend/src/api/client.js`, `frontend/src/pages/PaymentPage.test.jsx`
- แบบหน้าจอ: ไม่มี mockup ระบุใน spec.md
- ต้องทำหลัง: T-02
- เสร็จเมื่อ: หน้าชำระเงินเรียก API ผ่าน client และแสดงยอด Order ให้ลูกค้าตรวจสอบก่อนเริ่มจ่าย โดยทดสอบหน้าจอด้วย client จำลอง
- สถานะ: พร้อมทำ

#### จุดตรวจเฟส 1
- test ที่ต้องผ่านทั้งหมด: `test_AC_PAYMENT_01_show_order_total_before_payment` ทั้ง backend และ frontend; tests ของเฟส 0 ต้องยังผ่าน
- เปิดระบบ: Plan ไม่ระบุคำสั่งเปิด backend/frontend ให้ทีมยืนยัน
- คนลองเองตาม AC-PAYMENT-01:
  Given มี Order ที่มีรายการและยอดชำระเงินถูกต้อง
  When ลูกค้าเข้าสู่หน้าชำระเงิน
  Then ระบบแสดง Order ID และยอดเงินให้ตรวจสอบก่อนชำระ
- ยังขาด: การเริ่มชำระเงินและ QR

## เฟส 2: เริ่มชำระเงินและแสดง QR (AC-PAYMENT-02, AC-PAYMENT-03)

### T-04 ส่งข้อมูลเริ่มชำระเงินไปยัง Gateway interface
- รองรับ: FR-14, FR-15, NFR-SEC-01
- ตรวจด้วย: AC-PAYMENT-02 — `test_AC_PAYMENT_02_send_payment_data_to_gateway`; AC-PAYMENT-03 — `test_AC_PAYMENT_03_show_qr_and_expiry`
- ไฟล์ที่แตะ: `backend/app/services/payment_service.py`, `backend/app/routes/payments.py`, `backend/tests/test_payment_gateway_request.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-03
- เสร็จเมื่อ: payment service ส่ง order id, amount และ reference key ผ่าน Gateway interface และรับ QR payload กับเวลาหมดอายุจาก Gateway จำลอง โดยไม่เปิดเผยข้อมูลสำคัญในผลลัพธ์สำหรับลูกค้า
- สถานะ: พร้อมทำ

### T-05 แสดง QR พร้อม Order ID ยอดเงิน และเวลา
- รองรับ: FR-15
- ตรวจด้วย: AC-PAYMENT-03 — `test_AC_PAYMENT_03_show_qr_and_expiry`
- ไฟล์ที่แตะ: `frontend/src/pages/PaymentPage.jsx`, `frontend/src/api/client.js`, `frontend/src/pages/PaymentPage.test.jsx`
- แบบหน้าจอ: ไม่มี mockup ระบุใน spec.md
- ต้องทำหลัง: T-04
- เสร็จเมื่อ: ลูกค้าเห็น QR, Order ID, ยอดเงิน และเวลาหมดอายุ 5 นาทีจากผล API โดยไม่แสดงข้อมูลสำคัญจาก Gateway
- สถานะ: พร้อมทำ

#### จุดตรวจเฟส 2
- test ที่ต้องผ่านทั้งหมด: `test_AC_PAYMENT_02_send_payment_data_to_gateway`, `test_AC_PAYMENT_03_show_qr_and_expiry`; tests ของเฟสก่อนหน้าต้องยังผ่าน
- เปิดระบบ: Plan ไม่ระบุคำสั่งเปิด backend/frontend ให้ทีมยืนยัน; ใช้ Gateway จำลองจนกว่าจะได้รับการยืนยัน vendor
- คนลองเองตาม AC-PAYMENT-03:
  Given มี Order ที่พร้อมชำระและ Gateway จำลองส่ง QR กลับมา
  When ลูกค้าเลือกชำระผ่าน QR Payment
  Then ระบบแสดง QR พร้อม Order ID ยอดเงิน และเวลาหมดอายุ 5 นาที
- ยังขาด: การเชื่อมต่อ vendor จริงรอ Q-01

## เฟส 3: ตรวจและแสดงผลการชำระเงิน (AC-PAYMENT-04 ถึง AC-PAYMENT-11)

### T-06 รับ ตรวจสอบ และบันทึกผลจาก Gateway
- รองรับ: FR-16, NFR-SEC-01, NFR-REL-01
- ตรวจด้วย: AC-PAYMENT-04 — `test_AC_PAYMENT_04_receive_payment_result`; AC-PAYMENT-08 — `test_AC_PAYMENT_08_handle_gateway_timeout`; AC-PAYMENT-09 — `test_AC_PAYMENT_09_do_not_forward_failed_order`
- ไฟล์ที่แตะ: `backend/app/routes/payments.py`, `backend/app/services/payment_service.py`, `backend/tests/test_payment_callback.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-04
- เสร็จเมื่อ: ผล success/failed/pending ที่รับจาก Gateway ถูกตรวจสอบและบันทึก โดยไม่มีผลสำเร็จที่ตรวจสอบได้ต้องไม่ยืนยันว่าชำระเงินสำเร็จ
- สถานะ: พร้อมทำ

### T-07 ยืนยัน Order เมื่อผลชำระเงินสำเร็จเท่านั้น
- รองรับ: FR-17, NFR-SEC-01, NFR-REL-01
- ตรวจด้วย: AC-PAYMENT-05 — `test_AC_PAYMENT_05_confirm_order_on_success`
- ไฟล์ที่แตะ: `backend/app/services/payment_service.py`, `backend/app/routes/payments.py`, `backend/tests/test_payment_confirmation.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-06
- เสร็จเมื่อ: ผล success ที่ตรวจสอบได้บันทึกสถานะชำระเงินและยืนยัน Order โดยข้อมูลที่ส่งให้ลูกค้าไม่เปิดเผยข้อมูลสำคัญจาก Gateway
- สถานะ: พร้อมทำ

### T-08 จัดการผล failed และ pending โดยไม่ส่ง Order ต่อ
- รองรับ: FR-18, NFR-REL-01
- ตรวจด้วย: AC-PAYMENT-06 — `test_AC_PAYMENT_06_show_pending_on_failure`; AC-PAYMENT-07 — `test_AC_PAYMENT_07_keep_order_pending_when_not_paid`; AC-PAYMENT-08 — `test_AC_PAYMENT_08_handle_gateway_timeout`; AC-PAYMENT-09 — `test_AC_PAYMENT_09_do_not_forward_failed_order`
- ไฟล์ที่แตะ: `backend/app/services/payment_service.py`, `backend/app/routes/payments.py`, `backend/tests/test_payment_callback.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-06
- เสร็จเมื่อ: failed, pending หรือ Gateway ไม่ตอบกลับไม่ยืนยัน Order และ API ส่งสถานะที่ตรงกับ Spec กลับมา
- สถานะ: พร้อมทำ

### T-09 แสดงสถานะการชำระเงินที่ไม่สำเร็จหรือยังรอผล
- รองรับ: FR-18
- ตรวจด้วย: AC-PAYMENT-06 — `test_AC_PAYMENT_06_show_pending_on_failure`; AC-PAYMENT-07 — `test_AC_PAYMENT_07_keep_order_pending_when_not_paid`; AC-PAYMENT-08 — `test_AC_PAYMENT_08_handle_gateway_timeout`; AC-PAYMENT-09 — `test_AC_PAYMENT_09_do_not_forward_failed_order`
- ไฟล์ที่แตะ: `frontend/src/pages/PaymentPage.jsx`, `frontend/src/api/client.js`, `frontend/src/pages/PaymentPage.test.jsx`
- แบบหน้าจอ: ไม่มี mockup ระบุใน spec.md
- ต้องทำหลัง: T-08
- เสร็จเมื่อ: หน้าจอแสดง “กำลังตรวจสอบการชำระเงิน” สำหรับ pending/timeout และแจ้งผล failed พร้อมทางเลือกลองใหม่หรือเช็กใหม่ โดยไม่แสดงสถานะสำเร็จผิดพลาด
- สถานะ: พร้อมทำ

### T-10 คงสถานะ timeout และห้ามสร้าง QR ใหม่
- รองรับ: FR-15, FR-18, NFR-REL-01
- ตรวจด้วย: AC-PAYMENT-10 — `test_AC_PAYMENT_10_timeout_order_and_block_retry_qr`
- ไฟล์ที่แตะ: `backend/app/services/payment_service.py`, `backend/app/routes/payments.py`, `frontend/src/pages/PaymentPage.jsx`, `backend/tests/test_payment_timeout.py`, `frontend/src/pages/PaymentPage.test.jsx`
- แบบหน้าจอ: ไม่มี mockup ระบุใน spec.md
- ต้องทำหลัง: T-04, T-06, T-09
- เสร็จเมื่อ: QR ที่ครบ 5 นาทีทำให้ Order คงสถานะ timeout และระบบปฏิเสธการสร้าง QR ใหม่ พร้อมแจ้งให้ผู้ใช้ทำรายการใหม่
- สถานะ: พร้อมทำ

### T-11 ป้องกันการบันทึกหรือยืนยันรายการชำระเงินซ้ำ
- รองรับ: NFR-REL-02
- ตรวจด้วย: AC-PAYMENT-11 — `test_AC_PAYMENT_11_idempotent_duplicate_payment`
- ไฟล์ที่แตะ: `backend/app/services/payment_service.py`, `backend/app/routes/payments.py`, `backend/tests/test_payment_idempotency.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-06, T-07
- เสร็จเมื่อ: callback ซ้ำที่ใช้ order id หรือ transaction reference เดิมไม่สร้างหรือยืนยันรายการชำระเงินซ้ำ
- สถานะ: พร้อมทำ

#### จุดตรวจเฟส 3
- test ที่ต้องผ่านทั้งหมด: `test_AC_PAYMENT_04_receive_payment_result`, `test_AC_PAYMENT_05_confirm_order_on_success`, `test_AC_PAYMENT_06_show_pending_on_failure`, `test_AC_PAYMENT_07_keep_order_pending_when_not_paid`, `test_AC_PAYMENT_08_handle_gateway_timeout`, `test_AC_PAYMENT_09_do_not_forward_failed_order`, `test_AC_PAYMENT_10_timeout_order_and_block_retry_qr`, `test_AC_PAYMENT_11_idempotent_duplicate_payment`; tests ของเฟสก่อนหน้าต้องยังผ่าน
- เปิดระบบ: Plan ไม่ระบุคำสั่งเปิด backend/frontend ให้ทีมยืนยัน; ใช้ Gateway จำลอง
- คนลองเองตาม AC-PAYMENT-05:
  Given Gateway จำลองส่งผล success ที่ตรวจสอบได้
  When ระบบรับและตรวจสอบผลการชำระเงิน
  Then ระบบบันทึกผลและยืนยัน Order โดยลูกค้าเห็นเพียงสถานะชำระเงินสำเร็จ; เมื่อเป็น failed/pending/timeout จะไม่ยืนยัน Order
- ยังขาด: การทดสอบกับ vendor จริงยังรอ Q-01

## เฟส 4: รอคำตอบ

### T-12 ยืนยัน Gateway และเชื่อมต่อผู้ให้บริการที่ทีมเลือก
- รองรับ: FR-14, FR-15, FR-16, FR-17, FR-18, NFR-SEC-01, NFR-REL-01
- ตรวจด้วย: AC-PAYMENT-02 — `test_AC_PAYMENT_02_send_payment_data_to_gateway`; AC-PAYMENT-03 — `test_AC_PAYMENT_03_show_qr_and_expiry`; AC-PAYMENT-04 — `test_AC_PAYMENT_04_receive_payment_result`; AC-PAYMENT-05 — `test_AC_PAYMENT_05_confirm_order_on_success`; AC-PAYMENT-06 — `test_AC_PAYMENT_06_show_pending_on_failure`; AC-PAYMENT-08 — `test_AC_PAYMENT_08_handle_gateway_timeout`; AC-PAYMENT-09 — `test_AC_PAYMENT_09_do_not_forward_failed_order`
- ไฟล์ที่แตะ: `backend/app/services/payment_gateway.py`, `backend/app/routes/payments.py`, `backend/tests/test_payment_gateway_integration.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-04, T-06, T-07, T-08, T-09, T-10, T-11
- เสร็จเมื่อ: หลังผู้รับผิดชอบยืนยัน vendor และขอบเขต Test Mode แล้ว adapter เชื่อมต่อกับ vendor ที่เลือกและผ่าน tests ของ AC ที่เกี่ยวข้อง โดยไม่อ้างการสมัครหรือทดสอบจริงก่อนดำเนินการ
- สถานะ: รอ Q-01

## ตารางตรวจความครบ

### Acceptance Criteria

| AC ID | task ที่ตรวจ AC นี้ |
|---|---|
| AC-PAYMENT-01 | T-02, T-03 |
| AC-PAYMENT-02 | T-04, T-11 |
| AC-PAYMENT-03 | T-04, T-05, T-11 |
| AC-PAYMENT-04 | T-06, T-11 |
| AC-PAYMENT-05 | T-07, T-11 |
| AC-PAYMENT-06 | T-08, T-09, T-12 |
| AC-PAYMENT-07 | T-08, T-09 |
| AC-PAYMENT-08 | T-06, T-08, T-09, T-12 |
| AC-PAYMENT-09 | T-06, T-08, T-09, T-12 |
| AC-PAYMENT-10 | T-10 |
| AC-PAYMENT-11 | T-11 |

### Constraints

| Constraint ID | task ที่ทำให้เป็นจริง |
|---|---|
| ไม่มี ID ใน Spec — ต้องมี Order ที่มีรายการและยอดถูกต้องก่อนชำระเงิน | T-02, T-04 |
| ไม่มี ID ใน Spec — ส่งข้อมูลผ่าน Payment Gateway ที่กำหนด | T-04, T-12 |
| ไม่มี ID ใน Spec — ตรวจสอบผล Gateway ก่อนยืนยัน Order | T-06, T-07 |
| ไม่มี ID ใน Spec — ไม่มีผลยืนยันสำเร็จต้องไม่ยืนยัน Order ว่าจ่ายแล้ว | T-06, T-08, T-09 |
| ไม่มี ID ใน Spec — ป้องกันการยืนยันชำระเงินซ้ำ | T-11 |
| ไม่มี ID ใน Spec — แสดง QR พร้อม Order ID และยอดเงิน | T-04, T-05 |
| ไม่มี ID ใน Spec — QR อายุ 5 นาทีและ Order คงสถานะ timeout | T-09 |
| ไม่มี ID ใน Spec — ห้ามสร้าง QR ใหม่หลังหมดอายุและให้ทำรายการใหม่ | T-09 |

### FR Traceability

| FR ID | AC ที่ตรวจ FR นี้ | เฟส |
|---|---|---|
| FR-13 | AC-PAYMENT-01 | เฟส 1 |
| FR-14 | AC-PAYMENT-02 | เฟส 2 |
| FR-15 | AC-PAYMENT-03, AC-PAYMENT-07, AC-PAYMENT-10 | เฟส 2, 3 |
| FR-16 | AC-PAYMENT-04 | เฟส 3 |
| FR-17 | AC-PAYMENT-05 | เฟส 3 |
| FR-18 | AC-PAYMENT-06 | เฟส 3 |

### NFR Traceability

| NFR ID | task ที่ทำให้เป็นจริง |
|---|---|
| NFR-SEC-01 | T-04, T-06, T-07, T-12 |
| NFR-REL-01 | T-06, T-07, T-08, T-10, T-12 |
| NFR-REL-02 | T-11 |

## สิ่งที่ยังไม่ทำ / Open Questions

- ใน `spec.md` มีหัวข้อ Open Questions แต่ไม่มีคำถามที่ระบุไว้
- `plan.md` ระบุว่า Payment Gateway ยังไม่ได้เลือก และการเชื่อมต่อ vendor จริงต้องรอคำตอบ จึงติดตามเป็น Q-01:
  - Q-01: ผู้รับผิดชอบยืนยัน Payment Gateway และขอบเขตการทดสอบใน Test Mode ก่อนทำ T-12
  - ข้อเสนอ Opn Payments (Omise) สำหรับสาธิตและทดสอบยังไม่ถือเป็นการอนุมัติ vendor; ต้องยืนยันกับทีม และไม่อ้างว่ามีการสมัครหรือทดสอบสำเร็จแล้ว
  - เอกสาร PromptPay ของ Opn มีตัวอย่างการใช้ test key และคำขอทดสอบ API แต่การรองรับ/เปิดใช้ PromptPay ใน Test Mode ของบัญชีและการทดสอบการชำระเงินจริงยังต้องยืนยันก่อนสรุป
- งานก่อน T-11 ใช้ Gateway จำลองเพื่อทดสอบ flow; ไม่ถือเป็นการเชื่อมต่อ Gateway จริง

> สถานะทุก task เป็น “พร้อมทำ” หรือ “รอ Q-01” เท่านั้น ไม่มีการทำเครื่องหมาย Done เพราะเอกสารนี้เป็นแผนงาน ไม่ใช่หลักฐานการ implement หรือผลทดสอบ
