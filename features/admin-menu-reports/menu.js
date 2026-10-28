const menuItems = [
  { id: 1, name: 'ชาไทย', price: 45, description: 'ชาไทยหอมเข้มข้น รสกลมกล่อม', imageName: 'ภาพตัวอย่างชาไทย', art: '🧋', status: 'open', promotion: 'ลดพิเศษ 6 บาท' },
  { id: 2, name: 'มัทฉะลาเต้', price: 75, description: 'มัทฉะเข้มข้นผสมนมสด', imageName: 'ภาพตัวอย่างมัทฉะ', art: '🍵', status: 'open', promotion: 'โปรโมชั่นแก้วโปรด' },
  { id: 3, name: 'น้ำส้มคั้น', price: 55, description: 'น้ำส้มคั้นสด ไม่หวานเกินไป', imageName: 'ภาพตัวอย่างน้ำส้ม', art: '🍊', status: 'out_of_stock', promotion: '' },
  { id: 4, name: 'กาแฟเย็น', price: 65, description: 'กาแฟหอมเข้มข้นผสมนม', imageName: 'ภาพตัวอย่างกาแฟ', art: '☕', status: 'open', promotion: '' },
];
let nextMenuId = 5;
let editingId = null;
const statusLabels = { open: 'เปิดขาย', out_of_stock: 'หมด' };
const money = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount);
const menuListElement = document.getElementById('admin-menu-list');
const menuForm = document.getElementById('menu-form');
const menuFormMessage = document.getElementById('menu-form-message');
const reportContent = document.getElementById('report-content');
const reportMessage = document.getElementById('report-message');
const reportError = document.getElementById('report-error');
const reportScenario = document.getElementById('report-scenario');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function setMessage(element, text, type = '') {
  element.textContent = text;
  element.className = `form-message ${type}`.trim();
  element.hidden = !text;
}

function renderMenuList() {
  menuListElement.innerHTML = menuItems.map((item) => `
    <article class="admin-menu-row">
      <span class="item-art" aria-hidden="true">${item.art}</span>
      <div>
        <h3>${escapeHtml(item.name)} · ${money(item.price)}</h3>
        <p>${escapeHtml(item.description)} · ${escapeHtml(item.imageName)}${item.promotion ? ` · ${escapeHtml(item.promotion)}` : ''}</p>
      </div>
      <div class="row-actions">
        <span class="status-chip ${item.status === 'out_of_stock' ? 'soldout' : ''}">${statusLabels[item.status]}</span>
        <button class="button button-quiet" type="button" data-edit-menu="${item.id}">แก้ไข</button>
      </div>
    </article>
  `).join('');
}

function setAdminPermission() {
  const allowed = document.getElementById('admin-role').value === 'admin';
  const listPanel = document.querySelector('.admin-list-panel');
  const editorPanel = document.querySelector('.editor-panel');
  listPanel.inert = !allowed;
  editorPanel.inert = !allowed;
  document.getElementById('admin-access-message').textContent = allowed
    ? 'สิทธิ์ Admin จำลองเปิดใช้งานแล้ว'
    : 'ไม่มีสิทธิ์ Admin · ไม่อนุญาตให้เพิ่มหรือแก้ไขข้อมูลเมนู';
  document.getElementById('admin-access-message').className = allowed ? 'section-note' : 'section-note form-message error';
}

function resetEditor() {
  editingId = null;
  menuForm.reset();
  document.getElementById('menu-id').value = '';
  document.getElementById('editor-heading').textContent = 'เพิ่มหรือแก้ไขเมนู';
  document.getElementById('image-current').textContent = 'เลือกไฟล์รูปภาพสำหรับเมนูใหม่';
  document.getElementById('menu-image').required = true;
  setMessage(menuFormMessage, '');
}

function editMenu(item) {
  editingId = item.id;
  document.getElementById('menu-id').value = String(item.id);
  document.getElementById('menu-name').value = item.name;
  document.getElementById('menu-price').value = String(item.price);
  document.getElementById('menu-description').value = item.description;
  document.getElementById('menu-status').value = item.status;
  document.getElementById('menu-promotion').value = item.promotion;
  document.getElementById('menu-image').value = '';
  document.getElementById('menu-image').required = false;
  document.getElementById('image-current').textContent = `รูปภาพปัจจุบัน: ${item.imageName} · เลือกไฟล์ใหม่ได้หากต้องการเปลี่ยน`;
  document.getElementById('editor-heading').textContent = `แก้ไข ${item.name}`;
  setMessage(menuFormMessage, '');
  document.getElementById('editor-heading').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

menuListElement.addEventListener('click', (event) => {
  const button = event.target.closest('[data-edit-menu]');
  if (!button) return;
  const item = menuItems.find((entry) => entry.id === Number(button.dataset.editMenu));
  if (item) editMenu(item);
});

document.getElementById('new-menu').addEventListener('click', resetEditor);
document.getElementById('cancel-edit').addEventListener('click', resetEditor);
document.getElementById('admin-role').addEventListener('change', setAdminPermission);
document.getElementById('menu-image').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) document.getElementById('image-current').textContent = `ไฟล์ที่เลือก: ${file.name}`;
});

menuForm.addEventListener('submit', (event) => {
  event.preventDefault();
  setMessage(menuFormMessage, '');
  if (document.getElementById('admin-role').value !== 'admin') {
    setMessage(menuFormMessage, 'ไม่มีสิทธิ์ Admin จึงไม่สามารถบันทึกข้อมูลได้', 'error');
    return;
  }

  const name = document.getElementById('menu-name').value.trim();
  const price = Number(document.getElementById('menu-price').value);
  const description = document.getElementById('menu-description').value.trim();
  const imageFile = document.getElementById('menu-image').files[0];
  const status = document.getElementById('menu-status').value;
  const promotion = document.getElementById('menu-promotion').value.trim();
  const current = menuItems.find((item) => item.id === editingId);

  if (!name || !Number.isFinite(price) || price <= 0 || !description || (!current && !imageFile) || (imageFile && !imageFile.type.startsWith('image/'))) {
    setMessage(menuFormMessage, 'กรุณากรอกชื่อ ราคา รายละเอียด และเลือกรูปภาพให้ถูกต้อง', 'error');
    return;
  }

  if (status === 'out_of_stock' && current?.status !== 'out_of_stock'
      && !window.confirm('ยืนยันเปลี่ยนเมนูเป็น “หมด” และไม่แสดงเป็นเมนูที่เปิดขายหรือไม่?')) {
    return;
  }

  if (document.getElementById('save-scenario').value === 'error') {
    setMessage(menuFormMessage, 'ไม่สามารถบันทึกข้อมูลได้ ข้อมูลเดิมยังคงอยู่', 'error');
    return;
  }

  const updated = {
    id: current?.id ?? nextMenuId,
    name,
    price,
    description,
    imageName: imageFile?.name ?? current?.imageName ?? 'ภาพตัวอย่าง',
    art: current?.art ?? '🥤',
    status,
    promotion,
  };
  if (current) {
    menuItems.splice(menuItems.indexOf(current), 1, updated);
  } else {
    nextMenuId += 1;
    menuItems.unshift(updated);
  }
  renderMenuList();
  resetEditor();
  setMessage(menuFormMessage, 'บันทึกข้อมูลตัวอย่างสำเร็จและแสดงข้อมูลล่าสุดแล้ว', 'success');
});

function setInitialReportDates() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 6);
  document.getElementById('report-start').value = localDateString(start);
  document.getElementById('report-end').value = localDateString(today);
}

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const salesRecords = [
  { daysAgo: 0, branch: 'main', paid: true, total: 520, items: [{ name: 'ชาไทย', quantity: 6 }, { name: 'มัทฉะลาเต้', quantity: 2 }] },
  { daysAgo: 1, branch: 'main', paid: true, total: 390, items: [{ name: 'ชาไทย', quantity: 4 }, { name: 'กาแฟเย็น', quantity: 2 }] },
  { daysAgo: 2, branch: 'main', paid: true, total: 455, items: [{ name: 'มัทฉะลาเต้', quantity: 3 }, { name: 'ชาไทย', quantity: 2 }] },
  { daysAgo: 3, branch: 'main', paid: false, total: 150, items: [{ name: 'กาแฟเย็น', quantity: 2 }] },
  { daysAgo: 4, branch: 'main', paid: true, total: 260, items: [{ name: 'กาแฟเย็น', quantity: 4 }, { name: 'น้ำส้มคั้น', quantity: 1 }] },
  { daysAgo: 5, branch: 'main', paid: true, total: 315, items: [{ name: 'ชาไทย', quantity: 3 }, { name: 'มัทฉะลาเต้', quantity: 1 }] },
  { daysAgo: 6, branch: 'main', paid: true, total: 195, items: [{ name: 'ชาไทย', quantity: 3 }] },
  { daysAgo: 0, branch: 'campus', paid: true, total: 220, items: [{ name: 'มัทฉะลาเต้', quantity: 2 }, { name: 'ชาไทย', quantity: 1 }] },
  { daysAgo: 2, branch: 'campus', paid: true, total: 180, items: [{ name: 'กาแฟเย็น', quantity: 2 }, { name: 'ชาไทย', quantity: 1 }] },
];

function dateForDaysAgo(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return localDateString(date);
}

function displayDate(date) {
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' }).format(new Date(`${date}T12:00:00`));
}

function renderReport() {
  const roleAllowed = document.getElementById('manager-role').value === 'manager';
  document.getElementById('report-access-message').textContent = roleAllowed
    ? 'สิทธิ์ Manager ของสาขาที่เลือก (จำลอง)'
    : 'ไม่มีสิทธิ์ Manager · ไม่อนุญาตให้เข้าถึงข้อมูลรายงานของสาขานี้';
  document.getElementById('report-access-message').className = roleAllowed ? 'section-note' : 'section-note form-message error';
  const filters = document.querySelector('.report-filters');
  filters.inert = !roleAllowed;
  if (!roleAllowed) {
    reportContent.hidden = true;
    reportError.hidden = true;
    reportMessage.textContent = 'ไม่มีสิทธิ์ Manager สำหรับสาขานี้';
    reportMessage.hidden = false;
    return;
  }

  reportMessage.hidden = true;
  reportError.hidden = true;
  const scenario = reportScenario.value;
  if (scenario === 'error') {
    reportContent.hidden = true;
    reportError.hidden = false;
    return;
  }
  if (scenario === 'empty') {
    reportContent.hidden = true;
    reportMessage.textContent = 'ไม่มีข้อมูลสำหรับช่วงเวลาที่เลือก';
    reportMessage.hidden = false;
    return;
  }

  const start = document.getElementById('report-start').value;
  const end = document.getElementById('report-end').value;
  if (!start || !end || start > end) {
    reportContent.hidden = true;
    reportMessage.textContent = 'กรุณาเลือกช่วงวันที่ให้ถูกต้อง โดยวันที่เริ่มต้องไม่อยู่หลังวันที่สิ้นสุด';
    reportMessage.hidden = false;
    return;
  }

  const branch = document.getElementById('report-branch').value;
  const paidOrders = salesRecords.filter((record) => {
    const date = dateForDaysAgo(record.daysAgo);
    return record.branch === branch && record.paid && date >= start && date <= end;
  });
  if (paidOrders.length === 0) {
    reportContent.hidden = true;
    reportMessage.textContent = 'ไม่มีข้อมูลสำหรับช่วงเวลาที่เลือก';
    reportMessage.hidden = false;
    return;
  }

  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const quantities = new Map();
  paidOrders.forEach((order) => order.items.forEach((item) => {
    quantities.set(item.name, (quantities.get(item.name) ?? 0) + item.quantity);
  }));
  const bestSellers = [...quantities.entries()].sort((a, b) => b[1] - a[1]);
  document.getElementById('revenue-total').textContent = money(totalRevenue);
  document.getElementById('order-total').textContent = String(paidOrders.length);
  document.getElementById('report-range').textContent = `${displayDate(start)} – ${displayDate(end)}`;
  document.getElementById('report-branch-name').textContent = document.getElementById('report-branch').selectedOptions[0].textContent;
  document.getElementById('best-seller-list').innerHTML = bestSellers.map(([name, quantity], index) => `
    <div class="best-row"><span class="best-rank">${index + 1}</span><strong>${escapeHtml(name)}</strong><small>${quantity} ชิ้น</small></div>
  `).join('');
  reportContent.hidden = false;
}

document.getElementById('menu-tab').addEventListener('click', () => {
  document.getElementById('menu-tab').classList.add('is-active');
  document.getElementById('report-tab').classList.remove('is-active');
  document.getElementById('menu-tab').setAttribute('aria-selected', 'true');
  document.getElementById('report-tab').setAttribute('aria-selected', 'false');
  document.getElementById('menu-management').hidden = false;
  document.getElementById('sales-report').hidden = true;
});

document.getElementById('report-tab').addEventListener('click', () => {
  document.getElementById('report-tab').classList.add('is-active');
  document.getElementById('menu-tab').classList.remove('is-active');
  document.getElementById('report-tab').setAttribute('aria-selected', 'true');
  document.getElementById('menu-tab').setAttribute('aria-selected', 'false');
  document.getElementById('menu-management').hidden = true;
  document.getElementById('sales-report').hidden = false;
  renderReport();
});

document.getElementById('manager-role').addEventListener('change', renderReport);
document.getElementById('report-branch').addEventListener('change', renderReport);
document.getElementById('report-start').addEventListener('change', renderReport);
document.getElementById('report-end').addEventListener('change', renderReport);
document.getElementById('apply-report').addEventListener('click', renderReport);
reportScenario.addEventListener('change', renderReport);
document.getElementById('retry-report').addEventListener('click', () => {
  reportScenario.value = 'normal';
  renderReport();
});

setInitialReportDates();
renderMenuList();
resetEditor();
setAdminPermission();
renderReport();
