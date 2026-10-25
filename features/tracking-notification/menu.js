const statusLabels = {
  waiting: 'รอรับ Order',
  preparing: 'กำลังเตรียม',
  ready: 'พร้อมรับสินค้า',
  picked_up: 'รับสินค้าแล้ว',
  timeout: 'timeout',
  cancelled: 'ยกเลิก',
};
const statusFlow = ['waiting', 'preparing', 'ready', 'picked_up'];
const now = Date.now();
const orders = [
  {
    id: '004', createdAt: now - 1000 * 60 * 8, status: 'ready', changedAt: now - 1000 * 60 * 2,
    items: [{ name: 'ชาไทย', quantity: 2, price: 39, options: 'หวานน้อย 50% · ไข่มุก' }, { name: 'กาแฟเย็น', quantity: 1, price: 65, options: 'หวานปกติ 75% · น้ำแข็งปริมาณปกติ' }],
  },
  {
    id: '003', createdAt: now - 1000 * 60 * 25, status: 'preparing', changedAt: now - 1000 * 60 * 15,
    items: [{ name: 'มัทฉะลาเต้', quantity: 1, price: 65, options: 'ไม่หวาน · ไม่ใส่น้ำแข็ง' }],
  },
  {
    id: '002', createdAt: now - 1000 * 60 * 60 * 4, status: 'picked_up', changedAt: now - 1000 * 60 * 60 * 3,
    items: [{ name: 'ชาไทย', quantity: 1, price: 39, options: 'หวานปกติ 75% · น้ำแข็งปริมาณปกติ' }],
  },
  {
    id: '001', createdAt: now - 1000 * 60 * 60 * 27, status: 'timeout', changedAt: null,
    items: [{ name: 'น้ำส้มคั้น', quantity: 1, price: 55, options: 'ไม่หวาน · น้ำแข็งน้อย' }],
  },
];

let selectedOrderId = '';
let notificationLogs = [];
const sentSuccessfully = new Set();
const money = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount);

const elements = {
  scenario: document.getElementById('tracking-scenario'),
  content: document.getElementById('tracking-content'),
  error: document.getElementById('tracking-error'),
  empty: document.getElementById('tracking-empty'),
  list: document.getElementById('order-list'),
  detail: document.getElementById('order-detail'),
  notificationMessage: document.getElementById('notification-message'),
  notificationLog: document.getElementById('notification-log'),
};

function dateTime(timestamp) {
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp));
}

function formatStatus(status) {
  const style = status === 'ready' || status === 'picked_up' ? 'ready' : status === 'timeout' ? 'timeout' : status === 'cancelled' ? 'cancelled' : '';
  return `<span class="status-chip ${style}">${statusLabels[status]}</span>`;
}

function renderList() {
  const sorted = [...orders].sort((a, b) => b.createdAt - a.createdAt);
  elements.list.innerHTML = sorted.map((order) => `
    <button class="order-choice${order.id === selectedOrderId ? ' is-selected' : ''}" type="button" data-order-id="${order.id}" aria-pressed="${order.id === selectedOrderId}">
      <span class="order-choice-top"><span>Order #${order.id}</span>${formatStatus(order.status)}</span>
      <small>${dateTime(order.createdAt)} · ${order.items.length} รายการ</small>
    </button>
  `).join('');
}

function renderDetail(order) {
  if (!order) {
    elements.detail.innerHTML = '<div class="state-card"><h3>เลือกรายการ Order</h3><p>เลือก Order จากรายการเพื่อดูรายละเอียด</p></div>';
    return;
  }

  const currentIndex = statusFlow.indexOf(order.status);
  const timeline = currentIndex < 0
    ? `<p class="section-note">สถานะ Order: ${statusLabels[order.status]}</p>`
    : `<div class="timeline">${statusFlow.map((status, index) => `
      <div class="timeline-step${index <= currentIndex ? ' is-done' : ''}">${statusLabels[status]}</div>
    `).join('')}</div>`;
  const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  elements.detail.innerHTML = `
    <header class="detail-header">
      <div><h2>Order #${order.id}</h2><p class="detail-meta">สร้างเมื่อ ${dateTime(order.createdAt)}</p></div>
      ${formatStatus(order.status)}
    </header>
    ${timeline}
    ${order.changedAt && ['ready', 'picked_up'].includes(order.status) ? `<p class="section-note">อัปเดตสถานะ “${statusLabels[order.status]}” ล่าสุด · ${dateTime(order.changedAt)}</p>` : ''}
    <div class="detail-items">
      ${order.items.map((item) => `
        <div class="detail-item">
          <div><strong>${item.name} × ${item.quantity}</strong><small>${item.options}</small></div>
          <span>${money(item.price * item.quantity)}</span>
        </div>
      `).join('')}
    </div>
    <div class="detail-total"><span>ยอดรวม</span><strong>${money(total)}</strong></div>
    <p class="section-note">แสดงเฉพาะรายการตัวอย่างของบัญชีลูกค้าปัจจุบัน</p>
  `;
}

function render() {
  const scenario = elements.scenario.value;
  elements.error.hidden = scenario !== 'error';
  elements.empty.hidden = scenario !== 'empty';
  elements.content.hidden = scenario !== 'normal';
  if (scenario !== 'normal') return;
  const sorted = [...orders].sort((a, b) => b.createdAt - a.createdAt);
  if (!sorted.some((order) => order.id === selectedOrderId)) selectedOrderId = sorted[0]?.id ?? '';
  renderList();
  renderDetail(sorted.find((order) => order.id === selectedOrderId));
}

elements.list.addEventListener('click', (event) => {
  const button = event.target.closest('[data-order-id]');
  if (!button) return;
  selectedOrderId = button.dataset.orderId;
  render();
});

elements.scenario.addEventListener('change', render);
document.getElementById('refresh-orders').addEventListener('click', render);
document.getElementById('retry-tracking').addEventListener('click', () => {
  elements.scenario.value = 'normal';
  render();
});

function renderNotificationLogs() {
  elements.notificationLog.innerHTML = notificationLogs.length
    ? notificationLogs.map((entry) => `<div class="log-row"><span>${entry.text}</span><time>${dateTime(entry.at)}</time></div>`).join('')
    : '<p class="section-note">ยังไม่มีประวัติการแจ้งเตือนในสถานการณ์จำลองนี้</p>';
}

function addNotificationLog(text) {
  notificationLogs.unshift({ text, at: Date.now() });
  renderNotificationLogs();
}

document.getElementById('simulate-notification').addEventListener('click', () => {
  const readyOrder = orders.find((order) => order.status === 'ready');
  if (!readyOrder) {
    elements.notificationMessage.textContent = 'ไม่มี Order ที่มีสถานะ “พร้อมรับสินค้า” สำหรับจำลองการแจ้งเตือน';
    elements.notificationMessage.className = 'form-message error';
    elements.notificationMessage.hidden = false;
    return;
  }
  const order = readyOrder;

  if (sentSuccessfully.has(order.id)) {
    elements.notificationMessage.textContent = `Order #${order.id} เคยส่งสำเร็จแล้ว ระบบไม่ส่งข้อความซ้ำ`;
    elements.notificationMessage.className = 'form-message';
    elements.notificationMessage.hidden = false;
    return;
  }

  if (document.getElementById('line-connection').value !== 'connected') {
    elements.notificationMessage.textContent = `Order #${order.id} ยังไม่ได้เชื่อมต่อ LINE จึงไม่ส่งข้อความและไม่เปลี่ยนสถานะ Order`;
    elements.notificationMessage.className = 'form-message';
    elements.notificationMessage.hidden = false;
    addNotificationLog(`Order #${order.id} · ไม่ได้ส่ง (ยังไม่เชื่อมต่อ LINE)`);
    return;
  }

  if (document.getElementById('line-result').value === 'failure') {
    elements.notificationMessage.textContent = `ส่งไม่สำเร็จสำหรับ Order #${order.id} · บันทึกผลแล้ว ไม่มีการ retry อัตโนมัติ`;
    elements.notificationMessage.className = 'form-message error';
    addNotificationLog(`Order #${order.id} · ส่งไม่สำเร็จ`);
  } else {
    sentSuccessfully.add(order.id);
    elements.notificationMessage.textContent = `ส่งแจ้งเตือน Order #${order.id} สำเร็จ (จำลอง)`;
    elements.notificationMessage.className = 'form-message success';
    addNotificationLog(`Order #${order.id} · ส่งข้อความ “Order พร้อมรับสินค้า” สำเร็จ`);
  }
  elements.notificationMessage.hidden = false;
});

renderNotificationLogs();
render();
