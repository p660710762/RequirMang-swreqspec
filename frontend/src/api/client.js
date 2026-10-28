const ADMIN_MENU_PATH = '/api/admin/menu';
const MOCK_ADMIN_HEADERS = { 'X-User-Id': 'admin' };
const ORDER_LIST_PATH = '/api/orders';
const DEFAULT_MOCK_ORDER_USER = 'customer-a';
const STAFF_ORDERS_PATH = '/api/staff/orders';
const MOCK_STAFF_HEADERS = { 'X-User-Id': 'staff' };

function orderHeaders(userId = DEFAULT_MOCK_ORDER_USER) {
  return userId ? { 'X-Test-User': userId } : {};
}

// FR-19: load the order list for the current development/test user.
export async function getOrders(userId = DEFAULT_MOCK_ORDER_USER) {
  const response = await fetch(ORDER_LIST_PATH, { headers: orderHeaders(userId) });
  if (!response.ok) {
    throw new Error(`Order request failed (${response.status})`);
  }
  return response.json();
}

// FR-29, AC-STAFF-ORDER-07: surface load failures so the Staff page can offer retry.
export async function getStaffOrders() {
  const response = await fetch(STAFF_ORDERS_PATH, { headers: MOCK_STAFF_HEADERS });
  if (!response.ok) {
    throw new Error(`Staff orders request failed (${response.status})`);
  }
  return response.json();
}

// FR-20: load details for the selected order using the current development/test user.
export async function getOrderDetails(
  orderId,
  userId = DEFAULT_MOCK_ORDER_USER,
  orderDate,
) {
  const query = orderDate ? `?order_date=${encodeURIComponent(orderDate)}` : '';
  const response = await fetch(
    `${ORDER_LIST_PATH}/${encodeURIComponent(orderId)}${query}`,
    { headers: orderHeaders(userId) },
  );
  if (!response.ok) {
    throw new Error(`Order detail request failed (${response.status})`);
  }
  return response.json();
}

// FR-21, NFR-REL-03: load the confirmed status history for the selected order.
export async function getOrderStatus(
  orderId,
  userId = DEFAULT_MOCK_ORDER_USER,
  orderDate,
) {
  const query = orderDate ? `?order_date=${encodeURIComponent(orderDate)}` : '';
  const response = await fetch(
    `${ORDER_LIST_PATH}/${encodeURIComponent(orderId)}/status${query}`,
    { headers: orderHeaders(userId) },
  );
  if (!response.ok) {
    throw new Error(`Order status request failed (${response.status})`);
  }
  return response.json();
}

// FR-21, NFR-REL-03: reload the selected order's latest confirmed status after a failure.
export async function refreshOrderStatus(
  orderId,
  userId = DEFAULT_MOCK_ORDER_USER,
  orderDate,
) {
  const query = orderDate ? `?order_date=${encodeURIComponent(orderDate)}` : '';
  const response = await fetch(
    `${ORDER_LIST_PATH}/${encodeURIComponent(orderId)}/status/refresh${query}`,
    { method: 'POST', headers: orderHeaders(userId) },
  );
  if (!response.ok) {
    throw new Error(`Order status refresh failed (${response.status})`);
  }
  return response.json();
}

// FR-31: load the drink items, quantities, and selected options for one order.
export async function getStaffOrderDetails(orderId, orderDate) {
  const query = orderDate ? `?order_date=${encodeURIComponent(orderDate)}` : '';
  const response = await fetch(
    `${STAFF_ORDERS_PATH}/${encodeURIComponent(orderId)}${query}`,
    { headers: MOCK_STAFF_HEADERS },
  );
  if (!response.ok) {
    throw new Error(`Staff order details request failed (${response.status})`);
  }
  return response.json();
}

// FR-25, FR-26, FR-27: submit the next status for an authorized Staff update.
export async function updateStaffOrderStatus(orderId, orderDate, newStatus) {
  const query = `?order_date=${encodeURIComponent(orderDate)}`;
  const response = await fetch(
    `${STAFF_ORDERS_PATH}/${encodeURIComponent(orderId)}/status${query}`,
    {
      method: 'PATCH',
      headers: { ...MOCK_STAFF_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_status: newStatus }),
    },
  );
  if (!response.ok) {
    let message = `Staff order status update failed (${response.status})`;
    try {
      const errorBody = await response.json();
      if (typeof errorBody.detail === 'string') {
        message = errorBody.detail;
      }
    } catch {
      // Retain the HTTP status when the server does not return JSON.
    }
    throw new Error(message);
  }
  return response.json();
}

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
export function createDraft(userId) {
  return request('/api/orders/drafts', {
    method: 'POST',
    headers: orderHeaders(userId || ''),
  });
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

// FR-17: development/test-only simulated payment completion for the current mock user.
export function completeMockPayment(draft, userId) {
  return request('/api/orders/payment/mock-success', {
    method: 'POST',
    headers: orderHeaders(userId || ''),
    body: JSON.stringify(draft),
  });
}