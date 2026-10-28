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

  test('shows a newly created menu after returning from Admin Menu', async () => {
    let catalog = [];
    fetch.mockImplementation(async (url, options = {}) => {
      if (url === '/api/menu' && options.method !== 'POST') {
        return response({ items: catalog });
      }
      if (url === '/api/promotions/active') return response([]);
      if (url === '/api/admin/menu' && options.method !== 'POST') {
        return response(catalog);
      }
      if (url === '/api/admin/menu' && options.method === 'POST') {
        const createdItem = { menu_id: 7, ...JSON.parse(options.body) };
        catalog = [createdItem, ...catalog];
        return response(createdItem);
      }
      return response([], false);
    });

    render(<AppShell />);
    expect(await screen.findByText('ไม่พบเมนู')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Admin Menu' }));
    fireEvent.click(await screen.findByRole('button', { name: '+ เพิ่มเมนูตัวอย่าง' }));
    fireEvent.change(await screen.findByLabelText(/ชื่อเมนู/), {
      target: { value: 'ชาเขียวใหม่' },
    });
    fireEvent.change(screen.getByLabelText(/ราคา \(บาท\)/), {
      target: { value: '55' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'บันทึกเมนู' }));
    expect(await screen.findByText('บันทึกเมนูสำเร็จ')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Customer Menu' }));

    expect(await screen.findByRole('heading', { name: 'ชาเขียวใหม่' }))
      .toBeInTheDocument();
    expect(fetch.mock.calls.filter(([url]) => url === '/api/menu')).toHaveLength(2);
  });

  test('shows a paid Order in Status after the simulated payment succeeds', async () => {
    const draft = { order_date: '2026-10-28', order_id: '001' };
    fetch.mockImplementation(async (url, options = {}) => {
      if (url === '/api/menu') return response({ items: [menuItem] });
      if (url === '/api/promotions/active') return response([]);
      if (url === '/api/orders/drafts') return response(draft);
      if (url === '/api/orders/items') {
        return response({
          order_item_id: 7,
          ...JSON.parse(options.body),
          ice_level: 'ใส่น้ำแข็งปริมาณปกติ',
          toppings: null,
        });
      }
      if (url.startsWith('/api/orders/preview?')) {
        return response({
          ...draft,
          items: [{
            order_item_id: 7,
            menu_item_id: menuItem.menu_id,
            name: menuItem.name,
            quantity: 1,
            unit_price: 50,
            line_total: 50,
            regular_price: 50,
            promotion_price: null,
          }],
          total_amount: 50,
        });
      }
      if (url === '/api/orders/confirm') return response({ ...draft, payment_status: 'pending' });
      if (url === '/api/orders/payment/mock-success') {
        return response({
          ...draft,
          payment_status: 'success',
          status: 'PENDING_ACCEPT',
        });
      }
      if (url === '/api/orders') {
        return response([{
          ...draft,
          user_id: 'mock-user',
          status: 'PENDING_ACCEPT',
          created_at: '2026-10-28T11:00:00',
          total_amount: 50,
          items: [{ menu_name: menuItem.name, quantity: 1, unit_price: 50 }],
        }]);
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

    fireEvent.click(await screen.findByRole('button', { name: 'สั่งซื้อ' }));
    const orderDialog = await screen.findByRole('dialog', { name: 'สั่งซื้อเครื่องดื่ม' });
    fireEvent.change(within(orderDialog).getByLabelText('ระดับความหวาน'), {
      target: { value: 'หวานปกติ 75%' },
    });
    fireEvent.click(within(orderDialog).getByRole('button', { name: 'สั่งซื้อ' }));
    fireEvent.click(await within(orderDialog).findByRole('button', { name: 'ตรวจสอบ Order' }));
    fireEvent.click(
      await within(orderDialog).findByRole('button', { name: 'ยืนยัน Order เพื่อชำระเงิน' }),
    );
    fireEvent.click(
      await within(orderDialog).findByRole('button', { name: 'จำลองชำระเงินสำเร็จ' }),
    );
    fireEvent.click(await within(orderDialog).findByRole('button', { name: 'ไปหน้า Status' }));

    expect(await screen.findByRole('heading', { name: 'ชาเขียว' })).toBeInTheDocument();
    const orderCard = screen.getByText('Order: 001').closest('article');
    expect(orderCard).toHaveTextContent('รอรับ Order');
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
