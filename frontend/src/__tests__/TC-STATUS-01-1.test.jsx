import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import OrderListPage from '../pages/OrderList.jsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('TC-STATUS-01-1', () => {
  it('test_TC_STATUS_01_1_customer_sees_own_orders', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{
        order_id: 'order-customer-a',
        user_id: 'sample-user',
        status: 'PREPARING',
        items: [{ menu_name: 'ชาไทย', quantity: 1, unit_price: 50 }],
      }],
    }));

    // Given ลูกค้ามี Order อยู่ในระบบ
    // When ลูกค้าเปิดหน้ารายการ Order
    render(<OrderListPage />);

    // Then ระบบแสดงรายการ Order ของลูกค้า
    expect(await screen.findByRole('heading', { name: 'ชาไทย' }))
      .toBeInTheDocument();
    expect(screen.getByText('Order: order-customer-a')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/orders', {
      headers: { 'X-Test-User': 'customer-a' },
    });
  });
});
