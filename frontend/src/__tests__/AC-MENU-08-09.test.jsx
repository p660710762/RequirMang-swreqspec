import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import AppShell from '../AppShell.jsx';

const menuItem = {
  id: 1,
  menu_id: 1,
  name: 'ชาเขียว',
  price: 50,
  description: 'ชาเขียว',
  status: 'open',
};

function response(payload, ok = true) {
  return { ok, json: async () => payload };
}

describe('AC-MENU-08 and AC-MENU-09 customer login flow', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.history.replaceState({}, '', '/');
  });

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async (url, options = {}) => {
      if (url === '/api/menu') {
        return response({ items: [menuItem] });
      }
      if (url === '/api/promotions/active') {
        return response([]);
      }
      if (url === '/api/orders/drafts') {
        return response({ order_date: '2026-10-27', order_id: '001' });
      }
      if (url === '/api/orders/items') {
        return response({
          order_item_id: 4,
          ...JSON.parse(options.body ?? '{}'),
          ice_level: 'ใส่น้ำแข็งปริมาณปกติ',
          toppings: null,
        });
      }
      return response([], false);
    }));
  });

  test('test_AC_MENU_02_display_and_start_order_flow', async () => {
    render(<AppShell />);

    fireEvent.click(await screen.findByRole('button', { name: 'สั่งซื้อ' }));
    expect(await screen.findByRole('heading', { name: 'เข้าสู่ระบบ' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'เมนูที่เลือกไว้' })).not.toBeInTheDocument();
    expect(window.location.pathname).not.toBe('/order');

    fireEvent.change(screen.getByLabelText('อีเมล'), {
      target: { value: 'customer@example.com' },
    });
    fireEvent.change(screen.getByLabelText('รหัสผ่าน', { selector: '#register-password' }), {
      target: { value: 'valid-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'สมัครสมาชิก' }));

    expect(screen.queryByRole('dialog', { name: 'สั่งซื้อเครื่องดื่ม' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'เมนูเครื่องดื่ม' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');

    fireEvent.click(await screen.findByRole('button', { name: 'สั่งซื้อ' }));
    const reopenedOrderDialog = await screen.findByRole('dialog', { name: 'สั่งซื้อเครื่องดื่ม' });
    expect(within(reopenedOrderDialog).getByRole('heading', { name: 'เลือกเครื่องดื่ม' }))
      .toBeInTheDocument();
    expect(window.location.pathname).toBe('/order');
  });

  test('test_AC_MENU_08_login_returns_to_menu_then_user_selects_a_new_menu', async () => {
    render(<AppShell />);

    fireEvent.click(await screen.findByRole('button', { name: 'สั่งซื้อ' }));
    expect(await screen.findByRole('heading', { name: 'เข้าสู่ระบบ' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('อีเมล'), {
      target: { value: 'customer@example.com' },
    });
    fireEvent.change(screen.getByLabelText('รหัสผ่าน', { selector: '#register-password' }), {
      target: { value: 'valid-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'สมัครสมาชิก' }));

    expect(await screen.findByRole('heading', { name: 'เมนูเครื่องดื่ม' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'สั่งซื้อเครื่องดื่ม' })).not.toBeInTheDocument();
    expect(window.location.pathname).toBe('/');

    fireEvent.click(await screen.findByRole('button', { name: 'สั่งซื้อ' }));
    const orderDialog = await screen.findByRole('dialog', { name: 'สั่งซื้อเครื่องดื่ม' });
    expect(within(orderDialog).getByRole('heading', { name: 'ชาเขียว' })).toBeInTheDocument();
    expect(within(orderDialog).getByLabelText('ระดับความหวาน')).toHaveValue('');
    expect(within(orderDialog).queryByText(/ชาเขียว จำนวน/)).not.toBeInTheDocument();
    expect(window.location.pathname).toBe('/order');

    fireEvent.change(within(orderDialog).getByLabelText('ระดับความหวาน'), {
      target: { value: 'หวานปกติ 75%' },
    });
    fireEvent.click(within(orderDialog).getByRole('button', { name: 'สั่งซื้อ' }));

    expect(await within(orderDialog).findByText(/ชาเขียว จำนวน 1/)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/orders/items', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        order_date: '2026-10-27',
        order_id: '001',
        menu_item_id: 1,
        quantity: 1,
        sweetness_level: 'หวานปกติ 75%',
      }),
    }));
  });

  test('a logged-in menu click filters the order popup to that menu', async () => {
    const secondMenuItem = {
      id: 2,
      menu_id: 2,
      name: 'มัทฉะลาเต้',
      price: 75,
      description: 'มัทฉะ',
      status: 'open',
    };
    fetch.mockImplementation(async (url) => {
      if (url === '/api/menu') {
        return response({ items: [menuItem, secondMenuItem] });
      }
      if (url === '/api/promotions/active') return response([]);
      if (url === '/api/orders/drafts') {
        return response({ order_date: '2026-10-27', order_id: '001' });
      }
      return response([], false);
    });

    render(<AppShell />);
    fireEvent.click(screen.getByRole('button', { name: 'Login / Register' }));
    fireEvent.change(screen.getByLabelText('อีเมล'), {
      target: { value: 'customer@example.com' },
    });
    fireEvent.change(screen.getByLabelText('รหัสผ่าน', { selector: '#register-password' }), {
      target: { value: 'valid-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'สมัครสมาชิก' }));

    expect(await screen.findByRole('heading', { name: 'เมนูเครื่องดื่ม' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'สั่งซื้อเครื่องดื่ม' })).not.toBeInTheDocument();

    const secondMenuCard = screen.getByRole('heading', { name: 'มัทฉะลาเต้' }).closest('article');
    fireEvent.click(within(secondMenuCard).getByRole('button', { name: 'สั่งซื้อ' }));

    const orderDialog = await screen.findByRole('dialog', { name: 'สั่งซื้อเครื่องดื่ม' });
    expect(within(orderDialog).getByRole('article', { name: 'มัทฉะลาเต้' }))
      .toBeInTheDocument();
    expect(within(orderDialog).queryByRole('article', { name: 'ชาเขียว' }))
      .not.toBeInTheDocument();
  });

  test('test_AC_MENU_02_guest_route_to_order_requires_login', async () => {
    window.history.replaceState({}, '', '/order');
    render(<AppShell />);

    expect(await screen.findByRole('heading', { name: 'เข้าสู่ระบบ' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '03 · Ordering & Payment' }))
      .not.toBeInTheDocument();
  });

  test('successful login from /order returns to menu without opening the popup', async () => {
    window.history.replaceState({}, '', '/order');
    render(<AppShell />);

    await screen.findByRole('heading', { name: 'เข้าสู่ระบบ' });
    fireEvent.change(screen.getByLabelText('อีเมล'), {
      target: { value: 'customer@example.com' },
    });
    fireEvent.change(screen.getByLabelText('รหัสผ่าน', { selector: '#register-password' }), {
      target: { value: 'valid-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'สมัครสมาชิก' }));

    expect(await screen.findByRole('heading', { name: 'เมนูเครื่องดื่ม' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'สั่งซื้อเครื่องดื่ม' })).not.toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
  });

  test('test_AC_MENU_09_canceling_login_discards_the_selected_menu', async () => {
    render(<AppShell />);

    fireEvent.click(await screen.findByRole('button', { name: 'สั่งซื้อ' }));
    fireEvent.click(screen.getByRole('button', { name: 'Customer Menu' }));

    expect(await screen.findByRole('button', { name: 'ดำเนินการต่อไปยัง UC-03' }))
      .toBeInTheDocument();
    expect(window.location.pathname).not.toBe('/order');
  });

  test('test_AC_MENU_09_failed_login_discards_the_selected_menu', async () => {
    render(<AppShell />);

    fireEvent.click(await screen.findByRole('button', { name: 'สั่งซื้อ' }));
    fireEvent.change(screen.getByLabelText('อีเมลหรือเบอร์โทรศัพท์'), {
      target: { value: 'unknown@example.com' },
    });
    fireEvent.change(screen.getByLabelText('รหัสผ่าน', { selector: '#login-password' }), {
      target: { value: 'wrong-password' },
    });
    const loginSection = screen.getByRole('heading', { name: 'เข้าสู่ระบบ' }).closest('section');
    fireEvent.click(within(loginSection).getByRole('button', { name: 'เข้าสู่ระบบ' }));

    expect(await screen.findByText('กรุณากรอกข้อมูลให้ถูกต้อง')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '03 · Ordering & Payment' }))
      .not.toBeInTheDocument();
    expect(window.location.pathname).not.toBe('/order');
  });
});
