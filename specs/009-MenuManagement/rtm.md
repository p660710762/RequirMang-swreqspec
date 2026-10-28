# RTM: จัดการเมนู ราคา โปรโมชั่น และสถานะสินค้า
อ้างอิง: [spec.md](./spec.md) Draft v4 | [tasks.md](./tasks.md) | [test-cases.md](./test-cases.md)
สร้างด้วย `/verify` เมื่อ 2569-10-27 10:00 | test: 54 ผ่าน 0 ไม่ผ่าน

## 1. ตามรอยไปข้างหน้า (requirement ไป โค้ด ไป test)

| ID | AC | task | โค้ด (ไฟล์: ฟังก์ชัน) | test (ผล) | สถานะ |
|---|---|---|---|---|---|
| FR-42 | AC-MENU-MGMT-01 | T-01, T-04 เสร็จ รอทีมตรวจ | `backend/app/routes/menu.py: get_menu_items`, `frontend/src/pages/AdminMenuPage.jsx: AdminMenuPage` | `test_AC_MENU_MGMT_01_admin_can_view_menu_list`, `test_TC_MENU_MGMT_01_1_admin_views_menu_list`, `test_TC_MENU_MGMT_01_2_admin_views_empty_menu_list` (ผ่าน) | ครบ |
| FR-43 | AC-MENU-MGMT-02 | T-01, T-05 เสร็จ รอทีมตรวจ | `backend/app/services/menu_service.py: create_menu_item`, `frontend/src/components/MenuForm.jsx: submitForm` | `test_AC_MENU_MGMT_02_admin_can_add_menu_item`, `test_TC_MENU_MGMT_02_1_admin_adds_menu_with_required_fields`, `test_TC_MENU_MGMT_02_2_admin_adds_menu_without_optional_fields` (ผ่าน) | ครบ |
| FR-44 | AC-MENU-MGMT-03, AC-MENU-MGMT-15 | T-06, T-07 เสร็จ รอทีมตรวจ | `backend/app/services/menu_validation.py: _validate_promotion_datetime`, `frontend/src/components/MenuEditPanel.jsx: submitForm` | `test_AC_MENU_MGMT_03_admin_can_edit_menu_details`, `test_AC_MENU_MGMT_15_promotion_datetime_must_be_valid` และ tests ของ `MenuEditPanel` (ผ่าน) | ครบตาม test ที่เพิ่ม |
| FR-45 | AC-MENU-MGMT-04 | T-07 เสร็จ รอทีมตรวจ | `backend/app/services/menu_status_service.py: update_menu_status`, `frontend/src/components/StatusToggle.jsx: changeStatus` | `test_AC_MENU_MGMT_04_admin_can_change_status`, `test_TC_MENU_MGMT_04_1_admin_changes_menu_status`, `test_TC_MENU_MGMT_04_2_admin_switches_between_supported_statuses` (ผ่าน) | ครบ |
| FR-46 | AC-MENU-MGMT-05, AC-MENU-MGMT-11 | T-05 เสร็จ รอทีมตรวจ | `backend/app/services/menu_validation.py: validate_menu_payload`, `frontend/src/components/MenuForm.jsx: submitForm` | `test_AC_MENU_MGMT_05_validation_before_save`, `test_AC_MENU_MGMT_11_invalid_data_is_rejected`, `test_TC_MENU_MGMT_05_1_invalid_required_data_shows_error`, `test_TC_MENU_MGMT_05_2_valid_required_data_is_accepted`, `test_TC_MENU_MGMT_05_3_invalid_menu_data_shows_error` (ผ่าน) | ครบ |
| FR-47 | AC-MENU-MGMT-06, AC-MENU-MGMT-12 | T-06 เสร็จ รอทีมตรวจ; T-08, T-09 พร้อมทำ | `backend/app/services/menu_service.py: update_menu_item`, `frontend/src/pages/AdminMenuPage.jsx: handleUpdateMenu` | `test_AC_MENU_MGMT_06_successful_update_is_persisted` (ผ่าน); ไม่มี test ของ rollback/failure ตาม T-08/T-09 | ยังไม่ถึง |
| FR-48 | AC-MENU-MGMT-07, AC-MENU-MGMT-10 | T-10 พร้อมทำ | ยังไม่มี customer ordering guard หรือ order route | ไม่มี test | ยังไม่ถึง |
| FR-49 | AC-MENU-MGMT-08, AC-MENU-MGMT-14 | T-11, T-12 ทำบางส่วน | `backend/app/services/menu_service.py: create_order_snapshot, delete_menu_item`, `backend/app/routes/menu.py: delete_menu`, `backend/app/services/menu_status_service.py: update_menu_status` | `test_menu_history_and_snapshot` ตรวจ delete, history, snapshot และการแยก status (ผ่าน); ยังไม่มี Order API ตาม Out of scope | บางส่วน |
| NFR-SEC-05 | AC-MENU-MGMT-13 | T-03 เสร็จ รอทีมตรวจ | `backend/app/auth.py: get_current_user`, `backend/app/middleware/auth_guard.py: require_admin` | `test_AC_MENU_MGMT_13_non_admin_is_blocked`, `test_TC_MENU_MGMT_01_3_non_admin_cannot_view_menu_management` (ผ่าน) | ยังไม่ถึง |
| NFR-REL-08 | ไม่มี AC | T-08 พร้อมทำ | ยังไม่มี transaction/rollback implementation | ไม่มี test | ยังไม่ถึง |
| NFR-REL-09 | AC-MENU-MGMT-14 | T-11 พร้อมทำ | ยังไม่มี order snapshot persistence เมื่อเปลี่ยน status | ไม่มี test | ยังไม่ถึง |
| NFR-USE-03 | ไม่มี AC | T-04, T-06 เสร็จ รอทีมตรวจ | `frontend/src/pages/AdminMenuPage.jsx: formatPrice`, `AdminMenuPage`, `frontend/src/components/MenuEditPanel.jsx: MenuEditPanel` | list/edit tests (ผ่าน) | ครบ |
| CON-ADMIN-AUTH | AC-MENU-MGMT-13 | T-03 เสร็จ รอทีมตรวจ | `require_admin` dependency ของ `/api/admin` | `test_AC_MENU_MGMT_13_non_admin_is_blocked` (ผ่าน) | ครบ |
| CON-REQUIRED-FIELDS | AC-MENU-MGMT-05 | T-05 เสร็จ รอทีมตรวจ | `validate_menu_payload`, `_validate_menu_fields`, `MenuForm: submitForm` | AC-05 และ AC-11 tests (ผ่าน) | ครบ |
| CON-DELETE-SNAPSHOT | AC-MENU-MGMT-08, AC-MENU-MGMT-14 | T-11, T-12 ทำบางส่วน | `delete_menu`, `create_order_snapshot`, `ORDER_SNAPSHOT_STORE` | delete test ยืนยันเมนูหายจาก catalog แต่ snapshot/history ยังอยู่ (ผ่าน) | บางส่วน |
| CON-SEPARATE-DELETE-STATUS | AC-MENU-MGMT-04, AC-MENU-MGMT-08 | T-07 เสร็จ รอทีมตรวจ; T-12 ทำบางส่วน | มี status endpoint และ DELETE endpoint แยกกัน | test ยืนยัน sold_out ยังอยู่ใน catalog และ delete ลบออก (ผ่าน) | ครบใน backend |
| CON-PROMOTION-DATETIME | AC-MENU-MGMT-15 | T-07 เสร็จ รอทีมตรวจ | `_validate_promotion_datetime`, `MenuEditPanel: updatePromotionDate` | AC-15 tests ตรวจ required fields, ISO 8601 + timezone แยก start/end, end ก่อน start และ state เดิม (ผ่าน) | ครบ |
| CON-FUTURE-PROMOTION | AC-MENU-MGMT-15 | T-07 เสร็จ รอทีมตรวจ | `_validate_promotion_datetime`, `backend/app/seed.py: seed_menu_data` | validation ปฏิเสธอดีต และ seed tests ตรวจ start/end เป็นอนาคตและเรียงลำดับ (ผ่าน) | ครบ |
| CON-THAI-BUDDHIST-DATETIME | ไม่มี AC | T-07 เสร็จ รอทีมตรวจ | `MenuEditPanel: formatThaiDateTime`, `datetime-local` picker | มีบางส่วนใน `test_AC_MENU_MGMT_03_promotion_datetime_picker_sends_timezone` (ผ่าน) | ครบ |
| CON-DISCOUNT-RULES | ไม่มี AC | T-07 เสร็จ รอทีมตรวจ | `MenuEditPanel: submitForm`, `menu_service._validate_menu_fields` | discount tests (ผ่าน) | ครบ |
| CON-STATUS-CONFIRMATION | AC-MENU-MGMT-04, AC-MENU-MGMT-09, AC-MENU-MGMT-10 | T-07 เสร็จ รอทีมตรวจ | `StatusToggle: changeStatus` | status confirmation tests (ผ่าน) | ครบ |
| CON-SOLD-OUT-AVAILABILITY | AC-MENU-MGMT-07, AC-MENU-MGMT-10 | T-10 พร้อมทำ | ยังไม่มี customer ordering guard | ไม่มี test | ยังไม่ถึง |
| CON-LATEST-CUSTOMER-DATA | AC-MENU-MGMT-06 | T-06 เสร็จ รอทีมตรวจ; T-09 พร้อมทำ | Admin list state ถูกแทนที่หลัง update แต่ไม่มี customer view | update tests (ผ่านเฉพาะ Admin) | ยังไม่ถึง |
| CON-ORDER-OLD-DATA | AC-MENU-MGMT-08, AC-MENU-MGMT-14 | T-11, T-12 พร้อมทำ | ยังไม่มี order/snapshot implementation | ไม่มี test | ยังไม่ถึง |
| CON-ATOMIC-ROLLBACK | AC-MENU-MGMT-06, AC-MENU-MGMT-12 | T-08 พร้อมทำ | `MENU_STORE` ถูกแก้แบบ in-memory โดยไม่มี rollback transaction | ไม่มี test | ยังไม่ถึง |
| CON-HISTORY-SCOPE | AC-MENU-MGMT-08, AC-MENU-MGMT-14 | T-11 พร้อมทำ | ยังไม่มี history persistence และ delete archive | ไม่มี test | ยังไม่ถึง |

## 2. ตามรอยย้อนกลับ (โค้ด ไป requirement)

| โค้ด (ไฟล์: ฟังก์ชัน หรือ endpoint) | อ้าง ID | ตรงกับข้อความใน spec ไหม | หมายเหตุ |
|---|---|---|---|
| `backend/app/routes/menu.py: GET /api/admin/menu` | FR-42 | ตรง | คืนรายการเมนูปัจจุบันสำหรับ Admin |
| `backend/app/routes/menu.py: POST /api/admin/menu` | FR-43, FR-46, FR-47 | ตรงบางส่วน | ตรวจ required fields และคืนข้อมูลใหม่ แต่ยังไม่มี failure rollback |
| `backend/app/routes/menu.py: PATCH /api/admin/menu/{menu_id}` | FR-44, FR-47 | ตรงบางส่วน | แก้ไขเมนู/โปรโมชั่นและบันทึก history ได้ แต่ยังไม่มี transaction/rollback เต็มรูปแบบ |
| `backend/app/routes/menu.py: PATCH /api/admin/menu/{menu_id}/status` | FR-45, FR-48 | ตรงบางส่วน | เปลี่ยนสถานะได้ แต่ยังไม่มีการป้องกันการสั่งซื้อของลูกค้า |
| `backend/app/routes/menu.py: DELETE /api/admin/menu/{menu_id}` | FR-49, NFR-SEC-05 | ตรงในขอบเขต backend | ลบจาก catalog ปัจจุบันและคง history/snapshot store; ยังไม่มี frontend flow |
| `backend/app/services/menu_validation.py: _validate_promotion_datetime` | FR-44, AC-MENU-MGMT-15 | ตรง | ตรวจ required fields, ISO 8601 พร้อม timezone, ลำดับวันเวลา และไม่รับค่าในอดีต; มี test ครบตาม F-01 |
| `backend/app/services/menu_service.py: create_menu_item` | FR-43, FR-47 | ตรงบางส่วน | บันทึกลง `MENU_STORE` โดยไม่มี transaction/rollback |
| `backend/app/services/menu_service.py: update_menu_item` | FR-44, FR-47, FR-49 | ตรงบางส่วน | แก้ record ปัจจุบันและบันทึก menu history; order snapshot ใช้ helper แยกเพราะไม่มี Order API ตาม Out of scope |
| `backend/app/services/menu_status_service.py: update_menu_status` | FR-45, FR-48 | ตรงบางส่วน | อัปเดต status และ history; ยังไม่มี order flow ให้ตรวจเพราะการสร้าง Order อยู่ใน Out of scope |
| `backend/app/auth.py: get_current_user` | NFR-SEC-05 | ตรงในขอบเขต mock auth | เป็น mock identity ตามแผน ไม่ใช่ account management |
| `backend/app/middleware/auth_guard.py: require_admin` | NFR-SEC-05 | ตรง | ใช้กับ route จัดการเมนูรวม DELETE และตรวจสิทธิ์ทุก Admin action ที่มีอยู่ |
| `frontend/src/pages/AdminMenuPage.jsx: AdminMenuPage` | FR-42, FR-43, FR-44, FR-45, NFR-USE-03 | ตรงบางส่วน | มี list/add/edit/status แต่ยังไม่มี delete/customer view |
| `frontend/src/components/MenuForm.jsx: submitForm` | FR-43, FR-46 | ตรง | ตรวจ required fields ก่อนเรียก save |
| `frontend/src/components/MenuEditPanel.jsx: submitForm` | FR-44, FR-47 | ตรงบางส่วน | รองรับ promotion และข้อความสำเร็จ แต่ไม่มี rollback/customer display |
| `frontend/src/components/StatusToggle.jsx: changeStatus` | FR-45, CON-STATUS-CONFIRMATION | ตรง | ยืนยันทั้งการเปลี่ยนเป็นหมดและเปิดขาย |
| `frontend/src/api/client.js: createMenuItem` | FR-43, FR-47 | ตรงบางส่วน | จัดการ error ของ create แต่ไม่มี client flow สำหรับ delete/order |
| `backend/app/seed.py: seed_menu_data` | FR-42, FR-44, FR-49 | ตรง | seed promotion ใช้ UTC และกำหนด start/end เป็นอนาคต โดย end อยู่หลัง start |

## 3. ข้อค้นพบที่ยังคงค้าง

ชนิด: AC ไม่มี test / test อ่อน / โค้ดไม่มี FR / FR ไม่มี AC / เดา Q-xx / ละเมิด Constraint / ตัวเลขไม่ตรง spec / อ้าง ID ผิดเรื่อง

| F-ID | ชนิด | อยู่ที่ | ขัดกับ | รายละเอียด | ทีมตัดสิน |
|---|---|---|---|---|---|
| F-03 | โค้ดไม่มี FR | `backend/app/routes/menu.py`, `backend/app/services/menu_status_service.py` | FR-48, AC-MENU-MGMT-07/10 | ไม่มี customer ordering guard หรือ order route จึงยังไม่บังคับว่าเมนูสถานะ “หมด” ห้ามถูกสั่งซื้อ | |
| F-04 | โค้ดไม่มี FR | `backend/app/routes/menu.py`, `backend/app/services/menu_service.py`, `backend/app/services/menu_status_service.py` | FR-49, AC-MENU-MGMT-08/14 | เพิ่ม DELETE สำหรับ Admin, in-memory menu history และ order snapshot helper; ทดสอบสิทธิ์, การแยก delete/status, snapshot หลังแก้ไขและหลังลบ แต่ยังไม่มี Order API ตาม Out of scope ของ spec จึงยังไม่ครบ end-to-end | แก้บางส่วน |

หากนับเฉพาะ Findings ที่ปิดแล้ว: F-01 และ F-02 ปิดแล้ว; F-03 ยังไม่เสร็จ และ F-04 แก้ได้บางส่วนตามขอบเขตของ spec

## 4. Findings ที่แก้แล้ว

| F-ID | แก้อย่างไร | รู้ได้อย่างไร |
|---|---|---|
| F-01 | เพิ่ม validation tests สำหรับ promotion datetime และตรวจ state เดิมหลัง invalid request | `pytest -q tests/test_AC_MENU_MGMT_04_admin_can_change_status.py` ผ่าน 16 tests |
| F-02 | ปรับ seed promotion เป็นอนาคตแบบ UTC และเพิ่ม seed constraint/idempotence tests | `pytest -q tests/test_menu_history_and_snapshot.py` ผ่าน 5 tests |
