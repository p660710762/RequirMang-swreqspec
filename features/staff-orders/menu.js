const statusFlow = [
  { id: 'waiting', label: 'รอรับ Order', next: 'preparing', action: 'เริ่มเตรียมเครื่องดื่ม' },
  { id: 'preparing', label: 'กำลังเตรียม', next: 'ready', action: 'พร้อมรับสินค้า' },
  { id: 'ready', label: 'พร้อมรับสินค้า', next: 'picked_up', action: 'บันทึกรับสินค้าแล้ว' },
  { id: 'picked_up', label: 'รับสินค้าแล้ว', next: null, action: '' },
];
const now = Date.now();
const orders = [
  { id: '006', createdAt: now - 1000 * 60 * 4, status: 'waiting', items: [{ name: 'ชาไทย', quantity: 2, choices: 'หวานปกติ 75% · ไข่มุก' }] },
  { id: '005', createdAt: now - 1000 * 60 * 12, status: 'preparing', items: [{ name: 'มัทฉะลาเต้', quantity: 1, choices: 'หวานน้อย 50% · ไม่ใส่น้ำแข็ง' }, { name: 'กาแฟเย็น', quantity: 1, choices: 'ไม่หวาน · น้ำแข็งปริมาณปกติ' }] },
  { id: '004', createdAt: now - 1000 * 60 * 30, status: 'ready', items: [{ name: 'ชาไทย', quantity: 1, choices: 'เพิ่มหวาน 100% · เจลลี่ผลไม้' }] },
  { id: '003', createdAt: now - 1000 * 60 * 60 * 3, status: 'picked_up', items: [{ name: 'กาแฟเย็น', quantity: 1, choices: 'หวานปกติ 75% · น้ำแข็งน้อย' }] },
  { id: '002', createdAt: now - 1000 * 60 * 60 * 5, status: 'cancelled', items: [{ name: 'น้ำส้มคั้น', quantity: 1, choices: 'ไม่หวาน · น้ำแข็งปริมาณปกติ' }] },
];
let nextId = 7;
let notificationLogs = [];
const statusMessageByOrder = new Map();

const money = (amount) => new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(amount));
const statusFor = (id) => statusFlow.find((status) => status.id === id);
const elements = {
  list: document.getElementById('staff-list'),
  scenario: document.getElementById('staff-scenario'),
  error: document.getElementById('staff-error'),
  empty: document.getElementById('staff-empty'),
  notificationLog: document.getElementById('staff-notification-log'),
};

function statusChip(status) {
  const style = status === 'ready' ? 'ready' : status === 'picked_up' ? 'done' : status === 'cancelled' ? 'cancelled' : '';
  const label = status === 'cancelled' ? 'ยกเลิก' : statusFor(status)?.label ?? status;
  return `<span class="status-chip ${style}">${label}</span>`;
}

function orderedOrders() {
  return [...orders].sort((a, b) => {
    const aTerminal = ['picked_up', 'cancelled'].includes(a.status);
    const bTerminal = ['picked_up', 'cancelled'].includes(b.status);
    if (aTerminal !== bTerminal) return Number(aTerminal) - Number(bTerminal);
    return b.createdAt - a.createdAt;
  });
}

function render() {
  const scenario = elements.scenario.value;
  elements.error.hidden = scenario !== 'error';
  elements.empty.hidden = scenario !== 'empty';
  elements.list.hidden = scenario !== 'normal';
  if (scenario !== 'normal') return;

  const list = orderedOrders();
  document.getElementById('active-count').textContent = String(list.filter((order) => !['picked_up', 'cancelled'].includes(order.status)).length);
  elements.list.innerHTML = list.map((order) => {
    const current = statusFor(order.status);
    const saveMessage = statusMessageByOrder.get(order.id);
    return `
      <article class="staff-order${current ? '' : ' is-terminal'}" aria-label="Order ${order.id}">
        <header class="staff-order-head">
          <div><h3>Order #${order.id}</h3><span class="order-number">ลำดับคิว · ${order.id}</span></div>
          ${statusChip(order.status)}
        </header>
        <p class="section-note">รับ Order เมื่อ ${money(order.createdAt)}</p>
        <div class="order-items">
          ${order.items.map((item) => `<div class="order-item"><strong>${item.name} × ${item.quantity}</strong><small>${item.choices}</small></div>`).join('')}
        </div>
        ${saveMessage ? `<p class="form-message error" role="alert">${saveMessage}</p>` : ''}
        <footer class="staff-order-footer">
          <small>${current ? `สถานะปัจจุบัน: ${current.label}` : 'Order สิ้นสุดแล้ว'}</small>
          ${current?.next ? `<button class="button button-primary" type="button" data-update="${order.id}">${current.action}</button>` : ''}
        </footer>
      </article>
    `;
  }).join('');
}

function renderNotificationLog() {
  elements.notificationLog.innerHTML = notificationLogs.length
    ? notificationLogs.map((entry) => `<div class="log-row"><span>${entry.message}</span><time>${money(entry.at)}</time></div>`).join('')
    : '<p class="section-note">ยังไม่มีการแจ้งเตือนในสถานการณ์จำลองนี้</p>';
}

function notifyReady(order) {
  const connection = document.getElementById('staff-line-state').value;
  const outcome = document.getElementById('staff-line-result').value;
  let message;
  if (connection !== 'connected') {
    message = `Order #${order.id} พร้อมรับสินค้า · ไม่ส่งแจ้งเตือน (ลูกค้ายังไม่เชื่อมต่อ LINE)`;
  } else if (outcome === 'failure') {
    message = `Order #${order.id} พร้อมรับสินค้า · ส่ง LINE ไม่สำเร็จ บันทึกผลแล้วและไม่ retry อัตโนมัติ`;
  } else {
    message = `Order #${order.id} พร้อมรับสินค้า · ส่งข้อความแจ้งเตือนสำเร็จ (จำลอง)`;
  }
  notificationLogs.unshift({ message, at: Date.now() });
  renderNotificationLog();
}

elements.list.addEventListener('click', (event) => {
  const button = event.target.closest('[data-update]');
  if (!button) return;
  const order = orders.find((entry) => entry.id === button.dataset.update);
  if (!order) return;

  if (document.getElementById('status-save-result').value === 'failure') {
    statusMessageByOrder.set(order.id, 'ไม่สามารถอัปเดตสถานะได้ สถานะเดิมยังคงอยู่');
    render();
    return;
  }

  const current = statusFor(order.status);
  if (!current?.next) return;
  order.status = current.next;
  statusMessageByOrder.delete(order.id);
  if (order.status === 'ready') notifyReady(order);
  render();
});

document.getElementById('add-demo-order').addEventListener('click', () => {
  const id = String(nextId).padStart(3, '0');
  nextId += 1;
  orders.push({
    id,
    createdAt: Date.now(),
    status: 'waiting',
    items: [{ name: 'ชาไทย', quantity: 1, choices: 'หวานปกติ 75% · น้ำแข็งปริมาณปกติ' }],
  });
  elements.scenario.value = 'normal';
  render();
});

elements.scenario.addEventListener('change', render);
document.getElementById('refresh-staff').addEventListener('click', render);
document.getElementById('retry-staff').addEventListener('click', () => {
  elements.scenario.value = 'normal';
  render();
});

renderNotificationLog();
render();
