# แผนงานสำหรับ Feature: จัดการเมนู ราคา โปรโมชั่น และสถานะสินค้า (Menu & Product Management)

## 1. สรุปแนวทาง
- ฟีเจอร์นี้จะสร้างหน้า Admin สำหรับดูรายการเมนู เพิ่มเมนูใหม่ แก้ไขข้อมูลเมนู ราคา และโปรโมชั่น พร้อมเปลี่ยนสถานะสินค้าเป็น “เปิดขาย” หรือ “หมด” ตาม FR-42 ถึง FR-49
- ผู้ใช้หลักคือ Admin ที่เข้าสู่ระบบและมีสิทธิ์จัดการข้อมูลเมนูเท่านั้น ตาม Constraints และ NFR-SEC-05
- ระบบจะตรวจสอบข้อมูลที่จำเป็นก่อนบันทึก, ป้องกันไม่ให้ข้อมูลที่ไม่ถูกต้องหรือไม่ครบถ้วนถูกบันทึก, และแสดงข้อมูลล่าสุดหลังจากบันทึกสำเร็จตาม FR-46, FR-47 และ Exception Flow 6a / 7a
- เมื่อเมนูถูกเปลี่ยนเป็น “หมด” ระบบจะไม่อนุญาตให้ลูกค้าสั่งเมนูนั้นอีก แต่ Order เดิมยังคงข้อมูลเดิมไว้เพื่อไม่กระทบข้อมูลที่สร้างก่อนหน้า ตาม FR-48, FR-49 และ NFR-REL-09
- แผนนี้จะไม่สร้างฟังก์ชันนอก scope เช่น การสร้าง Order, การชำระเงิน, การติดตามสถานะ Order, หรือรายงานยอดขาย เพราะถูกระบุไว้ใน Out of scope อย่างชัดเจน

## 2. เทคโนโลยีที่ใช้

| สิ่งที่เลือก | มาจาก | หมายเหตุ |
|---|---|---|
| React (Vite) สำหรับหน้า Admin จัดการเมนู | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้แสดงรายการเมนู, เพิ่ม/แก้ไข, จัดการโปรโมชั่น, และเปลี่ยนสถานะสินค้า |
| Python FastAPI สำหรับ API จัดการเมนู | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้จัดการ validation, update, persistence, และ historical record สำหรับเมนูที่ถูกแก้ไข |
| ฐานข้อมูลเชิงสัมพันธ์ (เช่น PostgreSQL) | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้เก็บเมนู, ราคา, โปรโมชั่น, สถานะสินค้า และ archived version ที่จำเป็นสำหรับ Order เก่า |
| Admin authorization / role check | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้จำกัดให้เฉพาะ Admin ที่ได้รับสิทธิ์เท่านั้นที่สามารถแก้ไขเมนูได้ตาม NFR-SEC-05 |
| Historical price / product snapshot | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้บังคับให้ Order เก่าไม่กระทบเมื่อเมนูถูกแก้ไขหรือเปลี่ยนสถานะตาม FR-49 และ NFR-REL-09 |

## 3. โมเดลข้อมูล

| Entity | ฟิลด์หลัก | รองรับ FR / NFR |
|---|---|---|
| MenuItem | `menu_id`, `name`, `description`, `image_url`, `price`, `status`, `created_at`, `updated_at` | รองรับ FR-42, FR-43, FR-45, FR-47, FR-48, AC-MENU-MGMT-01, AC-MENU-MGMT-02, AC-MENU-MGMT-04, AC-MENU-MGMT-06 |
| Promotion | `promotion_id`, `menu_id`, `promotion_name`, `discount_value`, `is_active`, `start_at`, `end_at` | รองรับ FR-44, AC-MENU-MGMT-03 |
| MenuHistory | `history_id`, `menu_id`, `old_price`, `new_price`, `old_status`, `new_status`, `updated_by`, `updated_at` | รองรับ FR-49, NFR-REL-08, NFR-REL-09, AC-MENU-MGMT-08, AC-MENU-MGMT-14 |
| MenuValidationError | `field_name`, `message`, `error_code` | รองรับ FR-46, Exception Flow 6a, AC-MENU-MGMT-05, AC-MENU-MGMT-11 |
| OrderSnapshot | `order_id`, `menu_id`, `snapshot_price`, `snapshot_name`, `snapshot_status_at_order` | รองรับ FR-49, NFR-REL-09, AC-MENU-MGMT-08, AC-MENU-MGMT-14 |

หมายเหตุโมเดลข้อมูล:
- `status` มีค่าเฉพาะ “เปิดขาย” หรือ “หมด” ตาม Constraints และ FR-45
- `MenuHistory` / `OrderSnapshot` จะเก็บเฉพาะข้อมูลที่จำเป็นเพื่อให้ Order เก่า still valid ตาม FR-49 และ ASM-08
- จะไม่มีฟิลด์สำหรับข้อมูลผู้ใช้งานทั่วไปหรือข้อมูลลูกค้าเพิ่มเติม เนื่องจาก Out of scope
- `Promotion` อยู่บนหน้าเดียวกับเมนูตาม ASM-07 และ FR-44

## 4. API / หน้าจอ

- `GET /api/admin/menu` — Input: authenticated admin; Output: รายการเมนู พร้อมราคา, status, และ promotion ที่ใช้ได้ — รองรับ FR-42, AC-MENU-MGMT-01
- `GET /api/promotions/active` — Output: โปรโมชั่นที่ active สำหรับการแสดงเมนู — รองรับ FR-44
- `POST /api/admin/menu` — Input: `name`, `price`, `description`, `image_url`, `status`; Output: menu item ที่สร้างใหม่ — รองรับ FR-43, AC-MENU-MGMT-02
- `PATCH /api/admin/menu/{menu_id}` — Input: price / description / image / promotion / status; Output: menu item ที่อัปเดตและ latest snapshot — รองรับ FR-44, FR-45, FR-47, AC-MENU-MGMT-03, AC-MENU-MGMT-04, AC-MENU-MGMT-06
- `POST /api/admin/menu/validate` — Input: payload ของเมนู/โปรโมชั่น; Output: validation result และ error list รวมการตรวจ required promotion datetime, ISO 8601 พร้อม timezone, และ end >= start — รองรับ FR-44, FR-46, Exception Flow 6a, AC-MENU-MGMT-05, AC-MENU-MGMT-11, AC-MENU-MGMT-15
- `PATCH /api/admin/menu/{menu_id}/status` — Input: `status`; Output: status update and block order creation when `status = หมด` — รองรับ FR-45, FR-48, Alternative Flow 4a, AC-MENU-MGMT-04, AC-MENU-MGMT-07, AC-MENU-MGMT-10
- `DELETE /api/admin/menu/{menu_id}` — Input: authenticated admin; Output: ลบเมนูจาก catalog ปัจจุบันโดยคง Order snapshot ที่จำเป็น — รองรับ FR-49, Constraints, AC-MENU-MGMT-08, AC-MENU-MGMT-14
- `GET /admin/menu` — Output: หน้า Admin จัดการเมนู, promotion, และ status — รองรับ FR-42, FR-44, FR-45, NFR-USE-03

## 5. ตารางตรวจ Constraints

| Constraint ID | ถูกนำไปใช้ที่ไหนใน plan | สถานะ |
|---|---|---|
| ผู้ใช้งานต้องเข้าสู่ระบบและมีสิทธิ์เป็น Admin ก่อนจัดการข้อมูลเมนู | ใช้ใน admin auth guard สำหรับทุก API จัดการเมนู | ใช้แล้ว |
| ระบบต้องตรวจสอบข้อมูลที่จำเป็นก่อนบันทึก | ใช้ใน `POST /api/admin/menu/validate` และ validation layer ก่อน save | ใช้แล้ว |
| เมนูมีสถานะเพียง 2 แบบ: “เปิดขาย” และ “หมด” | ใช้ใน status enum และ UI dropdown สำหรับเมนู | ใช้แล้ว |
| “หมด” หมายถึงเมนูไม่เปิดขายชั่วคราว แต่เมนูยังอยู่ในระบบ | ใช้ใน `PATCH /api/admin/menu/{menu_id}/status` และ logic ป้องกันการลบเมนูจริง | ใช้แล้ว |
| เมนูที่ถูกกำหนดสถานะ “หมด” ต้องไม่สามารถถูกสั่งซื้อจากหน้าลูกค้าได้ | ใช้ใน menu availability validation และ customer ordering check | ใช้แล้ว |
| ข้อมูลราคาและรายละเอียดที่บันทึกต้องเป็นข้อมูลล่าสุดที่ระบบนำไปแสดงแก่ลูกค้า | ใช้ในหลัง update ทั้ง UI และ team output ให้แสดงข้อมูลล่าสุด | ใช้แล้ว |
| การเปลี่ยนแปลงเมนูมีผลเฉพาะคำสั่งซื้อใหม่ ส่วน Order เดิมต้องคงค่าสินค้าดั้งเดิมไว้ | ใช้ใน `OrderSnapshot` และ `MenuHistory` เพื่อ snapshot past price | ใช้แล้ว |
| ข้อมูลที่จำเป็นเพื่อคงความถูกต้องของ Order เก่าควรถูกเก็บไว้ตามกฎที่จำเป็นเท่านั้น | ใช้ใน `OrderSnapshot` เก็บเฉพาะข้อมูลที่จำเป็นเท่านั้น | ใช้แล้ว |
| ระบบตรวจข้อมูลจำเป็นก่อนบันทึก โดยรายละเอียดและรูปภาพเป็น optional | validation ก่อน save โดยบังคับ name, price, status | ใช้แล้ว |
| ลบเมนูถาวรได้โดยไม่ทำให้ Order เก่าสูญเสีย snapshot | `DELETE /api/admin/menu/{menu_id}` ลบจาก catalog ปัจจุบันและคง snapshot | ใช้แล้ว |
| การบันทึกเป็น all-or-nothing และ rollback เมื่อเกิดความล้มเหลว | transaction-safe save/update flow | ใช้แล้ว |
| โปรโมชั่นต้องมีวันเริ่มต้นและวันสิ้นสุดเป็น ISO 8601 datetime ที่มี timezone และ end ต้องไม่ก่อน start | validation ก่อนบันทึกตาม FR-44 / AC-MENU-MGMT-15 | ใช้แล้ว |

### ค่าที่ตั้งได้

| ค่า | มาจาก ID | ชื่อตัวแปรและไฟล์ |
|---|---|---|
| สถานะเมนูมี 2 ค่า: เปิดขาย, หมด | FR-45 และ Constraints | `MENU_STATUS_OPEN`, `MENU_STATUS_SOLD_OUT` ใน `backend/app/config.py` |
| required fields: name, price, status | FR-43, FR-46, ASM-10 | `required_menu_fields` ใน `backend/app/config.py` |
| คง Order snapshot เมื่อ delete | ASM-09, FR-49 | `retain_order_snapshot` ใน `backend/app/config.py` |
| บันทึกแบบ all-or-nothing | ASM-11, NFR-REL-08 | `transactional_save` ใน `backend/app/config.py` |
| วันเริ่มและวันสิ้นสุดโปรโมชั่นเป็น required และต้องมี timezone | FR-44, ASM-14 | `promotion_start_datetime`, `promotion_end_datetime`, `promotion_requires_datetime` ใน `backend/app/config.py` |

## 6. แผนทดสอบจาก Acceptance Criteria

| AC ID | ชื่อ test | ทดสอบอย่างไร |
|---|---|---|
| AC-MENU-MGMT-01 | `test_AC_MENU_MGMT_01_admin_can_view_menu_list` | login เป็น admin แล้วเปิดหน้า Admin จัดการเมนู ตรวจสอบว่าระบบแสดงรายการเมนูและข้อมูลที่เกี่ยวข้อง |
| AC-MENU-MGMT-02 | `test_AC_MENU_MGMT_02_admin_can_add_menu_item` | กรอกข้อมูลเมนูขั้นต่ำครบถ้วนและกดบันทึก ตรวจสอบว่าระบบเพิ่มเมนูและแสดงในรายการ |
| AC-MENU-MGMT-03 | `test_AC_MENU_MGMT_03_admin_can_edit_menu_details` | แก้ไขราคา/รายละเอียด/โปรโมชั่นและกดบันทึก ตรวจสอบว่าระบบแสดงข้อมูลใหม่ล่าสุด |
| AC-MENU-MGMT-04 | `test_AC_MENU_MGMT_04_admin_can_change_status` | เปลี่ยนสถานะเมนูจาก เปิดขาย → หมด แล้วตรวจสอบว่าระบบบันทึก และแสดงสถานะใหม่ |
| AC-MENU-MGMT-05 | `test_AC_MENU_MGMT_05_validation_before_save` | กรอกข้อมูลไม่ครบหรือไม่ถูกต้องแล้วกดบันทึก ตรวจสอบว่าระบบแจ้งข้อผิดพลาดและไม่บันทึก |
| AC-MENU-MGMT-06 | `test_AC_MENU_MGMT_06_successful_update_is_persisted` | กรอกข้อมูลถูกต้องและยืนยันบันทึก ตรวจสอบว่ามีการบันทึกสำเร็จและ UI แสดงข้อมูลล่าสุด |
| AC-MENU-MGMT-07 | `test_AC_MENU_MGMT_07_sold_out_menu_is_blocked_for_customer` | เปลี่ยนเมนูให้เป็น “หมด” แล้ว login เป็นลูกค้า ตรวจสอบว่าระบบไม่อนุญาตให้สั่งเมนูนั้น |
| AC-MENU-MGMT-08 | `test_AC_MENU_MGMT_08_past_orders_remain_valid` | สร้าง Order ก่อนการแก้ไขเมนู แล้วแก้ไขราคา/สถานะเมนู ตรวจสอบว่า Order เก่าคงข้อมูลเดิมไว้ |
| AC-MENU-MGMT-09 | `test_AC_MENU_MGMT_09_admin_can_mark_menu_as_not_for_sale` | เลือกเมนูที่ไม่จำหน่ายหรือไม่ต้องการใช้งานและยืนยัน ตรวจสอบว่าระบบเปลี่ยนสถานะให้ไม่เปิดขาย |
| AC-MENU-MGMT-10 | `test_AC_MENU_MGMT_10_out_of_stock_marking_blocks_purchase` | เปลี่ยนสถานะเป็น “หมด” แล้วตรวจสอบว่าลูกค้าไม่สามารถสั่งซื้อได้ |
| AC-MENU-MGMT-11 | `test_AC_MENU_MGMT_11_invalid_menu_data_is_rejected` | กรอกข้อมูลเมนูไม่ครบถ้วนหรือผิดรูปแบบ แล้วตรวจสอบว่าระบบปฏิเสธและแจ้งมาดูให้แก้ไข |
| AC-MENU-MGMT-12 | `test_AC_MENU_MGMT_12_save_failure_is_not_shown_as_success` | จำลอง DB failure แล้วตรวจสอบว่าระบบแจ้ง “ไม่สามารถบันทึกข้อมูลได้” และไม่แสดงข้อมูลใหม่ว่า save สำเร็จ |
| AC-MENU-MGMT-13 | `test_AC_MENU_MGMT_13_non_admin_cannot_modify_menu` | login เป็นผู้ใช้ไม่ใช่ admin แล้วพยายามเพิ่ม/แก้ไขเมนู ตรวจสอบว่าระบบปฏิเสธ |
| AC-MENU-MGMT-14 | `test_AC_MENU_MGMT_14_old_orders_keep_legacy_snapshot` | สร้าง Order ที่ใช้เมนูก่อนจะตัดสต๊อก แล้วเปลี่ยนเมนูเป็น “หมด” ตรวจสอบว่าดู Order เก่าได้ตาม snapshot เดิม |
| AC-MENU-MGMT-15 | `test_AC_MENU_MGMT_15_promotion_datetime_must_be_valid` | ไม่ส่งวันใดวันหนึ่ง, ส่งรูปแบบที่ไม่ใช่ ISO 8601 พร้อม timezone, หรือให้ end < start แล้วตรวจว่าถูกปฏิเสธและไม่มีการบันทึก |

## 7. ลำดับงาน

1. กำหนด schema สำหรับ `MenuItem`, `Promotion`, `MenuHistory`, `OrderSnapshot` และ validation rules ตาม FR-42 ถึง FR-49 และ Constraints
2. สร้างหน้า Admin จัดการเมนู พร้อม list view, add form, edit form, status selector, และ promotion section ตาม FR-42, FR-43, FR-44, FR-45, NFR-USE-03
3. สร้าง API validation สำหรับข้อมูลเมนูที่จำเป็นและวันเวลาโปรโมชั่นก่อนบันทึกตาม FR-44, FR-46, AC-MENU-MGMT-05, AC-MENU-MGMT-11, AC-MENU-MGMT-15
4. สร้าง logic เก็บและแสดงข้อมูลล่าสุดหลังบันทึกสำเร็จ, รวมถึงการบันทึกผลลัพธ์ผิดพลาดตาม FR-47, Exception Flow 7a, AC-MENU-MGMT-06, AC-MENU-MGMT-12
5. สร้าง logic ตาราง status “เปิดขาย/หมด” และป้องกันลูกค้าสั่งเมนูที่ status = หมด ตาม FR-45, FR-48, Alternative Flow 4a, AC-MENU-MGMT-07, AC-MENU-MGMT-10
6. สร้าง snapshot / archive strategy เพื่อให้ Order เก่าคงข้อมูลเดิมไว้แม้เมนูถูกแก้ไขหรือเปลี่ยน status ตาม FR-49, NFR-REL-09, AC-MENU-MGMT-08, AC-MENU-MGMT-14
7. เพิ่ม access control สำหรับ Admin เท่านั้นตาม NFR-SEC-05 และ AC-MENU-MGMT-13
8. ทดสอบ end-to-end สำหรับ Acceptance Criteria ทั้งหมด และตรวจว่าระบบไม่เกิน scope ที่ระบุไว้

## 8. สิ่งที่ยังไม่ทำ

- Open Questions จาก spec.md: ไม่มีข้อสงสัยที่ค้างจากทีมหลังจากยืนยันคำตอบทั้งหมด
- ไม่เพิ่มรายละเอียดด้านโปรโมชั่นหรือการ archive ที่ไม่มีข้อกำหนดรองรับใน spec

---

สรุป: แผนงานนี้จะสร้างระบบจัดการเมนูและสถานะสินค้าแบบ end-to-end สำหรับ Admin โดยยึด FR, NFR, Constraints และ AC ของ spec อย่างเคร่งครัด พร้อมทั้งคงความถูกต้องของ Order เก่าและป้องกันเมนูที่ถูกตั้งเป็น “หมด” จากการสั่งซื้อใหม่
