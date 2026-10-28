import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import OrderDetailPage from '../pages/OrderDetail.jsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('TC-STATUS-03-3', () => {
  it('test_TC_STATUS_03_3_does_not_show_unconfirmed_status', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          order_id: 'order-status',
          created_at: '2026-10-25T09:00:00',
          latest_status: null,
          items: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          order_id: 'order-status',
          current_status: null,
          latest_status_time: null,
          status_history: [],
        }),
      }));

    // Given Order ไม่มีสถานะที่ถูกบันทึกและยืนยันในระบบ
    // When ลูกค้าเปิดรายละเอียด Order
    render(<OrderDetailPage orderId="order-status" />);

    // Then ระบบไม่แสดงสถานะที่ไม่ถูกบันทึกหรือไม่ผ่านการยืนยัน ตาม NFR-REL-03
    expect(await screen.findByRole('heading', { name: 'Order: order-status' }))
      .toBeInTheDocument();
    expect(screen.queryByText('สถานะล่าสุด: รับสินค้าแล้ว')).not.toBeInTheDocument();
    expect(screen.queryByText('รับสินค้าแล้ว')).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'ลำดับสถานะ Order' }))
      .not.toBeInTheDocument();
  });
});
