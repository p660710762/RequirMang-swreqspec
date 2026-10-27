const ADMIN_MENU_PATH = '/api/admin/menu';
const MOCK_ADMIN_HEADERS = { 'X-User-Id': 'admin' };
const ORDER_LIST_PATH = '/api/orders';
const MOCK_ORDER_HEADERS = { 'X-Test-User': 'customer-a' };

// FR-19: load the order list for the current development/test user.
export async function getOrders() {
  const response = await fetch(ORDER_LIST_PATH, { headers: MOCK_ORDER_HEADERS });
  if (!response.ok) {
    throw new Error(`Order request failed (${response.status})`);
  }
  return response.json();
}

// FR-20: load details for the selected order using the current development/test user.
export async function getOrderDetails(orderId) {
  const response = await fetch(
    `${ORDER_LIST_PATH}/${encodeURIComponent(orderId)}`,
    { headers: MOCK_ORDER_HEADERS },
  );
  if (!response.ok) {
    throw new Error(`Order detail request failed (${response.status})`);
  }
  return response.json();
}

// FR-21, NFR-REL-03: load the confirmed status history for the selected order.
export async function getOrderStatus(orderId) {
  const response = await fetch(
    `${ORDER_LIST_PATH}/${encodeURIComponent(orderId)}/status`,
    { headers: MOCK_ORDER_HEADERS },
  );
  if (!response.ok) {
    throw new Error(`Order status request failed (${response.status})`);
  }
  return response.json();
}

// FR-21, NFR-REL-03: reload the selected order's latest confirmed status after a failure.
export async function refreshOrderStatus(orderId) {
  const response = await fetch(
    `${ORDER_LIST_PATH}/${encodeURIComponent(orderId)}/status/refresh`,
    { method: 'POST', headers: MOCK_ORDER_HEADERS },
  );
  if (!response.ok) {
    throw new Error(`Order status refresh failed (${response.status})`);
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
      if (typeof errorBody.detail === 'string') message = errorBody.detail;
    } catch {
      // Keep the status-based message when the response is not JSON.
    }
    throw new Error(message);
  }
  return response.json();
}