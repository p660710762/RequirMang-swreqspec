import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import OrderDetailPage from '../pages/OrderDetail.jsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('TC-STATUS-02-2', () => {
  it('test_TC_STATUS_02_2_customer_sees_completed_order_detail', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          order_id: 'order-owned',
          created_at: '2026-10-25T09:00:00',
          latest_status: {
            status_code: 'PICKED_UP',
            status_name: 'รับสินค้าแล้ว',
            changed_at: '2026-10-25T12:00:00',
          },
          items: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          order_id: 'order-owned',
          current_status: 'PICKED_UP',
          latest_status_time: '2026-10-25T12:00:00',
          status_history: [{
            status_code: 'PICKED_UP',
            status_name: 'รับสินค้าแล้ว',
            changed_at: '2026-10-25T12:00:00',
          }],
        }),
      }));

    // Given ลูกค้ามี Order ที่สถานะล่าสุดเป็น “รับสินค้าแล้ว”
    // When ลูกค้าเลือก Order นั้นเพื่อติดตาม
    render(<OrderDetailPage orderId="order-owned" />);

    // Then ระบบแสดงรายละเอียดและสถานะล่าสุด “รับสินค้าแล้ว” ของ Order ที่เลือก
    expect(await screen.findByRole('heading', { name: 'Order: order-owned' }))
      .toBeInTheDocument();
    expect(await screen.findByText('สถานะล่าสุด: รับสินค้าแล้ว'))
      .toBeInTheDocument();
    expect(fetch).toHaveBeenNthCalledWith(1, '/api/orders/order-owned', {
      headers: { 'X-Test-User': 'customer-a' },
    });
  });
});
