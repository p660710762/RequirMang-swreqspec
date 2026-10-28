import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import OrderListPage from '../pages/OrderList.jsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('TC-STATUS-05-1', () => {
  it('test_TC_STATUS_05_1_lists_multiple_orders_newest_first', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          order_id: 'order-newest',
          created_at: '2026-10-26T09:00:00',
          user_id: 'sample-user',
          status: 'PREPARING',
          items: [{ menu_name: 'ชาไทย', quantity: 1, unit_price: 45 }],
        },
        {
          order_id: 'order-middle',
          created_at: '2026-10-25T09:00:00',
          user_id: 'sample-user',
          status: 'PENDING_ACCEPT',
          items: [{ menu_name: 'โกโก้', quantity: 1, unit_price: 50 }],
        },
        {
          order_id: 'order-oldest',
          created_at: '2026-10-24T09:00:00',
          user_id: 'sample-user',
          status: 'PENDING_ACCEPT',
          items: [{ menu_name: 'มัทฉะลาเต้', quantity: 1, unit_price: 50 }],
        },
      ],
    }));

    // Given ลูกค้ามีหลาย Order อยู่ในระบบ
    // When ลูกค้าเปิดหน้าติดตามสถานะ Order
    render(<OrderListPage />);

    // Then ระบบแสดงรายการ Order ให้ลูกค้าเลือกติดตาม และเรียงตามวันที่สร้างล่าสุดก่อน
    const links = await screen.findAllByRole('link', { name: 'ดูรายละเอียด' });
    expect(links).toHaveLength(3);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/orders/order-newest/details',
      '/orders/order-middle/details',
      '/orders/order-oldest/details',
    ]);
  });
});
