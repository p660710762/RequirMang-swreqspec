import { useEffect, useMemo, useState } from 'react';

const SAMPLE_MENU = [
  {
    id: 1,
    name: 'ชาไทย',
    price: 45,
    description: 'ชาล้วนเข้มข้น กลิ่นหอมอ่อน ๆ เหมาะสำหรับมื้อเช้าแบบสดชื่น',
    status: 'open',
    promotion: { id: 1, title: 'ลด 10 บาท', discount_value: 10, status: 'active' },
  },
  {
    id: 2,
    name: 'มัทฉะลาเต้',
    price: 75,
    description: 'นมข้นหวานผสมมัทฉะสูตรเข้มข้น พร้อมฟองนมเนียนละมุน',
    status: 'open',
    promotion: { id: 1, title: 'ลด 10 บาท', discount_value: 10, status: 'active' },
  },
  {
    id: 3,
    name: 'น้ำส้มคั้น',
    price: 55,
    description: 'รสเปรี้ยวสดชื่นจากส้มคั้นบริสุทธิ์ ไม่หวานเกินไป',
    status: 'sold_out',
  },
  {
    id: 4,
    name: 'กาแฟเย็น',
    price: 65,
    description: 'กาแฟคั่วอ่อนเข้มข้น ดื่มคู่กับนมและน้ำเชื่อมแบบเรียบลื่น',
    status: 'open',
  },
];

const SAMPLE_PROMOTIONS = [
  { id: 1, title: 'ลด 10 บาท สำหรับเมนูที่มีโปรโมชั่น', discount_value: 10, status: 'active' },
  { id: 2, title: 'โปรโมชั่นพิเศษสัปดาห์นี้', discount_value: 15, status: 'inactive' },
];

function formatPrice(value) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function getDiscountedPrice(item) {
  if (!item) return 0;
  if (!item.promotion || item.promotion.status !== 'active') return Number(item.price ?? 0);
  const discount = Number(item.promotion.discount_value ?? 0);
  return Math.max(0, Number(item.price ?? 0) - discount);
}

function sortMenuItems(items) {
  return [...items].sort((left, right) => {
    const leftPriority = left.promotion && left.promotion.status === 'active' ? 1 : 0;
    const rightPriority = right.promotion && right.promotion.status === 'active' ? 1 : 0;
    return rightPriority - leftPriority || left.name.localeCompare(right.name, 'th');
  });
}

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState(SAMPLE_MENU);
  const [promotions, setPromotions] = useState(SAMPLE_PROMOTIONS);
  const [query, setQuery] = useState('');
  const [loadState, setLoadState] = useState('ready');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [orderItems, setOrderItems] = useState([]);

  const activePromotions = useMemo(
    () => promotions.filter((promotion) => promotion.status === 'active'),
    [promotions],
  );

  const loadMenu = async () => {
    setLoadState('loading');
    try {
      const response = await fetch('/api/menu');
      if (!response.ok) {
        throw new Error('Menu request failed');
      }
      const payload = await response.json();
      if (Array.isArray(payload)) {
        setMenuItems(payload);
      } else if (Array.isArray(payload.items)) {
        setMenuItems(payload.items);
      } else {
        setMenuItems(SAMPLE_MENU);
      }

      const promoResponse = await fetch('/api/promotions/active');
      if (promoResponse.ok) {
        const promoPayload = await promoResponse.json();
        if (Array.isArray(promoPayload)) {
          setPromotions(promoPayload);
        }
      }
      setLoadState('ready');
    } catch {
      setMenuItems(SAMPLE_MENU);
      setPromotions(SAMPLE_PROMOTIONS);
      setLoadState('error');
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const items = sortMenuItems(menuItems);
    if (!keyword) return items;
    return items.filter((item) => item.name.toLowerCase().includes(keyword));
  }, [menuItems, query]);

  const handleOrderClick = (item) => {
    if (item.status === 'sold_out') return;

    if (!isLoggedIn) {
      return;
    }

    setOrderItems((current) => {
      const exists = current.find((entry) => entry.id === item.id);
      if (exists) return current;
      return [...current, { ...item, price: getDiscountedPrice(item) }];
    });
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleCancelLogin = () => {
  };

  return (
    <main className="customer-page">
      <section className="customer-page__shell">
        <header className="customer-page__header">
          <div>
            <p className="customer-page__eyebrow">OWL CHA</p>
            <h1>เมนูเครื่องดื่ม</h1>
          </div>
          <div className="customer-page__meta">
            <span>{filteredItems.length} รายการ</span>
            <button type="button" className="customer-page__login-toggle" onClick={() => setIsLoggedIn((value) => !value)}>
              {isLoggedIn ? 'Logged in' : 'เข้าสู่ระบบ'}
            </button>
          </div>
        </header>

        <label className="customer-page__search">
          <span>ค้นหาเมนู</span>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหาชื่อเมนู เช่น ชา"
          />
        </label>

        {loadState === 'loading' && <p className="customer-page__state" role="status">กำลังโหลดเมนูและโปรโมชั่น...</p>}

        {loadState === 'error' && (
          <div className="customer-page__state customer-page__state--error" role="alert">
            <p>ไม่สามารถโหลดข้อมูลได้</p>
            <button type="button" onClick={loadMenu}>ลองใหม่</button>
          </div>
        )}

        {activePromotions.length > 0 && (
          <section className="customer-page__promo" aria-label="โปรโมชั่นที่กำลังใช้งาน">
            <h2>โปรโมชั่น</h2>
            <div className="customer-page__promo-list">
              {activePromotions.map((promotion) => (
                <div key={promotion.id} className="promo-badge">
                  <span>{promotion.title}</span>
                  <strong>ลด {formatPrice(promotion.discount_value)}</strong>
                </div>
              ))}
            </div>
          </section>
        )}

        {loadState === 'ready' && filteredItems.length === 0 && (
          <p className="customer-page__state">ไม่พบเมนู</p>
        )}

        {loadState === 'ready' && filteredItems.length > 0 && (
          <div className="customer-page__content">
            <div className="customer-page__grid">
              {filteredItems.map((item) => {
                const isSoldOut = item.status === 'sold_out';
                const discountedPrice = getDiscountedPrice(item);
                const hasPromotion = item.promotion && item.promotion.status === 'active';

                return (
                  <article key={item.id} className="menu-card">
                    <div className="menu-card__head">
                      <div className="menu-card__mark" aria-hidden="true">{item.name.slice(0, 1)}</div>
                      <div>
                        <h2>{item.name}</h2>
                        <p className="menu-card__meta">
                          {isSoldOut ? 'หมด' : 'เปิดขาย'}
                          {hasPromotion && ' • มีโปรโมชั่น'}
                        </p>
                      </div>
                    </div>

                    <p className="menu-card__description">{item.description}</p>

                    <div className="menu-card__price-row">
                      <span className="menu-card__price">{formatPrice(discountedPrice)}</span>
                      {hasPromotion && <span className="menu-card__original">{formatPrice(item.price)}</span>}
                    </div>

                    <button
                      type="button"
                      className="menu-card__button"
                      disabled={isSoldOut}
                      onClick={() => handleOrderClick(item)}
                    >
                      {isSoldOut ? 'หมด' : 'สั่งซื้อ'}
                    </button>
                  </article>
                );
              })}
            </div>

            <aside className="customer-page__order">
              <h3>Order</h3>
              {orderItems.length === 0 ? (
                <p className="customer-page__empty-order">ยังไม่มีเมนูใน Order</p>
              ) : (
                <ul className="customer-page__order-list">
                  {orderItems.map((item) => (
                    <li key={item.id}>
                      <span>{item.name}</span>
                      <strong>{formatPrice(item.price)}</strong>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" className="primary-button customer-page__checkout-button" disabled={orderItems.length === 0}>
                ดำเนินการต่อไปยัง UC-03
              </button>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
