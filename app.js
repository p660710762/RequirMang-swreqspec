// Supports FR-01, FR-02, FR-05 and the data-model requirement in SPEC-MENU-001.
const menuItems = [
  {
    id: 1,
    name: 'ชาไทย',
    price: 45,
    description: 'ชาล้วนเข้มข้น กลิ่นหอมอ่อน ๆ เหมาะสำหรับมื้อเช้าแบบสดชื่น',
    status: 'open',
  },
  {
    id: 2,
    name: 'มัทฉะลาเต้',
    price: 75,
    description: 'นมข้นหวานผสมมัทฉะสูตรเข้มข้น พร้อมฟองนมเนียนละมุน',
    status: 'open',
  },
  {
    id: 3,
    name: 'น้ำส้มคั้น',
    price: 55,
    description: 'รสเปรี้ยวสดชื่นจากส้มคั้นบริสุทธิ์ ไม่หวานเกินไป',
    status: 'out_of_stock',
  },
  {
    id: 4,
    name: 'กาแฟเย็น',
    price: 65,
    description: 'กาแฟคั่วอ่อนเข้มข้น ดื่มคู่กับนมและน้ำเชื่อมแบบเรียบลื่น',
    status: 'open',
  },
];

function getCurrentMenuItems() {
  return typeof globalThis !== 'undefined' && 'menuItems' in globalThis && globalThis.menuItems
    ? globalThis.menuItems
    : menuItems;
}

const promotions = [
  {
    id: 1,
    title: 'ลด 10% สำหรับเมนูที่มีโปรโมชั่น',
    discountPercent: 10,
    status: 'active',
    startsAt: '2026-01-01T00:00:00Z',
    endsAt: '2099-12-31T23:59:59Z',
  },
  {
    id: 2,
    title: 'โปรโมชั่นพิเศษสัปดาห์นี้',
    discountPercent: 15,
    status: 'inactive',
    startsAt: '2026-01-01T00:00:00Z',
    endsAt: '2026-01-07T23:59:59Z',
  },
];

const menuPromotionLinks = [
  { menuId: 1, promotionId: 1, displayOrder: 1 },
  { menuId: 2, promotionId: 1, displayOrder: 2 },
];

function getMenuCatalog() {
  return {
    menuItems: getCurrentMenuItems(),
    promotions,
    menuPromotionLinks,
  };
}

function getActivePromotions() {
  return promotions.filter((promotion) => promotion.status === 'active');
}

function getPromotionForMenuItem(menuId) {
  const link = menuPromotionLinks.find((item) => item.menuId === menuId);
  if (!link) {
    return null;
  }

  return promotions.find(
    (promotion) => promotion.id === link.promotionId && promotion.status === 'active',
  ) || null;
}

function getMenuDetailsWithPromotion(items = getCurrentMenuItems()) {
  return items.map((item) => {
    const promotion = getPromotionForMenuItem(item.id);
    const discountedPrice = promotion
      ? Math.round(item.price * (1 - promotion.discountPercent / 100))
      : item.price;

    return {
      ...item,
      promotion,
      discountedPrice,
    };
  });
}

// Supports FR-01, FR-02 and FR-05 by exposing read-only menu and promotion payloads.
function readMenuApi() {
  const items = getMenuDetailsWithPromotion(getCurrentMenuItems());
  return {
    items: items.map((item) => ({
      ...item,
      promotion: item.promotion ? { ...item.promotion } : null,
    })),
  };
}

// Supports FR-03, ASM-01: match menu names by partial text without case sensitivity.
function searchMenuApi(keyword, items = getCurrentMenuItems()) {
  const normalizedKeyword = String(keyword ?? '').trim().toLowerCase();
  const filteredItems = getMenuDetailsWithPromotion(items).filter((item) => {
    if (!normalizedKeyword) {
      return true;
    }

    return item.name.toLowerCase().includes(normalizedKeyword);
  });

  return {
    items: filteredItems.map((item) => ({
      ...item,
      promotion: item.promotion ? { ...item.promotion } : null,
    })),
    message: filteredItems.length === 0 ? 'ไม่พบเมนู' : null,
  };
}

// Supports FR-05 by returning only promotions that are currently active.
function readActivePromotionsApi() {
  return getActivePromotions().map((promotion) => ({ ...promotion }));
}

const menuListElement = document.getElementById('menu-list');
const searchInput = document.querySelector ? document.querySelector('#menu-search') : null;

const statusLabels = {
  open: 'เปิดขาย',
  out_of_stock: 'หมด',
};

function formatPrice(value) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(value);
}

// Supports FR-05 by sorting promoted items to the top and rendering active promotion summaries.
function renderPromotionSection() {
  const activePromotions = getActivePromotions();
  if (!activePromotions.length) {
    return '';
  }

  return `
    <section class="promotion-section" aria-label="โปรโมชั่น">
      <h2>โปรโมชั่น</h2>
      <ul class="promotion-list">
        ${activePromotions
          .map(
            (promotion) => `
              <li class="promotion-item">
                <span>${promotion.title}</span>
                <strong>ลด ${promotion.discountPercent}%</strong>
              </li>
            `,
          )
          .join('')}
      </ul>
    </section>
  `;
}

function sortMenuItemsWithPromotion(items) {
  return [...getMenuDetailsWithPromotion(items)].sort((left, right) => {
    const leftPriority = left.promotion ? 1 : 0;
    const rightPriority = right.promotion ? 1 : 0;
    return rightPriority - leftPriority;
  });
}

// Supports FR-01, FR-02 and FR-05 by representing menu and promotion relations as a catalog.
function renderMenu(items, options = {}) {
  const emptyMessage = options.emptyMessage || 'ขณะนี้ไม่มีรายการเครื่องดื่ม';
  const sortedItems = items ? sortMenuItemsWithPromotion(items) : [];

  if (!sortedItems || sortedItems.length === 0) {
    menuListElement.innerHTML = `${renderPromotionSection()}<p>${emptyMessage}</p>`;
    return;
  }

  menuListElement.innerHTML = `${renderPromotionSection()}${sortedItems
    .map((item) => {
      const isAvailable = item.status === 'open';
      const statusClass = isAvailable ? 'status-available' : 'status-soldout';
      const buttonLabel = isAvailable ? 'สั่งซื้อ' : 'หมด';
      const displayPrice = item.discountedPrice ?? item.price;
      const promotionBadge = item.promotion
        ? `<span class="promotion-badge">ลด ${item.promotion.discountPercent}%</span>`
        : '';

      return `
        <article class="menu-item" aria-label="${item.name}">
          <div class="menu-item__meta">
            <h2>${item.name}</h2>
            <span class="status-badge ${statusClass}">${statusLabels[item.status]}</span>
          </div>

          <p class="menu-item__description">${item.description}</p>

          <div class="menu-item__footer">
            <strong class="price">${formatPrice(displayPrice)}</strong>
            ${promotionBadge}
            <button type="button" class="order-button" ${isAvailable ? '' : 'disabled'}>
              ${buttonLabel}
            </button>
          </div>
        </article>
      `;
    })
    .join('')}`;
}

// Supports FR-03 by updating the list while the user types a partial menu name.
function applyMenuSearch(query = '') {
  const { items, message } = searchMenuApi(query, getCurrentMenuItems());
  renderMenu(items, { emptyMessage: message || 'ขณะนี้ไม่มีรายการเครื่องดื่ม' });
}

// Supports FR-01 by loading menu items from the read-only API and rendering the empty-state or list state.
// Supports FR-01, FR-05 and UC-01 Exception Flow 2a by surfacing a load failure instead of returning a fake success payload.
function loadMenuPageData() {
  try {
    const { items } = readMenuApi();
    const promotions = readActivePromotionsApi();
    return {
      ok: true,
      items,
      promotions,
      errorMessage: null,
    };
  } catch (error) {
    return {
      ok: false,
      items: [],
      promotions: [],
      errorMessage: 'ไม่สามารถโหลดข้อมูลได้',
    };
  }
}

// Supports UC-01 Exception Flow 2a by rendering an explicit retry action without keeping stale successful data on-screen.
function renderRetryableError(errorMessage) {
  menuListElement.innerHTML = `
    <div class="menu-error" role="alert">
      <p>${errorMessage}</p>
      <button type="button" class="retry-button">ลองใหม่</button>
    </div>
  `;
}

// Supports UC-01 Exception Flow 2a by rendering the error state without keeping stale successful data on screen.
function loadMenuFromApi() {
  const result = loadMenuPageData();

  if (!result.ok) {
    renderRetryableError(result.errorMessage);
    return result;
  }

  renderMenu(result.items);
  return result;
}

if (menuListElement && typeof menuListElement.addEventListener === 'function') {
  menuListElement.addEventListener('click', (event) => {
    const target = event.target;
    if (target && typeof target.closest === 'function' && target.closest('.retry-button')) {
      loadMenuFromApi();
    }
  });
}

if (searchInput && typeof searchInput.addEventListener === 'function') {
  searchInput.addEventListener('input', (event) => {
    applyMenuSearch(event.target.value);
  });
}

renderMenu(menuItems);
