# RTM: ดูรายการ Order สำหรับพนักงาน (Staff Order List)
อ้างอิง: [spec.md](./spec.md) Draft v2 | [tasks.md](./tasks.md) | [test-cases.md](./test-cases.md)
สร้างด้วย `/verify` เมื่อ 2569-10-28 14:33 | test: 182 ผ่าน 0 ไม่ผ่าน

## 1. ตามรอยไปข้างหน้า (requirement ไป โค้ด ไป test)

| ID | AC | task | โค้ด (ไฟล์: ฟังก์ชัน) | test (ผล) | สถานะ |
|---|---|---|---|---|---|
| FR-29 | AC-STAFF-ORDER-01, AC-STAFF-ORDER-06, AC-STAFF-ORDER-07 | T-02, T-03, T-14, T-15, T-16, T-17 | `backend/app/routes/staff_orders.py: list_staff_orders`, `backend/app/services/staff_order_service.py: list_staff_orders`, `frontend/src/pages/StaffOrdersPage.jsx: StaffOrdersPage` | `test_staff_orders_require_staff`, `test_AC_STAFF_ORDER_01_api_returns_staff_order_list`, `test_AC_STAFF_ORDER_06_api_empty_orders`, `test_AC_STAFF_ORDER_07_api_load_failure`, `test_AC_STAFF_ORDER_01_show_order_list_for_staff`, `test_AC_STAFF_ORDER_06_show_empty_state_when_no_new_orders`, `test_AC_STAFF_ORDER_07_show_retry_when_load_fails` (ผ่าน) | ครบ |
| FR-30 | AC-STAFF-ORDER-02 | T-04, T-05 | `backend/app/services/staff_order_service.py: list_staff_orders`, `frontend/src/pages/StaffOrdersPage.jsx: StaffOrdersPage` | `test_AC_STAFF_ORDER_02_api_order_number_and_sequence`, `test_AC_STAFF_ORDER_02_show_order_number_and_sequence` (ผ่าน) | ครบ |
| FR-31 | AC-STAFF-ORDER-03 | T-06, T-07 | `backend/app/services/staff_order_service.py: get_staff_order_details`, `frontend/src/pages/StaffOrdersPage.jsx: StaffOrdersPage` | `test_AC_STAFF_ORDER_03_api_order_details`, `test_AC_STAFF_ORDER_03_show_order_details_items_and_options` (ผ่าน) | ครบ |
| FR-32 | AC-STAFF-ORDER-04, AC-STAFF-ORDER-05 | T-08, T-09, T-12, T-13 | `backend/app/services/staff_order_service.py: list_staff_orders`, `frontend/src/pages/StaffOrdersPage.jsx: StaffOrdersPage` | `test_AC_STAFF_ORDER_04_api_current_status`, `test_AC_STAFF_ORDER_04_show_current_status_for_each_order`, `test_AC_STAFF_ORDER_05_api_order_sorting`, `test_AC_STAFF_ORDER_05_queue_is_sorted_by_created_time` (ผ่าน) | ครบ |
| FR-33 | AC-STAFF-ORDER-05 | T-12, T-13 | `backend/app/services/staff_order_service.py: list_staff_orders`, `frontend/src/pages/StaffOrdersPage.jsx: StaffOrdersPage` | `test_AC_STAFF_ORDER_05_api_order_sorting`, `test_AC_STAFF_ORDER_05_queue_is_sorted_by_created_time` (ผ่าน) | ครบ |
| NFR-USE-01 | AC-STAFF-ORDER-09 | T-10, T-11 | `backend/app/services/staff_order_service.py: list_staff_orders`, `frontend/src/pages/StaffOrdersPage.jsx: StaffOrdersPage` | `test_AC_STAFF_ORDER_09_api_visible_order_fields`, `test_AC_STAFF_ORDER_09_order_number_sequence_status_are_visible` (ผ่าน) | ครบ |
| NFR-PERF-01 | AC-STAFF-ORDER-08 | ไม่มี task (ทีมยกเว้นออกจาก prototype) | ไม่มีการใช้งานจริงในโค้ด | ไม่มี test | ยังไม่ถึง |

## 2. ตามรอยย้อนกลับ (โค้ด ไป requirement)

| โค้ด (ไฟล์: ฟังก์ชัน หรือ endpoint) | อ้าง ID | ตรงกับข้อความใน spec ไหม | หมายเหตุ |
|---|---|---|---|
| `backend/app/routes/staff_orders.py: list_staff_orders` | FR-29 | ใช่ | กรองเฉพาะพนักงานที่มีสิทธิ์และส่งข้อมูล order ที่มี payment_status = success ให้คนข้างหน้า |
| `backend/app/services/staff_order_service.py: list_staff_orders` | FR-29, FR-30, FR-32, FR-33 | ใช่ | เรียงตาม created_at, จัด Order สิ้นสุดไว้ท้าย, และส่ง `order_number` / `sequence_no` / `status` |
| `backend/app/services/staff_order_service.py: get_staff_order_details` | FR-31 | ใช่ | ส่ง `items`, `quantity`, และ `selected_options` สำหรับ Order ที่เลือก |
| `backend/app/services/staff_order_service.py: update_staff_order_status` | FR-32 | ใช่ | อัปเดตเฉพาะ next status ที่ถูกต้องตามลำดับที่อนุญาต |
| `frontend/src/pages/StaffOrdersPage.jsx: StaffOrdersPage` | FR-29, FR-30, FR-32, FR-33, NFR-USE-01 | ใช่ | แสดงหมายเลข Order, ลำดับคิว, สถานะ, ว่าง/ข้อผิดพลาด, และปุ่ม retry |
| `frontend/src/api/client.js: getStaffOrders` | FR-29 | ใช่ | เรียก API รายการ Order ของ staff แบบเข้ารหัสผู้อ่านง่าย |
| `frontend/src/api/client.js: getStaffOrderDetails` | FR-31 | ใช่ | เรียก detail ของ Order ที่เลือก |
| `frontend/src/api/client.js: updateStaffOrderStatus` | FR-32 | ใช่ | ส่ง next status ตามลำดับที่ถูกต้อง |

## 3. ข้อค้นพบ

| F-ID | ชนิด | อยู่ที่ | ขัดกับ | รายละเอียด | ทีมตัดสิน |
|---|---|---|---|---|---|
| - | - | - | - | ไม่มีข้อค้นพบใหม่จากการตรวจสรุปความสอดคล้องระหว่าง spec, โค้ด, และ test | - |

## 4. แก้แล้ว

| F-ID | แก้อย่างไร | รู้ได้อย่างไร |
|---|---|---|
| - | ไม่มีข้อค้นพบที่ต้องแก้ในรอบนี้ | ผ่าน test 182 ตัวทุกตัว |
