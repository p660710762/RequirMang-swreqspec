const ADMIN_MENU_PATH = '/api/admin/menu';
const MOCK_ADMIN_HEADERS = { 'X-User-Id': 'admin' };
const STAFF_ORDERS_PATH = '/api/staff/orders';
const MOCK_STAFF_HEADERS = { 'X-User-Id': 'staff' };

// FR-29: load the current order list for an authenticated Staff user.
export async function getStaffOrders() {
  const response = await fetch(STAFF_ORDERS_PATH, { headers: MOCK_STAFF_HEADERS });
  if (!response.ok) {
    throw new Error(`Staff orders request failed (${response.status})`);
  }
  return response.json();
}

// FR-31: load the drink items, quantities, and selected options for one order.
export async function getStaffOrderDetails(orderId) {
  const response = await fetch(
    `${STAFF_ORDERS_PATH}/${encodeURIComponent(orderId)}`,
    { headers: MOCK_STAFF_HEADERS },
  );
  if (!response.ok) {
    throw new Error(`Staff order details request failed (${response.status})`);
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