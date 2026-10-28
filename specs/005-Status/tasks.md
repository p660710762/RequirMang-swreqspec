# Tasks: ติดตามสถานะ Order

- Feature: ติดตามสถานะ Order (Order Status Tracking)
- Spec ID: SPEC-ORDER-STATUS-001
- อ้างอิง: [plan.md](./plan.md)
- วันที่: 2026-10-26
- สรุป: 3 เฟส รวม 25 tasks; ไม่มี task ที่รอ Open Questions
- เฟสแรกที่ลองใช้งานจริงได้: เฟส 1 เมื่อทำเส้นทางรายการ เลือกดูรายละเอียด สถานะ และกรณีโหลดผิดพลาดครบ
- หมายเหตุ: plan.md ระบุเทคโนโลยีและ endpoint แต่ไม่ได้ระบุโครงสร้างไฟล์หรือคำสั่งเปิดระบบ จึงเสนอ path มาตรฐานตาม React (Vite), FastAPI และฐานข้อมูลเชิงสัมพันธ์ไว้เป็นจุดเริ่มต้นให้ทีมยืนยันก่อนลงมือ; รายการเทคโนโลยีใน plan ระบุว่าเป็นสิ่งที่ทีมเลือกเอง ไม่ได้มาจาก spec
- หมายเหตุหน้าจอ: spec ไม่มี UI ID และไม่มี mockup จึงระบุ “ไม่มี UI ID/mockup ใน spec” ใน task หน้าจอ

## เฟส 0: ฐานราก

### T-01 ออกแบบโครงสร้างข้อมูล Order และสถานะ
- รองรับ: FR-19, FR-20, FR-21, FR-22, FR-23, NFR-REL-03, NFR-SEC-02
- ตรวจด้วย: ไม่มี AC ตรง ๆ เป็นงานพื้นฐานของ T-03
- ไฟล์ที่แตะ: `backend/models.py`, `backend/database.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: ไม่มี
- เสร็จเมื่อ: โครงสร้าง Order, OrderItem และ OrderStatusHistory รองรับข้อมูลที่ต้องแสดงและแยกข้อมูลตามผู้ใช้ได้
- สถานะ: เสร็จ

### T-02 เตรียมข้อมูล Order ตัวอย่างสำหรับพัฒนาและทดสอบ
- รองรับ: FR-19, FR-20, FR-21, FR-22, FR-23
- ตรวจด้วย: ไม่มี AC ตรง ๆ เป็นงานพื้นฐานของ T-03
- ไฟล์ที่แตะ: `backend/seed.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-01
- เสร็จเมื่อ: มีข้อมูลตัวอย่างขั้นต่ำสำหรับผู้ใช้หนึ่งรายที่มีหลาย Order และ Order มีรายการสินค้าและสถานะที่บันทึกไว้ให้ทดสอบได้
- สถานะ: เสร็จ

#### จุดตรวจเฟส 0
- test ที่ต้องผ่านทั้งหมด: `test_data_model_order_status`, `test_seed_order_data`
- เปิดระบบ: กำหนด `APP_ENV=development` และ `ORDER_DATABASE_PATH` ก่อนเปิด FastAPI; plan.md ไม่ได้ระบุคำสั่งเปิด backend/frontend
- คนลองเองตาม FR-19:
  Given มีข้อมูล Order ตัวอย่างของผู้ใช้ในฐานข้อมูล
  When ตรวจข้อมูลตัวอย่างและโครงสร้างข้อมูล
  Then พบ Order, รายการสินค้า และประวัติสถานะที่เชื่อมโยงกับเจ้าของ Order ได้
- ยังขาด: ไม่มี

## เฟส 1: ติดตาม Order ตั้งแต่รายการถึงรายละเอียดและกรณีโหลดผิดพลาด (AC-STATUS-01 ถึง AC-STATUS-09)

### T-03 สร้าง API รายการ Order ของผู้ใช้ปัจจุบัน
- รองรับ: FR-19, NFR-SEC-02, Constraint: ผู้ใช้ต้องมี Order อยู่ในระบบก่อนจึงสามารถติดตามสถานะได้, Constraint: ผู้ใช้สามารถดูสถานะเฉพาะ Order ของตนเอง
- ตรวจด้วย: AC-STATUS-01
- ไฟล์ที่แตะ: `backend/app/main.py`, `backend/app/routes/orders.py`, `backend/app/services/orders.py`, `tests/test_AC_STATUS_01_show_only_user_orders.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-01, T-02
- เสร็จเมื่อ: `GET /api/orders` ส่งกลับเฉพาะ Order ของผู้ใช้จาก Mock Authentication ซึ่งเปิดได้เฉพาะ Development/Test และปฏิเสธ Production; test ตรวจการแยก owner ผ่าน
- สถานะ: เสร็จ

### T-04 สร้างหน้ารายการ Order ของผู้ใช้
- รองรับ: FR-19, FR-23
- ตรวจด้วย: AC-STATUS-01
- ไฟล์ที่แตะ: `frontend/src/api/client.js`, `frontend/src/pages/OrderList.jsx`
- แบบหน้าจอ: ไม่มี UI ID/mockup ใน spec; หน้ารายการ Order ตาม plan.md
- ต้องทำหลัง: T-03
- เสร็จเมื่อ: หน้า `/orders/status` เรียก `GET /api/orders` ผ่าน `frontend/src/api/client.js` และแสดงรายการที่ได้รับจาก API
- สถานะ: เสร็จ

### T-05 ทดสอบการแสดงรายการ Order ของผู้ใช้
- รองรับ: FR-19, NFR-SEC-02
- ตรวจด้วย: AC-STATUS-01
- ไฟล์ที่แตะ: `backend/tests/test_orders.py`, `frontend/src/pages/OrderList.test.jsx`
- แบบหน้าจอ: ไม่มี UI ID/mockup ใน spec
- ต้องทำหลัง: T-03, T-04
- เสร็จเมื่อ: `test_AC_STATUS_01_show_only_user_orders` ผ่านโดยใช้ client จำลองสำหรับการทดสอบหน้าจอ
- สถานะ: เสร็จ

### T-06 เรียง API รายการ Order ตามวันที่สร้าง
- รองรับ: FR-23
- ตรวจด้วย: AC-STATUS-05
- ไฟล์ที่แตะ: `backend/app/services/orders.py`, `backend/tests/test_orders.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-03
- เสร็จเมื่อ: ผลจาก `GET /api/orders` เรียง Order ตามวันที่สร้างจากใหม่ไปเก่า
- สถานะ: เสร็จ

### T-07 แสดงรายการ Order หลายรายการตามลำดับที่ได้รับ
- รองรับ: FR-23
- ตรวจด้วย: AC-STATUS-05
- ไฟล์ที่แตะ: `frontend/src/pages/OrderList.jsx`, `frontend/src/pages/OrderList.test.jsx`
- แบบหน้าจอ: ไม่มี UI ID/mockup ใน spec; หน้ารายการ Order ตาม plan.md
- ต้องทำหลัง: T-04, T-06
- เสร็จเมื่อ: หน้ารายการแสดง Order หลายรายการตามลำดับวันที่สร้างล่าสุดก่อนที่ API ส่งมา
- สถานะ: เสร็จ

### T-08 ทดสอบการเรียงรายการ Order
- รองรับ: FR-23
- ตรวจด้วย: AC-STATUS-05
- ไฟล์ที่แตะ: `backend/tests/test_orders.py`, `frontend/src/pages/OrderList.test.jsx`
- แบบหน้าจอ: ไม่มี UI ID/mockup ใน spec
- ต้องทำหลัง: T-06, T-07
- เสร็จเมื่อ: `test_AC_STATUS_05_list_orders_sorted_by_latest_created` ผ่านเมื่อมี Order หลายรายการในวันเวลาต่างกัน
- สถานะ: เสร็จ

### T-09 สร้าง API รายละเอียด Order ที่ผู้ใช้มีสิทธิ์เข้าถึง
- รองรับ: FR-20, NFR-SEC-02, Constraint: ผู้ใช้สามารถดูสถานะเฉพาะ Order ของตนเอง
- ตรวจด้วย: AC-STATUS-02
- ไฟล์ที่แตะ: `backend/app/routes/orders.py`, `backend/app/services/orders.py`, `backend/tests/test_orders.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-01, T-03
- เสร็จเมื่อ: `GET /api/orders/{order_id}` ส่งรายละเอียดและสถานะล่าสุดที่ยืนยันแล้วของ Order ที่เป็นของผู้ใช้ปัจจุบัน; Order ของผู้อื่นไม่เปิดเผย
- สถานะ: เสร็จ

### T-10 สร้างหน้ารายละเอียด Order ที่เลือก
- รองรับ: FR-20
- ตรวจด้วย: AC-STATUS-02
- ไฟล์ที่แตะ: `frontend/src/api/client.js`, `frontend/src/pages/OrderDetail.jsx`, `frontend/src/pages/OrderList.jsx`, `frontend/src/main.jsx`, `frontend/src/pages/OrderDetail.test.jsx`
- แบบหน้าจอ: ไม่มี UI ID/mockup ใน spec; หน้ารายละเอียด Order ตาม plan.md
- ต้องทำหลัง: T-04, T-09
- เสร็จเมื่อ: การเลือก Order จากรายการเปิดหน้า `/orders/{order_id}/details` และโหลดข้อมูลผ่าน `frontend/src/api/client.js`
- สถานะ: เสร็จ

### T-11 ทดสอบการเลือก Order และดูรายละเอียด
- รองรับ: FR-20, NFR-SEC-02
- ตรวจด้วย: AC-STATUS-02
- ไฟล์ที่แตะ: `backend/tests/test_orders.py`, `frontend/src/pages/OrderDetail.test.jsx`
- แบบหน้าจอ: ไม่มี UI ID/mockup ใน spec
- ต้องทำหลัง: T-09, T-10
- เสร็จเมื่อ: `test_AC_STATUS_02_select_order_and_view_detail` ผ่านโดยใช้ client จำลองสำหรับการทดสอบหน้าจอ
- สถานะ: เสร็จ รอทีมตรวจ

### T-12 สร้าง API ประวัติสถานะที่ยืนยันแล้ว
- รองรับ: FR-21, NFR-REL-03, Constraint: สถานะ Order ต้องมาจากข้อมูลที่ระบบบันทึกไว้
- ตรวจด้วย: AC-STATUS-03
- ไฟล์ที่แตะ: `backend/app/routes/orders.py`, `backend/app/services/orders.py`, `backend/tests/test_orders.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-01, T-09
- เสร็จเมื่อ: API ส่งสถานะปัจจุบันและประวัติสถานะที่บันทึกยืนยันแล้ว โดยมีเวลาเปลี่ยนสถานะตามข้อมูล
- สถานะ: เสร็จ

### T-13 แสดงแถบสถานะ Order สี่ขั้น
- รองรับ: FR-21
- ตรวจด้วย: AC-STATUS-03
- ไฟล์ที่แตะ: `frontend/src/api/client.js`, `frontend/src/components/OrderStatusTimeline.jsx`, `frontend/src/components/OrderStatusTimeline.test.jsx`, `frontend/src/pages/OrderDetail.jsx`, `frontend/src/pages/OrderDetail.test.jsx`
- แบบหน้าจอ: ไม่มี UI ID/mockup ใน spec; แถบสถานะตามลำดับที่กำหนดใน AC-STATUS-03
- ต้องทำหลัง: T-10, T-12
- เสร็จเมื่อ: หน้ารายละเอียดแสดง “รอรับ Order” → “กำลังเตรียม” → “พร้อมรับสินค้า” → “รับสินค้าแล้ว” และแสดงเวลาเมื่อเป็นสองสถานะท้ายตามข้อมูลยืนยัน
- สถานะ: เสร็จ

### T-14 ทดสอบลำดับสถานะและเวลาเปลี่ยนสถานะ
- รองรับ: FR-21, NFR-REL-03
- ตรวจด้วย: AC-STATUS-03
- ไฟล์ที่แตะ: `backend/tests/test_orders.py`, `frontend/src/components/OrderStatusTimeline.test.jsx`
- แบบหน้าจอ: ไม่มี UI ID/mockup ใน spec
- ต้องทำหลัง: T-12, T-13
- เสร็จเมื่อ: `test_AC_STATUS_03_display_4_step_status_flow` ผ่านสำหรับสถานะทั้งสี่และเวลาของสถานะ “พร้อมรับสินค้า” หรือ “รับสินค้าแล้ว”
- สถานะ: เสร็จ

### T-15 เพิ่มข้อมูลรายการสินค้าในผลรายละเอียด Order
- รองรับ: FR-22
- ตรวจด้วย: AC-STATUS-04
- ไฟล์ที่แตะ: `backend/app/services/orders.py`, `backend/tests/test_orders.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-01, T-09
- เสร็จเมื่อ: รายละเอียดที่ API ส่งกลับมีรายการสินค้า จำนวน ราคา และสถานะล่าสุดที่เกี่ยวข้องกับ Order ที่เลือก
- สถานะ: เสร็จ

### T-16 แสดงรายการสินค้าในหน้ารายละเอียด Order
- รองรับ: FR-22
- ตรวจด้วย: AC-STATUS-04
- ไฟล์ที่แตะ: `frontend/src/components/OrderItems.jsx`, `frontend/src/pages/OrderDetail.jsx`, `frontend/src/pages/OrderDetail.test.jsx`
- แบบหน้าจอ: ไม่มี UI ID/mockup ใน spec; แสดงเฉพาะรายการสินค้า จำนวน ราคา และสถานะล่าสุดตาม FR-22
- ต้องทำหลัง: T-10, T-15
- เสร็จเมื่อ: หน้า Order detail แสดงรายการสินค้า จำนวน ราคา และสถานะล่าสุดจาก API
- สถานะ: เสร็จ

### T-17 ทดสอบข้อมูลสินค้าในรายละเอียด Order
- รองรับ: FR-22
- ตรวจด้วย: AC-STATUS-04
- ไฟล์ที่แตะ: `backend/tests/test_orders.py`, `frontend/src/components/OrderItems.test.jsx`
- แบบหน้าจอ: ไม่มี UI ID/mockup ใน spec
- ต้องทำหลัง: T-15, T-16
- เสร็จเมื่อ: `test_AC_STATUS_04_show_order_items_and_latest_status` ผ่านและยืนยันรายการสินค้า จำนวน ราคา และสถานะล่าสุด
- สถานะ: เสร็จ

### T-18 ทดสอบเลือก Order ที่ต้องการจากรายการหลาย Order
- รองรับ: FR-20, FR-23
- ตรวจด้วย: AC-STATUS-06
- ไฟล์ที่แตะ: `frontend/src/pages/OrderList.test.jsx`, `frontend/src/pages/OrderDetail.test.jsx`
- แบบหน้าจอ: ไม่มี UI ID/mockup ใน spec
- ต้องทำหลัง: T-07, T-10
- เสร็จเมื่อ: `test_AC_STATUS_06_select_order_from_multiple_orders` ผ่านและยืนยันว่ารายละเอียดที่แสดงเป็นของ Order ที่ผู้ใช้เลือก โดยใช้ client จำลอง
- สถานะ: เสร็จ

### T-19 กรองสถานะที่ยังไม่ยืนยันออกจากข้อมูลที่ส่งให้ผู้ใช้
- รองรับ: NFR-REL-03, FR-21, Constraint: หากไม่สามารถโหลดสถานะล่าสุดได้ ระบบต้องไม่แสดงข้อมูลสถานะที่ไม่ยืนยัน
- ตรวจด้วย: AC-STATUS-08
- ไฟล์ที่แตะ: `backend/app/services/orders.py`, `backend/tests/test_orders.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-12
- เสร็จเมื่อ: API เลือกเฉพาะสถานะล่าสุดที่บันทึกและยืนยันแล้ว และไม่ส่งสถานะที่ยังไม่ยืนยันเป็นสถานะปัจจุบัน
- สถานะ: เสร็จ

### T-20 ทดสอบการแสดงสถานะที่ยืนยันแล้วเท่านั้น
- รองรับ: NFR-REL-03
- ตรวจด้วย: AC-STATUS-08
- ไฟล์ที่แตะ: `backend/tests/test_orders.py`, `frontend/src/pages/OrderDetail.test.jsx`
- แบบหน้าจอ: ไม่มี UI ID/mockup ใน spec
- ต้องทำหลัง: T-13, T-19
- เสร็จเมื่อ: `test_AC_STATUS_08_show_only_confirmed_status` ผ่านเมื่อมีทั้งสถานะยืนยันแล้วและสถานะที่ยังไม่ยืนยัน
- สถานะ: เสร็จ

### T-21 ทดสอบการแยกข้อมูล Order ระหว่างผู้ใช้
- รองรับ: NFR-SEC-02, FR-19, Constraint: ผู้ใช้สามารถดูสถานะเฉพาะ Order ของตนเอง
- ตรวจด้วย: AC-STATUS-09
- ไฟล์ที่แตะ: `backend/tests/test_orders.py`, `frontend/src/pages/OrderList.test.jsx`
- แบบหน้าจอ: ไม่มี UI ID/mockup ใน spec
- ต้องทำหลัง: T-03, T-04
- เสร็จเมื่อ: `test_AC_STATUS_09_show_only_authorized_orders` ผ่านโดยมี Order ของผู้ใช้ปัจจุบันและผู้ใช้อื่น และหน้ารายการแสดงเฉพาะผล API ของผู้ใช้ปัจจุบัน
- สถานะ: เสร็จ

### T-22 สร้าง API สำหรับเรียกโหลดสถานะใหม่
- รองรับ: FR-21, NFR-REL-03, Constraint: หากไม่สามารถโหลดสถานะล่าสุดได้ ระบบต้องไม่แสดงข้อมูลสถานะที่ไม่ยืนยัน
- ตรวจด้วย: AC-STATUS-07
- ไฟล์ที่แตะ: `backend/app/routes/orders.py`, `backend/app/services/orders.py`, `backend/tests/test_orders.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-09, T-12
- เสร็จเมื่อ: `POST /api/orders/{order_id}/status/refresh` ส่งผลโหลดใหม่หรือ error state โดยไม่ทำให้สถานะที่ไม่ยืนยันกลายเป็นสถานะปัจจุบัน
- สถานะ: เสร็จ

### T-23 แสดงข้อความผิดพลาดและปุ่มลองใหม่
- รองรับ: FR-21, NFR-REL-03
- ตรวจด้วย: AC-STATUS-07
- ไฟล์ที่แตะ: `frontend/src/api/client.js`, `frontend/src/pages/OrderDetail.jsx`, `frontend/src/components/OrderStatusTimeline.jsx`, `frontend/src/pages/OrderDetail.test.jsx`
- แบบหน้าจอ: ไม่มี UI ID/mockup ใน spec; ข้อความและปุ่มตาม AC-STATUS-07
- ต้องทำหลัง: T-10, T-22
- เสร็จเมื่อ: เมื่อโหลดสถานะล้มเหลว หน้าแสดง “ไม่สามารถโหลดสถานะได้” พร้อมปุ่ม “ลองใหม่” และไม่แสดงสถานะเก่าที่ไม่ได้รับการยืนยัน
- สถานะ: เสร็จ

### T-24 ทดสอบกรณีโหลดสถานะล้มเหลวและลองใหม่
- รองรับ: NFR-REL-03, FR-21
- ตรวจด้วย: AC-STATUS-07
- ไฟล์ที่แตะ: `backend/tests/test_orders.py`, `frontend/src/pages/OrderDetail.test.jsx`
- แบบหน้าจอ: ไม่มี UI ID/mockup ใน spec
- ต้องทำหลัง: T-22, T-23
- เสร็จเมื่อ: `test_AC_STATUS_07_show_retry_when_load_fails` ผ่านโดยจำลอง API ล้มเหลวและใช้ client จำลองใน test หน้าจอ
- สถานะ: เสร็จ

#### จุดตรวจเฟส 1
- test ที่ต้องผ่านทั้งหมด: `test_AC_STATUS_01_show_only_user_orders`, `test_AC_STATUS_02_select_order_and_view_detail`, `test_AC_STATUS_03_display_4_step_status_flow`, `test_AC_STATUS_04_show_order_items_and_latest_status`, `test_AC_STATUS_05_list_orders_sorted_by_latest_created`, `test_AC_STATUS_06_select_order_from_multiple_orders`, `test_AC_STATUS_07_show_retry_when_load_fails`, `test_AC_STATUS_08_show_only_confirmed_status`, `test_AC_STATUS_09_show_only_authorized_orders` และ test ของเฟส 0 ต้องยังผ่าน
- เปิดระบบ: กำหนด `APP_ENV=development` และ `ORDER_DATABASE_PATH` ก่อนเปิด FastAPI; plan.md ไม่ได้ระบุคำสั่งเปิด backend/frontend
- คนลองเองตาม AC-STATUS-01 ถึง AC-STATUS-09:
  Given มี Order ตัวอย่างหลายรายการของผู้ใช้ และมี Order ของผู้ใช้อื่น รวมถึงสถานะที่บันทึกยืนยันแล้ว
  When เปิดรายการ Order เลือกรายการ และเปิดรายละเอียด โดยทดสอบทั้งกรณีโหลดสำเร็จและโหลดสถานะไม่สำเร็จ
  Then เห็นเฉพาะ Order ของตนเอง เรียงจากวันที่สร้างล่าสุด เลือกดูรายละเอียด สินค้า และสถานะตามลำดับได้ และเมื่อโหลดไม่สำเร็จเห็นข้อความ/ปุ่มลองใหม่โดยไม่มีสถานะเดิมที่ไม่ยืนยัน
- ยังขาด: ไม่มี

## เฟส 2: ตรวจเวลาตอบสนองตาม NFR-22 (ไม่มี AC)

### T-25 ทดสอบเวลาตอบสนองของหน้าติดตามสถานะ
- รองรับ: NFR-22
- ตรวจด้วย: ไม่มี AC ตรง ๆ; ตรวจ NFR-22 ตามเกณฑ์ p95 ไม่เกิน 2 วินาที ที่ผู้ใช้พร้อมกัน 100 คน
- ไฟล์ที่แตะ: `tests/test_NFR_22_response_time.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-03, T-04, T-06, T-09, T-10, T-12, T-13, T-15, T-16
- เสร็จเมื่อ: ผลทดสอบระบุค่า p95 ของหน้ารายการและหน้าตรวจสอบสถานะภายใต้ผู้ใช้พร้อมกัน 100 คน และยืนยันว่าไม่เกิน 2 วินาที
- สถานะ: เสร็จ

#### จุดตรวจเฟส 2
- test ที่ต้องผ่านทั้งหมด: `test_NFR_22_response_time` และ test ของเฟส 0–1 ต้องยังผ่าน
- เปิดระบบ: plan.md ไม่ได้ระบุคำสั่งเปิด backend/frontend; ทีมกำหนดคำสั่งก่อนเริ่มพัฒนา
- คนลองเองตาม NFR-22:
  Given เตรียมสภาพแวดล้อมทดสอบผู้ใช้พร้อมกัน 100 คน
  When เปิดหน้ารายการและหน้ารายละเอียด Order เพื่อวัดเวลาตอบสนอง
  Then ค่า p95 ของหน้าที่ทดสอบไม่เกิน 2 วินาที
- ยังขาด: ไม่มี

## ตารางตรวจความครบ: Acceptance Criteria

| AC ID | task ที่ตรวจ AC นี้ |
|---|---|
| AC-STATUS-01 | T-03, T-04, T-05 |
| AC-STATUS-02 | T-09, T-10, T-11 |
| AC-STATUS-03 | T-12, T-13, T-14 |
| AC-STATUS-04 | T-15, T-16, T-17 |
| AC-STATUS-05 | T-06, T-07, T-08 |
| AC-STATUS-06 | T-18 |
| AC-STATUS-07 | T-22, T-23, T-24 |
| AC-STATUS-08 | T-19, T-20 |
| AC-STATUS-09 | T-21 |

## ตารางตรวจความครบ: Constraints

| Constraint ID | task ที่ทำให้เป็นจริง |
|---|---|
| ผู้ใช้ต้องมี Order อยู่ในระบบก่อนจึงสามารถติดตามสถานะได้ | T-02, T-03 |
| ผู้ใช้สามารถดูสถานะเฉพาะ Order ของตนเอง | T-03, T-09, T-21 |
| สถานะ Order ต้องมาจากข้อมูลที่ระบบบันทึกไว้ | T-01, T-12, T-19 |
| ลูกค้าไม่สามารถแก้ไขหรือเปลี่ยนสถานะ Order ได้เอง | T-09, T-22 (มีเฉพาะการอ่านและเรียกโหลดใหม่ ไม่มี API ให้ลูกค้าเปลี่ยนสถานะ) |
| หากไม่สามารถโหลดสถานะล่าสุดได้ ระบบต้องไม่แสดงข้อมูลสถานะที่ไม่ยืนยัน | T-19, T-22, T-23, T-24 |

## ตารางตรวจความครบ: Functional Requirements

| FR ID | AC ที่ตรวจ FR นี้ | เฟส |
|---|---|---|
| FR-19 | AC-STATUS-01 | เฟส 1 |
| FR-20 | AC-STATUS-02, AC-STATUS-06 | เฟส 1 |
| FR-21 | AC-STATUS-03, AC-STATUS-07 | เฟส 1 |
| FR-22 | AC-STATUS-04 | เฟส 1 |
| FR-23 | AC-STATUS-05, AC-STATUS-06 | เฟส 1 |

## สิ่งที่ยังไม่ทำ

- Open Questions: spec.md มีหัวข้อ Open Questions แต่ไม่มีรายการคำถาม
- ไม่มี task ที่รอคำตอบ
- คำตัดสินทีม: ASM-11 ใช้ polling ทุก 5 วินาทีใน `OrderStatusTimeline`
- คำตัดสินทีม: NFR-22 ใช้ pytest ยิง `GET /api/orders`, `GET /api/orders/{order_id}` และ `GET /api/orders/{order_id}/status` ผ่าน uvicorn local server ด้วย 100 concurrent users
