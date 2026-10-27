import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import StatusToggle from './StatusToggle.jsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('StatusToggle', () => {
  it('test_AC_MENU_MGMT_04_admin_can_change_status', () => {
    const onChange = vi.fn();
    vi.stubGlobal('confirm', vi.fn(() => true));
    render(<StatusToggle status="open" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'ตั้งเป็นหมด' }));

    expect(window.confirm).toHaveBeenCalledWith('ยืนยันเปลี่ยนสถานะเมนูใช่หรือไม่');
    expect(onChange).toHaveBeenCalledWith('sold_out');
  });

  it('test_AC_MENU_MGMT_04_open_status_also_requires_confirmation', () => {
    const onChange = vi.fn();
    vi.stubGlobal('confirm', vi.fn(() => true));
    render(<StatusToggle status="sold_out" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'ตั้งเป็นเปิดขาย' }));

    expect(window.confirm).toHaveBeenCalledWith('ยืนยันเปลี่ยนสถานะเมนูใช่หรือไม่');
    expect(onChange).toHaveBeenCalledWith('open');
  });

  it('test_AC_MENU_MGMT_09_admin_can_mark_menu_as_not_for_sale', () => {
    const onChange = vi.fn();
    vi.stubGlobal('confirm', vi.fn(() => false));
    render(<StatusToggle status="open" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'ตั้งเป็นหมด' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('test_AC_MENU_MGMT_10_status_save_failure_is_reported', async () => {
    const onChange = vi.fn().mockRejectedValue(new Error('บันทึกสถานะไม่สำเร็จ'));
    vi.stubGlobal('confirm', vi.fn(() => true));
    render(<StatusToggle status="open" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'ตั้งเป็นหมด' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('บันทึกสถานะไม่สำเร็จ');
  });
});
