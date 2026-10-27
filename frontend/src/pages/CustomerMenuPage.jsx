import { useEffect, useMemo, useState } from 'react';

const SAMPLE_MENU = [
  {
    id: 1,
    name: 'ชาไทย',
    price: 45,
    description: 'ชาล้วนเข้มข้น กลิ่นหอมอ่อน ๆ เหมาะสำหรับมื้อเช้าแบบสดชื่น',
    status: 'open',
    image_url:
      'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=900&q=80',
    promotion: { id: 1, title: 'ลด 10%', discountPercent: 10, status: 'active' },
  },
  {
    id: 2,
    name: 'มัทฉะลาเต้',
    price: 75,
    description: 'นมข้นหวานผสมมัทฉะสูตรเข้มข้น พร้อมฟองนมเนียนละมุน',
    status: 'open',
    image_url:
      'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=900&q=80',
    promotion: { id: 1, title: 'ลด 10%', discountPercent: 10, status: 'active' },
  },
  {
    id: 3,
    name: 'น้ำส้มคั้น',
    price: 55,
    description: 'รสเปรี้ยวสดชื่นจากส้มคั้นบริสุทธิ์ ไม่หวานเกินไป',
    status: 'sold_out',
    image_url:
      'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 4,
    name: 'กาแฟเย็น',
    price: 65,
    description: 'กาแฟคั่วอ่อนเข้มข้น ดื่มคู่กับนมและน้ำเชื่อมแบบเรียบลื่น',
    status: 'open',
    image_url:
      'https://images.unsplash.com/photo-1497636567773-8a2a14c6d28e?auto=format&fit=crop&w=900&q=80',
  },
];

const SAMPLE_PROMOTIONS = [
  { id: 1, title: 'ลด 10% สำหรับเมนูที่มีโปรโมชั่น', discountPercent: 10, status: 'active' },
  { id: 2, title: 'โปรโมชั่นพิเศษสัปดาห์นี้', discountPercent: 15, status: 'inactive' },
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
  const discount = Number(item.price ?? 0) * (Number(item.promotion.discountPercent ?? 0) / 100);
  return Math.max(0, Number(item.price ?? 0) - discount);
}

function sortMenuItems(items) {
  return [...items].sort((left, right) => {
    const leftPriority = left.promotion && left.promotion.status === 'active' ? 1 : 0;
    const rightPriority = right.promotion && right.promotion.status === 'active' ? 1 : 0;
    return rightPriority - leftPriority || left.name.localeCompare(right.name, 'th');
  });
}

export default function CustomerMenuPage() {
  const [menuItems, setMenuItems] = useState(SAMPLE_MENU);
  const [promotions, setPromotions] = useState(SAMPLE_PROMOTIONS);
  const [query, setQuery] = useState('');
  const [loadState, setLoadState] = useState('ready');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pendingSelection, setPendingSelection] = useState(null);
  const [orderItems, setOrderItems] = useState([]);

  const activePromotions = useMemo(
    () => promotions.filter((promotion) => promotion.status === 'active'),
    [promotions],
  );

  const loadMenu = async () => {
    setLoadState('loading');

    const endpoints = [
      { menu: '/api/menu', promotions: '/api/promotions/active' },
      { menu: '/api/admin/menu', promotions: '/api/promotions/active' },
    ];

    let loadedMenu = SAMPLE_MENU;
    let loadedPromotions = SAMPLE_PROMOTIONS;

    for (const routeSet of endpoints) {
      try {
        const menuResponse = await fetch(routeSet.menu);
        if (!menuResponse.ok) throw new Error('Menu request failed');
        const menuPayload = await menuResponse.json();
        if (Array.isArray(menuPayload)) {
          loadedMenu = menuPayload;
        } else if (Array.isArray(menuPayload.items)) {
          loadedMenu = menuPayload.items;
        }

        const promoResponse = await fetch(routeSet.promotions);
        if (promoResponse.ok) {
          const promoPayload = await promoResponse.json();
          if (Array.isArray(promoPayload)) {
            loadedPromotions = promoPayload;
          }
        }

        setMenuItems(loadedMenu);
        setPromotions(loadedPromotions);
        setLoadState('ready');
        return;
      } catch {
        // Try the next endpoint; if all fail, keep the sample fallback below.
      }
    }

    setMenuItems(SAMPLE_MENU);
    setPromotions(SAMPLE_PROMOTIONS);
    setLoadState('error');
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
      setPendingSelection(item);
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
    if (pendingSelection) {
      setOrderItems((current) => {
        const exists = current.find((entry) => entry.id === pendingSelection.id);
        if (exists) return current;
        return [...current, { ...pendingSelection, price: getDiscountedPrice(pendingSelection) }];
      });
      setPendingSelection(null);
    }
  };

  const handleCancelLogin = () => {
    setPendingSelection(null);
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

        {pendingSelection && (
          <div className="customer-page__banner" role="alert">
            <div>
              <strong>กรุณาเข้าสู่ระบบก่อนเพิ่ม {pendingSelection.name} เข้า Order</strong>
              <p>ระบบจะเก็บเมนูที่เลือกไว้และนำคุณกลับไปยัง UC-02 ก่อนดำเนินการต่อ</p>
            </div>
            <div className="customer-page__banner-actions">
              <button type="button" className="primary-button" onClick={handleLoginSuccess}>เข้าสู่ระบบ</button>
              <button type="button" className="secondary-button" onClick={handleCancelLogin}>ยกเลิก</button>
            </div>
          </div>
        )}

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
                  <strong>ลด {promotion.discountPercent}%</strong>
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
                const cardImage = item.image_url || item.imageUrl || item.image || null;

                return (
                  <article key={item.id} className="menu-card">
                    {cardImage ? (
                      <img className="menu-card__image" src={cardImage} alt={item.name} />
                    ) : (
                      <div className="menu-card__mark menu-card__mark--image" aria-hidden="true">
                        {item.name.slice(0, 1)}
                      </div>
                    )}

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
