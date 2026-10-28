const menuItems = [
  { id: 1, name: 'ชาไทย', price: 45, description: 'ชาไทยหอมเข้มข้น รสกลมกล่อม ดื่มได้ทุกช่วงเวลา', status: 'open', art: '🧋', promotion: 'ลดพิเศษ 6 บาท', promoPrice: 39 },
  { id: 2, name: 'มัทฉะลาเต้', price: 75, description: 'มัทฉะเข้มข้นผสมนม หอมละมุนและสดชื่น', status: 'open', art: '🍵', promotion: 'โปรโมชั่นแก้วโปรด', promoPrice: 65 },
  { id: 3, name: 'น้ำส้มคั้น', price: 55, description: 'น้ำส้มคั้นรสสดชื่น ไม่หวานเกินไป', status: 'out_of_stock', art: '🍊' },
  { id: 4, name: 'กาแฟเย็น', price: 65, description: 'กาแฟหอมเข้ม ผสมนมและน้ำเชื่อมอย่างลงตัว', status: 'open', art: '☕' },
];

const elements = {
  search: document.getElementById('menu-search'),
  scenario: document.getElementById('menu-scenario'),
  promoSection: document.getElementById('promotion-section'),
  promoList: document.getElementById('promotion-list'),
  menuList: document.getElementById('menu-list'),
  feedback: document.getElementById('menu-feedback'),
  count: document.getElementById('result-count'),
  error: document.getElementById('load-error'),
  empty: document.getElementById('empty-state'),
  emptyTitle: document.getElementById('empty-title'),
  emptyCopy: document.getElementById('empty-copy'),
};

function formatPrice(value) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(value);
}

function renderPromotions(items) {
  const promoted = items.filter((item) => item.promotion);
  elements.promoSection.hidden = promoted.length === 0;
  elements.promoList.innerHTML = promoted.map((item) => `
    <article class="promotion-card">
      <span class="promotion-art" aria-hidden="true">${item.art}</span>
      <div><h3>${item.name}</h3><p>${item.promotion} · ${formatPrice(item.promoPrice)}</p></div>
    </article>
  `).join('');
}

function renderMenu() {
  const scenario = elements.scenario.value;
  const query = elements.search.value.trim().toLocaleLowerCase('th-TH');
  const data = scenario === 'empty' ? [] : menuItems;
  const noPromotions = scenario === 'no-promotions';
  const items = data
    .map((item) => noPromotions ? { ...item, promotion: '', promoPrice: null } : item)
    .sort((a, b) => Number(Boolean(b.promotion)) - Number(Boolean(a.promotion)));

  elements.menuList.innerHTML = '';
  elements.promoList.innerHTML = '';
  elements.feedback.hidden = true;
  elements.empty.hidden = true;
  elements.error.hidden = scenario !== 'error';
  elements.menuList.hidden = scenario === 'error';
  elements.promoSection.hidden = scenario === 'error';
  elements.count.textContent = '';

  if (scenario === 'error') return;

  if (items.length === 0) {
    elements.promoSection.hidden = true;
    elements.emptyTitle.textContent = 'ขณะนี้ไม่มีรายการเครื่องดื่ม';
    elements.emptyCopy.textContent = 'โปรดลองตรวจสอบอีกครั้งภายหลัง';
    elements.empty.hidden = false;
    return;
  }

  renderPromotions(items);
  const filtered = items.filter((item) => item.name.toLocaleLowerCase('th-TH').includes(query));
  elements.count.textContent = `${filtered.length} รายการ`;

  if (filtered.length === 0) {
    elements.emptyTitle.textContent = 'ไม่พบเมนู';
    elements.emptyCopy.textContent = 'ลองค้นหาด้วยชื่อเครื่องดื่มอื่น';
    elements.empty.hidden = false;
    return;
  }

  elements.menuList.innerHTML = filtered.map((item) => {
    const isAvailable = item.status === 'open';
    const price = item.promotion ? `<span class="price-old">${formatPrice(item.price)}</span>${formatPrice(item.promoPrice)}` : formatPrice(item.price);
    const status = isAvailable ? '<span class="status-pill">เปิดขาย</span>' : '<span class="status-pill soldout">หมด</span>';
    return `
      <article class="drink-card${item.promotion ? ' is-promoted' : ''}" aria-label="${item.name}">
        <div class="drink-top"><span class="drink-art" aria-hidden="true">${item.art}</span>${status}</div>
        <h3>${item.name}</h3>
        <p class="drink-description">${item.description}</p>
        <div class="drink-bottom">
          <strong class="price-group">${price}</strong>
          <button class="button button-primary order-button" type="button" data-menu-id="${item.id}" ${isAvailable ? '' : 'disabled'}>
            ${isAvailable ? 'สั่งซื้อ' : 'หมด'}
          </button>
        </div>
      </article>
    `;
  }).join('');
}

elements.search.addEventListener('input', renderMenu);
elements.scenario.addEventListener('change', renderMenu);
document.getElementById('retry-load').addEventListener('click', () => {
  elements.scenario.value = 'normal';
  renderMenu();
});
elements.menuList.addEventListener('click', (event) => {
  if (!event.target.closest('.order-button')) return;
  elements.feedback.textContent = 'ระบบสั่งซื้อออนไลน์ยังไม่เปิดให้บริการ';
  elements.feedback.classList.remove('error');
  elements.feedback.hidden = false;
});

renderMenu();
