# RTM: สั่งเครื่องดื่มออนไลน์
อ้างอิง: [spec.md](./spec.md) Draft v2 | [tasks.md](./tasks.md) | [test-cases.md](./test-cases.md)
สร้างด้วย `/verify` เมื่อ 2569-10-28 08:24 UTC | test: Backend 35 ผ่าน, Frontend 37 ผ่าน

## 1. ตามรอยไปข้างหน้า (requirement ไป โค้ด ไป test)

| ID | AC | task | โค้ด (ไฟล์: ฟังก์ชัน) | test (ผล) | สถานะ |
|---|---|---|---|---|---|
| FR-06 | AC-ORDER-01, AC-ORDER-08 | T-03, T-05, T-06, T-17, T-19 | `backend/app/routes/orders.py`: `list_menu_items`, `add_order_item`; `frontend/src/pages/OrderPage.jsx`: `handleAddItem`, `setView` | `test_TC_ORDER_01_1_add_open_menu_item`, `test_TC_ORDER_01_3_add_only_open_menu_item`, `test_TC_ORDER_01_4_reject_unavailable_menu_item`, `test_TC_ORDER_01_2_add_open_menu_item`, `test_AC_ORDER_08_return_to_menu_for_more_items`; ผ่าน | ครบ |
| FR-07 | AC-ORDER-02 | T-04, T-05, T-19 | `OrderService.save_item_options`; `SqliteOrderRepository.save_item_options`; `OrderPage.jsx`: selection controls | `test_AC_ORDER_02_save_item_options`, `test_TC_ORDER_02_1_save_all_item_options`, `test_TC_ORDER_02_2_save_minimum_quantity_without_optional_options`, `test_TC_ORDER_02_3_save_toppings_with_default_ice`, `test_TC_ORDER_02_4_reject_missing_sweetness`, `test_TC_ORDER_02_sqlite_persists_options_per_item`, frontend AC-ORDER-02/TC-ORDER-02-4; ผ่าน | ครบ |
| FR-08 | AC-ORDER-03 | T-06, T-09, T-19 | `GET /api/orders/preview`; `SqliteOrderRepository._summary`; `OrderPage.jsx`: summary rendering | `test_AC_ORDER_03_show_order_summary`, `test_TC_ORDER_03_1_show_order_summary`, `test_AC_ORDER_03_summary_uses_menu_effective_price_without_promotion`, `test_AC_ORDER_03_summary_uses_regular_price_without_promotion`, frontend promotion test; ผ่าน | ครบ |
| FR-09 | AC-ORDER-04, AC-ORDER-09 | T-07, T-09, T-19 | `PATCH /api/orders/items/{id}`; `SqliteOrderRepository.update_item`; `OrderPage.jsx`: `handleUpdateItem` | `test_AC_ORDER_04_and_09_update_delete_and_recalculate_via_sqlite`, unit/API AC-ORDER-04/09; ผ่าน | ครบ |
| FR-10 | AC-ORDER-05 | T-08, T-10, T-19 | `OrderService.confirm_order`; `POST /api/orders/confirm`; `OrderPage.jsx`: `handleConfirmOrder` | `test_AC_ORDER_05_confirm_valid_order_via_sqlite_and_returns_pending`, empty/missing-options integration tests, unit/API happy path; ผ่าน | ครบ |
| FR-11 | AC-ORDER-06 | T-11, T-12 | ยังไม่มี QR/payment endpoint และ timeout flow | ไม่มี test AC-ORDER-06 | ยังไม่ถึง |
| FR-12 | AC-ORDER-07 | T-13 | ยังไม่มี payment callback, completed-order creation หรือ order-detail endpoint | ไม่มี test AC-ORDER-07 | ยังไม่ถึง |
| NFR-22 | ไม่มี AC | T-16 | ไม่มี performance measurement หรือ load-test harness | ไม่มี test | ยังไม่ถึง |
| NFR-23 | AC-ORDER-12 | T-01, T-13, T-14 | SQLite บันทึก draft/items ได้ แต่ยังไม่มี payment idempotency/completed-order flow | ไม่มี test AC-ORDER-12 | ยังไม่ถึง |
| NFR-24 | ไม่มี AC | T-13, T-14 | ยังไม่มีหน้าผลการชำระเงินและรายละเอียด Order หลังสำเร็จ | ไม่มี test | ยังไม่ถึง |
| NFR-26 | ไม่มี AC | T-16 | ไม่มี usability test กับผู้ใช้ 10 คน | ไม่มี test | ยังไม่ถึง |
| CON-01 เมนูต้องเปิดขาย | AC-ORDER-01, AC-ORDER-11 | T-03, T-08, T-19 | `OrderService.add_item`, `confirm_order`; `SqliteMenuRepository.get_menu_item` | TC-ORDER-01-4, `test_AC_ORDER_11_rejects_one_out_of_stock_item_in_multi_item_order`; ผ่าน | ครบ |
| CON-02 จำนวนเป็นจำนวนเต็มมากกว่า 0 | AC-ORDER-02, AC-ORDER-04 | T-04, T-07, T-19 | Pydantic `quantity > 0`, update รองรับ 0 เพื่อลบ; SQLite `OrderItem` constraint | `test_AC_ORDER_01_rejects_non_positive_quantity`, TC-ORDER-02-2, AC-ORDER-04; ผ่าน | ครบ |
| CON-03 ตรวจข้อมูลก่อนสร้าง Order | AC-ORDER-05 | T-08, T-10, T-19 | `OrderService.confirm_order` ตรวจรายการ/options/สถานะเมนูก่อน `prepare_payment` | `test_AC_ORDER_05_confirm_valid_order_via_sqlite_and_returns_pending` และ negative integration tests; ผ่าน | ครบ |
| CON-04 สร้าง Order เมื่อชำระเงินสำเร็จ | AC-ORDER-07, AC-ORDER-10 | T-12, T-13, T-14 | ยังไม่มี completed-payment flow | ไม่มี test | ยังไม่ถึง |
| CON-05 payment ไม่สำเร็จไม่สร้าง Order | AC-ORDER-10 | T-14 | ยังไม่มี payment failure endpoint/logic | ไม่มี test | ยังไม่ถึง |
| CON-06 สินค้าหมดต้องแจ้งและให้เปลี่ยนเมนู | AC-ORDER-11 | T-08, T-10, T-19 | `SqliteMenuRepository` อ่านสถานะล่าสุด; `OrderService.confirm_order`; frontend `role="alert"` | `test_AC_ORDER_11_rejects_one_out_of_stock_item_in_multi_item_order`, frontend `test_AC_ORDER_11_show_out_of_stock_message`; ผ่าน | ครบ |
| CON-07 QR มีอายุ 5 นาที | AC-ORDER-06 | T-11, T-12 | ยังไม่มี implementation | ไม่มี test | ยังไม่ถึง |
| CON-08 หมดเวลาแล้วไม่ดำเนินการต่อ | AC-ORDER-06 | T-11, T-12 | ยังไม่มี timeout implementation | ไม่มี test | ยังไม่ถึง |

## 2. ตามรอยย้อนกลับ (โค้ด ไป requirement)

| โค้ด (ไฟล์: ฟังก์ชัน หรือ endpoint) | อ้าง ID | ตรงกับข้อความใน spec ไหม | หมายเหตุ |
|---|---|---|---|
| `backend/app/routes/orders.py`: `GET /api/menu` | FR-06, FR-08 | ตรง | อ่านเมนูจาก SQLite และส่ง `price`, `promotion_price`, `effective_price` |
| `backend/app/routes/orders.py`: `POST /api/orders/drafts` | FR-06, FR-12 | ตรงบางส่วน | จองเลข draft 001-999 ต่อวัน; การสร้าง Order สำเร็จหลัง payment ยังเป็นงานถัดไป |
| `backend/app/routes/orders.py`: `POST /api/orders/items` | FR-06, FR-07 | ตรง | ตรวจเมนูเปิดขายและบันทึก item/options ผ่าน SQLite transaction |
| `backend/app/routes/orders.py`: `GET /api/orders/preview` | FR-08 | ตรง | ส่งราคาปกติ ราคาโปรโมชัน ราคาที่มีผล และยอดรวมจากราคาที่มีผล |
| `backend/app/routes/orders.py`: `PATCH /api/orders/items/{id}` | FR-09 | ตรง | มี implementation และ SQLite integration test สำหรับแก้/ลบ/ยอดรวม |
| `backend/app/routes/orders.py`: `POST /api/orders/confirm` | FR-10, FR-11 | ตรงบางส่วน | ตรวจ draft/options/stock และคืน `pending`; ยังไม่ใช่ QR payment ซึ่งเป็น Release ถัดไป |
| `backend/app/services/order_service.py`: `add_item`, `save_item_options`, `update_item`, `confirm_order` | FR-06 ถึง FR-11 | ตรงบางส่วน | business validation สอดคล้อง; payment/completed Order ยังไม่ทำใน release นี้ |
| `backend/app/repositories/order_repository.py`: `SqliteMenuRepository`, `SqliteOrderRepository` | FR-06 ถึง FR-10, NFR-23 บางส่วน | ตรงบางส่วน | เป็น persistence จริงของ SQLite; idempotency หลัง payment เป็น Release ถัดไป |
| `backend/app/database.py`: `init_database` | FR-06, FR-08 | ตรงบางส่วน | สร้าง/ปรับ schema และ seed เมนูตัวอย่างเมื่อฐานว่าง; promotion data มาจาก Menu persistence |
| `backend/app/models/menu.py`: `MenuItemEntity` | FR-08, ASM-10 | ตรง | มี `price` และ nullable `promotion_price`; ใช้ promotion เป็น effective price โดยตรงตามคำตัดสิน Q-04 |
| `frontend/src/pages/OrderPage.jsx`: `handleAddItem`, summary rendering | FR-06 ถึง FR-09 | ตรงบางส่วน | แสดง promotion เมื่อ response มีค่า; UI test ใช้ client mock จึงไม่ใช่หลักฐาน integration |
| `frontend/src/pages/OrderPage.jsx`: `handleConfirmOrder` | FR-10, FR-11 | ตรงบางส่วน | แสดงผล pending/payment-ready placeholder; QR/payment controls จริง disabled ตาม release scope |
| `frontend/src/api/client.js`: `getMenu`, `getOrderSummary`, `confirmOrder` | FR-06, FR-08, FR-10 | ตรง | เรียก API contract ปัจจุบัน |
| `frontend/src/pages/OrderPage.jsx`: payment placeholder controls | FR-11 | ไม่ใช่ implementation ของ FR-11 | เป็น placeholder ที่ disabled และถูกระบุใน T-18; QR/payment จริงเลื่อนไป release ถัดไป |
| `backend/app/routes/menu.py` และ Menu Management services | ไม่ใช่ FR ของ SPEC-ORDER-001 | อยู่นอกฟีเจอร์ Order | เป็น feature Menu Management แยก; Order อ่านข้อมูลผ่าน SQLite entity ไม่ได้เพิ่มการจัดการเมนูใน Order |

## 3. ข้อค้นพบ

ชนิด: AC ไม่มี test / test อ่อน / โค้ดไม่มี FR / FR ไม่มี AC / เดา Q-xx / ละเมิด Constraint / ตัวเลขไม่ตรง spec / อ้าง ID ผิดเรื่อง

| F-ID | ชนิด | อยู่ที่ | ขัดกับ | รายละเอียด | ทีมตัดสิน |
|---|---|---|---|---|---|


## 4. แก้แล้ว

| F-ID | แก้อย่างไร | รู้ได้อย่างไร |
|---|---|---|
| F-01 | เปลี่ยน placeholder repository เป็น `SqliteMenuRepository`/`SqliteOrderRepository` และเชื่อม dependency จริง | Backend 33 tests ผ่าน รวม `test_order_api_uses_sqlite_persistence` |
| F-02 | เพิ่ม tests ครบ TC-ORDER-02-1 ถึง TC-ORDER-02-4 และ integration แยก options ต่อ item | พบชื่อ tests ใน `test_order_flow.py`, `OrderPage.test.jsx` และ `test_order_sqlite_repository.py`; Backend/Frontend ผ่าน |
| F-03 | เพิ่ม tests empty Order และ missing options พร้อมยืนยันไม่เข้าสู่ payment preparation | `test_AC_ORDER_05_rejects_empty_order_and_does_not_prepare_payment` และ `test_AC_ORDER_05_rejects_missing_options_before_payment` ผ่าน |
| F-04 | เพิ่ม integration test หลายรายการที่หนึ่งรายการ sold out ผ่าน SQLite จริง | `test_AC_ORDER_11_rejects_one_out_of_stock_item_in_multi_item_order` ผ่าน และ frontend alert test ผ่าน |
| F-05 | เพิ่ม `promotion_price`/`effective_price`, ส่งผ่าน API, ใช้ราคาที่มีผลคำนวณ total และแสดงใน UI ตามกติกา `menu_effective_price` | Backend promotion tests และ frontend promotion test ผ่าน; Backend 33 และ Frontend 36 ผ่าน |
| F-06 | เพิ่ม pytest path และแก้ชื่อชน `app.models.py` กับ package `app/models/` โดยย้าย shared Menu models เข้า package | `cd backend && pytest -v` collection สำเร็จและผ่าน 33 tests |
| F-09 | เพิ่ม `test_TC_ORDER_03_1_show_order_summary` สำหรับ summary ที่มีสองรายการและตรวจข้อมูลตาม Then ของ TC | Frontend Test Suite ผ่าน 37 tests |
| F-10 | เพิ่ม SQLite integration สำหรับ PATCH แก้จำนวน ลบรายการ และคำนวณยอดรวม พร้อมแก้การลบ `OrderOption` ก่อน `OrderItem` | Backend Test Suite ผ่าน 35 tests และ test เฉพาะ F-10 ผ่าน |
| F-11 | เพิ่ม SQLite happy-path integration สำหรับ `POST /api/orders/confirm` และตรวจผล `pending` โดยคง negative tests | Backend Test Suite ผ่าน 35 tests และ test เฉพาะ AC-ORDER-05/11 ผ่าน 4 tests |

## 5. งาน Release ถัดไป

- **F-07 / FR-11 / AC-ORDER-06:** QR payment และ timeout 5 นาที
- **F-08 / FR-12 / NFR-23 / NFR-24 / AC-ORDER-07, AC-ORDER-10, AC-ORDER-12:** payment callback, failed/timeout handling, completed Order, idempotency และผลลัพธ์หลังชำระเงิน
- รายการข้างต้นเป็นงานที่ยังไม่ถึงตาม tasks และอยู่นอกขอบเขตการแก้ไข F-01 ถึง F-06 รอบนี้ ไม่ใช่ข้อค้นพบใหม่ของ release ปัจจุบัน
