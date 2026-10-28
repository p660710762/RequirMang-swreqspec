import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import OrderDetailPage from '../pages/OrderDetail.jsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('OrderItems', () => {
  // Verifies FR-22 shows the selected order's products, quantities, prices, and latest status.
  it('test_AC_STATUS_04_show_order_items_and_latest_status', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          order_id: 'order-456',
          created_at: '2026-10-25T09:00:00',
          latest_status: {
            status_code: 'READY_FOR_PICKUP',
            status_name: 'พร้อมรับสินค้า',
            changed_at: '2026-10-25T11:00:00',
          },
          items: [
            {
              order_item_id: 'item-1',
              menu_name: 'ชาไทย',
              quantity: 2,
              unit_price: 45,
              line_total: 90,
            },
            {
              order_item_id: 'item-2',
              menu_name: 'โกโก้',
              quantity: 1,
              unit_price: 50,
              line_total: 50,
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          order_id: 'order-456',
          current_status: 'READY_FOR_PICKUP',
          latest_status_time: '2026-10-25T11:00:00',
          status_history: [{
            status_code: 'READY_FOR_PICKUP',
            status_name: 'พร้อมรับสินค้า',
            changed_at: '2026-10-25T11:00:00',
          }],
        }),
      }));

    render(<OrderDetailPage orderId="order-456" />);

    expect(await screen.findByText('สถานะล่าสุด: พร้อมรับสินค้า')).toBeInTheDocument();

    const itemsList = screen.getByRole('list', { name: 'รายการสินค้าใน Order' });
    expect(itemsList).toHaveTextContent('ชาไทย');
    expect(itemsList).toHaveTextContent('จำนวน: 2');
    expect(itemsList).toHaveTextContent('ราคา: 45');
    expect(itemsList).toHaveTextContent('โกโก้');
    expect(itemsList).toHaveTextContent('จำนวน: 1');
    expect(itemsList).toHaveTextContent('ราคา: 50');
  });
});
