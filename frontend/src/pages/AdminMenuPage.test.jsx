import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AdminMenuPage from './AdminMenuPage.jsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AdminMenuPage', () => {
  it('test_AC_MENU_MGMT_01_admin_can_view_menu_list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{
        menu_id: 1,
        name: 'เมนูทดสอบ',
        description: 'รายละเอียดเมนู',
        image_url: null,
        price: 45,
        status: 'open',
      }],
    }));

    render(<AdminMenuPage />);

    expect(await screen.findByRole('heading', { name: 'เมนูทดสอบ' })).toBeInTheDocument();
    expect(screen.getByText('รายละเอียดเมนู')).toBeInTheDocument();
    expect(screen.getByText('เปิดขาย', { selector: '.status-badge' })).toBeInTheDocument();
    expect(screen.getByText(/45/)).toBeInTheDocument();
  });

  it('test_AC_MENU_MGMT_02_admin_can_add_menu_item', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          menu_id: 2,
          name: 'ชาไทย',
          description: null,
          image_url: null,
          price: 45,
          status: 'open',
        }),
      }));

    render(<AdminMenuPage />);

    fireEvent.click(await screen.findByRole('button', { name: '+ เพิ่มเมนูตัวอย่าง' }));
    fireEvent.change(await screen.findByLabelText(/ชื่อเมนู/), { target: { value: 'ชาไทย' } });
    fireEvent.change(screen.getByLabelText(/ราคา \(บาท\)/), { target: { value: '45' } });
    fireEvent.click(screen.getByRole('button', { name: 'บันทึกเมนู' }));

    expect(await screen.findByRole('heading', { name: 'ชาไทย' })).toBeInTheDocument();
    expect(screen.getByText('เปิดขาย', { selector: '.status-badge' })).toBeInTheDocument();
  });

  it('test_AC_MENU_MGMT_04_admin_can_change_status', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          menu_id: 3,
          name: 'ชาเขียว',
          description: null,
          image_url: null,
          price: 40,
          status: 'open',
        }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          menu_id: 3,
          name: 'ชาเขียว',
          description: null,
          image_url: null,
          price: 40,
          status: 'sold_out',
        }),
      }));

    render(<AdminMenuPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'ตั้งเป็นหมด' }));

    expect(await screen.findByText(/หมด/, { selector: '.menu-row__summary' })).toBeInTheDocument();
    expect(fetch).toHaveBeenLastCalledWith('/api/admin/menu/3/status', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ status: 'sold_out' }),
    }));
  });
});