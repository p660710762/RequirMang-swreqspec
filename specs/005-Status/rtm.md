# RTM: ติดตามสถานะ Order
อ้างอิง: spec.md SPEC-ORDER-STATUS-001 (Draft v2) | tasks.md | test-cases.md
สร้างด้วย /verify และตรวจแก้ข้อค้นพบเมื่อ 2026-10-28 08:15 UTC | หลังแก้: backend 24 ผ่าน + 2 subtests, frontend 45 ผ่าน, NFR-22 1 ผ่าน

## 1. ตามรอยไปข้างหน้า (requirement ไป โค้ด ไป test)
| ID | AC | task | โค้ด (ไฟล์: ฟังก์ชัน) | test (ผล) | สถานะ |
|---|---|---|---|---|---|
| FR-19 | AC-STATUS-01 | T-03–T-05 เสร็จ | `backend/app/routes/orders.py:get_orders`; `backend/app/services/orders.py:list_orders_for_user`; `frontend/src/pages/OrderList.jsx:OrderListPage` | `test_AC_STATUS_01_show_only_user_orders`, `test_TC_STATUS_01_1_customer_sees_own_orders`, `test_TC_STATUS_01_2_hides_other_customers_orders` ผ่าน | ครบ |
| FR-20 | AC-STATUS-02, AC-STATUS-06 | T-09–T-11, T-18 เสร็จ; T-11 รอทีมตรวจ | `get_order_detail`; `get_order_detail_for_user`; `OrderListPage` ลิงก์ไป `OrderDetailPage`; `frontend/src/pages/OrderDetail.jsx:OrderDetailPage` | เพิ่ม flow test คลิก link จากรายการแล้ว render detail ของ Order ที่เลือก; tests AC/TC ที่เกี่ยวข้องผ่าน | ครบ |
| FR-21 | AC-STATUS-03, AC-STATUS-07 | T-12–T-14, T-22–T-24 เสร็จ | `get_order_status`; `get_order_status_for_user`; `refresh_order_status`; `OrderStatusTimeline` polling ทุก 5 วินาที; `OrderDetailPage` | tests AC/TC ที่เกี่ยวข้องผ่าน; กรณีไม่มี confirmed status ไม่แสดง timeline หลัง request เสร็จ | ครบ |
| FR-22 | AC-STATUS-04 | T-15–T-17 เสร็จ | `get_order_detail`; `get_order_detail_for_user`; `frontend/src/components/OrderItems.jsx:OrderItems`; `OrderDetailPage` | test AC-04 รอ timeline ด้วย `findByRole`; F-03 แก้แล้ว; UI ไม่แสดงวันที่/ยอดรวมที่ ASM-10 ไม่ได้ระบุ (F-05 แก้แล้ว) | ครบ |
| FR-23 | AC-STATUS-05, AC-STATUS-06 | T-06–T-08, T-18 เสร็จ | `list_orders_for_user` เรียง `created_at DESC`; `OrderListPage` แสดงลำดับที่ API ส่งมาและลิงก์รายละเอียด | tests AC/TC-STATUS-05 และ integration flow ผ่าน | ครบ |
| NFR-22 | ไม่มี AC | T-25 เสร็จ | `backend/tests/test_NFR_22_response_time.py` เริ่ม uvicorn และยิงทั้งสาม endpoint ด้วย 100 concurrent requests | `test_NFR_22_response_time` ผ่าน; p95 ของทุก endpoint ไม่เกิน 2 วินาที | ครบ |
| NFR-REL-03 | AC-STATUS-07, AC-STATUS-08 | T-12–T-14, T-19–T-20, T-22–T-24 เสร็จ | detail/status/list query กรองสถานะยืนยัน; `OrderStatusTimeline` ไม่แสดง timeline เมื่อ history ว่างและล้างค่าเมื่อ error | tests confirmed-only, empty-history และ retry ผ่าน | ครบ |
| NFR-SEC-02 | AC-STATUS-01, AC-STATUS-09 | T-03, T-05, T-09, T-11, T-21 เสร็จ | `get_mock_order_user`; query ของ `list_orders_for_user`, `get_order_detail_for_user`, `get_order_status_for_user` กรองตาม `user_id` | `test_AC_STATUS_01_show_only_user_orders`, `test_AC_STATUS_09_show_only_authorized_orders`, UI tests AC-01/09 และ TC-01-2/02-3 ผ่าน; mock identity เปิดเฉพาะ development/test | ครบ |
| Constraint: ต้องมี Order ในระบบก่อนติดตาม | AC-STATUS-01 (Given) | T-02, T-03 เสร็จ | `list_orders_for_user` อ่านจากตาราง Order; `OrderListPage` แสดง empty state เมื่อไม่มีรายการ | AC-01 และ TC-01-1 ผ่าน; ไม่มีการสร้าง Order ในส่วน Status | ครบ |
| Constraint: ดูได้เฉพาะ Order ของตน | AC-STATUS-01, AC-STATUS-09 | T-03, T-09, T-21 เสร็จ | mock user dependency และ service queries กรองตามเจ้าของ | backend และ UI tests AC-01/09 ผ่าน | ครบ |
| Constraint: สถานะมาจากข้อมูลที่บันทึก | AC-STATUS-03, AC-STATUS-08 | T-01, T-12, T-19–T-20 เสร็จ | `order_status_history` และ query สถานะยืนยันจากฐานข้อมูล | backend AC-03/08 และ UI AC-03 tests ผ่าน; ความเสี่ยงจาก field `orders.status` ในหน้ารายการตาม F-01 | ครบ |
| Constraint: ลูกค้าแก้ไข/เปลี่ยนสถานะเองไม่ได้ | ไม่มี AC | T-09, T-22 เสร็จ | routes ของ Order มี GET สำหรับ list/detail/status และ POST refresh ที่อ่านข้อมูล ไม่พบ route เปลี่ยนสถานะ | เพิ่ม test PATCH สถานะจากลูกค้าได้ 405 และตรวจว่าสถานะไม่เปลี่ยน; F-06 แก้แล้ว | ครบ |
| Constraint: โหลดสถานะไม่ได้ต้องไม่แสดงสถานะไม่ยืนยัน | AC-STATUS-07, AC-STATUS-08 | T-19–T-20, T-22–T-24 เสร็จ | status service กรองรายการยืนยัน; list/detail/status และ UI error state ไม่ใช้สถานะที่ไม่ยืนยัน | F-01 และ F-02 แก้แล้ว; tests ผ่าน | ครบ |

## 2. ตามรอยย้อนกลับ (โค้ด ไป requirement)
| โค้ด (ไฟล์: ฟังก์ชัน หรือ endpoint) | อ้าง ID | ตรงกับข้อความใน spec ไหม | หมายเหตุ |
|---|---|---|---|
| `GET /api/orders` — `backend/app/routes/orders.py:get_orders` | FR-19, FR-23, NFR-SEC-02, NFR-REL-03 | ตรง | กรอง Order ตามผู้ใช้ เรียงวันที่สร้างจากใหม่ไปเก่า และใช้ status/เวลาเปลี่ยนล่าสุดจาก latest confirmed history; เมื่อไม่มี confirmed history จะไม่สร้างสถานะขึ้นเอง |
| `GET /api/orders/{order_id}` — `get_order_detail` | FR-20, FR-22, NFR-SEC-02, NFR-REL-03 | ตรง | query กรอง owner และเลือก latest confirmed status; API มีข้อมูลวันที่สร้าง/ยอดรวมสำหรับข้อมูลระบบ แต่หน้า detail แสดงเฉพาะข้อมูลตาม ASM-10 แล้ว |
| `GET /api/orders/{order_id}/status` — `get_order_status` | FR-21, NFR-REL-03, NFR-SEC-02 | ตรง | ส่งประวัติที่ยืนยันแล้วและเรียงตามเวลา; UI polling เรียก endpoint นี้ทุก 5 วินาที |
| `POST /api/orders/{order_id}/status/refresh` — `refresh_order_status` | FR-21, NFR-REL-03, AC-STATUS-07 | ตรง | เป็นการอ่านข้อมูลยืนยันใหม่ ไม่แก้สถานะ Order; จัดการฐานข้อมูลล้มเหลวเป็น error response |
| `get_mock_order_user`, `get_order_database` — `backend/app/routes/orders.py` | NFR-SEC-02, Constraint: ดู Order ของตน | ตรงตามขอบเขตต้นแบบ | Mock identity allowlist ทำงานเฉพาะ `development`/`test`; Production ปฏิเสธ mock auth |
| `list_orders_for_user` — `backend/app/services/orders.py` | FR-19, FR-23, NFR-SEC-02, NFR-REL-03 | ตรง | owner filter/sort ตรง และ status/last_updated_at มาจากรายการล่าสุดที่ `is_confirmed = 1` |
| `get_order_detail_for_user`, `get_order_status_for_user` — `backend/app/services/orders.py` | FR-20–FR-22, NFR-REL-03, NFR-SEC-02 | ตรงในส่วน query | detail/status แยกตามเจ้าของและอ่าน confirmed history; detail response มี `created_at` และ `total_amount` เพิ่มจาก ASM-10 |
| `OrderListPage` — `frontend/src/pages/OrderList.jsx` | FR-19, FR-23, NFR-REL-03 | บางส่วน | แสดง Order และลำดับ 4 ขั้น; ใช้ `order.status` จาก list โดยตรง; แสดงวันที่และยอดรวมในหน้ารายการ (รายการนี้ไม่ใช่ส่วนรายละเอียดตาม ASM-10) |
| `OrderDetailPage` — `frontend/src/pages/OrderDetail.jsx` | FR-20, FR-22, NFR-REL-03 | ตรง | แสดงรายการสินค้า จำนวน ราคา และสถานะล่าสุด โดยไม่แสดงข้อมูลนอก ASM-10 |
| `OrderItems` — `frontend/src/components/OrderItems.jsx` | FR-22 | ตรง | แสดงชื่อสินค้า จำนวน และราคาต่อหน่วยตาม requirement |
| `OrderStatusTimeline` — `frontend/src/components/OrderStatusTimeline.jsx` | FR-21, NFR-REL-03, ASM-11 | ตรงตามคำตัดสินทีม | แสดง 4 ขั้นและเวลา 2 สถานะท้ายจาก confirmed history; polling ทุก 5 วินาที และไม่แสดง timeline เมื่อ history ว่าง |
| `/orders/status`, `/orders/{order_id}/details` — `frontend/src/main.jsx` | FR-19, FR-20 | ตรง | route หน้ารายการ/รายละเอียดตาม plan; ไม่มี test ที่คลิกจากรายการและยืนยันหน้ารายละเอียดแบบต่อเนื่อง (F-04) |
| `backend/database.py:initialize_database`, `backend/seed.py:seed_order_data` | FR-19–FR-23, NFR-REL-03, NFR-SEC-02 | ตรงในขอบเขตที่ตรวจ | มีตาราง Order, items และ status history พร้อม `is_confirmed`; service ไม่ใช้ `orders.status` เป็นสถานะที่แสดงในรายการเมื่อมีประวัติยืนยัน |
| `/api/admin/menu` GET/POST/PATCH และ Admin menu UI | ไม่มี ID ใน feature นี้ | อยู่ใน Out of scope | เป็นโมดูลจัดการเมนู/ราคา/โปรโมชั่น ซึ่ง `spec.md` ระบุ Out of scope; แยกจากเส้นทาง Order Status และไม่ถือเป็นงานของ feature นี้ |
| `specs/mockups/Tracking/TrackingMenu.png` เทียบกับหน้า `OrderListPage` | ไม่มี UI ID ใน spec | ไม่ใช่ข้อกำหนด UI ที่ยืนยันแล้ว | ภาพอยู่นอกโฟลเดอร์ feature และ `spec.md` ไม่มี UI section; ในภาพมี Guest badge และข้อความแจ้งเตือนเมื่อพร้อมรับสินค้า ซึ่ง notification อยู่นอก scope (F-08); ไม่ใช้ความแตกต่างนี้เป็นข้อขาดของ implementation |

## 3. ข้อค้นพบ
ชนิด: AC ไม่มี test / test อ่อน / โค้ดไม่มี FR / FR ไม่มี AC / เดา Q-xx / ละเมิด Constraint / ตัวเลขไม่ตรง spec / อ้าง ID ผิดเรื่อง / mockup เกิน spec
ทีมตัดสิน: แก้โค้ด / แก้ spec / เพิ่ม Q-xx / ไม่ใช่ปัญหา (พร้อมเหตุผล 1 บรรทัด)

| F-ID | ชนิด | อยู่ที่ | ขัดกับ | รายละเอียด | ทีมตัดสิน |
|---|---|---|---|---|---|
| F-01 | ละเมิด Constraint | `backend/app/services/orders.py:list_orders_for_user`; `frontend/src/pages/OrderList.jsx` | NFR-REL-03; Constraint: ไม่แสดงสถานะที่ไม่ยืนยัน | แก้ query ให้ status/เวลาในรายการมาจาก latest confirmed history และเพิ่ม test กรณี `orders.status` ไม่ตรงกับประวัติยืนยัน | แก้โค้ดและเพิ่ม test แล้ว |
| F-02 | test อ่อน | `frontend/src/__tests__/TC-STATUS-03-3.test.jsx`; `OrderStatusTimeline.jsx` | NFR-REL-03; TC-STATUS-03-3 | รอ status request เสร็จแล้ว และเมื่อ history ว่าง component ไม่แสดง timeline หรือข้อความเพิ่มเติม | แก้โค้ดและ test ตามคำตัดสินทีมแล้ว |
| F-03 | test อ่อน | `frontend/src/pages/OrderDetail.test.jsx:70-130` | AC-STATUS-04; T-17 | เปลี่ยน assertion timeline เป็น `findByRole` เพื่อรอ status request เสร็จก่อนตรวจผล | แก้ test แล้ว |
| F-04 | test อ่อน | `frontend/src/pages/OrderDetail.test.jsx` | AC-STATUS-02, AC-STATUS-06; T-11, T-18 | เพิ่ม `OrderTrackingFlow` ที่คลิก link จากรายการและ render `OrderDetailPage` ของ Order ที่เลือกจริง | แก้ test แล้ว |
| F-05 | โค้ดไม่มี FR | `frontend/src/pages/OrderDetail.jsx` | ASM-10; FR-22 | ลบวันที่สั่งและยอดรวมออกจากหน้า detail ให้เหลือข้อมูลตาม ASM-10 | แก้โค้ดแล้ว |
| F-06 | test อ่อน | `backend/app/routes/orders.py`; `backend/tests/test_orders.py` | Constraint: ลูกค้าไม่สามารถแก้ไข/เปลี่ยนสถานะ Order ได้เอง | เพิ่ม test PATCH สถานะจากลูกค้า ต้องได้ 405 และตรวจข้อมูลสถานะไม่เปลี่ยน | เพิ่ม test แล้ว |
| F-07 | โค้ดไม่มี FR | `frontend/src/components/OrderStatusTimeline.jsx` | ASM-11; FR-21 | เพิ่ม polling ด้วย interval 5 วินาที ตามคำตัดสินทีม และยกเลิก timer เมื่อ unmount | แก้โค้ดและ test suite ผ่าน |
| F-08 | mockup เกิน spec | `specs/mockups/Tracking/TrackingMenu.png` | Out of scope: การส่งแจ้งเตือนเมื่อสถานะเปลี่ยน; ไม่มี UI ID | ทีมเลือกยึด spec เดิม จึงไม่ทำ notification และไม่ถือส่วนนี้ของ mockup เป็น requirement | ปิดเป็นไม่ใช่ปัญหาตามคำตัดสินทีม |

## 4. แก้แล้ว
| F-ID | แก้อย่างไร | รู้ได้อย่างไร |
|---|---|---|
| F-01 | query รายการใช้ latest confirmed status และเพิ่ม regression test | focused backend test ตรวจกรณี `orders.status` ไม่ตรงกับ latest confirmed แล้วผ่าน |
| F-03 | เปลี่ยน UI assertion ให้รอ status request ด้วย `findByRole` | test AC-04 เดิมที่ล้มเหลวตรวจ timeline หลัง request เสร็จและผ่าน |
| F-05 | ลบวันที่สั่งและยอดรวมจากหน้า Order detail | UI แสดงเฉพาะข้อมูลตาม ASM-10 และ focused/full UI test ผ่าน |
| F-06 | เพิ่ม test ปฏิเสธ PATCH เปลี่ยนสถานะจากลูกค้า | endpoint ที่ไม่รองรับตอบ 405 และสถานะยังไม่เปลี่ยน |
| F-02 | ให้ empty confirmed status ไม่ render timeline/ข้อความ และรอ request เสร็จใน test | TC-STATUS-03-3 และ full frontend suite ผ่าน |
| F-04 | เพิ่ม `OrderTrackingFlow` integration test คลิกจากรายการไป detail | test AC-STATUS-02 และ full frontend suite ผ่าน |
| F-07 | เพิ่ม polling ทุก 5 วินาทีและ cleanup timer | implementation ระบุ interval และ full frontend suite ผ่าน |
| F-08 | ยึด spec เดิม ไม่ทำ notification | ทีมตัดสินใจปิด finding เป็นไม่ใช่ปัญหา |
| T-25 | เพิ่ม pytest benchmark ผ่าน uvicorn สำหรับ 3 endpoint และ 100 concurrent users | `test_NFR_22_response_time` ผ่าน โดย p95 ทุก endpoint ไม่เกิน 2 วินาที |
