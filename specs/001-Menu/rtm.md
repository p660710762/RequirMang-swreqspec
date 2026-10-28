# RTM: ดูเมนูและโปรโมชั่น (Menu & Promotion)
อ้างอิง: [spec.md](./spec.md) Draft v12 | [plan.md](./plan.md) | [tasks.md](./tasks.md) | [test-cases.md](./test-cases.md)
อัปเดตหลังแก้ F-01 ถึง F-07 เมื่อ 2569-10-28 16:50 UTC | test: Frontend 130 ผ่าน 0 ไม่ผ่าน; Backend 61 ผ่าน 1 ไม่ผ่าน

## 1. ตามรอยไปข้างหน้า (requirement ไป โค้ด ไป test)
| ID | AC | task | โค้ด (ไฟล์: ฟังก์ชัน) | test (ผล) | สถานะ |
|---|---|---|---|---|---|
| FR-01 | AC-MENU-01 | T-02, T-03 | `CustomerMenuPage.jsx`: `loadMenu`, `filteredItems`; `orders.py`: `list_menu_items` | `CustomerMenuPage.test.jsx`: `test_AC_MENU_01_displays_items_and_empty_state`; ผ่าน | ครบ |
| FR-02 | AC-MENU-02, AC-MENU-08, AC-MENU-09 | T-04, T-13, T-14, T-15 | `AppShell.jsx`: login/order handlers; `CustomerMenuPage.jsx`: `handleOrderClick` | `AC-MENU-08-09.test.jsx` flow tests และ `CustomerMenuPage.test.jsx` รายละเอียด/สถานะ; ผ่าน | ครบ |
| FR-03 | AC-MENU-03 | T-05, T-06 | `CustomerMenuPage.jsx`: `filteredItems` | `test_AC_MENU_03_filters_only_partial_case_insensitive_matches`; ผ่าน | ครบ |
| FR-05 | AC-MENU-04 | T-07, T-08 | `CustomerMenuPage.jsx`: `activePromotions`, `getDiscountedPrice`, `sortMenuItems`; `routes/menu.py`: `get_active_promotions` | `test_AC_MENU_04_*`; ผ่าน | ครบ |
| NFR-22 | AC-MENU-06 | T-11 | ไม่มี benchmark p95 | ไม่มี performance test | ยังไม่ถึง |
| NFR-26 | AC-MENU-07 | T-12 | ไม่มี usability study | ไม่มี usability test | ยังไม่ถึง |
| Constraint: public menu ไม่ต้อง Login | AC-MENU-01 | T-02, T-03 | `CustomerMenuPage.jsx`, `orders.py` | AC-MENU-01 ผ่าน; backend มี 1 regression ที่ไม่เกี่ยวกับ public menu | ครบ |
| Constraint: ต้อง Login ก่อนเพิ่มเข้า Order | AC-MENU-02, AC-MENU-08 | T-13, T-14 | `AppShell.jsx`, `CustomerMenuPage.jsx` | flow test ผ่าน | ครบ |
| Constraint: Login ก่อนหน้า UC-02 | AC-MENU-02, AC-MENU-08 | T-13, T-14 | `handleLoginRequired` | flow test ผ่าน | ครบ |
| Constraint: ไม่ส่ง menu ก่อน Login | AC-MENU-08, AC-MENU-09 | T-13, T-14 | `handleAuthenticationSuccess`, `setSelectedOrderMenuId(null)` | flow test ผ่าน | ครบ |
| Constraint: ยกเลิก/ล้มเหลวไม่กระทบ Order เดิม | AC-MENU-09 | T-15 | `handleLoginCancel`, `handleCloseOrder` | `test_AC_MENU_09_cancel_does_not_change_existing_order`; ผ่าน | ครบ |
| Constraint: partial/case-insensitive search | AC-MENU-03 | T-05, T-06 | `filteredItems` | search test ตรวจเฉพาะผลที่ตรง; ผ่าน | ครบ |
| Constraint: sold-out แสดง “หมด” และ disabled | AC-MENU-02, AC-MENU-04 | T-04, T-08 | `isSoldOut`, `handleOrderClick` | AC-MENU-02/04 tests; ผ่าน | ครบ |
| Constraint: เฉพาะ active promotions | AC-MENU-04 | T-07, T-08 | `activePromotions`, `get_active_promotions` | AC-MENU-04 tests; ผ่าน | ครบ |
| Constraint: promotion อยู่บนสุด | AC-MENU-04 | T-07, T-08 | `sortMenuItems` | AC-MENU-04 test ตรวจลำดับ; ผ่าน | ครบ |
| Constraint: discounted price และไม่ส่ง selection เดิม | AC-MENU-04, AC-MENU-08 | T-07, T-08, T-14 | `getDiscountedPrice`, `handleAuthenticationSuccess` | AC-MENU-04/08 tests; ผ่าน | ครบ |
| Constraint: เลือกเมนูยังไม่สร้าง Order | AC-MENU-02, AC-MENU-08 | T-14 | `handleContinueToOrder` | flow test ผ่านก่อน POST รายการ | ครบ |
| Constraint: Retry โหลด menu และ promotion | AC-MENU-05 | T-09, T-10 | `CustomerMenuPage.jsx`: `loadMenu` | `test_AC_MENU_05_shows_error_and_retries_menu_and_promotions`; ผ่าน | ครบ |

## 2. ตามรอยย้อนกลับ (โค้ด ไป requirement)
| โค้ด (ไฟล์: ฟังก์ชัน หรือ endpoint) | อ้าง ID | ตรงกับข้อความใน spec ไหม | หมายเหตุ |
|---|---|---|---|
| `backend/app/routes/orders.py`: `list_menu_items` | FR-01, FR-02, FR-05 | ตรง | public API คืนรายการ customer menu |
| `backend/app/routes/menu.py`: `get_active_promotions` | FR-05 | ตรง | คืนเฉพาะ promotion ที่ active |
| `frontend/src/pages/CustomerMenuPage.jsx`: `loadMenu` | FR-01, FR-05, AC-MENU-05 | ตรง | ใช้เฉพาะ `/api/menu` และ `/api/promotions/active`; ไม่มี admin/sample fallback เมื่อผิดพลาด |
| `frontend/src/pages/CustomerMenuPage.jsx`: `filteredItems`, `getDiscountedPrice`, `sortMenuItems` | FR-03, FR-05 | ตรง | มี automated assertions ครบ |
| `frontend/src/AppShell.jsx`: login/order handlers | FR-02, AC-MENU-08, AC-MENU-09 | ตรง | ล้าง selection ก่อน Login และยกเลิก flow |
| `frontend/src/pages/MenuPage.jsx`: `handleOrderClick`, `handleLoginSuccess` | FR-02, ASM-02 | ตรง | ไม่เก็บหรือเพิ่มเมนูเดิมหลัง Login; page ไม่ถูก render จาก AppShell ปัจจุบัน |

## 3. ข้อค้นพบ
ชนิด: AC ไม่มี test / test อ่อน / โค้ดไม่มี FR / FR ไม่มี AC / เดา Q-xx / ละเมิด Constraint / regression
ทีมตัดสิน: แก้โค้ด / แก้ spec / เพิ่ม Q-xx / ไม่ใช่ปัญหา

| F-ID | ชนิด | อยู่ที่ | ขัดกับ | รายละเอียด | ทีมตัดสิน |
|---|---|---|---|---|---|
| F-07 | regression ค้าง | `backend/tests/test_order_sqlite_repository.py` | backend regression | แก้ import path แล้ว collection ผ่านครบ 62 tests; เหลือ 1 test เดิมไม่ผ่านเพราะคาด `/api/admin/menu` เป็น list แต่ endpoint คืน dict `{menu_items, ...}` ไม่ใช่ปัญหา `ModuleNotFoundError` |  |

## 4. แก้แล้ว
| F-ID | แก้อย่างไร | รู้ได้อย่างไร |
|---|---|---|
| F-01 | เอา `/api/admin/menu` fallback และ sample-success fallback ออกจาก `CustomerMenuPage.loadMenu` | ตรวจโค้ดไม่พบ admin route ใน customer loader; error state ทำงานตาม spec |
| F-02 | เพิ่ม test cancel flow พร้อม fixture Order เดิม และตรวจไม่มี POST `/api/orders/items` | targeted frontend 16/16 ผ่าน |
| F-03 | เพิ่ม test partial, case-insensitive และผลลัพธ์เฉพาะรายการที่ตรง | `test_AC_MENU_03_filters_only_partial_case_insensitive_matches` ผ่าน |
| F-04 | เพิ่ม tests สำหรับ AC-MENU-01, 03, 04 และ 05 | frontend full suite 130/130 ผ่าน |
| F-05 | เอา `pendingSelection` และการเพิ่มเมนูเดิมหลัง Login ออกจาก `MenuPage.jsx` | ตรวจโค้ดแล้วไม่มี state/flow ดังกล่าว |
| F-06 | เพิ่ม assertions ชื่อ ราคา รายละเอียด สถานะ และ disabled sold-out button | AC-MENU-02/04 tests ผ่าน |
