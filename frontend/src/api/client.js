// รองรับ FR-06 และ FR-07 โดยเชื่อมต่อ API เมนูและ Order
async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`คำขอไม่สำเร็จ (HTTP ${response.status})`);
  }

  return response.json();
}

// รองรับ FR-06 โดยโหลดรายการเมนูตาม contract ของ SPEC-MENU-001
export async function getMenu() {
  const response = await request("/api/menu");
  const items = response.items;
  if (!Array.isArray(items)) {
    throw new Error("รูปแบบข้อมูลเมนูไม่ถูกต้อง");
  }
  return items;
}

// รองรับ FR-06 โดยขอ reference draft และเลขที่จองจาก backend
export function createDraft() {
  return request("/api/orders/drafts", { method: "POST" });
}

// รองรับ FR-06 และ FR-07 โดยส่งจำนวนและตัวเลือกไปเพิ่มใน draft Order
export function addOrderItem(item) {
  return request("/api/orders/items", {
    method: "POST",
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
