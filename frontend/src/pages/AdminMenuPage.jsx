import { useEffect, useState } from 'react';

import { createMenuItem, getMenuItems } from '../api/client.js';
import MenuForm from '../components/MenuForm.jsx';
import MenuEditPanel from '../components/MenuEditPanel.jsx';
import StatusToggle from '../components/StatusToggle.jsx';

const STATUS_LABELS = {
  open: 'เปิดขาย',
  sold_out: 'หมด',
};

const STATUS_DISPLAY_LABELS = {
  open: 'พร้อมขาย',
  sold_out: 'หมด',
};

function formatPrice(price) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 2,
  }).format(price);
}

function displayPrice(item) {
  const discount = Number(item.promotion?.discount_value);
  return Number.isFinite(discount) ? item.price - discount : item.price;
}

function MenuMark({ name, imageUrl }) {
  if (imageUrl) {
    return <img className="menu-row__image" src={imageUrl} alt="" />;
  }
  return <span className="menu-row__mark" aria-hidden="true">{name.slice(0, 1)}</span>;
}

// FR-42: show menu records and related fields returned by the Admin API.
export default function AdminMenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [isCreateFormVisible, setIsCreateFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // FR-43, FR-47: add the API response to the current menu list after saving.
  async function handleCreateMenu(menuItem) {
    const createdItem = await createMenuItem(menuItem);
    setMenuItems((current) => [createdItem, ...current]);
    return createdItem;
  }

  // FR-44, FR-47: persist edited menu details and replace the item with the latest API response.
  async function handleUpdateMenu(menuId, changes) {
    const response = await fetch(`/api/admin/menu/${menuId}`, {
      method: 'PATCH',
      headers: { 'X-User-Id': 'admin', 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.detail || `Menu update failed (${response.status})`);
    }

    const updatedItem = await response.json();
    setMenuItems((current) => current.map((item) => (
      item.menu_id === menuId ? updatedItem : item
    )));
    setEditingItem(null);
    return updatedItem;
  }

  // FR-45, FR-48: save a status transition and replace the item with the latest API response.
  async function handleStatusChange(menuId, status) {
    const response = await fetch(`/api/admin/menu/${menuId}/status`, {
      method: 'PATCH',
      headers: { 'X-User-Id': 'admin', 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.detail || `Menu status update failed (${response.status})`);
    }
    const updatedItem = await response.json();
    setMenuItems((current) => current.map((item) => (
      item.menu_id === menuId ? updatedItem : item
    )));
  }

  useEffect(() => {
    let isCurrent = true;

    getMenuItems()
      .then((items) => {
        if (isCurrent) {
          setMenuItems(items);
          setLoadState('ready');
        }
      })
      .catch(() => {
        if (isCurrent) setLoadState('error');
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <main className="admin-page">
      <section className="page-content" aria-labelledby="page-title">
        <div className="page-heading">
          <h1 id="page-title">จัดการเมนู / ราคา / สถานะ</h1>
        </div>

        {loadState === 'loading' && (
          <p className="page-state" role="status">กำลังโหลดรายการเมนู</p>
        )}

        {loadState === 'error' && (
          <p className="page-state page-state--error" role="alert">
            ไม่สามารถโหลดรายการเมนูได้
          </p>
        )}

        {loadState === 'ready' && menuItems.length === 0 && (
          <p className="page-state" role="status">ไม่มีรายการเมนู</p>
        )}

        {loadState === 'ready' && menuItems.length > 0 && (
          <section className="menu-panel" aria-label="รายการเมนู">
            <div className="menu-list">
              {menuItems.map((item) => (
                <article className="menu-row" key={item.menu_id}>
                  <div className="menu-row__product">
                    <MenuMark name={item.name} imageUrl={item.image_url} />
                    <div>
                      <h2>{item.name}</h2>
                      <p className="menu-row__summary">
                        {formatPrice(displayPrice(item))}
                        {item.promotion?.discount_value != null && ` จาก ${formatPrice(item.price)}`}
                        {' · '}
                        {STATUS_DISPLAY_LABELS[item.status] ?? item.status}
                      </p>
                    </div>
                  </div>
                  {item.description && (
                    <p className="menu-row__description">{item.description}</p>
                  )}
                  <div className="menu-row__actions">
                    <button className="row-button row-button--edit" type="button" onClick={() => setEditingItem(item)}>แก้ไข</button>
                    <StatusToggle
                      status={item.status}
                      onChange={(status) => handleStatusChange(item.menu_id, status)}
                    />
                  </div>
                  <span className={`status-badge status-badge--${item.status} sr-only`}>
                    {STATUS_LABELS[item.status] ?? item.status}
                  </span>
                  {editingItem?.menu_id === item.menu_id && (
                    <MenuEditPanel
                      menuItem={item}
                      onSubmit={(changes) => handleUpdateMenu(item.menu_id, changes)}
                      onCancel={() => setEditingItem(null)}
                    />
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        <button
          className="add-menu-button"
          type="button"
          onClick={() => setIsCreateFormVisible((visible) => !visible)}
        >
          + เพิ่มเมนูตัวอย่าง
        </button>

        {isCreateFormVisible && (
          <MenuForm
            onSubmit={handleCreateMenu}
            onCancel={() => setIsCreateFormVisible(false)}
          />
        )}
      </section>
    </main>
  );
}