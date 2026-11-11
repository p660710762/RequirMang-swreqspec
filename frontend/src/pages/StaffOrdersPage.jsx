import { useEffect, useState } from 'react';

import {
  getStaffOrderDetails,
  getStaffOrders,
  updateStaffOrderStatus,
} from '../api/client.js';

const ORDER_STATUS_LABELS = {
  PENDING_ACCEPT: 'รอรับคำสั่งซื้อ',
  PREPARING: 'กำลังจัดทำ',
  READY_FOR_PICKUP: 'พร้อมรับสินค้า',
  PICKED_UP: 'รับสินค้าแล้ว',
};
const ORDER_STATUS_OPTIONS = [
  'PENDING_ACCEPT',
  'PREPARING',
  'READY_FOR_PICKUP',
  'PICKED_UP',
];
const NEXT_ORDER_STATUS = {
  PENDING_ACCEPT: 'PREPARING',
  PREPARING: 'READY_FOR_PICKUP',
  READY_FOR_PICKUP: 'PICKED_UP',
};

// FR-29, FR-30, FR-32, FR-33, NFR-USE-01: display orders in API-provided order.
export default function StaffOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [detailsLoadState, setDetailsLoadState] = useState('idle');
  const [updatingOrderKey, setUpdatingOrderKey] = useState(null);
  const [statusUpdateError, setStatusUpdateError] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    setLoadState('loading');
    getStaffOrders()
      .then((items) => {
        if (isCurrent) {
          setOrders(items);
          setLoadState('ready');
        }
      })
      .catch((error) => {
        console.error('Failed to load staff orders', error);
        if (isCurrent) {
          setOrders([]);
          setLoadState('error');
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [loadAttempt]);

  // FR-29, AC-STAFF-ORDER-07: retry loading the current Staff order list.
  function retryLoadingOrders() {
    setOrders([]);
    setLoadState('loading');
    setLoadAttempt((attempt) => attempt + 1);
  }

  // FR-25, FR-26, FR-27: save only the next allowed status and reload the queue.
  async function handleStatusUpdate(order) {
    const orderKey = `${order.order_date ?? ''}-${order.order_id}`;
    const nextStatus = NEXT_ORDER_STATUS[order.status];
    if (!order.order_date || !nextStatus) return;

    setUpdatingOrderKey(orderKey);
    setStatusUpdateError(null);
    try {
      await updateStaffOrderStatus(order.order_id, order.order_date, nextStatus);
      setLoadAttempt((attempt) => attempt + 1);
    } catch (error) {
      console.error('Failed to update staff order status', error);
      setStatusUpdateError({
        orderKey,
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setUpdatingOrderKey(null);
    }
  }

  useEffect(() => {
    if (selectedOrder === null) {
      setOrderDetails(null);
      setDetailsLoadState('idle');
      return undefined;
    }

    let isCurrent = true;
    setOrderDetails(null);
    setDetailsLoadState('loading');

    const request = selectedOrder.order_date
      ? getStaffOrderDetails(selectedOrder.order_id, selectedOrder.order_date)
      : getStaffOrderDetails(selectedOrder.order_id);
    request
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
  }, [selectedOrder]);

  return (
    <main className="admin-page staff-orders-page">
      <section className="page-content staff-orders-panel" aria-labelledby="staff-orders-title">
        <div className="page-heading staff-orders-heading">
          <div>
            <p className="staff-orders-eyebrow">STAFF WORKSPACE</p>
            <h1 id="staff-orders-title">รายการ Order</h1>
            <p className="staff-orders-subtitle">จัดคิวเครื่องดื่มและอัปเดตสถานะให้ลูกค้า</p>
          </div>
          <span className="staff-orders-count">{orders.length} รายการ</span>
        </div>

        {loadState === 'loading' && (
          <p className="page-state" role="status">กำลังโหลดรายการ Order</p>
        )}

        {loadState === 'error' && (
          <>
            <p className="page-state page-state--error" role="alert">
              ไม่สามารถโหลดรายการ Order ได้
            </p>
            <button className="staff-orders-retry" type="button" onClick={retryLoadingOrders}>
              ลองใหม่
            </button>
          </>
        )}

        {loadState === 'ready' && (
          <section className="menu-panel" aria-label="รายการ Order">
            {orders.length === 0 ? (
              <p className="page-state" role="status">ไม่มีรายการ Order ใหม่</p>
            ) : (
              <div className="menu-list">
                {orders.map((order) => {
                  const isSelected = selectedOrder?.order_id === order.order_id
                    && selectedOrder?.order_date === order.order_date;
                  const orderKey = `${order.order_date ?? ''}-${order.order_id}`;
                  const detailsId = `order-details-${orderKey}`;
                  return (
                    <article className="menu-row staff-order-card" key={orderKey}>
                      <div className="staff-order-card__summary">
                        <h2>Order #{order.order_number ?? order.order_id}</h2>
                        {order.sequence_no != null && (
                          <p className="menu-row__summary">
                            <strong>ลำดับคิว</strong> · {order.sequence_no}
                          </p>
                        )}
                        {order.status != null && (
                          <p className="menu-row__summary">
                            <strong>สถานะ</strong> · {ORDER_STATUS_LABELS[order.status] ?? order.status}
                          </p>
                        )}
                      </div>
                      {NEXT_ORDER_STATUS[order.status] && (
                        <label className="staff-order-card__status-control">
                          อัปเดตสถานะ
                          <select
                            aria-label={`อัปเดตสถานะ Order ${order.order_number ?? order.order_id}`}
                            value={order.status}
                            disabled={updatingOrderKey === orderKey}
                            onChange={() => handleStatusUpdate(order)}
                          >
                            {ORDER_STATUS_OPTIONS.map((status, index) => {
                              const currentIndex = ORDER_STATUS_OPTIONS.indexOf(order.status);
                              return (
                                <option
                                  key={status}
                                  value={status}
                                  disabled={index !== currentIndex && index !== currentIndex + 1}
                                >
                                  {ORDER_STATUS_LABELS[status]}
                                </option>
                              );
                            })}
                          </select>
                        </label>
                      )}
                      <button
                        type="button"
                        aria-expanded={isSelected}
                        aria-controls={detailsId}
                        onClick={() => setSelectedOrder(isSelected ? null : order)}
                      >
                        {isSelected ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}
                      </button>
                      {isSelected && (
                        <div
                          id={detailsId}
                          className="menu-row__description staff-order-card__details"
                          aria-label={`รายละเอียด Order ${order.order_number ?? order.order_id}`}
                        >
                          {detailsLoadState === 'loading' && (
                            <p role="status">กำลังโหลดรายละเอียด Order</p>
                          )}
                          {detailsLoadState === 'error' && (
                            <p role="alert">ไม่สามารถโหลดรายละเอียด Order ได้</p>
                          )}
                          {detailsLoadState === 'ready'
                            && orderDetails?.order_id === selectedOrder.order_id && (
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
                      {statusUpdateError?.orderKey === orderKey && (
                        <p role="alert">{statusUpdateError.message}</p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}
