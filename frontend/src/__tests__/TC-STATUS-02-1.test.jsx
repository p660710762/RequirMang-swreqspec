import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import OrderDetailPage from '../pages/OrderDetail.jsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('TC-STATUS-02-1', () => {
  it('test_TC_STATUS_02_1_customer_sees_selected_order_detail', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          order_id: 'order-owned',
          created_at: '2026-10-25T09:00:00',
          latest_status: {
            status_code: 'PREPARING',
            status_name: 'กำลังเตรียม',
            changed_at: '2026-10-25T09:10:00',
          },
          items: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          order_id: 'order-owned',
          current_status: 'PREPARING',
          latest_status_time: '2026-10-25T09:10:00',
          status_history: [{
            status_code: 'PREPARING',
            status_name: 'กำลังเตรียม',
            changed_at: '2026-10-25T09:10:00',
          }],
        }),
      }));

    // Given ลูกค้ามี Order อยู่ในระบบ
    // When ลูกค้าเลือก Order ที่ต้องการติดตาม
    render(<OrderDetailPage orderId="order-owned" />);

    // Then ระบบแสดงรายละเอียดและสถานะล่าสุดของ Order ที่เลือก
    expect(await screen.findByRole('heading', { name: 'Order: order-owned' }))
      .toBeInTheDocument();
    expect(await screen.findByText('สถานะล่าสุด: กำลังเตรียม'))
      .toBeInTheDocument();
    expect(fetch).toHaveBeenNthCalledWith(1, '/api/orders/order-owned', {
      headers: { 'X-Test-User': 'customer-a' },
    });
  });
});
