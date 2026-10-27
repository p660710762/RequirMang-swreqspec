# Tasks: ดูรายงานยอดขายและสถิติ (Sales Report & Statistics)

- Feature: ดูรายงานยอดขายและสถิติ
- Spec ID: SPEC-SALES-REPORT-001
- อ้างอิง: [spec.md](./spec.md), [plan.md](./plan.md)
- วันที่: 2569-10-26
- สรุป: 13 เฟส รวม 25 tasks; เฟสแรกที่ Manager ทดลองเปิดและเห็นหน้ารายงานได้คือเฟส 1
- สรุป: มี 0 tasks ที่รอ Open Questions (spec ระบุว่าไม่มี)
- สรุป: เฟส 1 เป็นเฟสแรกที่ทดลองใช้งานได้จริง หลังจบฐานรากเฟส 0

> หมายเหตุ: `plan.md` ระบุ React (Vite), Python FastAPI และฐานข้อมูลเชิงสัมพันธ์ แต่ไม่ได้กำหนดโครงสร้างไฟล์หรือคำสั่งเปิดระบบและ test runner; path ด้านล่างเป็นตำแหน่งเสนอให้ทีมยืนยันก่อน implement
>
> Spec และ plan ไม่มี UI ID หรือ mockup; งานหน้าจอจึงระบุว่าไม่มี ส่วน UI tests ให้ใช้ API client จำลอง และหน้าจอจริงต้องเรียก API ผ่าน `frontend/src/api/client.js`

## เฟส 0: ฐานราก

### T-01 กำหนดโครงข้อมูลสำหรับรายงาน
- รองรับ: FR-50, FR-51, FR-52, FR-53, FR-54, FR-56
- ตรวจด้วย: ไม่มี AC ตรง ๆ เป็นงานพื้นฐานของ T-04
- ไฟล์ที่แตะ: `backend/app/models/report.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: ไม่มี
- เสร็จเมื่อ: `test_report_models` ผ่านสำหรับ BranchReportRequest, SalesSummary, TopSellingMenu และ ReportResult โดยอ้างอิงข้อมูล Order ที่ระบบมีอยู่
- สถานะ: พร้อมทำ

### T-02 ตั้งโครง API รายงานและ aggregation service
- รองรับ: FR-50, FR-52, FR-53, FR-54, FR-56
- ตรวจด้วย: ไม่มี AC ตรง ๆ เป็นงานพื้นฐานของ T-04
- ไฟล์ที่แตะ: `backend/app/main.py`, `backend/app/routes/reports.py`, `backend/app/services/report_service.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-01
- เสร็จเมื่อ: `test_report_route_registered` ผ่านและแอป FastAPI ลงทะเบียน route รายงานกับ service ได้
- สถานะ: พร้อมทำ

### T-03 ตั้งโครงหน้า React และ API client
- รองรับ: FR-50, FR-51
- ตรวจด้วย: ไม่มี AC ตรง ๆ เป็นงานพื้นฐานของ T-05
- ไฟล์ที่แตะ: `frontend/src/App.jsx`, `frontend/src/api/client.js`, `frontend/src/pages/SalesReportPage.jsx`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: ไม่มี
- เสร็จเมื่อ: `test_sales_report_page_renders` ผ่านและหน้า React เริ่มแสดงโครงรายงานโดยเตรียมเรียก API ผ่าน client ได้
- สถานะ: พร้อมทำ

#### จุดตรวจเฟส 0
- test ที่ต้องผ่านทั้งหมด: `test_report_models`, `test_report_route_registered`, `test_sales_report_page_renders`
- เปิดระบบ: `plan.md` ไม่ระบุคำสั่งเปิด backend หรือ frontend; ให้ทีมกำหนดก่อน implement
- คนลองเองตามงานพื้นฐาน:
  Given เตรียม environment ตาม React (Vite), Python FastAPI และฐานข้อมูลเชิงสัมพันธ์ที่ทีมเลือก
  When เปิด backend และ frontend ด้วยคำสั่งที่ทีมกำหนด
  Then แอปเริ่มทำงานและแสดงโครงหน้า Sales Report ได้
- ยังขาด: ไม่มี

## เฟส 1: เปิดหน้ารายงานยอดขายและสถิติ (AC-REPORT-01)

### T-04 ให้ Manager เปิด API รายงานได้
- รองรับ: FR-50, Constraint: ผู้ใช้งานต้องเข้าสู่ระบบและมีสิทธิ์เป็น Manager ของสาขานั้นก่อนเข้าถึงรายงาน
- ตรวจด้วย: AC-REPORT-01 — `test_AC_REPORT_01_manager_can_open_sales_report`
- ไฟล์ที่แตะ: `backend/app/routes/reports.py`, `backend/app/services/report_service.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-02
- เสร็จเมื่อ: `test_AC_REPORT_01_manager_can_open_sales_report` ผ่านเมื่อ Manager มีสิทธิ์และเปิด endpoint รายงานได้โดยไม่สร้างข้อมูลรายงานนอก scope
- สถานะ: พร้อมทำ

### T-05 แสดงหน้ารายงานให้ Manager
- รองรับ: FR-50
- ตรวจด้วย: AC-REPORT-01 — `test_AC_REPORT_01_manager_can_open_sales_report`
- ไฟล์ที่แตะ: `frontend/src/pages/SalesReportPage.jsx`, `frontend/src/api/client.js`, `frontend/src/pages/SalesReportPage.test.jsx`
- แบบหน้าจอ: ไม่มี (ไม่มี UI ID หรือ mockup ใน spec)
- ต้องทำหลัง: T-03, T-04
- เสร็จเมื่อ: `test_AC_REPORT_01_manager_can_open_sales_report` ผ่านด้วย client จำลองและหน้าจอจริงเรียก API ผ่าน `frontend/src/api/client.js`
- สถานะ: พร้อมทำ

#### จุดตรวจเฟส 1
- test ที่ต้องผ่านทั้งหมด: `test_AC_REPORT_01_manager_can_open_sales_report` และ tests จากเฟส 0
- เปิดระบบ: `plan.md` ไม่ระบุคำสั่งเปิด backend หรือ frontend; ให้ทีมกำหนดก่อน implement
- คนลองเองตาม AC-REPORT-01:
  Given Manager มีสิทธิ์เข้าถึงรายงาน
  When Manager เปิดหน้ารายงาน
  Then ระบบแสดงหน้ารายงานยอดขายและสถิติ
- ยังขาด: ไม่มี

## เฟส 2: เลือกสาขาและช่วงวันที่ (AC-REPORT-02)

### T-06 ตรวจสอบสาขาและช่วงวันที่ที่ใช้ขอรายงาน
- รองรับ: FR-51, Constraint: ช่วงเวลาที่เลือกต้องเป็นช่วงวันที่ที่ถูกต้อง และค่าเริ่มต้นของช่วงวันที่คือ 7 วันที่ผ่านมา
- ตรวจด้วย: AC-REPORT-02 — `test_AC_REPORT_02_filter_by_branch_and_date`
- ไฟล์ที่แตะ: `backend/app/routes/reports.py`, `backend/app/services/report_service.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-04
- เสร็จเมื่อ: `test_AC_REPORT_02_filter_by_branch_and_date` ผ่านสำหรับสาขาที่ได้รับสิทธิ์, ช่วงวันที่ถูกต้อง และ default 7 วันที่ผ่านมา
- สถานะ: พร้อมทำ

### T-07 เพิ่มตัวเลือกสาขาและช่วงวันที่บนหน้า
- รองรับ: FR-51
- ตรวจด้วย: AC-REPORT-02 — `test_AC_REPORT_02_filter_by_branch_and_date`
- ไฟล์ที่แตะ: `frontend/src/pages/SalesReportPage.jsx`, `frontend/src/api/client.js`, `frontend/src/pages/SalesReportPage.test.jsx`
- แบบหน้าจอ: ไม่มี (ไม่มี UI ID หรือ mockup ใน spec)
- ต้องทำหลัง: T-05, T-06
- เสร็จเมื่อ: `test_AC_REPORT_02_filter_by_branch_and_date` ผ่านด้วย client จำลอง โดยหน้าแสดงตัวเลือกสาขาและช่วงวันที่เริ่ม-สิ้นสุดพร้อมค่าเริ่มต้น 7 วันที่ผ่านมา
- สถานะ: พร้อมทำ

#### จุดตรวจเฟส 2
- test ที่ต้องผ่านทั้งหมด: `test_AC_REPORT_01_manager_can_open_sales_report`, `test_AC_REPORT_02_filter_by_branch_and_date` และ tests จากเฟส 0
- เปิดระบบ: `plan.md` ไม่ระบุคำสั่งเปิด backend หรือ frontend; ให้ทีมกำหนดก่อน implement
- คนลองเองตาม AC-REPORT-02:
  Given Manager อยู่ในหน้ารายงาน
  When เลือกสาขาและวันที่เริ่ม-สิ้นสุด หรือใช้ค่าเริ่มต้น
  Then ระบบรับเงื่อนไขที่เลือกไปประมวลผลรายงาน โดยค่าเริ่มต้นแสดงช่วง 7 วันที่ผ่านมา
- ยังขาด: ไม่มี

## เฟส 3: แสดงยอดขายรวม (AC-REPORT-03)

### T-08 คำนวณยอดขายจากรายการที่ชำระสำเร็จ
- รองรับ: FR-52, Constraint: ยอดขายรวมและจำนวน Order คำนวณจาก Order ที่ชำระเงินสำเร็จเท่านั้น
- ตรวจด้วย: AC-REPORT-03 — `test_AC_REPORT_03_show_total_sales`
- ไฟล์ที่แตะ: `backend/app/services/report_service.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-01, T-06
- เสร็จเมื่อ: `test_AC_REPORT_03_show_total_sales` ผ่านโดยรวมยอดเฉพาะ Order ที่ชำระเงินสำเร็จในสาขาและช่วงวันที่ที่เลือก
- สถานะ: พร้อมทำ

### T-09 แสดงยอดขายรวมบนรายงาน
- รองรับ: FR-52
- ตรวจด้วย: AC-REPORT-03 — `test_AC_REPORT_03_show_total_sales`
- ไฟล์ที่แตะ: `frontend/src/pages/SalesReportPage.jsx`, `frontend/src/api/client.js`, `frontend/src/pages/SalesReportPage.test.jsx`
- แบบหน้าจอ: ไม่มี (ไม่มี UI ID หรือ mockup ใน spec)
- ต้องทำหลัง: T-07, T-08
- เสร็จเมื่อ: `test_AC_REPORT_03_show_total_sales` ผ่านด้วย client จำลองและหน้าแสดงยอดขายรวมจากผล API
- สถานะ: พร้อมทำ

#### จุดตรวจเฟส 3
- test ที่ต้องผ่านทั้งหมด: `test_AC_REPORT_01_manager_can_open_sales_report`, `test_AC_REPORT_02_filter_by_branch_and_date`, `test_AC_REPORT_03_show_total_sales` และ tests จากเฟส 0
- เปิดระบบ: `plan.md` ไม่ระบุคำสั่งเปิด backend หรือ frontend; ให้ทีมกำหนดก่อน implement
- คนลองเองตาม AC-REPORT-03:
  Given มี Order ที่ชำระเงินสำเร็จในสาขาและช่วงเวลาที่เลือก
  When Manager เปิดรายงาน
  Then รายงานแสดงยอดขายรวมของช่วงเวลานั้น
- ยังขาด: ไม่มี

## เฟส 4: แสดงจำนวน Order (AC-REPORT-04)

### T-10 คำนวณจำนวน Order ที่สำเร็จ
- รองรับ: FR-53, Constraint: ยอดขายรวมและจำนวน Order คำนวณจาก Order ที่ชำระเงินสำเร็จเท่านั้น
- ตรวจด้วย: AC-REPORT-04 — `test_AC_REPORT_04_show_completed_order_count`
- ไฟล์ที่แตะ: `backend/app/services/report_service.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-08
- เสร็จเมื่อ: `test_AC_REPORT_04_show_completed_order_count` ผ่านโดยนับเฉพาะ Order ที่สำเร็จในสาขาและช่วงวันที่ที่เลือก
- สถานะ: พร้อมทำ

### T-11 แสดงจำนวน Order บนรายงาน
- รองรับ: FR-53
- ตรวจด้วย: AC-REPORT-04 — `test_AC_REPORT_04_show_completed_order_count`
- ไฟล์ที่แตะ: `frontend/src/pages/SalesReportPage.jsx`, `frontend/src/api/client.js`, `frontend/src/pages/SalesReportPage.test.jsx`
- แบบหน้าจอ: ไม่มี (ไม่มี UI ID หรือ mockup ใน spec)
- ต้องทำหลัง: T-09, T-10
- เสร็จเมื่อ: `test_AC_REPORT_04_show_completed_order_count` ผ่านด้วย client จำลองและหน้าแสดงจำนวน Order ที่สำเร็จ
- สถานะ: พร้อมทำ

#### จุดตรวจเฟส 4
- test ที่ต้องผ่านทั้งหมด: `test_AC_REPORT_01_manager_can_open_sales_report`, `test_AC_REPORT_02_filter_by_branch_and_date`, `test_AC_REPORT_03_show_total_sales`, `test_AC_REPORT_04_show_completed_order_count` และ tests จากเฟส 0
- เปิดระบบ: `plan.md` ไม่ระบุคำสั่งเปิด backend หรือ frontend; ให้ทีมกำหนดก่อน implement
- คนลองเองตาม AC-REPORT-04:
  Given มี Order ที่สำเร็จในสาขาและช่วงเวลาที่เลือก
  When Manager เปิดรายงาน
  Then รายงานแสดงจำนวน Order ของช่วงเวลานั้น
- ยังขาด: ไม่มี

## เฟส 5: แสดงเมนูขายดีตามจำนวนชิ้น (AC-REPORT-05)

### T-12 จัดอันดับเมนูจากจำนวนชิ้นที่ขาย
- รองรับ: FR-54, Constraint: เมนูขายดีจัดอันดับจากจำนวนชิ้นที่ขายในช่วงเวลาที่เลือก
- ตรวจด้วย: AC-REPORT-05 — `test_AC_REPORT_05_show_top_selling_menu`
- ไฟล์ที่แตะ: `backend/app/services/report_service.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-01, T-06
- เสร็จเมื่อ: `test_AC_REPORT_05_show_top_selling_menu` ผ่านโดยเรียงเมนูตามจำนวนชิ้นที่ขายจากมากไปน้อยสำหรับเงื่อนไขที่เลือก
- สถานะ: พร้อมทำ

### T-13 แสดงรายการเมนูขายดีบนรายงาน
- รองรับ: FR-54
- ตรวจด้วย: AC-REPORT-05 — `test_AC_REPORT_05_show_top_selling_menu`
- ไฟล์ที่แตะ: `frontend/src/pages/SalesReportPage.jsx`, `frontend/src/api/client.js`, `frontend/src/pages/SalesReportPage.test.jsx`
- แบบหน้าจอ: ไม่มี (ไม่มี UI ID หรือ mockup ใน spec)
- ต้องทำหลัง: T-07, T-12
- เสร็จเมื่อ: `test_AC_REPORT_05_show_top_selling_menu` ผ่านด้วย client จำลองและหน้าแสดงเมนูเรียงตามจำนวนชิ้นที่ขาย
- สถานะ: พร้อมทำ

#### จุดตรวจเฟส 5
- test ที่ต้องผ่านทั้งหมด: `test_AC_REPORT_01_manager_can_open_sales_report`, `test_AC_REPORT_02_filter_by_branch_and_date`, `test_AC_REPORT_03_show_total_sales`, `test_AC_REPORT_04_show_completed_order_count`, `test_AC_REPORT_05_show_top_selling_menu` และ tests จากเฟส 0
- เปิดระบบ: `plan.md` ไม่ระบุคำสั่งเปิด backend หรือ frontend; ให้ทีมกำหนดก่อน implement
- คนลองเองตาม AC-REPORT-05:
  Given มีข้อมูลรายการขายหลายเมนูในช่วงเวลาที่เลือก
  When Manager เปิดรายงาน
  Then ระบบแสดงเมนูขายดีเรียงตามจำนวนชิ้นที่ขาย
- ยังขาด: ไม่มี

## เฟส 6: แสดงรายงานสอดคล้องกับ Order ที่บันทึก (AC-REPORT-07)

### T-14 ตรวจความสอดคล้องของข้อมูลรายงานกับ Order
- รองรับ: FR-56, NFR-ACC-01
- ตรวจด้วย: AC-REPORT-07 — `test_AC_REPORT_07_report_matches_saved_data`
- ไฟล์ที่แตะ: `backend/tests/test_report_accuracy.py`, `backend/app/services/report_service.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-08, T-10, T-12
- เสร็จเมื่อ: `test_AC_REPORT_07_report_matches_saved_data` ผ่านโดยเทียบยอดขาย จำนวน Order และจำนวนขายรายเมนูกับข้อมูล Order ที่บันทึกไว้
- สถานะ: พร้อมทำ

### T-15 แสดงค่ารายงานที่สอดคล้องกับข้อมูลที่บันทึก
- รองรับ: FR-56, NFR-ACC-01
- ตรวจด้วย: AC-REPORT-07 — `test_AC_REPORT_07_report_matches_saved_data`
- ไฟล์ที่แตะ: `frontend/src/pages/SalesReportPage.jsx`, `frontend/src/api/client.js`, `frontend/src/pages/SalesReportPage.test.jsx`
- แบบหน้าจอ: ไม่มี (ไม่มี UI ID หรือ mockup ใน spec)
- ต้องทำหลัง: T-09, T-11, T-13, T-14
- เสร็จเมื่อ: `test_AC_REPORT_07_report_matches_saved_data` ผ่านด้วย client จำลองและตรวจว่าหน้าจอแสดงค่าทั้งสามชุดตรงกับ payload ที่อิงข้อมูลที่บันทึก
- สถานะ: พร้อมทำ

#### จุดตรวจเฟส 6
- test ที่ต้องผ่านทั้งหมด: `test_AC_REPORT_01_manager_can_open_sales_report`, `test_AC_REPORT_02_filter_by_branch_and_date`, `test_AC_REPORT_03_show_total_sales`, `test_AC_REPORT_04_show_completed_order_count`, `test_AC_REPORT_05_show_top_selling_menu`, `test_AC_REPORT_07_report_matches_saved_data` และ tests จากเฟส 0
- เปิดระบบ: `plan.md` ไม่ระบุคำสั่งเปิด backend หรือ frontend; ให้ทีมกำหนดก่อน implement
- คนลองเองตาม AC-REPORT-07:
  Given ระบบมีข้อมูล Order และยอดขายที่บันทึกไว้
  When Manager เปิดรายงาน
  Then ยอดขาย จำนวน Order และเมนูขายดีสอดคล้องกับข้อมูลในระบบ
- ยังขาด: ไม่มี

## เฟส 7: คำนวณรายงานใหม่เมื่อเปลี่ยนเงื่อนไข (AC-REPORT-06)

### T-16 คำนวณรายงานใหม่จากสาขาหรือช่วงเวลาใหม่
- รองรับ: FR-55
- ตรวจด้วย: AC-REPORT-06 — `test_AC_REPORT_06_recalculate_on_filter_change`
- ไฟล์ที่แตะ: `backend/app/routes/reports.py`, `backend/app/services/report_service.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-06, T-08, T-10, T-12
- เสร็จเมื่อ: `test_AC_REPORT_06_recalculate_on_filter_change` ผ่านเมื่อ API รับ filter ใหม่และส่งผลคำนวณที่ตรงกับสาขาและช่วงเวลาใหม่
- สถานะ: พร้อมทำ

### T-17 เรียก API และแสดงผลหลังเปลี่ยน filter
- รองรับ: FR-55
- ตรวจด้วย: AC-REPORT-06 — `test_AC_REPORT_06_recalculate_on_filter_change`
- ไฟล์ที่แตะ: `frontend/src/pages/SalesReportPage.jsx`, `frontend/src/api/client.js`, `frontend/src/pages/SalesReportPage.test.jsx`
- แบบหน้าจอ: ไม่มี (ไม่มี UI ID หรือ mockup ใน spec)
- ต้องทำหลัง: T-07, T-15, T-16
- เสร็จเมื่อ: `test_AC_REPORT_06_recalculate_on_filter_change` ผ่านด้วย client จำลองและหน้าเรียก API ใหม่เมื่อเปลี่ยนสาขาหรือช่วงวันที่
- สถานะ: พร้อมทำ

#### จุดตรวจเฟส 7
- test ที่ต้องผ่านทั้งหมด: `test_AC_REPORT_01_manager_can_open_sales_report`, `test_AC_REPORT_02_filter_by_branch_and_date`, `test_AC_REPORT_03_show_total_sales`, `test_AC_REPORT_04_show_completed_order_count`, `test_AC_REPORT_05_show_top_selling_menu`, `test_AC_REPORT_06_recalculate_on_filter_change`, `test_AC_REPORT_07_report_matches_saved_data` และ tests จากเฟส 0
- เปิดระบบ: `plan.md` ไม่ระบุคำสั่งเปิด backend หรือ frontend; ให้ทีมกำหนดก่อน implement
- คนลองเองตาม AC-REPORT-06:
  Given Manager กำลังดูรายงานของสาขาหรือช่วงเวลาหนึ่ง
  When เปลี่ยนสาขาหรือช่วงเวลา
  Then ระบบคำนวณและแสดงรายงานใหม่ตามเงื่อนไขใหม่
- ยังขาด: ไม่มี

## เฟส 8: ทดสอบการเปลี่ยนสาขาหรือเวลาใน Alternative Flow (AC-REPORT-08)

### T-18 ทดสอบ Alternative Flow เมื่อเปลี่ยนเงื่อนไขรายงาน
- รองรับ: FR-55, AC-REPORT-08
- ตรวจด้วย: AC-REPORT-08 — `test_AC_REPORT_08_refresh_report_after_filter_change`
- ไฟล์ที่แตะ: `frontend/src/pages/SalesReportPage.test.jsx`
- แบบหน้าจอ: ไม่มี (ไม่มี UI ID หรือ mockup ใน spec)
- ต้องทำหลัง: T-17
- เสร็จเมื่อ: `test_AC_REPORT_08_refresh_report_after_filter_change` ผ่านด้วย client จำลองเมื่อผู้ใช้เปลี่ยนสาขาหรือช่วงเวลา และเห็นผลตามเงื่อนไขใหม่
- สถานะ: พร้อมทำ

#### จุดตรวจเฟส 8
- test ที่ต้องผ่านทั้งหมด: `test_AC_REPORT_01_manager_can_open_sales_report`, `test_AC_REPORT_02_filter_by_branch_and_date`, `test_AC_REPORT_03_show_total_sales`, `test_AC_REPORT_04_show_completed_order_count`, `test_AC_REPORT_05_show_top_selling_menu`, `test_AC_REPORT_06_recalculate_on_filter_change`, `test_AC_REPORT_07_report_matches_saved_data`, `test_AC_REPORT_08_refresh_report_after_filter_change` และ tests จากเฟส 0
- เปิดระบบ: `plan.md` ไม่ระบุคำสั่งเปิด backend หรือ frontend; ให้ทีมกำหนดก่อน implement
- คนลองเองตาม AC-REPORT-08:
  Given Manager เลือกสาขาและช่วงเวลาสำหรับรายงาน
  When เปลี่ยนสาขาหรือช่วงเวลา
  Then ระบบแสดงรายงานใหม่ตามสาขาและช่วงเวลาใหม่
- ยังขาด: ไม่มี

## เฟส 9: แสดงสถานะไม่มีข้อมูล (AC-REPORT-09)

### T-19 ส่งผลลัพธ์ว่างเมื่อไม่มี Order หรือยอดขายในช่วงที่เลือก
- รองรับ: FR-56, Constraint: หากไม่มีข้อมูลในช่วงเวลาที่เลือก ระบบต้องแสดงข้อความว่าไม่มีข้อมูลสำหรับช่วงเวลานั้น และไม่แสดงตัวเลขใด ๆ
- ตรวจด้วย: AC-REPORT-09 — `test_AC_REPORT_09_empty_data_message`
- ไฟล์ที่แตะ: `backend/app/services/report_service.py`, `backend/app/routes/reports.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-08, T-10, T-12
- เสร็จเมื่อ: `test_AC_REPORT_09_empty_data_message` ผ่านเมื่อไม่มีข้อมูลและ API ส่งสถานะว่างโดยไม่มีตัวเลขรายงาน
- สถานะ: พร้อมทำ

### T-20 แสดงข้อความไม่มีข้อมูลโดยไม่แสดงตัวเลข
- รองรับ: FR-56
- ตรวจด้วย: AC-REPORT-09 — `test_AC_REPORT_09_empty_data_message`
- ไฟล์ที่แตะ: `frontend/src/pages/SalesReportPage.jsx`, `frontend/src/api/client.js`, `frontend/src/pages/SalesReportPage.test.jsx`
- แบบหน้าจอ: ไม่มี (ไม่มี UI ID หรือ mockup ใน spec)
- ต้องทำหลัง: T-15, T-19
- เสร็จเมื่อ: `test_AC_REPORT_09_empty_data_message` ผ่านด้วย client จำลอง โดยแสดงข้อความไม่มีข้อมูลและไม่แสดงตัวเลขจากข้อมูลก่อนหน้า
- สถานะ: พร้อมทำ

#### จุดตรวจเฟส 9
- test ที่ต้องผ่านทั้งหมด: `test_AC_REPORT_01_manager_can_open_sales_report`, `test_AC_REPORT_02_filter_by_branch_and_date`, `test_AC_REPORT_03_show_total_sales`, `test_AC_REPORT_04_show_completed_order_count`, `test_AC_REPORT_05_show_top_selling_menu`, `test_AC_REPORT_06_recalculate_on_filter_change`, `test_AC_REPORT_07_report_matches_saved_data`, `test_AC_REPORT_08_refresh_report_after_filter_change`, `test_AC_REPORT_09_empty_data_message` และ tests จากเฟส 0
- เปิดระบบ: `plan.md` ไม่ระบุคำสั่งเปิด backend หรือ frontend; ให้ทีมกำหนดก่อน implement
- คนลองเองตาม AC-REPORT-09:
  Given ไม่มี Order หรือยอดขายในช่วงเวลาที่เลือก
  When Manager เปิดรายงาน
  Then ระบบแสดงข้อความว่าไม่มีข้อมูลและไม่แสดงตัวเลข
- ยังขาด: ไม่มี

## เฟส 10: แจ้งเตือนเมื่อประมวลผลรายงานไม่สำเร็จ (AC-REPORT-10)

### T-21 ป้องกันการส่งข้อมูลรายงานที่ประมวลผลไม่สมบูรณ์
- รองรับ: FR-56, Constraint: หากระบบไม่สามารถประมวลผลรายงานได้ ระบบต้องแสดงข้อความเตือนแบบสากล และไม่แสดงข้อมูลรายงานที่ไม่สมบูรณ์
- ตรวจด้วย: AC-REPORT-10 — `test_AC_REPORT_10_global_warning_when_report_fails`
- ไฟล์ที่แตะ: `backend/app/routes/reports.py`, `backend/app/services/report_service.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-02, T-08
- เสร็จเมื่อ: `test_AC_REPORT_10_global_warning_when_report_fails` ผ่านเมื่อจำลองความล้มเหลวแล้ว API ส่งผลผิดพลาดโดยไม่มี payload รายงานที่ไม่สมบูรณ์
- สถานะ: พร้อมทำ

### T-22 แสดงข้อความเตือนสากลโดยไม่คงข้อมูลเก่า
- รองรับ: FR-56
- ตรวจด้วย: AC-REPORT-10 — `test_AC_REPORT_10_global_warning_when_report_fails`
- ไฟล์ที่แตะ: `frontend/src/pages/SalesReportPage.jsx`, `frontend/src/api/client.js`, `frontend/src/pages/SalesReportPage.test.jsx`
- แบบหน้าจอ: ไม่มี (ไม่มี UI ID หรือ mockup ใน spec)
- ต้องทำหลัง: T-20, T-21
- เสร็จเมื่อ: `test_AC_REPORT_10_global_warning_when_report_fails` ผ่านด้วย client จำลอง โดยแจ้งเตือนและไม่แสดงผลรายงานที่ไม่สมบูรณ์หรือข้อมูลเดิม
- สถานะ: พร้อมทำ

#### จุดตรวจเฟส 10
- test ที่ต้องผ่านทั้งหมด: `test_AC_REPORT_01_manager_can_open_sales_report`, `test_AC_REPORT_02_filter_by_branch_and_date`, `test_AC_REPORT_03_show_total_sales`, `test_AC_REPORT_04_show_completed_order_count`, `test_AC_REPORT_05_show_top_selling_menu`, `test_AC_REPORT_06_recalculate_on_filter_change`, `test_AC_REPORT_07_report_matches_saved_data`, `test_AC_REPORT_08_refresh_report_after_filter_change`, `test_AC_REPORT_09_empty_data_message`, `test_AC_REPORT_10_global_warning_when_report_fails` และ tests จากเฟส 0
- เปิดระบบ: `plan.md` ไม่ระบุคำสั่งเปิด backend หรือ frontend; ให้ทีมกำหนดก่อน implement
- คนลองเองตาม AC-REPORT-10:
  Given Manager เลือกสาขาและช่วงเวลาที่ต้องการดู
  When ระบบไม่สามารถประมวลผลรายงานได้
  Then ระบบแจ้งเตือนและไม่แสดงข้อมูลรายงานที่ไม่สมบูรณ์
- ยังขาด: ไม่มี

## เฟส 11: ปฏิเสธผู้ใช้ที่ไม่มีสิทธิ์สาขา (AC-REPORT-11)

### T-23 จำกัด API ด้วยสิทธิ์ Manager ของสาขา
- รองรับ: NFR-SEC-06, Constraint: Manager สามารถดูข้อมูลได้เฉพาะข้อมูลในสาขาที่ตนเองมีสิทธิ์เข้าถึง
- ตรวจด้วย: AC-REPORT-11 — `test_AC_REPORT_11_manager_scope_restriction`
- ไฟล์ที่แตะ: `backend/app/routes/reports.py`, `backend/app/services/report_service.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-04, T-06
- เสร็จเมื่อ: `test_AC_REPORT_11_manager_scope_restriction` ผ่านเมื่อ Manager ของสาขาหนึ่งถูกปฏิเสธการขอข้อมูลของสาขาที่ไม่มีสิทธิ์
- สถานะ: พร้อมทำ

### T-24 ไม่แสดงรายงานเมื่อผู้ใช้ไม่มีสิทธิ์
- รองรับ: NFR-SEC-06
- ตรวจด้วย: AC-REPORT-11 — `test_AC_REPORT_11_manager_scope_restriction`
- ไฟล์ที่แตะ: `frontend/src/pages/SalesReportPage.jsx`, `frontend/src/api/client.js`, `frontend/src/pages/SalesReportPage.test.jsx`
- แบบหน้าจอ: ไม่มี (ไม่มี UI ID หรือ mockup ใน spec)
- ต้องทำหลัง: T-05, T-23
- เสร็จเมื่อ: `test_AC_REPORT_11_manager_scope_restriction` ผ่านด้วย client จำลองและหน้าจอไม่แสดงข้อมูลรายงานของสาขาที่เข้าถึงไม่ได้
- สถานะ: พร้อมทำ

#### จุดตรวจเฟส 11
- test ที่ต้องผ่านทั้งหมด: `test_AC_REPORT_01_manager_can_open_sales_report`, `test_AC_REPORT_02_filter_by_branch_and_date`, `test_AC_REPORT_03_show_total_sales`, `test_AC_REPORT_04_show_completed_order_count`, `test_AC_REPORT_05_show_top_selling_menu`, `test_AC_REPORT_06_recalculate_on_filter_change`, `test_AC_REPORT_07_report_matches_saved_data`, `test_AC_REPORT_08_refresh_report_after_filter_change`, `test_AC_REPORT_09_empty_data_message`, `test_AC_REPORT_10_global_warning_when_report_fails`, `test_AC_REPORT_11_manager_scope_restriction` และ tests จากเฟส 0
- เปิดระบบ: `plan.md` ไม่ระบุคำสั่งเปิด backend หรือ frontend; ให้ทีมกำหนดก่อน implement
- คนลองเองตาม AC-REPORT-11:
  Given ผู้ใช้ไม่มีสิทธิ์ Manager ของสาขาที่ร้องขอ
  When พยายามเปิดหน้ารายงานของสาขานั้น
  Then ระบบไม่อนุญาตให้เข้าถึงข้อมูลรายงาน
- ยังขาด: ไม่มี

## เฟส 12: ตรวจความถูกต้องและเวลาตอบสนองรายงาน (AC-REPORT-12)

### T-25 ตรวจความถูกต้องและเวลาตอบสนองรายงาน
- รองรับ: NFR-PERF-02, NFR-ACC-01
- ตรวจด้วย: AC-REPORT-12 — `test_AC_REPORT_12_performance_and_accuracy`
- ไฟล์ที่แตะ: `backend/tests/test_report_performance_and_accuracy.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-08, T-10, T-12, T-14
- เสร็จเมื่อ: `test_AC_REPORT_12_performance_and_accuracy` ผ่านโดยยืนยันความสอดคล้องของยอดขายและจำนวน Order กับข้อมูลที่บันทึก และเวลาตอบสนองรายงานไม่เกิน 5 วินาทีสำหรับชุดข้อมูลปกติที่ทีมกำหนด
- สถานะ: พร้อมทำ

#### จุดตรวจเฟส 12
- test ที่ต้องผ่านทั้งหมด: `test_AC_REPORT_01_manager_can_open_sales_report`, `test_AC_REPORT_02_filter_by_branch_and_date`, `test_AC_REPORT_03_show_total_sales`, `test_AC_REPORT_04_show_completed_order_count`, `test_AC_REPORT_05_show_top_selling_menu`, `test_AC_REPORT_06_recalculate_on_filter_change`, `test_AC_REPORT_07_report_matches_saved_data`, `test_AC_REPORT_08_refresh_report_after_filter_change`, `test_AC_REPORT_09_empty_data_message`, `test_AC_REPORT_10_global_warning_when_report_fails`, `test_AC_REPORT_11_manager_scope_restriction`, `test_AC_REPORT_12_performance_and_accuracy` และ tests จากเฟส 0
- เปิดระบบ: `plan.md` ไม่ระบุคำสั่งเปิด backend หรือ frontend; ให้ทีมกำหนดก่อน implement
- คนลองเองตาม AC-REPORT-12:
  Given มี Order และยอดขายที่บันทึกไว้
  When Manager เปิดรายงานด้วยชุดข้อมูลปกติที่ทีมกำหนด
  Then ยอดขายและจำนวน Order ตรงกับข้อมูลที่บันทึก และรายงานแสดงผลภายใน 5 วินาที
- ยังขาด: ไม่มี

## ตารางตรวจความครบ

### Acceptance Criteria

| AC ID | task ที่ตรวจ AC นี้ |
|---|---|
| AC-REPORT-01 | T-04, T-05 |
| AC-REPORT-02 | T-06, T-07 |
| AC-REPORT-03 | T-08, T-09 |
| AC-REPORT-04 | T-10, T-11 |
| AC-REPORT-05 | T-12, T-13 |
| AC-REPORT-06 | T-16, T-17 |
| AC-REPORT-07 | T-14, T-15 |
| AC-REPORT-08 | T-18 |
| AC-REPORT-09 | T-19, T-20 |
| AC-REPORT-10 | T-21, T-22 |
| AC-REPORT-11 | T-23, T-24 |
| AC-REPORT-12 | T-25 |

### Constraints

| Constraint ID | task ที่ทำให้เป็นจริง |
|---|---|
| ไม่มี ID ใน spec — ผู้ใช้งานต้องเข้าสู่ระบบและมีสิทธิ์เป็น Manager ของสาขานั้นก่อนเข้าถึงรายงาน | T-04, T-23, T-24 |
| ไม่มี ID ใน spec — ระบบต้องคำนวณรายงานจากข้อมูล Order และยอดขายที่มีอยู่ในระบบ | T-08, T-10, T-12, T-14 |
| ไม่มี ID ใน spec — ช่วงเวลาที่เลือกต้องเป็นช่วงวันที่ที่ถูกต้อง และค่าเริ่มต้นของช่วงวันที่คือ 7 วันที่ผ่านมา | T-06, T-07 |
| ไม่มี ID ใน spec — Manager สามารถดูข้อมูลได้เฉพาะข้อมูลในสาขาที่ตนเองมีสิทธิ์เข้าถึง | T-23, T-24 |
| ไม่มี ID ใน spec — ยอดขายรวมและจำนวน Order คำนวณจาก Order ที่ชำระเงินสำเร็จเท่านั้น | T-08, T-10 |
| ไม่มี ID ใน spec — เมนูขายดีจัดอันดับจากจำนวนชิ้นที่ขายในช่วงเวลาที่เลือก | T-12, T-13 |
| ไม่มี ID ใน spec — หากไม่มีข้อมูลในช่วงเวลาที่เลือก ระบบต้องแสดงข้อความว่าไม่มีข้อมูลสำหรับช่วงเวลานั้น และไม่แสดงตัวเลขใด ๆ | T-19, T-20 |
| ไม่มี ID ใน spec — หากระบบไม่สามารถประมวลผลรายงานได้ ระบบต้องแสดงข้อความเตือนแบบสากล และไม่แสดงข้อมูลรายงานที่ไม่สมบูรณ์ | T-21, T-22 |
| ไม่มี ID ใน spec — การคำนวณยอดขายและจำนวน Order ต้องสอดคล้องกับข้อมูลที่บันทึกในระบบ | T-14, T-15, T-25 |
| ไม่มี ID ใน spec — รายงานยอดขายควรแสดงผลภายใน 5 วินาทีสำหรับข้อมูลปกติ | T-25 |

### Functional Requirements

| FR ID | AC ที่ตรวจ FR นี้ | เฟส |
|---|---|---|
| FR-50 | AC-REPORT-01 | เฟส 1 |
| FR-51 | AC-REPORT-02 | เฟส 2 |
| FR-52 | AC-REPORT-03 | เฟส 3 |
| FR-53 | AC-REPORT-04 | เฟส 4 |
| FR-54 | AC-REPORT-05 | เฟส 5 |
| FR-55 | AC-REPORT-06, AC-REPORT-08 | เฟส 7, เฟส 8 |
| FR-56 | AC-REPORT-07, AC-REPORT-09, AC-REPORT-10 | เฟส 6, เฟส 9, เฟส 10 |

## สิ่งที่ยังไม่ทำ

- Open Questions: ไม่มี ตาม `spec.md`
- ไม่มี tasks สถานะรอคำตอบ
- `plan.md` ไม่ระบุโครงสร้างไฟล์, คำสั่งเปิด backend/frontend หรือ test runner; ทีมต้องยืนยันรายละเอียดเหล่านี้ก่อนเริ่ม implement
- แผนไม่ได้ระบุขนาดชุดข้อมูลที่จะถือว่า “ข้อมูลปกติ” สำหรับ NFR-PERF-02; ให้ทีมกำหนดชุดข้อมูลทดสอบก่อนวัดผล โดยไม่เปลี่ยนเกณฑ์ 5 วินาที
