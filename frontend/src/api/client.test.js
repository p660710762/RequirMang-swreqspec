import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMenuItem } from './client.js';

afterEach(() => vi.unstubAllGlobals());

describe('menu API client', () => {
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