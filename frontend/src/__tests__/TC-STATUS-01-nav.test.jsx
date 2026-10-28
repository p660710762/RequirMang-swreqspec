import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AppShell from '../AppShell.jsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
});

describe('TC-STATUS-01 navigation', () => {
  it('shows the Status link after login and opens the order list route', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === '/api/menu') {
        return {
          ok: true,
          json: async () => ({
            items: [{ menu_id: 1, name: 'ชาไทย', price: 45, status: 'open' }],
          }),
        };
      }
      if (url === '/api/promotions/active') {
        return { ok: true, json: async () => [] };
      }
      if (url === '/api/orders/drafts') {
        return {
          ok: true,
          json: async () => ({ order_date: '2026-10-28', order_id: '001' }),
        };
      }
      if (url === '/api/orders') {
        return { ok: true, json: async () => [] };
      }
      return { ok: false, json: async () => [] };
    }));

    render(<AppShell />);

    expect(screen.queryByRole('link', { name: 'Status' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Login / Register' }));
    fireEvent.change(screen.getByLabelText('อีเมล'), {
      target: { value: 'customer@example.com' },
    });
    fireEvent.change(screen.getByLabelText('รหัสผ่าน', { selector: '#register-password' }), {
      target: { value: 'valid-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'สมัครสมาชิก' }));

    const statusButton = await screen.findByRole('button', { name: 'Status' });
    expect(screen.getByRole('heading', { name: 'เมนูเครื่องดื่ม' })).toBeInTheDocument();
    fireEvent.click(statusButton);
    expect(window.location.pathname).toBe('/orders/status');
    expect(await screen.findByRole('heading', { name: 'ติดตามคำสั่งซื้อ' }))
      .toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Customer Menu' }));
    fireEvent.click(await screen.findByRole('button', { name: 'สั่งซื้อ' }));
    await screen.findByRole('dialog', { name: 'สั่งซื้อเครื่องดื่ม' });
    const draftRequest = fetch.mock.calls.find(([url]) => url === '/api/orders/drafts');
    expect(draftRequest).toBeTruthy();
    const userId = draftRequest[1].headers['X-Test-User'];
    expect(fetch).toHaveBeenCalledWith(
      '/api/orders/drafts',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Test-User': userId }),
      }),
    );
  });
});
