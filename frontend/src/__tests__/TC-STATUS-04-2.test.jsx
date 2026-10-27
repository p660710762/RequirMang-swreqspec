import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import OrderDetailPage from '../pages/OrderDetail.jsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('TC-STATUS-04-2', () => {
  it('test_TC_STATUS_04_2_shows_two_order_items', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          order_id: 'order-status-04',
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
              menu_name: 'มัทฉะลาเต้',
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
          order_id: 'order-status-04',
          current_status: 'READY_FOR_PICKUP',
          latest_status_time: '2026-10-25T11:00:00',
          status_history: [{
            status_code: 'READY_FOR_PICKUP',
            status_name: 'พร้อมรับสินค้า',
            changed_at: '2026-10-25T11:00:00',
          }],
        }),
      }));

    // Given ลูกค้าเลือก Order ที่มีรายการสินค้า 2 รายการ ซึ่งเป็นขอบล่างของช่วง 2-3 รายการในแผนทดสอบ
    // When ระบบโหลดข้อมูล Order สำเร็จ
    render(<OrderDetailPage orderId="order-status-04" />);

    // Then ระบบแสดงสถานะล่าสุด และข้อมูลรายการสินค้าทั้ง 2 รายการ จำนวน และราคาที่เกี่ยวข้องอย่างถูกต้อง
    expect(await screen.findByText('สถานะล่าสุด: พร้อมรับสินค้า')).toBeInTheDocument();
    const itemsList = screen.getByRole('list', { name: 'รายการสินค้าใน Order' });
    const items = within(itemsList).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('ชาไทย');
    expect(items[0]).toHaveTextContent('จำนวน: 2');
    expect(items[0]).toHaveTextContent('ราคา: 45');
    expect(items[1]).toHaveTextContent('มัทฉะลาเต้');
    expect(items[1]).toHaveTextContent('จำนวน: 1');
    expect(items[1]).toHaveTextContent('ราคา: 50');
  });
});
