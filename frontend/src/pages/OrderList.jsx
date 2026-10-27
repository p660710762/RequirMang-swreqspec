import { useEffect, useState } from 'react';

import { getOrders } from '../api/client.js';

const ORDER_STATUS_STEPS = [
  { code: 'PENDING_ACCEPT', label: 'รอรับ Order' },
  { code: 'PREPARING', label: 'กำลังเตรียม' },
  { code: 'READY_FOR_PICKUP', label: 'พร้อมรับสินค้า' },
  { code: 'PICKED_UP', label: 'รับสินค้าแล้ว' },
];

// FR-23: format the saved creation time shown in each Order summary.
function formatOrderDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

// FR-22: format the saved item and Order prices shown in the summary.
function formatOrderTotal(value) {
  if (value === null || value === undefined) return null;
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 2,
  }).format(value);
}

// FR-19, FR-22, and FR-23: show owner-scoped Orders, saved items, and status progression.
export default function OrderListPage() {
  const [orders, setOrders] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isCurrent = true;

    getOrders()
      .then((result) => {
        if (isCurrent) {
          setOrders(result);
          setLoadState('ready');
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setErrorMessage(error instanceof Error ? error.message : String(error));
          setLoadState('error');
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <main className="tracking-page">
      <header className="tracking-page__header">
        <div>
          <p className="tracking-page__eyebrow">ORDER STATUS</p>
          <h1 id="order-list-title">ติดตามคำสั่งซื้อ</h1>
          <p className="tracking-page__subtitle">รายการ Order ของคุณ</p>
        </div>
      </header>

      <section className="tracking-panel" aria-labelledby="tracking-list-title">
        <h2 id="tracking-list-title">รายการคำสั่งซื้อ</h2>

        {loadState === 'loading' && (
          <p className="tracking-state" role="status">กำลังโหลดรายการ Order</p>
        )}

        {loadState === 'error' && (
          <p className="tracking-state tracking-state--error" role="alert">
            ไม่สามารถโหลดรายการ Order ได้: {errorMessage}
          </p>
        )}

        {loadState === 'ready' && orders.length === 0 && (
          <p className="tracking-state" role="status">ไม่มีรายการ Order</p>
        )}

        {loadState === 'ready' && orders.length > 0 && (
          <div className="tracking-order-list" aria-label="รายการ Order">
            {orders.map((order) => {
              const currentStepIndex = ORDER_STATUS_STEPS.findIndex(
                (step) => step.code === order.status,
              );
              const currentStep = ORDER_STATUS_STEPS[currentStepIndex];

              return (
                <article className="tracking-order-card" key={order.order_id}>
                  <header className="tracking-order-card__header">
                    <div>
                      <h3>
                        {order.items?.length
                          ? order.items.map((item) => item.menu_name).join(', ')
                          : 'รายการสินค้า'}
                      </h3>
                      <p className="tracking-order-card__id">Order: {order.order_id}</p>
                      {order.created_at && (
                        <p className="tracking-order-card__date">
                          วันที่สั่ง: {formatOrderDate(order.created_at)}
                        </p>
                      )}
                    </div>
                    <span className="tracking-status-badge">
                      {currentStep?.label ?? order.status}
                    </span>
                  </header>

                  <div className="tracking-order-card__summary">
                    {order.items?.map((item, index) => (
                      <p key={`${item.menu_name}-${index}`}>
                        {item.menu_name} × {item.quantity} · {formatOrderTotal(item.unit_price)}
                      </p>
                    ))}
                    {order.total_amount !== null && order.total_amount !== undefined && (
                      <p className="tracking-order-card__total">
                        ยอดรวม {formatOrderTotal(order.total_amount)}
                      </p>
                    )}
                  </div>

                  <ol
                    className="tracking-progress"
                    aria-label={`ความคืบหน้าสถานะ Order ${order.order_id}`}
                  >
                    {ORDER_STATUS_STEPS.map((step, index) => {
                      const isComplete = currentStepIndex >= 0 && index <= currentStepIndex;
                      const isCurrent = currentStepIndex === index;

                      return (
                        <li
                          className="tracking-progress__step"
                          data-state={isCurrent ? 'current' : isComplete ? 'complete' : 'upcoming'}
                          aria-current={isCurrent ? 'step' : undefined}
                          key={step.code}
                        >
                          <span className="tracking-progress__bar" aria-hidden="true" />
                          <span className="tracking-progress__label">{step.label}</span>
                        </li>
                      );
                    })}
                  </ol>

                  <a
                    className="tracking-order-card__link"
                    href={`/orders/${encodeURIComponent(order.order_id)}/details`}
                  >
                    ดูรายละเอียด
                  </a>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <footer className="tracking-page__footer">
        OWL CHA · Term Project Prototype
      </footer>
    </main>
  );
}
