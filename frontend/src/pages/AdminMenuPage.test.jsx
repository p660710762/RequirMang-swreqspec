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

  it('test_AC_MENU_MGMT_06_successful_update_is_persisted_and_shows_success_toast', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          menu_id: 1,
          name: 'ชาไทย',
          description: 'เดิม',
          image_url: null,
          price: 45,
          status: 'open',
        }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          menu_id: 1,
          name: 'ชาไทย',
          description: 'อัปเดตแล้ว',
          image_url: null,
          price: 60,
          status: 'open',
        }),
      }));

    render(<AdminMenuPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'แก้ไข' }));
    fireEvent.change(screen.getByLabelText('ราคา (บาท)'), { target: { value: '60' } });
    fireEvent.change(screen.getByLabelText('รายละเอียด'), { target: { value: 'อัปเดตแล้ว' } });
    fireEvent.click(screen.getByRole('button', { name: 'บันทึกการแก้ไข' }));

    expect(await screen.findByText('บันทึกข้อมูลสำเร็จ')).toBeInTheDocument();
    expect(screen.getByText('อัปเดตแล้ว')).toBeInTheDocument();
  });

  it('test_AC_MENU_MGMT_08_admin_can_delete_menu_with_archive_kept', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          menu_id: 9,
          name: 'เมนูลบ',
          description: 'ต้องลบ',
          image_url: null,
          price: 30,
          status: 'open',
        }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ menu_id: 9, deleted: true, status: 'deleted' }),
      }));

    render(<AdminMenuPage />);

    fireEvent.click((await screen.findAllByRole('button', { name: 'ลบ' }))[0]);
    fireEvent.click(await screen.findByRole('button', { name: 'ลบเมนู' }));

    expect(await screen.findByText('ลบเมนูสำเร็จ')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'เมนูลบ' })).not.toBeInTheDocument();
    expect(fetch).toHaveBeenLastCalledWith('/api/admin/menu/9', expect.objectContaining({ method: 'DELETE' }));
  });

  it('test_AC_MENU_MGMT_12_save_failure_not_marked_as_success_and_shows_error_toast', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          menu_id: 1,
          name: 'ชาไทย',
          description: 'เดิม',
          image_url: null,
          price: 45,
          status: 'open',
        }],
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'ไม่สามารถบันทึกข้อมูลได้' }),
      }));

    render(<AdminMenuPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'แก้ไข' }));
    fireEvent.click(screen.getByRole('button', { name: 'บันทึกการแก้ไข' }));

    expect((await screen.findAllByText('ไม่สามารถบันทึกข้อมูลได้')).length).toBeGreaterThan(0);
    expect(screen.queryByText('อัปเดตแล้ว')).not.toBeInTheDocument();
  });
});