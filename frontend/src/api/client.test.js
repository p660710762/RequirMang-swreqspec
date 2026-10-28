import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createMenuItem,
  getStaffOrderDetails,
  updateStaffOrderStatus,
} from './client.js';

afterEach(() => vi.unstubAllGlobals());

describe('menu API client', () => {
  it('test_AC_STATUS_01_updates_order_status_for_the_selected_date', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'PREPARING' }),
    }));

    await expect(updateStaffOrderStatus('006', '2026-10-27', 'PREPARING'))
      .resolves.toEqual({ status: 'PREPARING' });
    expect(fetch).toHaveBeenCalledWith(
      '/api/staff/orders/006/status?order_date=2026-10-27',
      {
        method: 'PATCH',
        headers: {
          'X-User-Id': 'staff',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ new_status: 'PREPARING' }),
      },
    );
  });

  it('test_AC_STAFF_ORDER_03_requests_order_details_for_the_selected_date', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ order_id: '006', items: [] }),
    }));

    await expect(getStaffOrderDetails('006', '2026-10-27'))
      .resolves.toEqual({ order_id: '006', items: [] });
    expect(fetch).toHaveBeenCalledWith(
      '/api/staff/orders/006?order_date=2026-10-27',
      { headers: { 'X-User-Id': 'staff' } },
    );
  });

  it('test_AC_MENU_MGMT_02_admin_can_add_menu_item', async () => {
    const menuItem = { name: 'เมนูทดสอบ', price: 45, status: 'open' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ menu_id: 7, ...menuItem }),
    }));

    await expect(createMenuItem(menuItem)).resolves.toMatchObject(menuItem);
    expect(fetch).toHaveBeenCalledWith('/api/admin/menu', {
      method: 'POST',
      headers: { 'X-User-Id': 'admin', 'Content-Type': 'application/json' },
      body: JSON.stringify(menuItem),
    });
  });

  it('test_AC_MENU_MGMT_11_invalid_data_is_rejected', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ detail: 'Menu name is required' }),
    }));

    await expect(createMenuItem({ name: '   ' })).rejects.toThrow('Menu name is required');
  });
});