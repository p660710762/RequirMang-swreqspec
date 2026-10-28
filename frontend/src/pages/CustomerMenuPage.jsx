import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const SAMPLE_MENU = [
  {
    id: 1,
    name: 'ชาไทย',
    price: 45,
    description: 'ชาล้วนเข้มข้น กลิ่นหอมอ่อน ๆ เหมาะสำหรับมื้อเช้าแบบสดชื่น',
    status: 'open',
    image_url:
      'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=900&q=80',
    promotion: { id: 1, title: 'ลด 10 บาท', discount_value: 10, status: 'active' },
  },
  {
    id: 2,
    name: 'มัทฉะลาเต้',
    price: 75,
    description: 'นมข้นหวานผสมมัทฉะสูตรเข้มข้น พร้อมฟองนมเนียนละมุน',
    status: 'open',
    image_url:
      'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=900&q=80',
    promotion: { id: 1, title: 'ลด 10 บาท', discount_value: 10, status: 'active' },
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

// รองรับ FR-02: เริ่ม UC-03 หลัง Login โดยไม่เพิ่มเมนูจาก UC-01 เข้า Order
export default function CustomerMenuPage({
  isLoggedIn,
  onLoginRequired,
  onContinueToOrder,
  onOpenLogin,
  isActive = true,
}) {
  const [menuItems, setMenuItems] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [query, setQuery] = useState('');
  const [loadState, setLoadState] = useState('ready');
  const requestGeneration = useRef(0);

  const activePromotions = useMemo(
    () => promotions.filter((promotion) => promotion.status === 'active'),
    [promotions],
  );

  const loadMenu = useCallback(async () => {
    const generation = ++requestGeneration.current;
    setLoadState('loading');

    try {
      const menuResponse = await fetch('/api/menu');
      if (generation !== requestGeneration.current) return;
      if (!menuResponse.ok) throw new Error('Menu request failed');
      const menuPayload = await menuResponse.json();
      if (generation !== requestGeneration.current) return;
      const loadedMenu = Array.isArray(menuPayload)
        ? menuPayload
        : menuPayload.items;
      if (!Array.isArray(loadedMenu)) throw new Error('Invalid menu response');

      const promoResponse = await fetch('/api/promotions/active');
      if (generation !== requestGeneration.current) return;
      if (!promoResponse.ok) throw new Error('Promotion request failed');
      const promoPayload = await promoResponse.json();
      if (generation !== requestGeneration.current) return;
      if (!Array.isArray(promoPayload)) throw new Error('Invalid promotion response');

      setMenuItems(loadedMenu);
      setPromotions(promoPayload);
      setLoadState('ready');
    } catch {
      if (generation !== requestGeneration.current) return;
      setMenuItems([]);
      setPromotions([]);
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    if (!isActive) {
      requestGeneration.current += 1;
      return undefined;
    }

    loadMenu();
    return () => {
      requestGeneration.current += 1;
    };
  }, [isActive, loadMenu]);

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const items = sortMenuItems(menuItems);
    if (!keyword) return items;
    return items.filter((item) => item.name.toLowerCase().includes(keyword));
  }, [menuItems, query]);

  const handleContinueToOrder = (menuId = null) => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }

    onContinueToOrder(menuId);
  };

  const handleOrderClick = (item) => {
    if (item.status === 'sold_out' || item.status === 'out_of_stock') return;

    handleContinueToOrder(item.menu_id ?? item.id);
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
            {isLoggedIn ? (
              <span className="customer-page__login-toggle">Logged in</span>
            ) : (
              <button type="button" className="customer-page__login-toggle" onClick={onOpenLogin}>
                เข้าสู่ระบบ
              </button>
            )}
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
          <p className="customer-page__state">
            {query.trim() ? 'ไม่พบเมนู' : 'ขณะนี้ไม่มีรายการเครื่องดื่ม'}
          </p>
        )}

        {loadState === 'ready' && filteredItems.length > 0 && (
          <div className="customer-page__content">
            <div className="customer-page__grid">
              {filteredItems.map((item) => {
                const isSoldOut = item.status === 'sold_out' || item.status === 'out_of_stock';
                const discountedPrice = getDiscountedPrice(item);
                const hasPromotion = item.promotion && item.promotion.status === 'active';
                const cardImage = item.image_url || item.imageUrl || item.image || null;

                return (
                  <article key={item.menu_id ?? item.id} className="menu-card">
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
              <button type="button" className="primary-button customer-page__checkout-button" onClick={handleContinueToOrder}>
                ดำเนินการต่อไปยัง UC-03
              </button>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
