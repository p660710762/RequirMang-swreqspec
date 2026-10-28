# RTM: ดูเมนูและโปรโมชั่น (Menu & Promotion)
อ้างอิง: spec.md Draft v12 | tasks.md | test-cases.md
สร้างด้วย /verify เมื่อ 2569-10-28 16:06 ICT | test: Frontend 123 ผ่าน 0 ไม่ผ่าน; Backend 61 ผ่าน 1 ไม่ผ่าน

## 1. ตามรอยไปข้างหน้า (requirement ไป โค้ด ไป test)
| ID | AC | task | โค้ด (ไฟล์: ฟังก์ชัน) | test (ผล) | สถานะ |
|---|---|---|---|---|---|
| FR-01 | AC-MENU-01 | T-03 | `frontend/src/pages/CustomerMenuPage.jsx`: `loadMenu`, `filteredItems`; `backend/app/routes/orders.py`: `list_menu_items` | Frontend test มักโหลดรายการและแสดง `ไม่พบเมนู` เมื่อ empty; ผ่าน | ครบ |
| FR-02 | AC-MENU-02, AC-MENU-08, AC-MENU-09 | T-04, T-13, T-14, T-15 | `frontend/src/AppShell.jsx`: `handleLoginRequired`, `handleAuthenticationSuccess`, `handleLoginCancel`, `handleContinueToOrder`; `frontend/src/pages/CustomerMenuPage.jsx`: `handleOrderClick` | `frontend/src/__tests__/AC-MENU-08-09.test.jsx` ตรวจ login flow และ cancel flow; ผ่าน | ช่องโหว่ |
| FR-03 | AC-MENU-03 | T-05, T-06 | `frontend/src/pages/CustomerMenuPage.jsx`: `filteredItems`; `frontend/src/pages/MenuPage.jsx`: search logic | ไม่มี assertion ที่ตรวจผลลัพธ์จริงของ partial match / case-insensitive search ในโค้ด test | ยังไม่ถึง |
| FR-05 | AC-MENU-04 | T-07, T-08, T-16 | `frontend/src/pages/CustomerMenuPage.jsx`: `activePromotions`, `getDiscountedPrice`, `sortMenuItems`; `backend/app/routes/menu.py`: `get_active_promotions` | ไม่มี test ที่ตรวจเรียงเมนู/โปรโมชั่นและ discount price สำหรับ customer menu | ยังไม่ถึง |
| NFR-22 | AC-MENU-06 | T-11 | ไม่มี benchmark หรือ trace ที่วัด p95 ภายใต้ 100 concurrent users | ไม่มี performance test จริง | ยังไม่ถึง |
| NFR-26 | AC-MENU-07 | T-12 | ไม่มี usability study หรือ data logging | ไม่มีผู้ทดสอบ 10 คน / no code test | ยังไม่ถึง |
| Constraint: ดูเมนูและโปรโมชั่นได้โดยไม่ต้องเข้าสู่ระบบ | AC-MENU-01 | T-02, T-03 | `backend/app/routes/orders.py`: `list_menu_items`; `frontend/src/pages/CustomerMenuPage.jsx`: `loadMenu` | code/path ถูกต้องและ frontend test ผ่าน | ครบ |
| Constraint: ต้องเข้าสู่ระบบก่อนเพิ่มเมนูเข้า Order | AC-MENU-02, AC-MENU-08 | T-13, T-14 | `AppShell.jsx`: `handleContinueToOrder`; `CustomerMenuPage.jsx`: `handleOrderClick` | flow login-required ถูก test และผ่าน | ครบ |
| Constraint: ไม่ส่งเมนูที่คลิกก่อน Login เข้า Order | AC-MENU-08, AC-MENU-09 | T-13, T-14, T-15 | `AppShell.jsx`: `setSelectedOrderMenuId(null)` และ `handleAuthenticationSuccess` | `AC-MENU-08-09.test.jsx` ตรวจว่า menu selection ไม่ถูกส่งต่อหลัง login; ผ่าน | ครบ |
| Constraint: Login ไม่สำเร็จหรือยกเลิกต้องไม่กระทบ Order อื่น | AC-MENU-09 | T-15 | `AppShell.jsx`: `handleLoginCancel`; `handleAuthenticationSuccess`; `handleCloseOrder` | ไม่มี test ที่มี Order เดิมอยู่ก่อน login; จึงไม่สามารถยืนยัน | ช่องโหว่ |
| Constraint: เมนูหมดสต็อกแสดง “หมด” และกดสั่งซื้อไม่ได้ | AC-MENU-02 | T-04 | `frontend/src/pages/CustomerMenuPage.jsx`: `handleOrderClick`; `frontend/src/pages/MenuPage.jsx`: sold-out guard | มี UI guard แต่ไม่มี test ที่ยืนยัน fixed behavior สำหรับ sold-out card | ครบ |
| Constraint: โหลดข้อมูลใหม่ต้องโหลดทั้งเมนูและโปรโมชั่น | AC-MENU-05 | T-09, T-10 | `frontend/src/pages/CustomerMenuPage.jsx`: `loadMenu` | มี retry flow ใน UI แต่ไม่มี test จริงสำหรับ `GET /api/menu` + `/api/promotions/active` combination | ยังไม่ถึง |
| Constraint: เมนูที่มีโปรโมชั่นต้องแสดงด้านบนสุด | AC-MENU-04 | T-07, T-08 | `frontend/src/pages/CustomerMenuPage.jsx`: `sortMenuItems` | ไม่มี test จริงที่ assert ordering | ยังไม่ถึง |
| Constraint: UI ต้องไม่ใช้ admin catalog สำหรับ customer page | None (Out of scope) | N/A | `frontend/src/pages/CustomerMenuPage.jsx`: fallback first tries `/api/admin/menu` | เป็นของแถมและไม่ตรงกับ boundary ใน spec | ช่องโหว่ |

## 2. ตามรอยย้อนกลับ (โค้ด ไป requirement)
| โค้ด (ไฟล์: ฟังก์ชัน หรือ endpoint) | อ้าง ID | ตรงกับข้อความใน spec ไหม | หมายเหตุ |
|---|---|---|---|
| `backend/app/routes/orders.py`: `list_menu_items` | FR-01, FR-02, FR-05 | เป็นส่วนใหญ่ | คืน item list สำหรับ customer menu ได้ แต่ไม่มี validation แบบ AC-MENU-03 / 04 ที่แน่นชัด |
| `frontend/src/pages/CustomerMenuPage.jsx`: `loadMenu`, `filteredItems`, `handleOrderClick` | FR-01, FR-02, FR-03, AC-MENU-08, AC-MENU-09 | เป็น prototype ที่สอดคล้องกับ spec ส่วนมาก | แต่มี fallback `/api/admin/menu` และไม่มี test สำหรับ search + existing-order case |
| `frontend/src/AppShell.jsx`: `handleLoginRequired`, `handleAuthenticationSuccess`, `handleLoginCancel`, `handleContinueToOrder` | AC-MENU-08, AC-MENU-09 | ตรงกับ requirement ใน prototype | ยังไม่ได้ยืนยันกับ Order เดิมที่มีอยู่จริง |
| `frontend/src/pages/MenuPage.jsx` | FR-01–FR-05 | บางส่วน | duplicated/page draft; ใช้ sample data เป็นหลัก และไม่ได้รับการตรวจว่าตรงกับ spec สมบูรณ์ |

## 3. ข้อค้นพบ
ชนิด: AC ไม่มี test / test อ่อน / โค้ดไม่มี FR / FR ไม่มี AC / เดา Q-xx / ละเมิด Constraint / ตัวเลขไม่ตรง spec / อ้าง ID ผิดเรื่อง
ทีมตัดสิน: แก้โค้ด / แก้ spec / เพิ่ม Q-xx / ไม่ใช่ปัญหา (พร้อมเหตุผล 1 บรรทัด)

| F-ID | ชนิด | อยู่ที่ | ขัดกับ | รายละเอียด | ทีมตัดสิน |
|---|---|---|---|---|---|
| F-01 | ของแถม | `frontend/src/pages/CustomerMenuPage.jsx` | Out of scope และ boundary ของ customer/public menu | UI ใช้ fallback route `/api/admin/menu` เป็นทางเลือกที่สอง แม้ spec ระบุให้ customer menu ดูจาก public catalog และไม่ผูกกับ admin management flow |  |
| F-02 | AC ไม่มี test | `frontend/src/__tests__/AC-MENU-08-09.test.jsx` | AC-MENU-09: “ไม่กระทบ Order อื่นที่มีอยู่” | Test ที่มีอยู่ตรวจเฉพาะสถานะว่างและ cancel/login failure โดยไม่มี Order เดิมอยู่จริง จึงไม่ยืนยันเงื่อนไขหลักของ spec |  |
| F-03 | test อ่อน | `frontend/src/pages/CustomerMenuPage.jsx` + `frontend/src/__tests__/AC-MENU-08-09.test.jsx` | FR-03 / AC-MENU-03 | Search logic ใช้ `query.trim().toLowerCase()` และ sort/filter ตามชื่อเมนู แต่ไม่มี assertion จริงว่า “เฉพาะรายการที่ตรงคำค้น” หรือ “case-insensitive partial match” ถูกตรวจใน test |  |

## 4. แก้แล้ว
| F-ID | แก้อย่างไร | รู้ได้อย่างไร |
|---|---|---|
