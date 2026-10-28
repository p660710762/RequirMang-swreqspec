import { useEffect, useState } from 'react';

import { getStaffOrderDetails, getStaffOrders } from '../api/client.js';

// FR-29, FR-30, FR-32, NFR-USE-01: display identifiable orders and their current status.
export default function StaffOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [detailsLoadState, setDetailsLoadState] = useState('idle');

  useEffect(() => {
    let isCurrent = true;

    getStaffOrders()
      .then((items) => {
        if (isCurrent) {
          setOrders(items);
          setLoadState('ready');
        }
      })
      .catch((error) => {
        console.error('Failed to load staff orders', error);
        if (isCurrent) setLoadState('error');
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (selectedOrderId === null) {
      setOrderDetails(null);
      setDetailsLoadState('idle');
      return undefined;
    }

    let isCurrent = true;
    setOrderDetails(null);
    setDetailsLoadState('loading');

    getStaffOrderDetails(selectedOrderId)
      .then((details) => {
        if (isCurrent) {
          setOrderDetails(details);
          setDetailsLoadState('ready');
        }
      })
      .catch((error) => {
        console.error('Failed to load staff order details', error);
        if (isCurrent) setDetailsLoadState('error');
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedOrderId]);

  return (
    <main className="admin-page">
      <section className="page-content" aria-labelledby="staff-orders-title">
        <div className="page-heading">
          <h1 id="staff-orders-title">รายการ Order</h1>
        </div>

        {loadState === 'loading' && (
          <p className="page-state" role="status">กำลังโหลดรายการ Order</p>
        )}

        {loadState === 'error' && (
          <p className="page-state page-state--error" role="alert">
            ไม่สามารถโหลดรายการ Order ได้
          </p>
        )}

        {loadState === 'ready' && (
          <section className="menu-panel" aria-label="รายการ Order">
            <div className="menu-list">
              {orders.map((order) => (
                <article className="menu-row" key={order.order_id}>
                  <div>
                    <h2>Order #{order.order_number ?? order.order_id}</h2>
                    {order.sequence_no != null && (
                      <p className="menu-row__summary">
                        <strong>ลำดับคิว</strong> · {order.sequence_no}
                      </p>
                    )}
                    {order.status != null && (
                      <p className="menu-row__summary">
                        <strong>สถานะ</strong> · {order.status}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-expanded={selectedOrderId === order.order_id}
                    aria-controls={`order-details-${order.order_id}`}
                    onClick={() => setSelectedOrderId(
                      selectedOrderId === order.order_id ? null : order.order_id,
                    )}
                  >
                    {selectedOrderId === order.order_id ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}
                  </button>
                  {selectedOrderId === order.order_id && (
                    <div
                      id={`order-details-${order.order_id}`}
                      className="menu-row__description"
                      aria-label={`รายละเอียด Order ${order.order_number ?? order.order_id}`}
                    >
                      {detailsLoadState === 'loading' && (
                        <p role="status">กำลังโหลดรายละเอียด Order</p>
                      )}
                      {detailsLoadState === 'error' && (
                        <p role="alert">ไม่สามารถโหลดรายละเอียด Order ได้</p>
                      )}
                      {detailsLoadState === 'ready'
                        && orderDetails?.order_id === selectedOrderId && (
                        <ul>
                          {orderDetails.items.map((item) => (
                            <li key={item.order_item_id}>
                              <span>{item.menu_item_name}</span>
                              <span>จำนวน {item.quantity}</span>
                              <span>
                                ตัวเลือก {item.selected_options.join(', ')}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
