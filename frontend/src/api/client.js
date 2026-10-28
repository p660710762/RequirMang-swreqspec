const ADMIN_MENU_PATH = '/api/admin/menu';
const MOCK_ADMIN_HEADERS = { 'X-User-Id': 'admin' };

// FR-42: load the current menu list for the Admin menu page.
export async function getMenuItems() {
  const response = await fetch(ADMIN_MENU_PATH, { headers: MOCK_ADMIN_HEADERS });
  if (!response.ok) {
    throw new Error(`Menu request failed (${response.status})`);
  }
  return response.json();
}

// FR-43, FR-47: send a new menu payload to the menu API.
export async function createMenuItem(menuItem) {
  const response = await fetch(ADMIN_MENU_PATH, {
    method: 'POST',
    headers: { ...MOCK_ADMIN_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(menuItem),
  });
  if (!response.ok) {
    let message = `Menu save failed (${response.status})`;
    try {
      const errorBody = await response.json();
      if (typeof errorBody.detail === 'string') {
        message = errorBody.detail;
      }
    } catch {
      // Keep the HTTP status message when the error response is not JSON.
    }
    throw new Error(message);
  }
  return response.json();
}

// รองรับ FR-06 และ FR-07 โดยเรียก Order API พร้อมแสดงข้อผิดพลาดจาก server
async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `คำขอไม่สำเร็จ (HTTP ${response.status})`;
    try {
      const errorBody = await response.json();
      if (typeof errorBody.detail === 'string') {
        message = errorBody.detail;
      }
    } catch {
      // Keep the HTTP status message when the error response is not JSON.
    }
    throw new Error(message);
  }

  return response.json();
}

// รองรับ FR-06 โดยโหลดรายการเมนูตาม contract ของ SPEC-MENU-001
export async function getMenu() {
  const response = await request('/api/menu');
  if (!Array.isArray(response.items)) {
    throw new Error('รูปแบบข้อมูลเมนูไม่ถูกต้อง');
  }
  return response.items;
}

// รองรับ FR-06 โดยขอ reference draft และเลขที่จองจาก backend
export function createDraft() {
  return request('/api/orders/drafts', { method: 'POST' });
}

// รองรับ FR-06 และ FR-07 โดยส่งจำนวนและตัวเลือกไปเพิ่มใน draft Order
export function addOrderItem(item) {
  return request('/api/orders/items', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

// รองรับ FR-08 โดยโหลดรายการและยอดรวมของ draft Order
export function getOrderSummary(draft) {
  const query = new URLSearchParams({
    order_date: draft.order_date,
    order_id: draft.order_id,
  });
  return request(`/api/orders/preview?${query}`);
}

// รองรับ FR-07 และ FR-09 โดยแก้จำนวนหรือตัวเลือกของรายการก่อนยืนยัน Order
export function updateOrderItem(orderItemId, changes) {
  return request(`/api/orders/items/${orderItemId}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
}

// รองรับ FR-10 และ FR-11 โดยตรวจ Order ก่อนเข้าสู่ขั้นตอนชำระเงิน
export function confirmOrder(draft) {
  return request('/api/orders/confirm', {
    method: 'POST',
    body: JSON.stringify(draft),
  });
}