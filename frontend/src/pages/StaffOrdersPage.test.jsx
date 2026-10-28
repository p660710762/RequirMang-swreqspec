import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AppShell from '../AppShell.jsx';
import { getStaffOrders } from '../api/client.js';

vi.mock('../api/client.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getStaffOrderDetails: vi.fn(),
    getStaffOrders: vi.fn(),
  };
});

afterEach(() => {
  cleanup();
  window.history.pushState({}, '', '/');
  vi.clearAllMocks();
});

describe('StaffOrdersPage', () => {
  it('test_AC_STAFF_ORDER_01_show_order_list_for_staff', async () => {
    getStaffOrders.mockResolvedValue([
      { order_id: '006', created_at: '2026-10-27T09:00:00+00:00', status: 'waiting' },
      { order_id: '005', created_at: '2026-10-27T08:50:00+00:00', status: 'preparing' },
    ]);
    window.history.pushState({}, '', '/staff/orders');

    render(<AppShell />);

    expect(await screen.findByRole('heading', { name: 'Order #006' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Order #005' })).toBeInTheDocument();
    expect(getStaffOrders).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(screen.queryByText('กำลังโหลดรายการ Order')).not.toBeInTheDocument();
    });
  });
});
