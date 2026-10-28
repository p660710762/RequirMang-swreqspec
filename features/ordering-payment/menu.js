const menuItems = [
  { id: 1, name: 'ชาไทย', description: 'ชาไทยหอมเข้มข้น', price: 45, promoPrice: 39, promo: true, status: 'open', art: '🧋' },
  { id: 2, name: 'มัทฉะลาเต้', description: 'มัทฉะเข้มข้นผสมนมสด', price: 75, promoPrice: 65, promo: true, status: 'open', art: '🍵' },
  { id: 3, name: 'น้ำส้มคั้น', description: 'ส้มคั้นสดรสเปรี้ยวหวาน', price: 55, status: 'out_of_stock', art: '🍊' },
  { id: 4, name: 'กาแฟเย็น', description: 'กาแฟหอมเข้มข้นและนม', price: 65, status: 'open', art: '☕' },
];

const toppings = [
  'ไข่มุก', 'ดับเบิ้ลไข่มุก', 'เจลลี่ผลไม้', 'ดับเบิ้ลเจลลี่ผลไม้',
  'บุกขาว', 'ดับเบิ้ลบุกขาว', 'คริสตัลใส', 'ดับเบิ้ลคริสตัลใส',
  'คริสตัลบราวชูการ์', 'ชีส', 'ดับเบิ้ลชีส', 'ซอสบราวน์ชูการ์',
  'ชีสครันช์', 'ครันช์',
];
const sweetnessChoices = ['หวานปกติ 75%', 'หวานน้อย 50%', 'เพิ่มหวาน 100%', 'ไม่หวาน'];
const cart = [];
let activeMenuItem = null;
let editingCartIndex = -1;
let orderSequence = 0;
let currentOrderId = '';
let paymentSeconds = 300;
let paymentTimer = null;
let paymentFinalized = false;
let pendingAmount = 0;
const completedOrders = [];

const money = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount);
const unitPrice = (item) => item.promo ? item.promoPrice : item.price;
const cartTotal = () => cart.reduce((sum, line) => sum + unitPrice(line) * line.quantity, 0);
const itemDialog = document.getElementById('item-dialog');
const itemForm = document.getElementById('item-form');
const formMessage = document.getElementById('item-form-message');
const orderMessage = document.getElementById('order-message');
const menuStage = document.getElementById('menu-stage');
const reviewStage = document.getElementById('review-stage');
const paymentStage = document.getElementById('payment-stage');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function renderMenu() {
  document.getElementById('order-menu').innerHTML = menuItems.map((item) => `
    <article class="order-menu-card">
      <span class="menu-art" aria-hidden="true">${item.art}</span>
      <h3>${item.name}</h3>
      <p>${item.description}${item.promo ? ' · โปรโมชั่นตัวอย่าง' : ''}</p>
      <div class="menu-card-footer">
        <strong class="price">${money(unitPrice(item))}${item.promo ? `<del>${money(item.price)}</del>` : ''}</strong>
        <button class="button ${item.status === 'open' ? 'button-primary' : 'button-quiet'}" type="button" data-add-menu="${item.id}" ${item.status === 'open' ? '' : 'disabled'}>
          ${item.status === 'open' ? 'เลือกแก้ว' : 'หมด'}
        </button>
      </div>
    </article>
  `).join('');
}

function renderCart() {
  const cartElement = document.getElementById('cart-items');
  document.getElementById('cart-count').textContent = String(cart.reduce((sum, line) => sum + line.quantity, 0));
  document.getElementById('cart-total').textContent = money(cartTotal());
  document.getElementById('review-order').disabled = cart.length === 0;

  if (cart.length === 0) {
    cartElement.innerHTML = '<p class="cart-empty">ยังไม่มีเครื่องดื่มในรายการ</p>';
    return;
  }

  cartElement.innerHTML = cart.map((line, index) => `
    <div class="cart-line">
      <div class="cart-line-head"><strong>${escapeHtml(line.name)}</strong><span>${money(unitPrice(line) * line.quantity)}</span></div>
      <p class="cart-meta">${escapeHtml(line.sweetness)} · ${escapeHtml(line.ice || 'น้ำแข็งปริมาณปกติ')}${line.toppings.length ? ` · ${escapeHtml(line.toppings.join(', '))}` : ''}</p>
      <div class="cart-controls">
        <button type="button" data-quantity="${index}" data-delta="-1" aria-label="ลดจำนวน ${escapeHtml(line.name)}">−</button>
        <span>${line.quantity} แก้ว</span>
        <button type="button" data-quantity="${index}" data-delta="1" aria-label="เพิ่มจำนวน ${escapeHtml(line.name)}">＋</button>
        <button type="button" data-edit="${index}">แก้ไขตัวเลือก</button>
        <button type="button" data-remove="${index}" aria-label="ลบ ${escapeHtml(line.name)}">ลบ</button>
      </div>
    </div>
  `).join('');
}

function populateToppings(selected = []) {
  document.getElementById('topping-options').innerHTML = toppings.map((topping, index) => `
    <label><input type="checkbox" name="topping" value="${escapeHtml(topping)}" ${selected.includes(topping) ? 'checked' : ''} /> ${escapeHtml(topping)}</label>
  `).join('');
}

function openItemDialog(item, cartIndex = -1) {
  activeMenuItem = item;
  editingCartIndex = cartIndex;
  formMessage.hidden = true;
  itemForm.reset();
  const current = cartIndex >= 0 ? cart[cartIndex] : null;
  document.getElementById('dialog-item-name').textContent = item.name;
  document.getElementById('item-quantity').value = current ? current.quantity : 1;
  document.getElementById('item-ice').value = current ? current.ice : '';
  document.getElementById('item-dialog-heading').textContent = current ? 'แก้ไขตัวเลือก' : 'ปรับแต่งเครื่องดื่ม';
  itemForm.querySelector('button[type="submit"]').textContent = current ? 'บันทึกการแก้ไข' : 'เพิ่มลง Order';
  populateToppings(current ? current.toppings : []);
  const sweetness = current ? current.sweetness : '';
  itemForm.querySelectorAll('input[name="sweetness"]').forEach((radio) => { radio.checked = radio.value === sweetness; });
  itemDialog.showModal();
}

function showMessage(element, text, isError = false) {
  element.textContent = text;
  element.classList.toggle('error', isError);
  element.hidden = !text;
}

function setWorkflowStep(step) {
  document.querySelectorAll('.workflow-step').forEach((item) => {
    item.classList.toggle('is-current', item.dataset.step === step);
  });
}

document.getElementById('order-menu').addEventListener('click', (event) => {
  const button = event.target.closest('[data-add-menu]');
  if (!button) return;
  const item = menuItems.find((entry) => entry.id === Number(button.dataset.addMenu));
  if (!item || item.status !== 'open') {
    showMessage(orderMessage, 'สินค้าหมด กรุณาเลือกเมนูอื่น', true);
    return;
  }
  showMessage(orderMessage, '');
  openItemDialog(item);
});

document.getElementById('close-item-dialog').addEventListener('click', () => itemDialog.close());
itemDialog.addEventListener('click', (event) => {
  if (event.target === itemDialog) itemDialog.close();
});

itemForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const quantity = Number(document.getElementById('item-quantity').value);
  const sweetness = itemForm.querySelector('input[name="sweetness"]:checked')?.value;
  if (!Number.isInteger(quantity) || quantity < 1 || !sweetness) {
    showMessage(formMessage, 'กรุณาระบุจำนวนมากกว่า 0 และเลือกระดับความหวาน', true);
    return;
  }
  const line = {
    menuId: activeMenuItem.id,
    name: activeMenuItem.name,
    price: activeMenuItem.price,
    promo: Boolean(activeMenuItem.promo),
    promoPrice: activeMenuItem.promoPrice,
    quantity,
    sweetness,
    toppings: [...itemForm.querySelectorAll('input[name="topping"]:checked')].map((input) => input.value),
    ice: document.getElementById('item-ice').value,
  };
  if (editingCartIndex >= 0) cart[editingCartIndex] = line;
  else cart.push(line);
  itemDialog.close();
  renderCart();
});

document.getElementById('cart-items').addEventListener('click', (event) => {
  const quantityButton = event.target.closest('[data-quantity]');
  const editButton = event.target.closest('[data-edit]');
  const removeButton = event.target.closest('[data-remove]');
  if (quantityButton) {
    const index = Number(quantityButton.dataset.quantity);
    cart[index].quantity += Number(quantityButton.dataset.delta);
    if (cart[index].quantity <= 0) cart.splice(index, 1);
  } else if (editButton) {
    const index = Number(editButton.dataset.edit);
    const item = menuItems.find((entry) => entry.id === cart[index].menuId);
    openItemDialog(item, index);
    return;
  } else if (removeButton) {
    cart.splice(Number(removeButton.dataset.remove), 1);
  } else {
    return;
  }
  renderCart();
});

function renderReview() {
  const confirmButton = document.getElementById('confirm-order');
  const reviewMessage = document.getElementById('review-message');
  confirmButton.disabled = cart.length === 0;
  reviewMessage.textContent = cart.length === 0 ? 'รายการว่าง กรุณากลับไปเลือกเครื่องดื่มก่อนยืนยัน Order' : '';
  reviewMessage.hidden = cart.length !== 0;
  document.getElementById('review-items').innerHTML = cart.map((line, index) => `
    <div class="review-line">
      <div><strong>${escapeHtml(line.name)} × ${line.quantity}</strong><p class="cart-meta">${escapeHtml(line.sweetness)} · ${escapeHtml(line.ice || 'น้ำแข็งปริมาณปกติ')}${line.toppings.length ? ` · ${escapeHtml(line.toppings.join(', '))}` : ''}</p></div>
      <div class="review-controls"><input type="number" min="0" step="1" value="${line.quantity}" data-review-quantity="${index}" aria-label="จำนวน ${escapeHtml(line.name)}" /><button class="button button-quiet" type="button" data-review-edit="${index}">แก้ไขตัวเลือก</button><strong>${money(unitPrice(line) * line.quantity)}</strong></div>
    </div>
  `).join('');
  document.getElementById('review-total').textContent = money(cartTotal());
}

document.getElementById('review-order').addEventListener('click', () => {
  if (cart.length === 0) {
    showMessage(orderMessage, 'กรุณาเลือกเครื่องดื่มอย่างน้อย 1 รายการ', true);
    return;
  }
  menuStage.hidden = true;
  reviewStage.hidden = false;
  setWorkflowStep('review');
  renderReview();
});

document.getElementById('back-to-menu').addEventListener('click', () => {
  reviewStage.hidden = true;
  menuStage.hidden = false;
  setWorkflowStep('menu');
});

document.getElementById('review-items').addEventListener('change', (event) => {
  if (!event.target.matches('[data-review-quantity]')) return;
  const index = Number(event.target.dataset.reviewQuantity);
  const quantity = Number(event.target.value);
  if (!Number.isInteger(quantity) || quantity < 0) {
    event.target.value = String(cart[index].quantity);
    return;
  }
  if (quantity === 0) cart.splice(index, 1);
  else cart[index].quantity = quantity;
  renderReview();
  renderCart();
});

document.getElementById('review-items').addEventListener('click', (event) => {
  const button = event.target.closest('[data-review-edit]');
  if (!button) return;
  const index = Number(button.dataset.reviewEdit);
  const item = menuItems.find((entry) => entry.id === cart[index].menuId);
  openItemDialog(item, index);
});

function drawMockQr() {
  const pattern = document.getElementById('qr-pattern');
  const finder = (row, column, startRow, startColumn) => {
    const r = row - startRow;
    const c = column - startColumn;
    if (r < 0 || r > 6 || c < 0 || c > 6) return null;
    return r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
  };
  let markup = '';
  for (let row = 0; row < 21; row += 1) {
    for (let column = 0; column < 21; column += 1) {
      const square = finder(row, column, 0, 0) ?? finder(row, column, 0, 14) ?? finder(row, column, 14, 0);
      const dark = square ?? ((row * 13 + column * 7 + row * column) % 5 < 2);
      markup += `<span class="${dark ? 'is-dark' : ''}"></span>`;
    }
  }
  pattern.innerHTML = markup;
}

function updateTimer() {
  const minutes = String(Math.floor(paymentSeconds / 60)).padStart(2, '0');
  const seconds = String(paymentSeconds % 60).padStart(2, '0');
  document.getElementById('payment-timer').textContent = `${minutes}:${seconds}`;
  if (paymentSeconds <= 0) {
    clearInterval(paymentTimer);
    showMessage(document.getElementById('payment-message'), 'QR หมดอายุ Order อยู่ในสถานะ timeout ไม่สามารถสร้าง QR ใหม่ได้ กรุณาทำรายการใหม่', true);
    document.querySelector('.qr-card').hidden = true;
    document.querySelector('.demo-controls').hidden = true;
    document.getElementById('start-new-order').hidden = false;
    return;
  }
  paymentSeconds -= 1;
}

function startPayment() {
  if (cart.length === 0 || cart.some((line) => !line.sweetness || line.quantity < 1)) {
    showMessage(document.getElementById('review-message'), 'Order ต้องมีสินค้าอย่างน้อย 1 รายการ และเลือกระดับความหวานให้ครบ', true);
    return;
  }
  pendingAmount = cartTotal();
  orderSequence += 1;
  currentOrderId = String(orderSequence).padStart(3, '0');
  paymentSeconds = 300;
  paymentFinalized = false;
  document.getElementById('payment-order-id').textContent = currentOrderId;
  document.getElementById('payment-reference').textContent = `DEMO-${Date.now().toString(36).toUpperCase()}`;
  document.getElementById('payment-amount').textContent = money(pendingAmount);
  document.getElementById('payment-content').hidden = false;
  document.getElementById('payment-success').hidden = true;
  document.getElementById('start-new-order').hidden = true;
  showMessage(document.getElementById('payment-message'), '');
  drawMockQr();
  reviewStage.hidden = true;
  paymentStage.hidden = false;
  setWorkflowStep('payment');
  clearInterval(paymentTimer);
  updateTimer();
  paymentTimer = setInterval(updateTimer, 1000);
}

document.getElementById('confirm-order').addEventListener('click', startPayment);

document.getElementById('submit-payment').addEventListener('click', () => {
  if (paymentFinalized || paymentSeconds <= 0) return;
  const result = document.getElementById('payment-result').value;
  if (result === 'success') {
    paymentFinalized = true;
    clearInterval(paymentTimer);
    document.getElementById('payment-content').hidden = true;
    document.getElementById('payment-success').hidden = false;
    completedOrders.push({
      id: currentOrderId,
      total: pendingAmount,
      items: cart.map((line) => ({
        name: line.name,
        quantity: line.quantity,
        sweetness: line.sweetness,
        toppings: [...line.toppings],
        ice: line.ice,
        lineTotal: unitPrice(line) * line.quantity,
      })),
    });
    document.getElementById('paid-order-summary').innerHTML = `
      Order #${currentOrderId} · ${cart.length} รายการ · ${money(pendingAmount)} (ข้อมูลจำลอง)
      <br />${completedOrders.at(-1).items.map((line) => `${escapeHtml(line.name)} × ${line.quantity} · ${escapeHtml(line.sweetness)} · ${escapeHtml(line.toppings.join(', ') || 'ไม่เพิ่ม Topping')} · ${escapeHtml(line.ice || 'น้ำแข็งปริมาณปกติ')} · ${money(line.lineTotal)}`).join('<br />')}
    `;
    document.getElementById('submit-payment').disabled = true;
    document.getElementById('start-new-order').hidden = false;
    return;
  }

  if (result === 'failure') {
    showMessage(document.getElementById('payment-message'), 'การชำระเงินไม่สำเร็จ · กำลังตรวจสอบการชำระเงิน คุณสามารถลองใหม่หรือเช็กอีกครั้ง', true);
  } else {
    showMessage(document.getElementById('payment-message'), 'กำลังตรวจสอบการชำระเงิน · ยังไม่ได้รับการยืนยันจาก Payment Gateway', false);
  }
});

document.getElementById('start-new-order').addEventListener('click', () => {
  clearInterval(paymentTimer);
  cart.splice(0, cart.length);
  currentOrderId = '';
  pendingAmount = 0;
  document.getElementById('submit-payment').disabled = false;
  document.querySelector('.qr-card').hidden = false;
  document.querySelector('.demo-controls').hidden = false;
  paymentStage.hidden = true;
  menuStage.hidden = false;
  setWorkflowStep('menu');
  renderCart();
  showMessage(orderMessage, '');
});

renderMenu();
renderCart();
