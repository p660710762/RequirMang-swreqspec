# RTM: สั่งเครื่องดื่มออนไลน์
อ้างอิง: [spec.md](./spec.md) Draft v2 | [tasks.md](./tasks.md) | [test-cases.md](./test-cases.md)
สร้างด้วย `/verify` เมื่อ 2569-10-27 10:00 UTC | test: 34 ผ่าน 1 ชุดรันไม่ได้

## 1. ตามรอยไปข้างหน้า (requirement ไป โค้ด ไป test)

| ID | AC | task | โค้ด (ไฟล์: ฟังก์ชัน) | test (ผล) | สถานะ |
|---|---|---|---|---|---|
| FR-06 | AC-ORDER-01, AC-ORDER-08 | T-03, T-05, T-06, T-17 | `backend/app/routes/orders.py`: `add_order_item`; `frontend/src/pages/OrderPage.jsx`: `handleAddItem`, `setView` | `test_AC_ORDER_01_add_item_to_order`, `test_AC_ORDER_01_add_item_to_order` (frontend), `test_AC_ORDER_08_return_to_menu_for_more_items`; frontend ผ่าน, backend รันไม่ได้ | ช่องโหว่ |
| FR-07 | AC-ORDER-02 | T-04, T-05 | `backend/app/services/order_service.py`: `save_item_options`; `frontend/src/pages/OrderPage.jsx`: selection controls | `test_AC_ORDER_02_save_item_options`, `test_AC_ORDER_02_persists_options_for_each_order_item`, frontend AC-ORDER-02; frontend ผ่าน, backend รันไม่ได้; TC-ORDER-02 ที่สถานะใช้ได้ยังไม่มี test ตามชื่อ TC | ช่องโหว่ |
| FR-08 | AC-ORDER-03 | T-06, T-09 | `backend/app/routes/orders.py`: `get_order_summary`; `frontend/src/pages/OrderPage.jsx`: `handleShowSummary` | `test_AC_ORDER_03_show_order_summary`, frontend AC-ORDER-03; frontend ผ่าน, backend รันไม่ได้; ไม่ assert ราคาโปรโมชั่น | ช่องโหว่ |
| FR-09 | AC-ORDER-04, AC-ORDER-09 | T-07, T-09 | `PATCH /api/orders/items/{order_item_id}`; `OrderService.update_item`; `OrderPage.jsx`: `handleUpdateItem` | `test_AC_ORDER_04_update_quantity_or_remove_item`, `test_AC_ORDER_09_recalculate_total_after_edit`; frontend ผ่าน, backend รันไม่ได้ | ช่องโหว่ |
| FR-10 | AC-ORDER-05 | T-08, T-10 | `OrderService.confirm_order`; `POST /api/orders/confirm`; `OrderPage.jsx`: `handleConfirmOrder` | `test_AC_ORDER_05_confirm_order_to_payment`; frontend ผ่าน, backend รันไม่ได้ | ช่องโหว่ |
| FR-11 | AC-ORDER-06 | T-11, T-12 | ยังไม่มี QR/payment endpoint และ timeout flow | ไม่มี test AC-ORDER-06 | ยังไม่ถึง |
| FR-12 | AC-ORDER-07 | T-13 | ยังไม่มี payment callback, completed-order creation หรือ order-detail endpoint | ไม่มี test AC-ORDER-07 | ยังไม่ถึง |
| NFR-22 | ไม่มี AC | T-16 | ไม่มี performance measurement หรือ load-test harness | ไม่มี test | ยังไม่ถึง |
| NFR-23 | AC-ORDER-12 | T-01, T-13, T-14 | มี model/transaction schema บางส่วน แต่ยังไม่มี payment idempotency/completed-order flow | ไม่มี test AC-ORDER-12 | ยังไม่ถึง |
| NFR-24 | ไม่มี AC | T-13, T-14 | ยังไม่มีหน้าผลการชำระเงินและรายละเอียด Order หลังสำเร็จ | ไม่มี test | ยังไม่ถึง |
| NFR-26 | ไม่มี AC | T-16 | ไม่มี usability test กับผู้ใช้ 10 คน | ไม่มี test | ยังไม่ถึง |
| CON-01 เลือกเมนูสถานะเปิดขาย | AC-ORDER-01, AC-ORDER-11 | T-03, T-08 | `OrderService.add_item`, `OrderService.confirm_order` ตรวจ `status == "open"` | AC-ORDER-01/11 tests; frontend ผ่าน, backend รันไม่ได้ | ช่องโหว่ |
| CON-02 จำนวนเป็นจำนวนเต็มมากกว่า 0 | AC-ORDER-02, AC-ORDER-04 | T-04, T-07 | Pydantic `quantity > 0` ตอนเพิ่ม และ `quantity >= 0` ตอนแก้ | `test_AC_ORDER_01_rejects_non_positive_quantity`, AC-ORDER-04 frontend; backend รันไม่ได้ | ช่องโหว่ |
| CON-03 ตรวจข้อมูลก่อนสร้าง Order | AC-ORDER-05 | T-08, T-10 | `OrderService.confirm_order` ตรวจรายการ/options/เมนูก่อน `prepare_payment` | AC-ORDER-05 tests; backend รันไม่ได้ | ช่องโหว่ |
| CON-04 สร้าง Order สำเร็จเมื่อชำระเงินสำเร็จ | AC-ORDER-07, AC-ORDER-10 | T-13, T-14 | ยังไม่มี completed-order/payment-result flow | ไม่มี test | ยังไม่ถึง |
| CON-05 payment ไม่สำเร็จต้องไม่สร้าง Order | AC-ORDER-10 | T-14 | ยังไม่มี payment failure endpoint/logic | ไม่มี test | ยังไม่ถึง |
| CON-06 สินค้าหมดต้องแจ้งและให้เปลี่ยนเมนู | AC-ORDER-11 | T-08, T-10 | backend `OrderOutOfStockError`; frontend แสดง `role="alert"` และไม่แสดง payment-ready | `test_AC_ORDER_11_show_out_of_stock_message`; frontend ผ่าน, backend รันไม่ได้ | ช่องโหว่ |
| CON-07 QR มีอายุ 5 นาที | AC-ORDER-06 | T-11, T-12 | ยังไม่มี implementation | ไม่มี test | ยังไม่ถึง |
| CON-08 หมดเวลาแล้วไม่ดำเนินการต่อ | AC-ORDER-06 | T-11, T-12 | ยังไม่มี timeout implementation | ไม่มี test | ยังไม่ถึง |

## 2. ตามรอยย้อนกลับ (โค้ด ไป requirement)

| โค้ด (ไฟล์: ฟังก์ชัน หรือ endpoint) | อ้าง ID | ตรงกับข้อความใน spec ไหม | หมายเหตุ |
|---|---|---|---|
| `backend/app/routes/orders.py`: `GET /api/menu`, `POST /api/orders/drafts`, `POST /api/orders/items` | FR-06, FR-07 | ตรงบางส่วน | route ถูกประกาศ แต่ dependency repository จริงเป็น placeholder ที่ตอบ 503 |
| `backend/app/routes/orders.py`: `GET /api/orders/preview` | FR-08 | ตรงบางส่วน | คืนชื่อ/จำนวน/ราคา/ยอดรวม แต่ไม่มี promotion price ใน response |
| `backend/app/routes/orders.py`: `PATCH /api/orders/items/{order_item_id}` | FR-09 | ตรงบางส่วน | contract รองรับการแก้และลบ แต่ไม่มี concrete repository ใน runtime |
| `backend/app/routes/orders.py`: `POST /api/orders/confirm` | FR-10, FR-11 | ตรงบางส่วน | ตรวจความพร้อมและส่ง `pending` แต่ยังไม่สร้าง QR/payment flow |
| `backend/app/services/order_service.py`: `OrderService.add_item`, `save_item_options`, `update_item`, `confirm_order` | FR-06, FR-07, FR-09, FR-10 | ตรงบางส่วน | business logic สอดคล้อง แต่พึ่ง protocol ที่ไม่มี implementation จริง |
| `backend/app/models/order.py`: `Order` | FR-10, FR-11, FR-12, NFR-23 | ยังไม่ครบ | มี payment status/order id schema แต่ไม่มี lifecycle หลังชำระเงินและ idempotency |
| `backend/app/models/order_item.py`: `OrderItem`, `OrderOption` | FR-07, FR-08, FR-09 | ตรงบางส่วน | มี constraint `quantity > 0`; การลบ quantity 0 ต้องเกิดผ่าน repository/service ที่ยังไม่มีจริง |
| `backend/app/models/payment_transaction.py`: `PaymentTransaction` | FR-11, FR-12, NFR-23 | ยังไม่ครบ | มีฟิลด์ QR/expiry แต่ไม่มี endpoint หรือการใช้งาน |
| `frontend/src/pages/OrderPage.jsx`: `handleAddItem`, `handleShowSummary`, `handleUpdateItem` | FR-06 ถึง FR-09 | ตรงบางส่วน | UI รองรับ flow ที่ทำแล้ว แต่ summary ไม่แสดง promotion price |
| `frontend/src/pages/OrderPage.jsx`: `handleConfirmOrder` | FR-10, FR-11 | ตรงบางส่วน | มีปุ่ม/ผลสำเร็จและ error แต่ยังไม่มี QR/timeout |
| `frontend/src/api/client.js`: `confirmOrder`, `updateOrderItem` | FR-09, FR-10 | ตรง | เป็น client ตาม API contract ใน plan |
| `frontend/src/pages/OrderPage.jsx`: payment placeholder controls | FR-11 | ไม่ครบและมีข้อจำกัด | ปุ่ม payment จริงถูก disabled; เป็น placeholder ไม่ใช่การชำระเงินจริง |
| `backend/app/routes/menu.py` และ `backend/app/services/menu_service.py` | ไม่ใช่ FR ของ SPEC-ORDER-001 | อยู่นอกฟีเจอร์ Order | เป็น Menu Management feature แยกต่างหาก จึงไม่ใช้เป็นหลักฐานว่า Order ใช้งานจริงได้ |

## 3. ข้อค้นพบ

ชนิด: AC ไม่มี test / test อ่อน / โค้ดไม่มี FR / FR ไม่มี AC / เดา Q-xx / ละเมิด Constraint / ตัวเลขไม่ตรง spec / อ้าง ID ผิดเรื่อง

| F-ID | ชนิด | อยู่ที่ | ขัดกับ | รายละเอียด | ทีมตัดสิน |
|---|---|---|---|---|---|
| F-01 | โค้ดไม่มี FR/ช่องโหว่ | `backend/app/routes/orders.py`: `get_menu_repository`, `get_order_repository` | FR-06, FR-09, FR-10 | dependency production เป็นฟังก์ชันที่ตอบ 503 เสมอ ไม่มี repository จริง ทำให้ Order API ใช้งานจริงไม่ได้ แม้ fake repository ใน test จะทำงาน | |
| F-02 | AC ไม่มี test | `specs/003-Order/test-cases.md`, `backend/tests/test_order_flow.py`, `frontend/src/pages/OrderPage.test.jsx` | AC-ORDER-02 | TC-ORDER-02-1 ถึง TC-ORDER-02-4 เป็น “ใช้ได้” แต่ยังไม่มี test ที่ใช้ชื่อ TC ตามตารางครบ 4 แถว | |
| F-03 | test อ่อน | `frontend/src/pages/OrderPage.test.jsx` และ `backend/tests/test_order_flow.py` | AC-ORDER-05 | test happy path ตรวจการเรียก/สถานะสำเร็จ แต่ไม่ตรวจ assert แยกว่ามีอย่างน้อย 1 รายการและระดับความหวานถูกตรวจจริงในเส้นทางยืนยัน | |
| F-04 | test อ่อน | `frontend/src/pages/OrderPage.test.jsx`, `backend/tests/test_order_flow.py` | AC-ORDER-11 | ตรวจข้อความ error และไม่เข้าสู่ payment-ready จาก mock แต่ยังไม่ยืนยันการทำงานกับรายการหลายรายการหรือผลตรวจ stock จาก repository จริง | |
| F-05 | โค้ดไม่มี FR/AC ไม่มี test | `backend/app/routes/orders.py`, `frontend/src/pages/OrderPage.jsx` | FR-08, AC-ORDER-03 | ไม่มี `promotion_price` ใน `MenuItemRecord`, response หรือ UI จึงไม่สามารถแสดงราคาโปรโมชั่นที่ลดอยู่ตามข้อกำหนดได้ และ test ไม่ assert ส่วนนี้ | |
| F-06 | test รันไม่ได้ | `backend/tests/test_order_flow.py` | ทุก AC ฝั่ง backend | `cd backend && pytest -v` ล้มเหลวตอน collection เพราะ `ModuleNotFoundError: No module named 'app'`; การปรับ path ยังพบชื่อ `app.models.py` ชนกับ package `app/models/` | |
| F-07 | ตัวเลขไม่ตรง spec/โค้ดไม่มี FR | `frontend/src/pages/OrderPage.jsx` | FR-11, AC-ORDER-06 | ยังไม่มี QR และ timeout 5 นาที; ปุ่ม payment หลักเป็น disabled placeholder จึงไม่ทำตาม FR-11 | |
| F-08 | โค้ดไม่มี FR | `backend/app/services/order_service.py`, `backend/app/routes/orders.py` | FR-12, NFR-23, NFR-24 | ไม่มี callback ผลชำระเงิน, การสร้าง completed Order, unique/idempotent payment handling, หรือการแสดงรายละเอียดหลังชำระเงิน | |

## 4. แก้แล้ว

| F-ID | แก้อย่างไร | รู้ได้อย่างไร |
|---|---|---|
| - | ยังไม่มีการแก้ใน `/verify` | คำสั่งนี้ห้ามแก้โค้ดและ test |

## 5. อัปเดตหลังการแก้ไข 2569-10-28

| F-ID | สถานะล่าสุด | หลักฐาน |
|---|---|---|
| F-01 | แก้แล้ว: เพิ่ม SQLite repository และเชื่อม `get_order_repository()` ให้ใช้งานจริง; ตั้งค่า path เริ่มต้นเป็น `backend/orders.sqlite3` หรือใช้ `ORDER_DATABASE_PATH` | `backend/tests/test_order_repository.py` ทดสอบสร้าง draft, เพิ่ม/แก้/ลบรายการ, preview และยืนยัน; `PYTHONPATH=.:backend python -m pytest -q backend/tests tests` ผ่าน 42 tests |
