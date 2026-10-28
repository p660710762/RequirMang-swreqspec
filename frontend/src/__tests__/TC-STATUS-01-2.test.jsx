import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import OrderListPage from '../pages/OrderList.jsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('TC-STATUS-01-2', () => {
  it('test_TC_STATUS_01_2_hides_other_customers_orders', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{
        order_id: 'order-customer-a',
        user_id: 'sample-user',
        status: 'PREPARING',
        items: [{ menu_name: 'ชาไทย', quantity: 1, unit_price: 50 }],
      }],
    }));

    // Given ลูกค้ามี Order อยู่ในระบบ และมี Order ของลูกค้าคนอื่นอยู่ด้วย
    // When ลูกค้าเปิดหน้ารายการ Order
    render(<OrderListPage />);

    // Then ระบบแสดงรายการ Order ของลูกค้าเท่านั้น ตาม NFR-SEC-02
    expect(await screen.findByText('Order: order-customer-a')).toBeInTheDocument();
    expect(screen.queryByText('Order: order-customer-b')).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith('/api/orders', {
      headers: { 'X-Test-User': 'customer-a' },
    });
  });
});
