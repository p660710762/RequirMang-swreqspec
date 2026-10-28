# Tasks: จัดการเมนู ราคา โปรโมชั่น และสถานะสินค้า

- Feature: จัดการเมนู ราคา โปรโมชั่น และสถานะสินค้า
- Spec ID: SPEC-MENU-MANAGEMENT-001
- อ้างอิง plan.md: ./plan.md
- วันที่: 2569-10-26

## สรุป 3 บรรทัด
- มี 5 เฟสหลัก: 1 เฟสฐานราก + 4 เฟสใช้งานจริง
- มี 12 task ทั้งหมด และไม่มี task ที่ต้องรอ Open Questions
- เฟสแรกที่ลองใช้งานได้จริงคือ เฟส 1: Admin ดูรายการเมนูและเพิ่มเมนูใหม่

---

## เฟส 0: ฐานรากและโครงสร้างใช้งานร่วม (AC-01, AC-02)

### T-01 สร้าง schema และ seed data พื้นฐาน
- รองรับ: FR-42, FR-43, FR-45, FR-49, NFR-REL-08, NFR-REL-09
- ตรวจด้วย: AC-MENU-MGMT-01, AC-MENU-MGMT-02
- ไฟล์ที่แตะ: backend/app/models.py, backend/app/seed.py, backend/app/config.py
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: ไม่มี
- เสร็จเมื่อ: Schema เมนู/โปรโมชั่น/history/snapshot ถูกสร้างและมีข้อมูลตัวอย่างสำหรับ Admin ใช้งานได้
- สถานะ: เสร็จ รอทีมตรวจ

### T-02 สร้าง API base และ route สำหรับเมนู
- รองรับ: FR-42, FR-43, FR-45, FR-46, FR-47
- ตรวจด้วย: AC-MENU-MGMT-01, AC-MENU-MGMT-02, AC-MENU-MGMT-05, AC-MENU-MGMT-06
- ไฟล์ที่แตะ: backend/app/main.py, backend/app/routes/menu.py, backend/app/services/menu_service.py
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-01
- เสร็จเมื่อ: route GET/POST/PATCH พร้อมใช้งานและตอบกลับรูปแบบ JSON พื้นฐาน
- สถานะ: เสร็จ รอทีมตรวจ

### T-03 สร้าง guard สำหรับ Admin และ mock auth ของนักศึกษา
- รองรับ: NFR-SEC-05, FR-42, FR-43
- ตรวจด้วย: AC-MENU-MGMT-13
- ไฟล์ที่แตะ: backend/app/auth.py, backend/app/middleware/auth_guard.py
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-02
- เสร็จเมื่อ: ผู้ใช้ที่ไม่ใช่ Admin ถูกปฏิเสธการเข้าถึง route จัดการเมนู
- สถานะ: เสร็จ รอทีมตรวจ

#### จุดตรวจเฟส 0
- test ที่ต้องผ่านทั้งหมด: test_AC_MENU_MGMT_01_admin_can_view_menu_list, test_AC_MENU_MGMT_02_admin_can_add_menu_item, test_AC_MENU_MGMT_13_non_admin_is_blocked
- เปิดระบบ: backend FastAPI run และ frontend Vite run ตาม plan.md
- คนลองเองตาม AC-01 / AC-02 / AC-13:
  Given ใช้ข้อมูลตัวอย่างเมนูและ login เป็น Admin
  When เปิดหน้าจัดการเมนูและเพิ่มเมนูใหม่
  Then ระบบแสดงรายการเมนูและบันทึกข้อมูลได้ แต่ผู้ใช้ที่ไม่ใช่ Admin ถูกปฏิเสธ
- ยังขาด: ไม่มี

---

## เฟส 1: Admin ดูรายการเมนูและเพิ่มเมนูใหม่ (AC-01, AC-02)

### T-04 สร้าง API list/menu และ UI หน้า Admin Menu Management
- รองรับ: FR-42, FR-43, FR-47
- ตรวจด้วย: AC-MENU-MGMT-01, AC-MENU-MGMT-02
- ไฟล์ที่แตะ: frontend/src/pages/AdminMenuPage.jsx, frontend/src/api/client.js, backend/app/routes/menu.py
- แบบหน้าจอ: UI-MENU-01, mockup ทีมออกแบบเอง
- ต้องทำหลัง: T-02, T-03
- เสร็จเมื่อ: หน้า Admin Menu Management โหลดรายการเมนูจาก API และมีเมนูที่จัดการได้
- สถานะ: เสร็จ รอทีมตรวจ

### T-05 สร้างฟอร์มเพิ่มเมนูและ validation ช่วง required fields
- รองรับ: FR-43, FR-46, ASM-10
- ตรวจด้วย: AC-MENU-MGMT-02, AC-MENU-MGMT-05, AC-MENU-MGMT-11
- ไฟล์ที่แตะ: frontend/src/components/MenuForm.jsx, frontend/src/api/client.js, backend/app/services/menu_validation.py
- แบบหน้าจอ: UI-MENU-02, ไม่มี mockup ทีมออกแบบเอง
- ต้องทำหลัง: T-04
- เสร็จเมื่อ: กรอกข้อมูลที่ไม่มี name/price/status จะถูก reject และกรอกครบจะบันทึกสำเร็จ
- สถานะ: เสร็จ รอทีมตรวจ

#### จุดตรวจเฟส 1
- test ที่ต้องผ่านทั้งหมด: test_AC_MENU_MGMT_01_admin_can_view_menu_list, test_AC_MENU_MGMT_02_admin_can_add_menu_item, test_AC_MENU_MGMT_05_validation_before_save, test_AC_MENU_MGMT_11_invalid_data_is_rejected
- เปิดระบบ: backend FastAPI run และ frontend Vite run ตาม plan.md
- คนลองเองตาม AC-01 / AC-02 / AC-05 / AC-11:
  Given เป็น Admin ที่ login แล้วเปิดหน้าเมนู
  When กดเพิ่มเมนูและกรอกข้อมูลครบหรือไม่ครบ
  Then ระบบแสดงรายการเมนูและปฏิเสธข้อมูลไม่ครบก่อนบันทึก
- ยังขาด: ไม่มี

---

## เฟส 2: Admin แก้ไขเมนูและเปลี่ยนสถานะ (AC-03, AC-04, AC-09, AC-10, AC-15)

### T-06 สร้าง API update menu และ UI สำหรับแก้ไขรายละเอียด
- รองรับ: FR-44, FR-47, ASM-07
- ตรวจด้วย: AC-MENU-MGMT-03, AC-MENU-MGMT-06
- ไฟล์ที่แตะ: backend/app/routes/menu.py, backend/app/services/menu_service.py, frontend/src/components/MenuEditPanel.jsx
- แบบหน้าจอ: UI-MENU-01, ไม่มี mockup ทีมออกแบบเอง
- ต้องทำหลัง: T-05
- เสร็จเมื่อ: Admin สามารถแก้ไขราคา/รายละเอียด/โปรโมชั่นแล้วบันทึกและเห็นข้อมูลใหม่ทันที
- สถานะ: เสร็จ รอทีมตรวจ

### T-07 สร้าง API status change และ UI status panel
- รองรับ: FR-44, FR-45, FR-48, ASM-03, ASM-12, ASM-14
- ตรวจด้วย: AC-MENU-MGMT-04, AC-MENU-MGMT-09, AC-MENU-MGMT-10, AC-MENU-MGMT-15
- ไฟล์ที่แตะ: backend/app/routes/menu.py, backend/app/services/menu_status_service.py, backend/app/services/menu_validation.py, backend/app/config.py, frontend/src/components/StatusToggle.jsx
- แบบหน้าจอ: UI-MENU-03, ไม่มี mockup ทีมออกแบบเอง
- ต้องทำหลัง: T-06
- เสร็จเมื่อ: status สลับได้ระหว่าง “เปิดขาย” และ “หมด”; validation ปฏิเสธวันเริ่ม/สิ้นสุดโปรโมชั่นที่ขาดหาย, ไม่ใช่ ISO 8601 พร้อม timezone, หรือวันสิ้นสุดก่อนวันเริ่ม
- สถานะ: เสร็จ รอทีมตรวจ

#### จุดตรวจเฟส 2
- test ที่ต้องผ่านทั้งหมด: test_AC_MENU_MGMT_03_admin_can_edit_menu_details, test_AC_MENU_MGMT_04_admin_can_change_status, test_AC_MENU_MGMT_09_admin_can_mark_menu_as_not_for_sale, test_AC_MENU_MGMT_10_sold_out_status_blocks_purchase, test_AC_MENU_MGMT_15_promotion_datetime_must_be_valid
- เปิดระบบ: backend FastAPI run และ frontend Vite run ตาม plan.md
- คนลองเองตาม AC-03 / AC-04 / AC-09 / AC-10 / AC-15:
  Given เป็น Admin ที่ login แล้วมีเมนูที่เปิดขายอยู่
  When แก้ไขข้อมูล, เปลี่ยนสถานะเป็น “หมด”, หรือกรอกวันเวลาโปรโมชั่นไม่ถูกต้อง
  Then ระบบบันทึกข้อมูลใหม่หรือปฏิเสธข้อมูลที่ผิดตามเงื่อนไข
- ยังขาด: ไม่มี

---

## เฟส 3: บันทึกความล้มเหลวและ rollback (AC-06, AC-12)

### T-08 สร้าง transaction-safe save และ handling failure
- รองรับ: FR-47, NFR-REL-08, ASM-11
- ตรวจด้วย: AC-MENU-MGMT-06, AC-MENU-MGMT-12
- ไฟล์ที่แตะ: backend/app/services/menu_service.py, backend/app/repositories/menu_repo.py
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-06, T-07
- เสร็จเมื่อ: save failure ทำให้ระบบ rollback และไม่แสดงว่าบันทึกสำเร็จ
- สถานะ: พร้อมทำ

### T-09 สร้าง UI แจ้งผลบันทึกและข้อความข้อผิดพลาด
- รองรับ: FR-47, FR-46, UC-09 Exception Flow 7a
- ตรวจด้วย: AC-MENU-MGMT-06, AC-MENU-MGMT-12
- ไฟล์ที่แตะ: frontend/src/components/Toast.jsx, frontend/src/pages/AdminMenuPage.jsx
- แบบหน้าจอ: UI-MENU-01, UI-MENU-02
- ต้องทำหลัง: T-08
- เสร็จเมื่อ: เมื่อ save สำเร็จ จะแสดงข้อมูลใหม่และเมื่อ fail จะแสดงข้อความ “ไม่สามารถบันทึกข้อมูลได้”
- สถานะ: พร้อมทำ

#### จุดตรวจเฟส 3
- test ที่ต้องผ่านทั้งหมด: test_AC_MENU_MGMT_06_successful_update_is_persisted, test_AC_MENU_MGMT_12_save_failure_not_marked_as_success
- เปิดระบบ: backend FastAPI run และ frontend Vite run ตาม plan.md
- คนลองเองตาม AC-06 / AC-12:
  Given เป็น Admin ที่ login แล้วมีฟอร์มแก้ไขเมนู
  When บันทึกถูกต้องหรือจำลองบันทึกล้มเหลว
  Then ระบบต้องแสดงข้อมูลใหม่เมื่อสำเร็จ หรือแจ้งว่าบันทึกไม่สำเร็จและไม่มีการแสดง state ใหม่เป็นสำเร็จ
- ยังขาด: ไม่มี

---

## เฟส 4: ป้องกันลูกค้าและรักษาผลย้อนหลัง (AC-07, AC-08, AC-13, AC-14)

### T-10 สร้าง customer ordering guard สำหรับ status “หมด”
- รองรับ: FR-48, AC-MENU-MGMT-07, AC-MENU-MGMT-10
- ตรวจด้วย: AC-MENU-MGMT-07, AC-MENU-MGMT-10
- ไฟล์ที่แตะ: backend/app/services/order_guard.py, backend/app/routes/order.py
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-07
- เสร็จเมื่อ: เมนูที่ status = หมด ถูกปฏิเสธใน order flow และลูกค้าไม่สามารถสั่งได้
- สถานะ: พร้อมทำ

### T-11 สร้าง snapshot/history สำหรับ Order เก่า และ delete archive
- รองรับ: FR-49, NFR-REL-09, ASM-09, ASM-13
- ตรวจด้วย: AC-MENU-MGMT-08, AC-MENU-MGMT-14
- ไฟล์ที่แตะ: backend/app/services/history_service.py, backend/app/models.py
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-10
- เสร็จเมื่อ: เมื่อมี Order เก่าหรือเมนูถูกลบ จะมี snapshot/history ที่จำเป็นอยู่และไม่ถูกเปลี่ยนเมื่อแก้ไขเมนูปัจจุบัน
- สถานะ: ทำบางส่วน — มี in-memory snapshot/history helper และทดสอบการคงข้อมูลเมื่อแก้ไข/ลบ; ยังไม่มี Order API ตาม Out of scope

### T-12 สร้างหน้าจอและ flow สำหรับลบเมนูถาวรพร้อม history
- รองรับ: FR-42, FR-49, ASM-09, ASM-12
- ตรวจด้วย: AC-MENU-MGMT-08, AC-MENU-MGMT-14
- ไฟล์ที่แตะ: frontend/src/pages/AdminMenuPage.jsx, frontend/src/components/DeleteMenuDialog.jsx
- แบบหน้าจอ: UI-MENU-01, ไม่มี mockup ทีมออกแบบเอง
- ต้องทำหลัง: T-11
- เสร็จเมื่อ: Admin สามารถลบเมนูจริงจาก catalog ปัจจุบัน แต่ history/order snapshot ยังคงอยู่และลูกค้าไม่เห็นเมนูนั้น
- สถานะ: ทำบางส่วน — มี DELETE Admin API และลบออกจาก catalog พร้อมคง snapshot/history; ยังไม่มี UI delete flow

#### จุดตรวจเฟส 4
- test ที่ต้องผ่านทั้งหมด: test_AC_MENU_MGMT_07_sold_out_menu_blocked_for_customer, test_AC_MENU_MGMT_08_old_orders_remain_valid, test_AC_MENU_MGMT_10_sold_out_status_blocks_purchase, test_AC_MENU_MGMT_13_non_admin_is_blocked, test_AC_MENU_MGMT_14_old_order_keeps_snapshot
- เปิดระบบ: backend FastAPI run และ frontend Vite run ตาม plan.md
- คนลองเองตาม AC-07 / AC-08 / AC-10 / AC-13 / AC-14:
  Given มีเมนูเปิดขายและมี Order เก่าอยู่แล้ว
  When เปลี่ยน status เป็น “หมด” หรือพยายามสั่งเมนูดังกล่าวหรือเข้าถึงจัดการเมนูโดยไม่ได้รับสิทธิ์
  Then ระบบปฏิเสธการสั่งซื้อ, คง Order เก่าไว้, และไม่อนุญาตให้ผู้ใช้ที่ไม่ใช่ Admin ทำงานได้
- ยังขาด: ไม่มี

---

## ตารางตรวจความครบ AC

| AC ID | task ที่ตรวจ AC นี้ |
|---|---|
| AC-MENU-MGMT-01 | T-01, T-04 |
| AC-MENU-MGMT-02 | T-01, T-05 |
| AC-MENU-MGMT-03 | T-06 |
| AC-MENU-MGMT-04 | T-07 |
| AC-MENU-MGMT-05 | T-05 |
| AC-MENU-MGMT-06 | T-06, T-08, T-09 |
| AC-MENU-MGMT-07 | T-10 |
| AC-MENU-MGMT-08 | T-11, T-12 |
| AC-MENU-MGMT-09 | T-07 |
| AC-MENU-MGMT-10 | T-07, T-10 |
| AC-MENU-MGMT-11 | T-05 |
| AC-MENU-MGMT-12 | T-08, T-09 |
| AC-MENU-MGMT-13 | T-03 |
| AC-MENU-MGMT-14 | T-11, T-12 |
| AC-MENU-MGMT-15 | T-07 |

## ตารางตรวจความครบ Constraints

| Constraint ID | task ที่ทำให้เป็นจริง |
|---|---|
| ผู้ใช้งานต้องเข้าสู่ระบบและมีสิทธิ์เป็น Admin ก่อนจัดการข้อมูลเมนู | T-03 |
| ระบบต้องตรวจสอบข้อมูลที่จำเป็นก่อนบันทึก เช่น ชื่อ ราคา และสถานะ โดยชื่อ ราคา และสถานะเป็นข้อมูลที่ต้องมีก่อนบันทึก ส่วนรายละเอียดและรูปภาพเป็น optional | T-05 |
| Admin สามารถลบเมนูออกจากระบบถาวรได้ แต่เมนูที่ถูกลบจริงจะหายจาก catalog ปัจจุบัน และยังต้องรักษาข้อมูล snapshot สำหรับ Order เก่าไว้เพื่อการตรวจสอบย้อนหลัง โดยไม่แสดงให้ลูกค้าเห็น | T-11, T-12 |
| การลบเมนูถาวรและการเปลี่ยนสถานะเป็น “หมด” เป็น 2 action ที่แยกกัน แต่มี UI คล้ายกัน | T-07, T-12 |
| เมนูมีสถานะเพียง 2 แบบ: “เปิดขาย” และ “หมด” | T-07 |
| “หมด” หมายถึงเมนูไม่เปิดขายชั่วคราว แต่เมนูยังอยู่ในระบบ | T-07 |
| เมนูที่ถูกกำหนดสถานะ “หมด” ต้องไม่สามารถถูกสั่งซื้อจากหน้าลูกค้าได้ | T-10 |
| ข้อมูลราคาและรายละเอียดที่บันทึกต้องเป็นข้อมูลล่าสุดที่ระบบนำไปแสดงแก่ลูกค้า | T-06, T-09 |
| การเปลี่ยนแปลงเมนูมีผลเฉพาะคำสั่งซื้อใหม่ ส่วน Order เดิมต้องคงค่าสินค้าดั้งเดิมไว้ | T-11 |
| การบันทึกข้อมูลเมนูต้องเป็นการบันทึกแบบทั้งหมดหรือไม่เลย (all-or-nothing) และข้อมูลเดิมต้องไม่เปลี่ยนแปลงเมื่อเกิดความล้มเหลวระหว่างการบันทึก รวมถึงต้อง rollback ทั้งหมดเพื่อให้ระบบอยู่ใน state เดิมทั้งหมด | T-08 |
| ข้อมูลที่จำเป็นเพื่อคงความถูกต้องของ Order เก่าควรถูกเก็บไว้ตามกฎที่จำเป็นเท่านั้น โดยข้อมูลที่ถือว่าจำเป็นคือ Order snapshot และ menu history ที่เคยมีก่อนการแก้ไขเท่านั้น ไม่รวม record ปัจจุบัน | T-11 |

## ตารางตรวจความครบ FR

| FR ID | AC ที่ตรวจ FR นี้ | เฟส |
|---|---|---|
| FR-42 | AC-MENU-MGMT-01 | เฟส 1 |
| FR-43 | AC-MENU-MGMT-02, AC-MENU-MGMT-05, AC-MENU-MGMT-11 | เฟส 1 |
| FR-44 | AC-MENU-MGMT-03, AC-MENU-MGMT-15 | เฟส 2 |
| FR-45 | AC-MENU-MGMT-04, AC-MENU-MGMT-09, AC-MENU-MGMT-10 | เฟส 2 |
| FR-46 | AC-MENU-MGMT-05, AC-MENU-MGMT-11 | เฟส 1 |
| FR-47 | AC-MENU-MGMT-06, AC-MENU-MGMT-12 | เฟส 3 |
| FR-48 | AC-MENU-MGMT-07, AC-MENU-MGMT-10 | เฟส 4 |
| FR-49 | AC-MENU-MGMT-08, AC-MENU-MGMT-14 | เฟส 4 |

## สิ่งที่ยังไม่ทำ

- Open Questions จาก spec.md: ไม่มีข้อสงสัยที่ค้างจากทีมหลังจากยืนยันคำตอบทั้งหมด
- task ที่ต้องรอ Q-xx: ไม่มี
- ส่วนที่ยังไม่ได้สร้างแต่ไม่ใช่ Open Question: ไม่มี

---

## สรุปสั้น
- จำนวนเฟส: 5
- จำนวน task: 12
- จำนวน task ที่รอ Q-xx: 0
- เฟสที่เป็นจุดเริ่มต้นใช้งานจริง: เฟส 1 (ดูเมนูและเพิ่มเมนูใหม่)
