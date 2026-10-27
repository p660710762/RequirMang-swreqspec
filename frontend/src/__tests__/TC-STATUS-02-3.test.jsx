import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import OrderDetailPage from '../pages/OrderDetail.jsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('TC-STATUS-02-3', () => {
  it('test_TC_STATUS_02_3_hides_unauthorized_order_detail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }));

    // Given ลูกค้ามี Order ของตนเองและมี Order ของลูกค้ารายอื่นในระบบ แต่ไม่มีสิทธิ์เข้าถึง Order ของลูกค้ารายอื่น
    // When ลูกค้าเลือก Order ของลูกค้ารายอื่น
    render(<OrderDetailPage orderId="order-other" />);

    // Then ระบบไม่แสดงรายละเอียดหรือสถานะของ Order ที่ลูกค้าไม่มีสิทธิ์เข้าถึง ตาม NFR-SEC-02
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByLabelText('Order: order-other')).not.toBeInTheDocument();
    expect(screen.queryByText(/สถานะล่าสุด:/)).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'ลำดับสถานะ Order' }))
      .not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/orders/order-other', {
      headers: { 'X-Test-User': 'customer-a' },
    });
  });
});
