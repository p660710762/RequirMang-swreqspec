import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import OrderStatusTimeline from '../components/OrderStatusTimeline.jsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('TC-STATUS-03-2', () => {
  it('test_TC_STATUS_03_2_shows_ready_status_time', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        order_id: 'order-status',
        current_status: 'READY_FOR_PICKUP',
        latest_status_time: '2026-10-25T11:00:00',
        status_history: [
          { status_code: 'PENDING_ACCEPT', status_name: 'รอรับ Order', changed_at: '2026-10-25T09:00:00' },
          { status_code: 'PREPARING', status_name: 'กำลังเตรียม', changed_at: '2026-10-25T10:00:00' },
          { status_code: 'READY_FOR_PICKUP', status_name: 'พร้อมรับสินค้า', changed_at: '2026-10-25T11:00:00' },
        ],
      }),
    }));

    // Given Order มีสถานะที่ถูกบันทึกในระบบจนถึง “พร้อมรับสินค้า”
    // When ลูกค้าเปิดรายละเอียด Order
    render(<OrderStatusTimeline orderId="order-status" />);

    // Then ระบบแสดงลำดับ 4 ขั้นตาม FR-21
    const timeline = await screen.findByRole('list', { name: 'ลำดับสถานะ Order' });
    expect(
      within(timeline).getAllByRole('listitem').map((step) => step.textContent),
    ).toEqual([
      'รอรับ Order',
      'กำลังเตรียม',
      'พร้อมรับสินค้า2026-10-25T11:00:00',
      'รับสินค้าแล้ว',
    ]);

    // Then เมื่อสถานะเปลี่ยนเป็น “พร้อมรับสินค้า” ระบบแสดงเวลาและสถานะที่เปลี่ยนล่าสุด
    const readyStep = within(timeline).getByText('พร้อมรับสินค้า').closest('li');
    expect(readyStep).toHaveTextContent('2026-10-25T11:00:00');
    expect(within(readyStep).getByText('2026-10-25T11:00:00')).toHaveAttribute(
      'dateTime',
      '2026-10-25T11:00:00',
    );
    expect(readyStep).toHaveAttribute('aria-current', 'step');
  });
});
