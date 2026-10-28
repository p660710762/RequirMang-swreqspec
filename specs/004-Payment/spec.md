# Feature: ชำระเงินออนไลน์ (Online Payment)
Spec ID: SPEC-PAYMENT-001 | Source: SRS v0.1 ข้อ 3.4 (FR-PAYMENT) | Use case: UC-04  
Owner: <ทีม/คน> | Status: Draft v2 | Updated: 2569-09-18  
Depends on: SPEC-ORDER-001 | Reviewed by: -

## Goal
นักศึกษา / ลูกค้า สามารถชำระเงินสำหรับ Order ที่สร้างไว้ผ่านช่องทางออนไลน์
โดยระบบส่งข้อมูลการชำระเงินไปยัง Payment Gateway และตรวจสอบผลการชำระเงิน
ก่อนยืนยันสถานะ Order เพื่อให้คำสั่งซื้อดำเนินการต่อได้อย่างถูกต้อง

## Scope
### In scope
- แสดงยอดชำระเงินของ Order
- ส่งข้อมูลการชำระเงินไปยัง Payment Gateway
- รองรับการชำระเงินผ่าน QR Payment
- รับผลการชำระเงินจาก Payment Gateway
- ตรวจสอบสถานะการชำระเงิน
- บันทึกผลการชำระเงิน
- ยืนยัน Order เมื่อชำระเงินสำเร็จ
- แจ้งผลการชำระเงินให้ผู้ใช้ทราบ

### Out of scope
- การสร้าง Order
- การแก้ไขรายการสินค้าใน Order
- การจัดการเมนู ราคา และโปรโมชั่น
- การจัดการ Payment Gateway
- การคืนเงิน (Refund)
- การยกเลิก Order หลังชำระเงินสำเร็จ
- การจัดการ Order ของพนักงาน
- การดูรายงานยอดขายและสถิติ

## Constraints
- ผู้ใช้ต้องมี Order ที่มีรายการสินค้าและยอดชำระเงินถูกต้องก่อนเข้าสู่ขั้นตอนการชำระเงิน
- ระบบต้องส่งข้อมูลการชำระเงินผ่านช่องทาง Payment Gateway ที่กำหนด
- ระบบต้องตรวจสอบผลการชำระเงินจาก Payment Gateway ก่อนยืนยัน Order
- หากไม่ได้รับการยืนยันว่าชำระเงินสำเร็จ ระบบต้องไม่ยืนยัน Order ว่าชำระเงินแล้ว
- ระบบต้องป้องกันการยืนยันการชำระเงินซ้ำสำหรับ Order เดิม
- ในต้นแบบที่ยังไม่เชื่อม Payment Gateway อนุญาตให้จำลองผลชำระเงินสำเร็จได้เฉพาะ development/test โดยต้องระบุชัดว่าเป็นการจำลอง ไม่ใช่การเรียกเก็บเงินจริง และห้ามเปิดใช้ใน production
- ระบบแสดง QR code ภายในเวลาที่กำหนด พร้อม Order ID และยอดเงิน เพื่อให้ลูกค้าสแกนชำระเงิน
- QR Payment มีอายุ 5 นาที และเมื่อหมดอายุ Order จะถูกคงสถานะ timeout
- ผู้ใช้ไม่สามารถสร้าง QR ใหม่ได้ และต้องทำรายการใหม่อีกครั้งเมื่อ QR หมดอายุ

## Requirements
- FR-13  
  ระบบต้องแสดงยอดชำระเงินของ Order ให้ผู้ใช้ตรวจสอบก่อนดำเนินการชำระเงิน

- FR-14  
  ระบบต้องส่งข้อมูลที่จำเป็นสำหรับการชำระเงินไปยัง Payment Gateway
  โดยระบบส่ง order id, amount, และ reference key ไปยัง Payment Gateway ตามมาตรฐานทั่วไป

- FR-15  
  ผู้ใช้สามารถเลือกชำระเงินผ่าน QR Payment และดำเนินการชำระเงินตามขั้นตอนของ Payment Gateway ได้
  ระบบต้องแสดง QR code ภายในเวลาที่กำหนด พร้อม Order ID และยอดเงิน เพื่อให้ลูกค้าสแกนชำระเงิน
  QR Payment มีอายุ 5 นาที และเมื่อหมดอายุ Order จะถูกคงสถานะ timeout

- FR-16  
  ระบบต้องรับและตรวจสอบผลการชำระเงินจาก Payment Gateway

- FR-17  
  เมื่อ Payment Gateway ยืนยันว่าการชำระเงินสำเร็จ ระบบต้องบันทึกสถานะการชำระเงินและยืนยัน Order
  ลูกค้ามีแค่สถานะชำระเงินสำเร็จ และไม่เห็นข้อมูลสำคัญจาก Payment Gateway

- FR-18  
  เมื่อการชำระเงินไม่สำเร็จ ระบบต้องแจ้งผลให้ผู้ใช้ทราบ และต้องไม่ยืนยัน Order ว่าชำระเงินสำเร็จ
  ระบบแสดง “กำลังตรวจสอบการชำระเงิน” และให้ผู้ใช้ลองใหม่หรือเช็กใหม่อีกครั้ง

### Alternative Flow Requirement

- FR-15 / UC-04 Alternative Flow 4a  
  หากลูกค้ายังไม่ชำระเงิน ระบบต้องคง Order ไว้รอการยืนยันการชำระเงิน และยังไม่ยืนยัน Order ว่าชำระเงินสำเร็จ

### Exception Flow Requirement

- UC-04 Exception Flow 5a  
  หาก Payment Gateway ไม่ตอบกลับ ระบบต้องไม่ยืนยันว่าการชำระเงินสำเร็จ และแสดงสถานะให้ผู้ใช้ตรวจสอบการชำระเงินอีกครั้ง
  โดยแสดงข้อความ “กำลังตรวจสอบการชำระเงิน” และให้ลองใหม่หรือเช็กใหม่อีกครั้ง

- UC-04 Exception Flow 5b  
  หาก Payment Gateway แจ้งว่าการชำระเงินไม่สำเร็จ ระบบต้องแจ้งผลให้ผู้ใช้ทราบ และไม่ส่ง Order ไปขั้นตอนถัดไป

- UC-04 Exception Flow 5c  
  หาก QR Payment หมดอายุ ระบบต้องคง Order ไว้ในสถานะ timeout และไม่สามารถสร้าง QR ใหม่ได้ ให้ผู้ใช้ทำรายการใหม่อีกครั้ง

## Quality Requirements
- NFR-SEC-01  
  ข้อมูลการชำระเงินต้องถูกส่งและจัดการอย่างปลอดภัย โดยระบบต้องไม่แสดงข้อมูลการชำระเงินที่เป็นข้อมูลสำคัญเกินความจำเป็นแก่ผู้ใช้หรือบุคคลที่ไม่เกี่ยวข้อง

- NFR-REL-01  
  ระบบต้องไม่ยืนยันสถานะการชำระเงินหากไม่ได้รับผลยืนยันการชำระเงินที่สำเร็จจาก Payment Gateway

- NFR-REL-02  
  ระบบต้องป้องกันการบันทึกหรือยืนยันการชำระเงินซ้ำสำหรับ Order เดิม

## Acceptance Criteria

- [ ] AC-PAYMENT-01 (FR-13)

  Given ลูกค้ามี Order ที่ต้องชำระเงิน  
  When ลูกค้าเข้าสู่หน้าชำระเงิน  
  Then ระบบแสดงยอดชำระเงินของ Order ให้ลูกค้าตรวจสอบก่อนชำระเงิน

- [ ] AC-PAYMENT-02 (FR-14)

  Given ลูกค้ายืนยันว่าต้องการชำระเงิน  
  When ระบบเริ่มกระบวนการชำระเงิน  
  Then ระบบส่งข้อมูลที่จำเป็นไปยัง Payment Gateway
  And ระบบส่ง order id, amount, และ reference key ไปยัง Payment Gateway ตามมาตรฐานทั่วไป

- [ ] AC-PAYMENT-03 (FR-15)

  Given ระบบรองรับ QR Payment  
  When ลูกค้าเลือกชำระเงินผ่าน QR Payment  
  Then ระบบแสดง QR code ภายในเวลาที่กำหนด พร้อม Order ID และยอดเงิน เพื่อให้ลูกค้าสแกนชำระเงิน
  And QR Payment มีอายุ 5 นาที

- [ ] AC-PAYMENT-04 (FR-16)

  Given ลูกค้าดำเนินการชำระเงินผ่าน Payment Gateway แล้ว  
  When Payment Gateway ส่งผลการชำระเงินกลับมายังระบบ  
  Then ระบบตรวจสอบและบันทึกผลการชำระเงิน

- [ ] AC-PAYMENT-05 (FR-17)

  Given ลูกค้ามี Order ที่ต้องชำระเงิน  
  When Payment Gateway ยืนยันว่าการชำระเงินสำเร็จ  
  Then ระบบบันทึกสถานะการชำระเงินเป็นสำเร็จและยืนยัน Order
  And ลูกค้ามีแค่สถานะชำระเงินสำเร็จ และไม่เห็นข้อมูลสำคัญจาก Payment Gateway

- [ ] AC-PAYMENT-06 (FR-18)

  Given ลูกค้ามี Order ที่ต้องชำระเงิน  
  When Payment Gateway แจ้งว่าการชำระเงินไม่สำเร็จ  
  Then ระบบแจ้งผลการชำระเงินให้ลูกค้าทราบ และไม่ยืนยัน Order ว่าชำระเงินสำเร็จ
  And ระบบแสดง “กำลังตรวจสอบการชำระเงิน” และให้ผู้ใช้ลองใหม่หรือเช็กใหม่อีกครั้ง

- [ ] AC-PAYMENT-07 (UC-04 Alternative Flow 4a)

  Given ลูกค้าเริ่มกระบวนการชำระเงินแล้ว  
  When ลูกค้ายังไม่ชำระเงิน  
  Then ระบบคง Order ไว้รอการยืนยันการชำระเงิน และไม่ยืนยัน Order ว่าชำระเงินสำเร็จ

- [ ] AC-PAYMENT-08 (UC-04 Exception Flow 5a)

  Given ระบบกำลังรอผลจาก Payment Gateway  
  When Payment Gateway ไม่ตอบกลับ  
  Then ระบบไม่ยืนยันว่าการชำระเงินสำเร็จ และแสดงสถานะให้ลูกค้าตรวจสอบการชำระเงินอีกครั้ง
  And แสดงข้อความ “กำลังตรวจสอบการชำระเงิน”

- [ ] AC-PAYMENT-09 (UC-04 Exception Flow 5b)

  Given ระบบได้รับผลจาก Payment Gateway  
  When Payment Gateway แจ้งว่าการชำระเงินไม่สำเร็จ  
  Then ระบบแจ้งผลให้ลูกค้าทราบและไม่ส่ง Order ไปยังขั้นตอนถัดไป

- [ ] AC-PAYMENT-10 (UC-04 Exception Flow 5c)

  Given QR Payment หมดอายุแล้ว  
  When ระบบตรวจสอบสถานะ QR  
  Then Order ถูกคงสถานะ timeout
  And ไม่สามารถสร้าง QR ใหม่ได้
  And ผู้ใช้ต้องทำรายการใหม่อีกครั้ง

- [ ] AC-PAYMENT-11 (NFR-REL-02)

  Given Order เดิมได้รับการยืนยันการชำระเงินสำเร็จแล้ว  
  When ระบบได้รับข้อมูลการชำระเงินซ้ำสำหรับ Order เดิม  
  Then ระบบต้องไม่สร้างหรือยืนยันรายการชำระเงินซ้ำ
  And ระบบจะยึด order id / transaction reference เป็น key ป้องกันการยืนยันซ้ำ

## Assumptions and Open Questions

### Assumptions
- ASM-01  
  ลูกค้ามี Order ที่สร้างสำเร็จแล้วก่อนเข้าสู่ขั้นตอนการชำระเงิน

- ASM-02  
  Payment Gateway เป็นผู้ให้บริการภายนอกสำหรับประมวลผลการชำระเงิน

- ASM-03  
  ระบบรองรับการชำระเงินผ่าน QR Payment

- ASM-04  
  ระบบจะยืนยัน Order เฉพาะเมื่อได้รับผลการชำระเงินสำเร็จจาก Payment Gateway

- ASM-05  
  หาก Payment Gateway ไม่ตอบกลับ ระบบจะไม่ถือว่าการชำระเงินสำเร็จโดยอัตโนมัติ

- ASM-06  
  ลูกค้าสามารถกลับมาดำเนินการชำระเงินใหม่ได้ หากการชำระเงินครั้งก่อนยังไม่สำเร็จ

- ASM-07  
  QR Payment มีอายุ 5 นาที และเมื่อหมดอายุ Order จะถูกคงสถานะ timeout

- ASM-08  
  เมื่อ QR Payment หมดอายุ ผู้ใช้ไม่สามารถสร้าง QR ใหม่ได้ และต้องทำรายการใหม่อีกครั้ง

- ASM-09  
  ระบบจะยึด order id / transaction reference เป็น key ป้องกันการยืนยันซ้ำ

- ASM-10  
  ลูกค้ามีแค่สถานะชำระเงินสำเร็จ และไม่เห็นข้อมูลสำคัญจาก Payment Gateway

### Open Questions

## Traceability

| SRS / Use Case | spec.md | Acceptance Criteria |
|---|---|---|
| UC-04 Main Flow ขั้น 1 | FR-13 | AC-PAYMENT-01 |
| UC-04 Main Flow ขั้น 2 | FR-14 | AC-PAYMENT-02 |
| UC-04 Main Flow ขั้น 3 | FR-15 | AC-PAYMENT-03 |
| UC-04 Main Flow ขั้น 4-5 | FR-16 | AC-PAYMENT-04 |
| UC-04 Main Flow ขั้น 6-8 | FR-17 | AC-PAYMENT-05 |
| UC-04 Main Flow ขั้น 7 | FR-18 | AC-PAYMENT-06 |
| UC-04 Alternative Flow 4a | Alternative Flow Requirement | AC-PAYMENT-07 |
| UC-04 Exception Flow 5a | Exception Flow Requirement | AC-PAYMENT-08 |
| UC-04 Exception Flow 5b | Exception Flow Requirement | AC-PAYMENT-09 |
| UC-04 Exception Flow 5c | Exception Flow Requirement | AC-PAYMENT-10 |
| NFR ด้าน Security | NFR-SEC-01 | — |
| NFR ด้าน Reliability | NFR-REL-01 | — |
| NFR ด้าน Reliability | NFR-REL-02 | AC-PAYMENT-11 |

## Changelog
- v2 2569-09-18 ปรับความชัดเจนตามคำตอบของทีม: QR timeout 5 นาที, ไม่สามารถสร้าง QR ใหม่, order id/transaction reference สำหรับป้องกัน duplicate, และข้อความสถานะชำระเงิน
- v1 2569-09-18 ร่างจาก UC-04 ชำระเงินออนไลน์ โดยครอบคลุม Payment Gateway, QR Payment, การตรวจสอบผลการชำระเงิน และการยืนยัน Order