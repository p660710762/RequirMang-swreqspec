import { useCallback, useEffect, useState } from 'react';

import { getOrderDetails } from '../api/client.js';
import OrderItems from '../components/OrderItems.jsx';
import OrderStatusTimeline from '../components/OrderStatusTimeline.jsx';

// FR-22: format the selected Order's saved creation time.
function formatOrderDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

// FR-20, FR-22: show the selected order, saved item details, and latest confirmed status.
export default function OrderDetailPage({ orderId }) {
  const [order, setOrder] = useState(null);
  const [loadState, setLoadState] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [latestConfirmedStatus, setLatestConfirmedStatus] = useState(null);
  const handleStatusChange = useCallback((status) => {
    setLatestConfirmedStatus(status);
  }, []);

  useEffect(() => {
    let isCurrent = true;
    setLatestConfirmedStatus(null);

    getOrderDetails(orderId)
      .then((result) => {
        if (isCurrent) {
          setOrder(result);
          setLatestConfirmedStatus(result.latest_status);
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
  }, [orderId]);

  return (
    <main className="tracking-page">
      <header className="tracking-page__header">
        <div>
          <p className="tracking-page__eyebrow">ORDER STATUS</p>
          <h1 id="order-detail-title">ติดตามคำสั่งซื้อ</h1>
          <p className="tracking-page__subtitle">รายละเอียดคำสั่งซื้อ</p>
        </div>
      </header>

      <section className="tracking-panel order-detail-panel" aria-labelledby="order-detail-title">
        {loadState === 'loading' && (
          <p className="tracking-state" role="status">กำลังโหลดรายละเอียด Order</p>
        )}

        {loadState === 'error' && (
          <p className="tracking-state tracking-state--error" role="alert">
            ไม่สามารถโหลดรายละเอียด Order ได้: {errorMessage}
          </p>
        )}

        {loadState === 'ready' && order && (
          <section className="order-detail-content" aria-label={`Order: ${order.order_id}`}>
            <header className="order-detail-header">
              <div>
                <h2>
                  {order.items.length
                    ? order.items.map((item) => item.menu_name).join(', ')
                    : `Order: ${order.order_id}`}
                </h2>
                {order.items.length > 0 && <p>Order: {order.order_id}</p>}
                {order.created_at && <p>วันที่สั่ง: {formatOrderDate(order.created_at)}</p>}
              </div>
              {latestConfirmedStatus && (
                <span className="tracking-status-badge">
                  สถานะล่าสุด: {latestConfirmedStatus.status_name}
                </span>
              )}
            </header>
            <OrderItems items={order.items} />
            {order.total_amount !== null && order.total_amount !== undefined && (
              <p className="order-detail-total">
                ยอดรวม {new Intl.NumberFormat('th-TH', {
                  style: 'currency',
                  currency: 'THB',
                  maximumFractionDigits: 2,
                }).format(order.total_amount)}
              </p>
            )}
            <OrderStatusTimeline
              orderId={orderId}
              onStatusChange={handleStatusChange}
            />
          </section>
        )}
      </section>
      <footer className="tracking-page__footer">
        OWL CHA · Term Project Prototype
      </footer>
    </main>
  );
}
