import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import AppShell from '../AppShell.jsx';

const menuItem = {
  id: 1,
  name: 'ชาเขียว',
  price: 50,
  description: 'ชาเขียว',
  status: 'open',
};

describe('AC-MENU-08 and AC-MENU-09 customer login flow', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === '/api/menu') {
        return { ok: true, json: async () => [menuItem] };
      }
      if (url === '/api/promotions/active') {
        return { ok: true, json: async () => [] };
      }
      return { ok: false, json: async () => [] };
    }));
  });

  test('test_AC_MENU_08_registering_from_customer_returns_selected_menu_to_order', async () => {
    render(<AppShell />);

    fireEvent.click(await screen.findByRole('button', { name: 'สั่งซื้อ' }));
    expect(await screen.findByRole('region', { name: 'เมนูที่เลือกไว้' }))
      .toHaveTextContent('กรุณาเข้าสู่ระบบก่อนเพิ่ม ชาเขียว');

    fireEvent.change(screen.getByLabelText('อีเมล'), {
      target: { value: 'customer@example.com' },
    });
    fireEvent.change(screen.getByLabelText('รหัสผ่าน', { selector: '#register-password' }), {
      target: { value: 'valid-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'สมัครสมาชิก' }));

    expect(await screen.findByText('ชาเขียว', { selector: '.customer-page__order-list span' }))
      .toBeInTheDocument();
  });

  test('test_AC_MENU_09_canceling_login_discards_the_selected_menu', async () => {
    render(<AppShell />);

    fireEvent.click(await screen.findByRole('button', { name: 'สั่งซื้อ' }));
    fireEvent.click(within(await screen.findByRole('region', { name: 'เมนูที่เลือกไว้' }))
      .getByRole('button', { name: 'ยกเลิกและกลับไปหน้าเมนู' }));

    expect(await screen.findByText('ยังไม่มีเมนูใน Order')).toBeInTheDocument();
    expect(screen.queryByText('กรุณาเข้าสู่ระบบก่อนเพิ่ม ชาเขียว')).not.toBeInTheDocument();
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
    expect(screen.queryByText('กรุณาเข้าสู่ระบบก่อนเพิ่ม ชาเขียว')).not.toBeInTheDocument();
    expect(screen.getByText('ยังไม่มีเมนูใน Order')).toBeInTheDocument();
  });
});
