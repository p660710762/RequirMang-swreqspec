import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import OrderStatusTimeline from './OrderStatusTimeline.jsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('OrderStatusTimeline', () => {
  it('test_AC_STATUS_03_display_4_step_status_flow', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        order_id: 'order-123',
        current_status: 'PICKED_UP',
        latest_status_time: '2026-10-25T12:00:00',
        status_history: [
          {
            status_code: 'PENDING_ACCEPT',
            status_name: 'รอรับ Order',
            changed_at: '2026-10-25T09:00:00',
          },
          {
            status_code: 'PREPARING',
            status_name: 'กำลังเตรียม',
            changed_at: '2026-10-25T10:00:00',
          },
          {
            status_code: 'READY_FOR_PICKUP',
            status_name: 'พร้อมรับสินค้า',
            changed_at: '2026-10-25T11:00:00',
          },
          {
            status_code: 'PICKED_UP',
            status_name: 'รับสินค้าแล้ว',
            changed_at: '2026-10-25T12:00:00',
          },
        ],
      }),
    }));

    render(<OrderStatusTimeline orderId="order-123" />);

    const timeline = await screen.findByRole('list', { name: 'ลำดับสถานะ Order' });
    expect(
      within(timeline).getAllByRole('listitem').map((step) => step.textContent),
    ).toEqual([
      'รอรับ Order',
      'กำลังเตรียม',
      'พร้อมรับสินค้า2026-10-25T11:00:00',
      'รับสินค้าแล้ว2026-10-25T12:00:00',
    ]);

    const currentStep = within(timeline).getByText('รับสินค้าแล้ว').closest('li');
    expect(currentStep).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('2026-10-25T11:00:00')).toHaveAttribute(
      'dateTime',
      '2026-10-25T11:00:00',
    );
    expect(fetch).toHaveBeenCalledWith('/api/orders/order-123/status', {
      headers: { 'X-Test-User': 'customer-a' },
    });
  });

  it('does not render a status when the confirmed status request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    render(<OrderStatusTimeline orderId="order-123" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('ไม่สามารถโหลดสถานะได้');
    expect(screen.queryByRole('list', { name: 'ลำดับสถานะ Order' })).not.toBeInTheDocument();
  });
});
