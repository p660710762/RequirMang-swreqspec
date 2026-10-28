import { useEffect, useRef, useState } from 'react';

import { getOrderStatus, refreshOrderStatus } from '../api/client.js';

const ORDER_STATUS_STEPS = [
  { code: 'PENDING_ACCEPT', label: 'รอรับ Order' },
  { code: 'PREPARING', label: 'กำลังเตรียม' },
  { code: 'READY_FOR_PICKUP', label: 'พร้อมรับสินค้า' },
  { code: 'PICKED_UP', label: 'รับสินค้าแล้ว' },
];

const TIMED_STATUS_CODES = new Set(['READY_FOR_PICKUP', 'PICKED_UP']);

// FR-21: display the four order status steps and confirmed timestamps for the final two steps.
export default function OrderStatusTimeline({
  orderId,
  orderDate,
  userId = 'customer-a',
  onStatusChange,
}) {
  const [status, setStatus] = useState(null);
  const [loadState, setLoadState] = useState('loading');
  const requestGeneration = useRef(0);

  useEffect(() => {
    const generation = ++requestGeneration.current;

    getOrderStatus(orderId, userId, orderDate)
      .then((result) => {
        if (generation === requestGeneration.current) {
          setStatus(result);
          onStatusChange?.(
            result.status_history[result.status_history.length - 1] ?? null,
          );
          setLoadState('ready');
        }
      })
      .catch(() => {
        if (generation === requestGeneration.current) {
          setStatus(null);
          onStatusChange?.(null);
          setLoadState('error');
        }
      });

    return () => {
      requestGeneration.current += 1;
    };
  }, [onStatusChange, orderDate, orderId, userId]);

  // FR-21, NFR-REL-03: retry status loading without retaining an unconfirmed prior result.
  async function handleRetry() {
    const generation = ++requestGeneration.current;
    setStatus(null);
    onStatusChange?.(null);
    setLoadState('loading');

    try {
      const result = await refreshOrderStatus(orderId, userId, orderDate);
      if (generation === requestGeneration.current) {
        setStatus(result);
        onStatusChange?.(
          result.status_history[result.status_history.length - 1] ?? null,
        );
        setLoadState('ready');
      }
    } catch {
      if (generation === requestGeneration.current) {
        setStatus(null);
        onStatusChange?.(null);
        setLoadState('error');
      }
    }
  }

  if (loadState === 'error') {
    return (
      <div className="page-state page-state--error" role="alert">
        <p>ไม่สามารถโหลดสถานะได้</p>
        <button type="button" onClick={handleRetry}>ลองใหม่</button>
      </div>
    );
  }

  if (loadState !== 'ready' || !status) {
    return null;
  }

  const currentStepIndex = ORDER_STATUS_STEPS.findIndex(
    (step) => step.code === status.current_status,
  );
  const historyByStatus = new Map(
    status.status_history.map((entry) => [entry.status_code, entry]),
  );

  return (
    <section className="order-detail-section" aria-labelledby="order-status-title">
      <h3 className="order-detail-section__title" id="order-status-title">สถานะ Order</h3>
      <ol
        className="order-detail-progress"
        aria-label="ลำดับสถานะ Order"
      >
        {ORDER_STATUS_STEPS.map((step, index) => {
          const entry = historyByStatus.get(step.code);
          const isCurrent = index === currentStepIndex;
          const isComplete = currentStepIndex >= 0 && index < currentStepIndex;
          const time = TIMED_STATUS_CODES.has(step.code) ? entry?.changed_at : null;

          return (
            <li
              className="order-detail-progress__step"
              key={step.code}
              aria-current={isCurrent ? 'step' : undefined}
              data-state={isCurrent ? 'current' : isComplete ? 'complete' : 'upcoming'}
            >
              <span>{step.label}</span>
              {time && <time dateTime={time}>{time}</time>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
