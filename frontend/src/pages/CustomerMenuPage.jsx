import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const MENU_IMAGES = {
  ชานมไต้หวัน:
    'https://images-ext-1.discordapp.net/external/0aCCY_6ziq2qKpjZeyW9nYufczvYmLmHLNic_4jifuc/https/www.bluemochatea.com/wp-content/uploads/2020/03/%25E0%25B8%258A%25E0%25B8%25B2%25E0%25B9%2580%25E0%25B8%2582%25E0%25B8%25B5%25E0%25B8%25A2%25E0%25B8%25A7%25E0%25B8%259B%25E0%25B8%25B1%25E0%25B8%2594%25E0%25B9%2580%25E0%25B8%259B%25E0%25B9%2588%25E0%25B8%25B2.jpg?format=webp',
  ชาแอปเปิ้ล:
    'https://media.discordapp.net/attachments/1555975574030123132/1565084510905958521/coconut_coffee_in_cafe_1024x1024.png?ex=6ae39e09&is=6ae24c89&hm=332a1454b095f8927d405c744a61d359c34674ea2542939131c803ed3d6254bc&=&format=webp&quality=lossless',
  ชานมบราวน์ชูก้า:
    'https://media.discordapp.net/attachments/1555975574030123132/1565084188468711636/9qouf4swhzge.png?ex=6ae39dbc&is=6ae24c3c&hm=8ef1fd3eeee6540fdc8f20893a02375e43f83f7053bfd3df423e5d84029724f7&=&format=webp&quality=lossless',
  นมสด:
    'https://media.discordapp.net/attachments/1555975574030123132/1565083139968204860/BANNER_E0B884E0B8B2E0B89BE0B8B9E0B88AE0B8B4E0B982E0B899E0B98820E0B980E0B8A2E0B987E0B89920540x40020px.png?ex=6ae39cc2&is=6ae24b42&hm=53d78096820e595cb2b308ebb622581abde873d952719a560548f3afce36b940&=&format=webp&quality=lossless',
  ชาไทย:
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzxW3AItEUHEaBKRkHRJLAfaSVh9v9VuoPgX5-MCl4Xc1zl3-chHMvp8Al&s=10',
  โกโก้:
    'https://media.discordapp.net/attachments/1555975574030123132/1565083905525284864/images.png?ex=6ae39d78&is=6ae24bf8&hm=02db45ab96c5695b474f7f8486c41dfc54b2afab382e2cb81e58042d04fdfe82&=&format=webp&quality=lossless',
  ชานมไต้หวัน:
    'https://media.discordapp.net/attachments/1555975574030123132/1565086191597002802/image.png?ex=6ae39f99&is=6ae24e19&hm=c05e6aee069400af465fb1e4a7bdd7d43957d4aef62995b199730a5f728192c2&=&format=webp&quality=lossless&width=768&height=1024',
  ชาแอปเปิ้ล:
    'https://images-ext-1.discordapp.net/external/hHIzEQ5swfgEtN6s-H5HcSp4ST5T7XTMi7Aon82-kcA/https/img.wongnai.com/p/256x256/2022/09/29/0c9bbc0a782b4c23924dcdc4f8541ee3.jpg?format=webp',
  ชานมบราวน์ชูก้า:
    'https://media.discordapp.net/attachments/1555975574030123132/1565088727708074106/images.png?ex=6ae3a1f6&is=6ae25076&hm=dc7fab010ec9328a34c7c5ab7d1e2671f4acf5eb612b6e6e3433ebfaa1fe74ed&=&format=webp&quality=lossless',
  นมสด:
    'https://images-ext-1.discordapp.net/external/wpi1wMKa7QQm9WrwQ72bFqnhFcBZWmcEWpjBYGJ76Rs/%3Fq%3Dtbn%3AANd9GcTx_VZwMDbs1cqb11g9QkoOkkMVuAZfKIsBRZMpD3yQEa3O7sKmXvIzsnzH%26s%3D10/https/encrypted-tbn0.gstatic.com/images?format=webp',
  โกโก้:
    'https://media.discordapp.net/attachments/1555975574030123132/1565087819905507529/image.png?ex=6ae3a11e&is=6ae24f9e&hm=9384d376acdd3111524224d105d59cbd101136ce0e403bf6e0186076e7e5e6d3&=&format=webp&quality=lossless&width=1024&height=1024',
  ชาเขียว:
    'https://media.discordapp.net/attachments/1555975574030123132/1565085730504441887/images.png?ex=6ae39f2c&is=6ae24dac&hm=120adc6d44ad0699dcfacb0d5d66d181810a2816d6c8d401307909d97798c606&=&format=webp&quality=lossless',
};

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
            <p className="customer-page__eyebrow">OWL CHA / FRESHLY BREWED</p>
            <h1>เมนูเครื่องดื่ม</h1>
            <p className="customer-page__intro">
              เลือกเครื่องดื่มแก้วโปรด แล้วเริ่มต้นช่วงเวลาดี ๆ ของคุณ
            </p>
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
            <h2>โปรโมชัน</h2>
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
                const cardImage = item.image_url || item.imageUrl || item.image || MENU_IMAGES[item.name];

                return (
                  <article key={item.menu_id ?? item.id} className="menu-card">
                    {cardImage ? (
                      <img className="menu-card__image" src={cardImage} alt={item.name} />
                    ) : (
                      <div className="menu-card__image menu-card__image--placeholder" aria-hidden="true" />
                    )}

                    <div className="menu-card__head">
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
            <button
              type="button"
              className="sr-only"
              onClick={handleContinueToOrder}
            >
              ดำเนินการต่อไปยัง UC-03
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
