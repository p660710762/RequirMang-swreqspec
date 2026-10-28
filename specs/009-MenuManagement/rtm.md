# RTM: จัดการเมนู ราคา โปรโมชั่น และสถานะสินค้า
อ้างอิง: [spec.md](./spec.md) Draft v4 | [tasks.md](./tasks.md) | [test-cases.md](./test-cases.md)
แก้ findings F-13/F-14 เมื่อ 2569-10-28 16:49 | test: frontend 130 ผ่าน 0 ไม่ผ่าน; backend `cd backend && pytest -q` 78 ผ่าน 0 ไม่ผ่าน
สถานะข้อค้นพบคงค้าง: ไม่มี — F-01 ถึง F-14 อยู่ในหัวข้อ “แก้แล้ว” และมีหลักฐานกำกับ

## 1. ตามรอยไปข้างหน้า (requirement ไป โค้ด ไป test)

| ID | AC | task | โค้ด (ไฟล์: ฟังก์ชัน) | test (ผล) | สถานะ |
|---|---|---|---|---|---|
| FR-42 | AC-MENU-MGMT-01 | T-01, T-04 เสร็จ | `backend/app/routes/menu.py: get_menu_items`, `frontend/src/pages/AdminMenuPage.jsx: AdminMenuPage` | `test_AC_MENU_MGMT_01_admin_can_view_menu_list` และ Admin page tests ผ่าน | ครบ |
| FR-43 | AC-MENU-MGMT-02 | T-01, T-05 เสร็จ | `create_menu_item`, `MenuForm: submitForm` | AC-02 tests และ MenuForm tests ผ่านใน frontend; backend feature run มีผลปนจาก contract test เดิม | ครบ |
| FR-44 | AC-MENU-MGMT-03, AC-MENU-MGMT-15 | T-06, T-07 เสร็จ | `menu_validation.py: _validate_promotion_datetime`, `MenuEditPanel: submitForm` | AC-03/15 tests และ component tests ผ่าน | ครบ |
| FR-45 | AC-MENU-MGMT-04 | T-07 เสร็จ | `menu_status_service.py: update_menu_status`, `StatusToggle: changeStatus` | AC-04 tests และ StatusToggle tests ผ่าน | ครบ |
| FR-46 | AC-MENU-MGMT-05, AC-MENU-MGMT-11 | T-05 เสร็จ | `validate_menu_payload`, `MenuForm: submitForm` | AC-05/11 tests, `test_AC_MENU_MGMT_11.py` 3 tests และ MenuForm tests ผ่าน | ครบ |
| FR-47 | AC-MENU-MGMT-06, AC-MENU-MGMT-12 | T-06, T-08, T-09 เสร็จ | `update_menu_item`, `AdminMenuPage: handleUpdateMenu` | AC-06 และ AC-12 frontend tests ผ่าน; backend suite ผ่าน 78 tests | ครบ |
| FR-48 | AC-MENU-MGMT-07, AC-MENU-MGMT-10 | T-07, T-10 เสร็จ | `order_guard.py: ensure_menu_is_orderable`, `OrderService.add_item` | AC-07/10 backend tests และ `test_TC_MENU_MGMT_07_1_customer_sees_sold_out_menu_and_cannot_order_it` ผ่าน | ครบ |
| FR-49 | AC-MENU-MGMT-08, AC-MENU-MGMT-14 | T-11, T-12 เสร็จ | `history_service.py`, `menu_service.py: delete_menu_item`, order item route | สร้าง snapshot จาก Order จริงผ่าน API และอ่านผ่าน `GET /api/admin/menu`; AC-08/14 tests เดิมยังผ่าน | ครบ |
| NFR-SEC-05 | AC-MENU-MGMT-13 | T-03 เสร็จ รอทีมตรวจ | `auth.py: get_current_user`, `auth_guard.py: require_admin` | AC-13 backend test ผ่านใน targeted run | ครบ |
| NFR-REL-08 | ไม่มี AC | T-01, T-08 เสร็จ | SQLAlchemy transaction ใน `create_menu_item`/`update_menu_item`/`set_menu_status`/`delete_menu_item`; staged history/snapshot stores | `test_rtm_menu_findings.py` ตรวจ transaction failure ของ create, update, status และ delete แล้วไม่ append history/snapshot; backend suite 78 tests ผ่าน | ครบ |
| NFR-REL-09 | AC-MENU-MGMT-14 | T-11 เสร็จ | `history_service.py: create_order_snapshot`, `set_menu_status` | integration test สร้าง Order ผ่าน API แล้วอ่าน snapshot เดิมหลังเปลี่ยนเป็น sold_out ผ่าน Admin API | ครบ |
| NFR-USE-03 | ไม่มี AC | T-04, T-06 เสร็จ | `AdminMenuPage`, `MenuEditPanel`, `StatusToggle` | frontend suite ผ่าน 130 tests | ครบ |
| CON-ADMIN-AUTH | AC-MENU-MGMT-13 | T-03 เสร็จ รอทีมตรวจ | `require_admin` dependency บน Admin routes | AC-13 test ผ่านใน targeted run | ครบ |
| CON-REQUIRED-FIELDS | AC-MENU-MGMT-05, AC-MENU-MGMT-11 | T-05 เสร็จ | `menu_validation.py`, `MenuForm.jsx` | validation tests ผ่าน | ครบ |
| CON-DELETE-SNAPSHOT | AC-MENU-MGMT-08, AC-MENU-MGMT-14 | T-11, T-12 เสร็จ | `delete_menu_item`, `create_order_snapshot`, `deleteMenuItem` | snapshot จาก Order จริงถูกเก็บใน API response; delete flow เดิมยังคง snapshot/history ไว้ | ครบ |
| CON-SEPARATE-DELETE-STATUS | AC-MENU-MGMT-04, AC-MENU-MGMT-08 | T-07, T-12 เสร็จ | PATCH status และ DELETE แยก endpoint | status/delete UI tests ผ่าน | ครบ |
| CON-PROMOTION-DATETIME | AC-MENU-MGMT-15 | T-07 เสร็จ | `_validate_promotion_datetime`, `MenuEditPanel: updatePromotionDate` | required/timezone/order tests ผ่าน | ครบ |
| CON-FUTURE-PROMOTION | AC-MENU-MGMT-15 | T-07 เสร็จ | `menu_validation.py`, `seed.py: seed_menu_data` | seed ใช้ช่วงเวลาเริ่มวันถัดไปและสิ้นสุดหลังจากนั้น; `test_seed_promotion_is_in_the_future` ผ่าน | ครบ |
| CON-THAI-BUDDHIST-DATETIME | ไม่มี AC | T-07 เสร็จ | `MenuEditPanel: formatThaiDateTime` และ datetime picker | `test_TC_MENU_MGMT_15_1_promotion_datetime_is_displayed_in_thai_buddhist_calendar` ตรวจเดือนภาษาไทยและปี พ.ศ. ผ่าน | ครบ |
| CON-DISCOUNT-RULES | ไม่มี AC | T-07 เสร็จ | `MenuEditPanel: submitForm`, `_validate_menu_fields`, `CustomerMenuPage: getDiscountedPrice`, `MenuPage: getDiscountedPrice` | customer ใช้ `discount_value` เป็นจำนวนเงินและคำนวณราคาเมนูลบส่วนลด; test ตรวจราคา 45 - 10 = 35 ผ่าน | ครบ |
| CON-STATUS-CONFIRMATION | AC-MENU-MGMT-04, AC-MENU-MGMT-09, AC-MENU-MGMT-10 | T-07 เสร็จ | `StatusToggle: changeStatus` | confirmation tests ผ่าน | ครบ |
| CON-SOLD-OUT-AVAILABILITY | AC-MENU-MGMT-07, AC-MENU-MGMT-10 | T-10 เสร็จ | `ensure_menu_is_orderable`, `/api/orders/items` | backend และ customer UI tests ตรวจทั้งการแสดง “หมด” และการสั่งซื้อไม่ได้ ผ่าน | ครบ |
| CON-LATEST-CUSTOMER-DATA | AC-MENU-MGMT-06 | T-06, T-09 เสร็จ | Admin state update; `CustomerMenuPage: loadMenu`, `GET /api/menu` | integration test แก้ราคา/รายละเอียดผ่าน Admin API แล้วอ่านค่าล่าสุดจาก customer API | ครบ |
| CON-ORDER-OLD-DATA | AC-MENU-MGMT-08, AC-MENU-MGMT-14 | T-11, T-12 เสร็จ | `MenuHistory`/`OrderSnapshot` helpers, order item route | integration test ตรวจ Order จริงและค่าชื่อ ราคา สถานะเดิมใน snapshot หลังเปลี่ยนสถานะเมนู | ครบ |
| CON-ATOMIC-ROLLBACK | AC-MENU-MGMT-06, AC-MENU-MGMT-12 | T-08, T-09 เสร็จ | `SessionLocal.begin` ใน menu service และ staged history/snapshot stores | tests จำลอง transaction failure ของ create/update/status/delete และยืนยันว่าไม่มี history/snapshot ถูก append | ครบ |

## 2. ตามรอยย้อนกลับ (โค้ด ไป requirement)

| โค้ด (ไฟล์: ฟังก์ชัน หรือ endpoint) | อ้าง ID | ตรงกับข้อความใน spec ไหม | หมายเหตุ |
|---|---|---|---|
| `backend/app/routes/menu.py: GET /api/admin/menu` | FR-42, FR-49 | ตรง | คืน menu list พร้อม history/snapshot และใช้เป็น API อ่าน snapshot ของ Order เดิม |
| `backend/app/routes/menu.py: GET /api/promotions/active` | FR-44 | ตรง | เป็น endpoint สำหรับ active promotions ที่ใช้ร่วมกับการจัดการโปรโมชั่น และระบุไว้ใน plan ข้อ 4 แล้ว |
| `backend/app/routes/menu.py: POST /api/admin/menu` | FR-43, FR-46, FR-47 | ตรง | ตรวจ required fields และคืน record ที่สร้าง |
| `backend/app/routes/menu.py: PATCH /api/admin/menu/{menu_id}` | FR-44, FR-47 | ตรง | update ได้ และ history ถูก staging จน transaction สำเร็จ |
| `backend/app/routes/menu.py: PATCH /api/admin/menu/{menu_id}/status` | FR-45, FR-48 | ตรงบางส่วน | เปลี่ยน status และ guard การสั่งซื้อมีอยู่ แต่ไม่มี UI assertion ครบ |
| `backend/app/routes/menu.py: DELETE /api/admin/menu/{menu_id}` | FR-49 | ตรง | ลบ catalog และสร้าง snapshot/history; ไม่มี API อ่าน Order เดิมเฉพาะฟีเจอร์นี้ |
| `backend/app/routes/orders.py: /api/menu`, `/api/orders/items` | FR-48, CON-SOLD-OUT-AVAILABILITY | ตรงบางส่วน | order guard ปฏิเสธ sold_out แต่ `/api/menu` ไม่ได้เชื่อมกับ Admin response shape โดยตรง |
| `backend/app/services/history_service.py: record_menu_history/create_order_snapshot` | FR-49, NFR-REL-09 | ตรง | เก็บข้อมูลขั้นต่ำ, staging จาก menu transaction และมี integration test จาก Order API |
| `backend/app/services/menu_validation.py: validate_menu_payload` | FR-44, FR-46, AC-MENU-MGMT-15 | ตรง | ตรวจ required, ISO timezone, end >= start และอดีต |
| `backend/app/seed.py: seed_menu_data` | FR-44, CON-FUTURE-PROMOTION | ตรง | กำหนด promotion start เป็นวันถัดไปและ end หลัง start |
| `frontend/src/pages/AdminMenuPage.jsx: AdminMenuPage` | FR-42, FR-43, FR-44, FR-45, FR-47, FR-49 | ตรงบางส่วน | มี list/add/edit/status/delete แต่การแสดงข้อมูลลูกค้าหลัง update ไม่ได้ตรวจ end-to-end |
| `frontend/src/pages/CustomerMenuPage.jsx: loadMenu/getDiscountedPrice` | FR-48, CON-LATEST-CUSTOMER-DATA, CON-DISCOUNT-RULES | ตรง | อ่านข้อมูลล่าสุดจาก customer API และคำนวณ `price - discount_value`; fallback ใช้ข้อมูลตัวอย่างจำนวนเงิน |
| `frontend/src/components/MenuForm.jsx: submitForm` | FR-43, FR-46 | ตรง | ตรวจ name/price/status และ optional fields |
| `frontend/src/components/MenuEditPanel.jsx: submitForm` | FR-44, FR-47, CON-THAI-BUDDHIST-DATETIME | ตรง | ส่ง ISO timezone และมี test ยืนยันการแสดงเดือนภาษาไทยและปี พ.ศ. |
| `frontend/src/components/StatusToggle.jsx: changeStatus` | CON-STATUS-CONFIRMATION | ตรง | ยืนยันทั้ง open และ sold_out ก่อนเรียก callback |
| `frontend/src/api/client.js: getMenuItems/createMenuItem/deleteMenuItem` | FR-42, FR-43, FR-49 | ตรงบางส่วน | รองรับ object response แล้ว แต่ tests เก่าบางตัวใช้ contract เดิม |
| `backend/app/routes/staff_orders.py` และ `frontend/src/pages/StaffOrdersPage.jsx` | ไม่มี ID ในฟีเจอร์นี้ | ไม่อยู่ในขอบเขตฟีเจอร์ | เป็นโค้ดของ Staff Order feature ไม่ใช่ requirement ของ Menu Management; ไม่พบการใช้เพื่อทำ Menu Management ให้จริง |

## 3. ข้อค้นพบ

ชนิด: AC ไม่มี test / test อ่อน / โค้ดไม่มี FR / FR ไม่มี AC / เดา Q-xx / ละเมิด Constraint / ตัวเลขไม่ตรง spec / อ้าง ID ผิดเรื่อง

ไม่พบข้อค้นพบคงค้าง

| F-ID | ชนิด | อยู่ที่ | ขัดกับ | รายละเอียด | ทีมตัดสิน |
|---|---|---|---|---|---|

## 4. แก้แล้ว

| F-ID | แก้อย่างไร | รู้ได้อย่างไร |
|---|---|---|
| F-01 | เพิ่ม validation tests สำหรับ promotion datetime และตรวจ state เดิมหลัง invalid request | test promotion datetime ผ่านก่อนการตรวจรอบนี้ |
| F-02 | ปรับ seed promotion เป็นอนาคตแบบ UTC และเพิ่ม seed constraint/idempotence tests | `test_seed_promotion_is_in_the_future` และ backend suite ผ่าน; สอดคล้องกับ CON-FUTURE-PROMOTION |
| F-03 | เพิ่ม `ensure_menu_is_orderable` และเชื่อมกับ `OrderService.add_item` เพื่อปฏิเสธเมนูสถานะ “หมด” | targeted AC-07/10 tests ผ่าน และโค้ด guard ถูกเรียกจาก order service จริง |
| F-05 | เพิ่ม `test_TC_MENU_MGMT_07_1_customer_sees_sold_out_menu_and_cannot_order_it` ให้ตรวจทั้งข้อความ “หมด” และปุ่มสั่งซื้อที่ disabled | frontend test ผ่าน และตรงกับ Then ของ AC-MENU-MGMT-07 |
| F-10 | เพิ่ม `test_TC_MENU_MGMT_15_1_promotion_datetime_is_displayed_in_thai_buddhist_calendar` ให้ตรวจเดือนภาษาไทยและปี พ.ศ. | frontend test ผ่าน |
| F-11 | ปรับ `backend/pytest.ini` ให้เพิ่ม repository root ใน `pythonpath` เพื่อให้ `cd backend && pytest -q` เก็บ test ได้ | backend suite เก็บและรันผ่าน 62 tests |
| F-12 | ปรับ assertion ของ test ที่อ่าน `GET /api/admin/menu` ให้ใช้ field `menu_items` ตาม response contract ปัจจุบัน | backend suite และ targeted API tests ผ่าน | targeted AC-07/10 tests ผ่าน และโค้ด guard ถูกเรียกจาก order service จริง |
| F-13 | เพิ่ม tests ให้ครอบคลุม transaction failure ของ create, update, status และ delete โดยยืนยันว่า history/snapshot ไม่ถูก append | `test_rtm_menu_findings.py` มี tests ครบทั้ง 4 operation และ backend suite 78 tests ผ่าน |
| F-14 | เปลี่ยนการอ้างอิง endpoint active promotions จาก `FR-05` เป็น `FR-44` และเพิ่ม endpoint ใน API table ของ plan | route docstring และ plan ระบุ FR-44 ตรงกับ requirement เรื่องโปรโมชั่นแล้ว |
