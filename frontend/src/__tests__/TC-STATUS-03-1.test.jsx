import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import OrderStatusTimeline from '../components/OrderStatusTimeline.jsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('TC-STATUS-03-1', () => {
  it('test_TC_STATUS_03_1_displays_four_status_steps', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        order_id: 'order-status',
        current_status: 'PICKED_UP',
        latest_status_time: '2026-10-25T12:00:00',
        status_history: [
          { status_code: 'PENDING_ACCEPT', status_name: 'รอรับ Order', changed_at: '2026-10-25T09:00:00' },
          { status_code: 'PREPARING', status_name: 'กำลังเตรียม', changed_at: '2026-10-25T10:00:00' },
          { status_code: 'READY_FOR_PICKUP', status_name: 'พร้อมรับสินค้า', changed_at: '2026-10-25T11:00:00' },
          { status_code: 'PICKED_UP', status_name: 'รับสินค้าแล้ว', changed_at: '2026-10-25T12:00:00' },
        ],
      }),
    }));

    // Given Order มีสถานะที่ถูกบันทึกในระบบครบทั้ง 4 ขั้นตาม FR-21
    // When ลูกค้าเปิดรายละเอียด Order
    render(<OrderStatusTimeline orderId="order-status" />);

    // Then ระบบแสดงสถานะตามลำดับ “รอรับ Order” → “กำลังเตรียม” → “พร้อมรับสินค้า” → “รับสินค้าแล้ว”
    const timeline = await screen.findByRole('list', { name: 'ลำดับสถานะ Order' });
    expect(
      within(timeline).getAllByRole('listitem').map((step) => step.textContent),
    ).toEqual([
      'รอรับ Order',
      'กำลังเตรียม',
      'พร้อมรับสินค้า2026-10-25T11:00:00',
      'รับสินค้าแล้ว2026-10-25T12:00:00',
    ]);
  });
});
