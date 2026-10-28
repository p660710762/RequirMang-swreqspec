# รายการงาน: ดูรายการ Order สำหรับพนักงาน (Staff Order List)

- Feature: ดูรายการ Order สำหรับพนักงาน
- Spec ID: SPEC-STAFF-ORDER-001
- อ้างอิง: [plan.md](plan.md)
- วันที่: 2569-10-27

สรุป:
- มี 10 เฟส รวม 20 task; เฟสแรกที่ลองใช้ได้จริงคือเฟส 1 เมื่อเปิดดูรายการ Order ได้
- มี 3 task ที่รอคำตอบ Open Question (spec ไม่มี Q-ID จึงอ้างตามลำดับข้อ)
- เฟส 1 เป็น vertical slice แรก แต่ยังขาดการอัปเดต Real-time ที่รอคำตอบข้อ 3

## เฟส 0: เตรียมทางเข้า API สำหรับ Staff (FR-29)

### T-01 เตรียม route รายการ Order ที่จำกัดสิทธิ์ Staff
- รองรับ: FR-29
- ตรวจด้วย: ไม่มี AC ตรง ๆ เป็นงานพื้นฐานของ T-02
- ไฟล์ที่แตะ: `backend/app/main.py`, `backend/app/routes/staff_orders.py`, `backend/app/middleware/auth_guard.py`, `tests/test_staff_orders_require_staff.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: ไม่มี
- เสร็จเมื่อ: route รายการ Order ถูก mount ใน FastAPI และคำขอที่ไม่ใช่ Staff ถูกปฏิเสธโดย test `test_staff_orders_require_staff`
- สถานะ: เสร็จ

#### จุดตรวจเฟส 0
- test ที่ต้องผ่านทั้งหมด: `test_staff_orders_require_staff`
- เปิดระบบ: คำสั่งเปิด Backend และ Frontend ไม่ได้ระบุใน plan.md
- คนลองเองตาม FR-29 (งานพื้นฐาน ไม่มี AC ตรง ๆ):
  Given ผู้ใช้ที่มีสิทธิ์ Staff และผู้ใช้ที่ไม่มีสิทธิ์ Staff
  When ทั้งสองเรียก route รายการ Order
  Then เฉพาะผู้ใช้ Staff ผ่านการตรวจสิทธิ์
- ยังขาด: ไม่มี

## เฟส 1: เปิดดูรายการ Order (AC-STAFF-ORDER-01)

### T-02 สร้าง API อ่านรายการ Order ที่ Staff เข้าถึงได้
- รองรับ: FR-29
- ตรวจด้วย: AC-STAFF-ORDER-01
- ไฟล์ที่แตะ: `backend/app/routes/staff_orders.py`, `backend/app/services/staff_order_service.py`, `tests/test_AC_STAFF_ORDER_01_api_returns_staff_order_list.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-01
- เสร็จเมื่อ: API ส่งรายการ Order ล่าสุดที่ Staff มีสิทธิ์เห็นและอยู่ในช่วงย้อนหลัง 7 วัน โดย test `test_AC_STAFF_ORDER_01_api_returns_staff_order_list` ผ่าน
- สถานะ: เสร็จ 

### T-03 แสดงรายการ Order ในหน้าพนักงาน
- รองรับ: FR-29
- ตรวจด้วย: AC-STAFF-ORDER-01
- ไฟล์ที่แตะ: `frontend/src/api/client.js`, `frontend/src/pages/StaffOrdersPage.jsx`, `frontend/src/App.jsx`, `frontend/src/__tests__/StaffOrdersPage.test.jsx`
- แบบหน้าจอ: ไม่มี (spec/plan ไม่กำหนด UI ID หรือ mockup)
- ต้องทำหลัง: T-02
- เสร็จเมื่อ: หน้าเรียก API ผ่าน `client.js` และแสดงรายการจาก client จำลอง โดย test `test_AC_STAFF_ORDER_01_show_order_list_for_staff` ผ่าน
- สถานะ: เสร็จ 

#### จุดตรวจเฟส 1
- test ที่ต้องผ่านทั้งหมด: `test_staff_orders_require_staff`, `test_AC_STAFF_ORDER_01_api_returns_staff_order_list`, `test_AC_STAFF_ORDER_01_show_order_list_for_staff`
- เปิดระบบ: คำสั่งเปิด Backend และ Frontend ไม่ได้ระบุใน plan.md
- คนลองเองตาม AC-STAFF-ORDER-01:
  Given มี Order ที่ลูกค้าสั่งอยู่ในระบบและผู้ใช้เข้าสู่ระบบเป็น Staff
  When เปิดหน้ารายการ Order
  Then เห็นรายการ Order ที่ลูกค้าสั่งเข้ามา
- ยังขาด: การอัปเดตรายการอัตโนมัติ/การแจ้งเตือนเมื่อมี Order ใหม่ รอคำตอบ Open Question ข้อ 3

## เฟส 2: ระบุหมายเลขและลำดับ Order (AC-STAFF-ORDER-02)

### T-04 ส่งหมายเลข Order และลำดับตามเวลาที่สั่ง
- รองรับ: FR-30
- ตรวจด้วย: AC-STAFF-ORDER-02
- ไฟล์ที่แตะ: `backend/app/services/staff_order_service.py`, `backend/app/routes/staff_orders.py`, `tests/test_AC_STAFF_ORDER_02_api_order_number_and_sequence.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-03
- เสร็จเมื่อ: API ส่งหมายเลข Order และลำดับตามเวลาที่สั่งเข้ามาสำหรับแต่ละรายการ และ test `test_AC_STAFF_ORDER_02_api_order_number_and_sequence` ผ่าน
- สถานะ: เสร็จ 

### T-05 แสดงหมายเลขและลำดับของแต่ละ Order
- รองรับ: FR-30
- ตรวจด้วย: AC-STAFF-ORDER-02
- ไฟล์ที่แตะ: `frontend/src/pages/StaffOrdersPage.jsx`, `frontend/src/__tests__/StaffOrdersPage.test.jsx`
- แบบหน้าจอ: ไม่มี (spec/plan ไม่กำหนด UI ID หรือ mockup)
- ต้องทำหลัง: T-04
- เสร็จเมื่อ: หน้ารายการแสดงหมายเลข Order และลำดับของแต่ละรายการ และ test `test_AC_STAFF_ORDER_02_show_order_number_and_sequence` ผ่านด้วย client จำลอง
- สถานะ: เสร็จ 

#### จุดตรวจเฟส 2
- test ที่ต้องผ่านทั้งหมด: `test_staff_orders_require_staff`, `test_AC_STAFF_ORDER_01_api_returns_staff_order_list`, `test_AC_STAFF_ORDER_01_show_order_list_for_staff`, `test_AC_STAFF_ORDER_02_api_order_number_and_sequence`, `test_AC_STAFF_ORDER_02_show_order_number_and_sequence`
- เปิดระบบ: คำสั่งเปิด Backend และ Frontend ไม่ได้ระบุใน plan.md
- คนลองเองตาม AC-STAFF-ORDER-02:
  Given ระบบมีรายการ Order
  When เปิดหน้ารายการ Order
  Then เห็นหมายเลข Order และลำดับของแต่ละ Order อย่างชัดเจน
- ยังขาด: ไม่มี

## เฟส 3: เปิดดูรายละเอียดเครื่องดื่มของ Order (AC-STAFF-ORDER-03)

### T-06 สร้าง API อ่านรายละเอียด Order
- รองรับ: FR-31
- ตรวจด้วย: AC-STAFF-ORDER-03
- ไฟล์ที่แตะ: `backend/app/routes/staff_orders.py`, `backend/app/services/staff_order_service.py`, `tests/test_AC_STAFF_ORDER_03_api_order_details.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-05
- เสร็จเมื่อ: API ส่งรายการเครื่องดื่ม จำนวน และตัวเลือกตาม Order ที่มีอยู่จริง และ test `test_AC_STAFF_ORDER_03_api_order_details` ผ่าน
- สถานะ: เสร็จ 

### T-07 แสดงรายละเอียดเครื่องดื่มเมื่อเปิด Order
- รองรับ: FR-31
- ตรวจด้วย: AC-STAFF-ORDER-03
- ไฟล์ที่แตะ: `frontend/src/api/client.js`, `frontend/src/pages/StaffOrdersPage.jsx`, `frontend/src/__tests__/StaffOrdersPage.test.jsx`
- แบบหน้าจอ: ไม่มี (spec/plan ไม่กำหนด UI ID หรือ mockup)
- ต้องทำหลัง: T-06
- เสร็จเมื่อ: เมื่อเลือกหรือเปิด Order หน้าจอแสดงเครื่องดื่ม จำนวน และตัวเลือกจาก client จำลอง และ test `test_AC_STAFF_ORDER_03_show_order_details_items_and_options` ผ่าน
- สถานะ: เสร็จ 

#### จุดตรวจเฟส 3
- test ที่ต้องผ่านทั้งหมด: `test_staff_orders_require_staff`, `test_AC_STAFF_ORDER_01_api_returns_staff_order_list`, `test_AC_STAFF_ORDER_01_show_order_list_for_staff`, `test_AC_STAFF_ORDER_02_api_order_number_and_sequence`, `test_AC_STAFF_ORDER_02_show_order_number_and_sequence`, `test_AC_STAFF_ORDER_03_api_order_details`, `test_AC_STAFF_ORDER_03_show_order_details_items_and_options`
- เปิดระบบ: คำสั่งเปิด Backend และ Frontend ไม่ได้ระบุใน plan.md
- คนลองเองตาม AC-STAFF-ORDER-03:
  Given พนักงานเลือกหรือเปิดดู Order
  When ระบบโหลดรายละเอียด Order สำเร็จ
  Then เห็นรายการเครื่องดื่ม จำนวน และตัวเลือกของเครื่องดื่มอย่างถูกต้อง
- ยังขาด: ไม่มี

## เฟส 4: ตรวจสอบสถานะปัจจุบันของ Order (AC-STAFF-ORDER-04)

### T-08 ส่งสถานะปัจจุบันของแต่ละ Order
- รองรับ: FR-32
- ตรวจด้วย: AC-STAFF-ORDER-04
- ไฟล์ที่แตะ: `backend/app/services/staff_order_service.py`, `backend/app/routes/staff_orders.py`, `tests/test_AC_STAFF_ORDER_04_api_current_status.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-07
- เสร็จเมื่อ: API ส่งสถานะปัจจุบันที่ตรงกับข้อมูล Order และ test `test_AC_STAFF_ORDER_04_api_current_status` ผ่าน
- สถานะ: เสร็จ 

### T-09 แสดงสถานะปัจจุบันในรายการ Order
- รองรับ: FR-32
- ตรวจด้วย: AC-STAFF-ORDER-04
- ไฟล์ที่แตะ: `frontend/src/pages/StaffOrdersPage.jsx`, `frontend/src/__tests__/StaffOrdersPage.test.jsx`
- แบบหน้าจอ: ไม่มี (spec/plan ไม่กำหนด UI ID หรือ mockup)
- ต้องทำหลัง: T-08
- เสร็จเมื่อ: แต่ละ Order แสดงสถานะจาก client จำลอง และ test `test_AC_STAFF_ORDER_04_show_current_status_for_each_order` ผ่าน
- สถานะ: เสร็จ 

#### จุดตรวจเฟส 4
- test ที่ต้องผ่านทั้งหมด: `test_staff_orders_require_staff`, `test_AC_STAFF_ORDER_01_api_returns_staff_order_list`, `test_AC_STAFF_ORDER_01_show_order_list_for_staff`, `test_AC_STAFF_ORDER_02_api_order_number_and_sequence`, `test_AC_STAFF_ORDER_02_show_order_number_and_sequence`, `test_AC_STAFF_ORDER_03_api_order_details`, `test_AC_STAFF_ORDER_03_show_order_details_items_and_options`, `test_AC_STAFF_ORDER_04_api_current_status`, `test_AC_STAFF_ORDER_04_show_current_status_for_each_order`
- เปิดระบบ: คำสั่งเปิด Backend และ Frontend ไม่ได้ระบุใน plan.md
- คนลองเองตาม AC-STAFF-ORDER-04:
  Given Order มีสถานะปัจจุบันอยู่ในระบบ
  When เปิดรายการ Order
  Then เห็นสถานะปัจจุบันของแต่ละ Order
- ยังขาด: ไม่มี

## เฟส 5: ระบุ Order ได้ชัดเจนจากข้อมูลบนหน้าจอ (AC-STAFF-ORDER-09)

### T-10 จัดเตรียมข้อมูลหมายเลข ลำดับ และสถานะสำหรับหน้าจอ
- รองรับ: FR-30, FR-32, NFR-USE-01
- ตรวจด้วย: AC-STAFF-ORDER-09
- ไฟล์ที่แตะ: `backend/app/routes/staff_orders.py`, `backend/app/services/staff_order_service.py`, `tests/test_AC_STAFF_ORDER_09_api_visible_order_fields.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-09
- เสร็จเมื่อ: ข้อมูลตอบกลับมีหมายเลข ลำดับ และสถานะที่หน้าใช้ระบุแต่ละ Order ได้ และ test `test_AC_STAFF_ORDER_09_api_visible_order_fields` ผ่าน
- สถานะ: เสร็จ 

### T-11 ทำให้หมายเลข ลำดับ และสถานะมองเห็นชัดเจน
- รองรับ: NFR-USE-01
- ตรวจด้วย: AC-STAFF-ORDER-09
- ไฟล์ที่แตะ: `frontend/src/pages/StaffOrdersPage.jsx`, `frontend/src/__tests__/StaffOrdersPage.test.jsx`
- แบบหน้าจอ: ไม่มี (spec/plan ไม่กำหนด UI ID หรือ mockup)
- ต้องทำหลัง: T-10
- เสร็จเมื่อ: หน้าจอแสดงหมายเลข ลำดับ และสถานะอย่างชัดเจนและ test `test_AC_STAFF_ORDER_09_order_number_sequence_status_are_visible` ผ่านด้วย client จำลอง
- สถานะ: เสร็จ 

#### จุดตรวจเฟส 5
- test ที่ต้องผ่านทั้งหมด: `test_staff_orders_require_staff`, `test_AC_STAFF_ORDER_01_api_returns_staff_order_list`, `test_AC_STAFF_ORDER_01_show_order_list_for_staff`, `test_AC_STAFF_ORDER_02_api_order_number_and_sequence`, `test_AC_STAFF_ORDER_02_show_order_number_and_sequence`, `test_AC_STAFF_ORDER_03_api_order_details`, `test_AC_STAFF_ORDER_03_show_order_details_items_and_options`, `test_AC_STAFF_ORDER_04_api_current_status`, `test_AC_STAFF_ORDER_04_show_current_status_for_each_order`, `test_AC_STAFF_ORDER_09_api_visible_order_fields`, `test_AC_STAFF_ORDER_09_order_number_sequence_status_are_visible`
- เปิดระบบ: คำสั่งเปิด Backend และ Frontend ไม่ได้ระบุใน plan.md
- คนลองเองตาม AC-STAFF-ORDER-09:
  Given พนักงานเปิดหน้ารายการ Order
  When ระบบแสดงข้อมูล Order
  Then หมายเลข Order ลำดับ และสถานะมองเห็นและระบุได้อย่างชัดเจน
- ยังขาด: ไม่มี

## เฟส 6: เรียง Order ตามเวลาที่สั่งและสถานะสิ้นสุด (AC-STAFF-ORDER-05)

### T-12 เรียง Order ใหม่ก่อนและรายการสิ้นสุดไว้ท้าย
- รองรับ: FR-33, FR-32
- ตรวจด้วย: AC-STAFF-ORDER-05
- ไฟล์ที่แตะ: `backend/app/services/staff_order_service.py`, `tests/test_AC_STAFF_ORDER_05_api_order_sorting.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-11
- เสร็จเมื่อ: API เรียง Order ตามเวลาที่สั่งล่าสุดก่อนและวาง Order สถานะ “รับสินค้าแล้ว” หรือ “ยกเลิก” ไว้ท้ายรายการโดยยังคงแสดงไว้ และ test `test_AC_STAFF_ORDER_05_api_order_sorting` ผ่าน
- สถานะ: เสร็จ 

### T-13 แสดงรายการตามลำดับที่ API ส่งกลับ
- รองรับ: FR-33
- ตรวจด้วย: AC-STAFF-ORDER-05
- ไฟล์ที่แตะ: `frontend/src/pages/StaffOrdersPage.jsx`, `frontend/src/__tests__/StaffOrdersPage.test.jsx`
- แบบหน้าจอ: ไม่มี (spec/plan ไม่กำหนด UI ID หรือ mockup)
- ต้องทำหลัง: T-12
- เสร็จเมื่อ: หน้าจอคงลำดับรายการจาก API และ test `test_AC_STAFF_ORDER_05_queue_is_sorted_by_created_time` ผ่านด้วย client จำลอง
- สถานะ: เสร็จ

#### จุดตรวจเฟส 6
- test ที่ต้องผ่านทั้งหมด: `test_staff_orders_require_staff`, `test_AC_STAFF_ORDER_01_api_returns_staff_order_list`, `test_AC_STAFF_ORDER_01_show_order_list_for_staff`, `test_AC_STAFF_ORDER_02_api_order_number_and_sequence`, `test_AC_STAFF_ORDER_02_show_order_number_and_sequence`, `test_AC_STAFF_ORDER_03_api_order_details`, `test_AC_STAFF_ORDER_03_show_order_details_items_and_options`, `test_AC_STAFF_ORDER_04_api_current_status`, `test_AC_STAFF_ORDER_04_show_current_status_for_each_order`, `test_AC_STAFF_ORDER_09_api_visible_order_fields`, `test_AC_STAFF_ORDER_09_order_number_sequence_status_are_visible`, `test_AC_STAFF_ORDER_05_api_order_sorting`, `test_AC_STAFF_ORDER_05_queue_is_sorted_by_created_time`
- เปิดระบบ: คำสั่งเปิด Backend และ Frontend ไม่ได้ระบุใน plan.md
- คนลองเองตาม AC-STAFF-ORDER-05:
  Given ระบบมี Order หลายรายการ รวม Order ที่สิ้นสุดแล้ว
  When เปิดหน้ารายการ Order
  Then เห็น Order ตามเวลาที่สั่งล่าสุดก่อน และ Order ที่สิ้นสุดอยู่ท้ายรายการ
- ยังขาด: การยืนยัน Open Question ข้อ 1 เรื่อง Order สิ้นสุด; ระหว่างรอให้ยึด FR-32/FR-33 และ Constraint ปัจจุบันที่กำหนดให้คงแสดง Order ไว้ท้ายรายการ

## เฟส 7: แสดงสถานะเมื่อไม่มี Order ใหม่ (AC-STAFF-ORDER-06)

### T-14 ส่งผลรายการว่างสำหรับหน้ารายการ Order
- รองรับ: FR-29
- ตรวจด้วย: AC-STAFF-ORDER-06
- ไฟล์ที่แตะ: `backend/app/routes/staff_orders.py`, `backend/app/services/staff_order_service.py`, `tests/test_AC_STAFF_ORDER_06_api_empty_orders.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-13
- เสร็จเมื่อ: API ส่งผลรายการว่างโดยไม่สร้างข้อมูล Order ขึ้นเอง และ test `test_AC_STAFF_ORDER_06_api_empty_orders` ผ่าน
- สถานะ: เสร็จ 

### T-15 แสดงข้อความเมื่อไม่มีรายการ Order ใหม่
- รองรับ: FR-29
- ตรวจด้วย: AC-STAFF-ORDER-06
- ไฟล์ที่แตะ: `frontend/src/pages/StaffOrdersPage.jsx`, `frontend/src/__tests__/StaffOrdersPage.test.jsx`
- แบบหน้าจอ: ไม่มี (spec/plan ไม่กำหนด UI ID หรือ mockup)
- ต้องทำหลัง: T-14
- เสร็จเมื่อ: หน้าจอแสดงข้อความหรือสถานะว่าไม่มีรายการ Order ใหม่เมื่อ client จำลองส่งรายการว่าง และ test `test_AC_STAFF_ORDER_06_show_empty_state_when_no_new_orders` ผ่าน
- สถานะ: เสร็จ 

#### จุดตรวจเฟส 7
- test ที่ต้องผ่านทั้งหมด: `test_staff_orders_require_staff`, `test_AC_STAFF_ORDER_01_api_returns_staff_order_list`, `test_AC_STAFF_ORDER_01_show_order_list_for_staff`, `test_AC_STAFF_ORDER_02_api_order_number_and_sequence`, `test_AC_STAFF_ORDER_02_show_order_number_and_sequence`, `test_AC_STAFF_ORDER_03_api_order_details`, `test_AC_STAFF_ORDER_03_show_order_details_items_and_options`, `test_AC_STAFF_ORDER_04_api_current_status`, `test_AC_STAFF_ORDER_04_show_current_status_for_each_order`, `test_AC_STAFF_ORDER_09_api_visible_order_fields`, `test_AC_STAFF_ORDER_09_order_number_sequence_status_are_visible`, `test_AC_STAFF_ORDER_05_api_order_sorting`, `test_AC_STAFF_ORDER_05_queue_is_sorted_by_created_time`, `test_AC_STAFF_ORDER_06_api_empty_orders`, `test_AC_STAFF_ORDER_06_show_empty_state_when_no_new_orders`
- เปิดระบบ: คำสั่งเปิด Backend และ Frontend ไม่ได้ระบุใน plan.md
- คนลองเองตาม AC-STAFF-ORDER-06:
  Given ยังไม่มี Order ใหม่ในระบบ
  When พนักงานเปิดหน้ารายการ Order
  Then เห็นข้อความหรือสถานะว่าไม่มีรายการ Order ใหม่
- ยังขาด: ไม่มี

## เฟส 8: แจ้งข้อผิดพลาดและลองโหลดรายการใหม่ (AC-STAFF-ORDER-07)

### T-16 จัดการการโหลดล้มเหลวโดยไม่ส่งข้อมูลไม่ยืนยัน
- รองรับ: FR-29
- ตรวจด้วย: AC-STAFF-ORDER-07
- ไฟล์ที่แตะ: `backend/app/routes/staff_orders.py`, `backend/app/services/staff_order_service.py`, `tests/test_AC_STAFF_ORDER_07_api_load_failure.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-15
- เสร็จเมื่อ: API ส่งสถานะข้อผิดพลาดเมื่อโหลดไม่สำเร็จและไม่ส่งข้อมูล Order ที่ไม่สมบูรณ์ โดย test `test_AC_STAFF_ORDER_07_api_load_failure` ผ่าน
- สถานะ: เสร็จ 

### T-17 แสดงข้อผิดพลาดและปุ่มลองใหม่
- รองรับ: FR-29
- ตรวจด้วย: AC-STAFF-ORDER-07
- ไฟล์ที่แตะ: `frontend/src/api/client.js`, `frontend/src/pages/StaffOrdersPage.jsx`, `frontend/src/__tests__/StaffOrdersPage.test.jsx`
- แบบหน้าจอ: ไม่มี (spec/plan ไม่กำหนด UI ID หรือ mockup)
- ต้องทำหลัง: T-16
- เสร็จเมื่อ: เมื่อ client จำลองโหลดล้มเหลว หน้าจอแสดงข้อความตาม AC และปุ่ม “ลองใหม่” เรียกโหลดอีกครั้ง โดย test `test_AC_STAFF_ORDER_07_show_retry_when_load_fails` ผ่าน
- สถานะ: เสร็จ 

#### จุดตรวจเฟส 8
- test ที่ต้องผ่านทั้งหมด: `test_staff_orders_require_staff`, `test_AC_STAFF_ORDER_01_api_returns_staff_order_list`, `test_AC_STAFF_ORDER_01_show_order_list_for_staff`, `test_AC_STAFF_ORDER_02_api_order_number_and_sequence`, `test_AC_STAFF_ORDER_02_show_order_number_and_sequence`, `test_AC_STAFF_ORDER_03_api_order_details`, `test_AC_STAFF_ORDER_03_show_order_details_items_and_options`, `test_AC_STAFF_ORDER_04_api_current_status`, `test_AC_STAFF_ORDER_04_show_current_status_for_each_order`, `test_AC_STAFF_ORDER_09_api_visible_order_fields`, `test_AC_STAFF_ORDER_09_order_number_sequence_status_are_visible`, `test_AC_STAFF_ORDER_05_api_order_sorting`, `test_AC_STAFF_ORDER_05_queue_is_sorted_by_created_time`, `test_AC_STAFF_ORDER_06_api_empty_orders`, `test_AC_STAFF_ORDER_06_show_empty_state_when_no_new_orders`, `test_AC_STAFF_ORDER_07_api_load_failure`, `test_AC_STAFF_ORDER_07_show_retry_when_load_fails`
- เปิดระบบ: คำสั่งเปิด Backend และ Frontend ไม่ได้ระบุใน plan.md
- คนลองเองตาม AC-STAFF-ORDER-07:
  Given พนักงานเปิดหน้ารายการ Order
  When ระบบไม่สามารถโหลดข้อมูล Order ได้
  Then เห็นข้อความว่าไม่สามารถโหลดรายการ Order ได้และมีปุ่ม “ลองใหม่” เพื่อเรียกข้อมูลอีกครั้ง
- ยังขาด: ไม่มี

## เฟส 9: รอคำตอบ Open Questions

### T-18 ยืนยันพฤติกรรม Order หลังสิ้นสุด
- รองรับ: FR-32, FR-33
- ตรวจด้วย: ไม่มี AC ตรง ๆ เป็นงานรอคำตอบ Open Question ข้อ 1
- ไฟล์ที่แตะ: `specs/007-StaffOrder/spec.md`, `specs/007-StaffOrder/plan.md` (แก้ตามคำตัดสินของทีมเท่านั้น)
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: ไม่มี
- เสร็จเมื่อ: ทีมยืนยันว่าจะลบหรือคง Order ที่สิ้นสุด และบันทึกคำตัดสินใน spec/plan ก่อนปรับ task หรือพฤติกรรมระบบ; ระหว่างรอให้ยึดข้อกำหนด v2 ที่ระบุว่าคงแสดงไว้ท้ายรายการ
- สถานะ: รอ Open Question ข้อ 1 (spec ไม่มี Q-ID)

### T-19 ยืนยันขอบเขตการดู Order ที่เกิน 7 วัน
- รองรับ: FR-29
- ตรวจด้วย: ไม่มี AC ตรง ๆ เป็นงานรอคำตอบ Open Question ข้อ 2
- ไฟล์ที่แตะ: `specs/007-StaffOrder/spec.md`, `specs/007-StaffOrder/plan.md` (แก้ตามคำตัดสินของทีมเท่านั้น)
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: ไม่มี
- เสร็จเมื่อ: ทีมระบุเงื่อนไขสิทธิ์หรือช่วงเวลาสำหรับ Order ที่เกิน 7 วันใน spec ก่อนขยายการกรองหรือการแสดงผล; ระหว่างรอให้จำกัดการดูย้อนหลังตาม Constraint ปัจจุบัน
- สถานะ: รอ Open Question ข้อ 2 (spec ไม่มี Q-ID)

### T-20 ยืนยันวิธีอัปเดต/แจ้งเมื่อมี Order ใหม่
- รองรับ: FR-29
- ตรวจด้วย: ไม่มี AC ตรง ๆ เป็นงานรอคำตอบ Open Question ข้อ 3
- ไฟล์ที่แตะ: `specs/007-StaffOrder/spec.md`, `specs/007-StaffOrder/plan.md`, `backend/app/services/staff_order_service.py`, `frontend/src/api/client.js`, `frontend/src/pages/StaffOrdersPage.jsx`
- แบบหน้าจอ: ไม่มี (spec/plan ไม่กำหนด UI ID หรือ mockup)
- ต้องทำหลัง: ไม่มี
- เสร็จเมื่อ: ทีมตัดสินวิธีอัปเดตรายการหรือแจ้งเตือนและบันทึกคำตอบใน spec/plan ก่อนทำกลไกจริง; ระหว่างรอไม่เพิ่มรูปแบบแจ้งเตือนที่ spec ไม่ได้กำหนด
- สถานะ: รอ Open Question ข้อ 3 (spec ไม่มี Q-ID)

## ตารางตรวจความครบ

### Acceptance Criteria

| AC ID | task ที่ตรวจ AC นี้ |
|---|---|
| AC-STAFF-ORDER-01 | T-02, T-03 |
| AC-STAFF-ORDER-02 | T-04, T-05 |
| AC-STAFF-ORDER-03 | T-06, T-07 |
| AC-STAFF-ORDER-04 | T-08, T-09 |
| AC-STAFF-ORDER-05 | T-12, T-13 |
| AC-STAFF-ORDER-06 | T-14, T-15 |
| AC-STAFF-ORDER-07 | T-16, T-17 |
| AC-STAFF-ORDER-08 | ไม่รวมใน prototype ตามคำตัดสินของทีม; ไม่มี task |
| AC-STAFF-ORDER-09 | T-10, T-11 |

### Constraints

| Constraint ID | task ที่ทำให้เป็นจริง |
|---|---|
| ไม่มี ID ใน spec: ผู้ใช้งานต้องเข้าสู่ระบบและมีสิทธิ์เป็น Staff ก่อนเข้าถึงรายการ Order | T-01 |
| ไม่มี ID ใน spec: ระบบต้องแสดงเฉพาะ Order ที่พนักงานมีสิทธิ์เข้าถึง | T-02 |
| ไม่มี ID ใน spec: รายการ Order ต้องแสดงข้อมูลจากระบบที่เป็นข้อมูลล่าสุด | T-02, T-03 |
| ไม่มี ID ใน spec: รายละเอียดของ Order ต้องตรงกับรายการที่ลูกค้าสั่ง | T-06, T-07 |
| ไม่มี ID ใน spec: หากโหลดข้อมูลไม่ได้ ห้ามแสดงข้อมูลที่ไม่สมบูรณ์หรือไม่ยืนยัน | T-16, T-17 |
| ไม่มี ID ใน spec: ลำดับของ Order คือ ลำดับตามเวลาที่สั่งเข้ามา | T-04, T-12 |
| ไม่มี ID ใน spec: Order “รับสินค้าแล้ว” หรือ “ยกเลิก” คงแสดงและวางท้ายรายการตามสถานะ | T-12, T-18 |
| ไม่มี ID ใน spec: ระบบต้องอัปเดตรายการ Order แบบ Real-time เมื่อมี Order ใหม่ | T-20 (รอคำตอบ Open Question ข้อ 3) |
| ไม่มี ID ใน spec: พนักงานดู Order ย้อนหลังได้ภายใน 7 วัน | T-02, T-19 |

### FR

| FR ID | AC ที่ตรวจ FR นี้ | เฟส |
|---|---|---|
| FR-29 | AC-STAFF-ORDER-01, AC-STAFF-ORDER-06, AC-STAFF-ORDER-07 | เฟส 1, 7, 8 |
| FR-30 | AC-STAFF-ORDER-02 | เฟส 2 |
| FR-31 | AC-STAFF-ORDER-03 | เฟส 3 |
| FR-32 | AC-STAFF-ORDER-04, AC-STAFF-ORDER-05 | เฟส 4, 6 |
| FR-33 | AC-STAFF-ORDER-05 | เฟส 6 |

หมายเหตุ: ทีมยืนยันว่าไม่รวมการทดสอบ AC-STAFF-ORDER-08 และ NFR-22 ใน prototype จึงไม่มี task สำหรับข้อเหล่านี้ แม้ spec ปัจจุบันยังระบุข้อกำหนดดังกล่าว; ควรปรับ spec ให้ตรงกับขอบเขต prototype ก่อนใช้เป็น baseline

## สิ่งที่ยังไม่ทำ

- หลังจาก Order สิ้นสุดแล้ว ควรมีการลบออกจากหน้ารายการหรือให้คงไว้และแสดงเป็นสถานะสุดท้ายต่อไป — รอคำตอบ Open Question ข้อ 1; task T-18. ข้อกำหนด v2 ปัจจุบันระบุให้คงแสดง Order ที่สิ้นสุดไว้ท้ายรายการ
- มีเงื่อนไขทางสิทธิ์หรือช่วงเวลาใดบ้างที่อนุญาตให้พนักงานเห็น Order เก่าเกิน 7 วัน — รอคำตอบ Open Question ข้อ 2; task T-19. ระหว่างนี้ใช้ Constraint ปัจจุบันที่ให้ดูย้อนหลังได้ภายใน 7 วัน
- ระบบควรมีการแจ้งเตือนหลังกดใหม่เข้ามาหรือใช้การแสดงรายการอัตโนมัติอย่างไร — รอคำตอบ Open Question ข้อ 3; task T-20. ระหว่างนี้ยังไม่เพิ่มรูปแบบการแจ้งเตือนที่ spec ไม่ได้กำหนด
- การทดสอบ AC-STAFF-ORDER-08 และ NFR-22 ไม่รวมใน prototype ตามคำตัดสินของทีม; spec ยังระบุข้อกำหนดดังกล่าวและควรปรับให้ตรงกับขอบเขตที่ยืนยัน

ข้อสังเกตเพื่อทีม: Constraints ใน spec ไม่มี Constraint ID และไม่มี mockup/UI ID; งานจึงอ้างข้อความ Constraint เดิมโดยไม่สร้าง ID ส่วน plan.md ไม่ระบุคำสั่งเปิด Backend/Frontend ซึ่งจำเป็นต้องกำหนดก่อนจุดตรวจที่ให้ลองระบบจริง
