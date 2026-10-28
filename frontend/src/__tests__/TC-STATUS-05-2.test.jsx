import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import OrderListPage from '../pages/OrderList.jsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('TC-STATUS-05-2', () => {
  it('test_TC_STATUS_05_2_orders_two_items_newest_first', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          order_id: 'order-newer',
          created_at: '2026-10-26T09:00:00',
          user_id: 'sample-user',
          status: 'PREPARING',
          items: [{ menu_name: 'ชาไทย', quantity: 1, unit_price: 45 }],
        },
        {
          order_id: 'order-older',
          created_at: '2026-10-25T09:00:00',
          user_id: 'sample-user',
          status: 'PENDING_ACCEPT',
          items: [{ menu_name: 'โกโก้', quantity: 1, unit_price: 50 }],
        },
      ],
    }));

    // Given ลูกค้ามี Order 2 รายการอยู่ในระบบ โดยรายการหนึ่งสร้างใหม่กว่าอีกรายการ
    // When ลูกค้าเปิดหน้าติดตามสถานะ Order
    render(<OrderListPage />);

    // Then ระบบแสดง Order ทั้งสองให้เลือก และแสดง Order ที่สร้างใหม่กว่าก่อน
    const links = await screen.findAllByRole('link', { name: 'ดูรายละเอียด' });
    expect(links).toHaveLength(2);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/orders/order-newer/details',
      '/orders/order-older/details',
    ]);
  });
});
