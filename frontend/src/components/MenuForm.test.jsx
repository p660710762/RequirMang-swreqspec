import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MenuForm from './MenuForm.jsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('MenuForm', () => {
  it('test_AC_MENU_MGMT_02_admin_can_add_menu_item', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ menu_id: 8 });
    render(<MenuForm onSubmit={onSubmit} />);

    expect(screen.getByRole('button', { name: 'เลือกไฟล์รูปภาพ' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/ชื่อเมนู/), { target: { value: 'ชาไทย' } });
    fireEvent.change(screen.getByLabelText(/ราคา \(บาท\)/), { target: { value: '45' } });
    fireEvent.change(screen.getByLabelText(/รายละเอียด/), { target: { value: 'ชาหอม' } });
    fireEvent.click(screen.getByRole('button', { name: 'บันทึกเมนู' }));

    expect(await screen.findByRole('status')).toHaveTextContent('บันทึกเมนูสำเร็จ');
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'ชาไทย',
      price: 45,
      status: 'open',
      description: 'ชาหอม',
      image_url: null,
    });
  });

  it('test_AC_MENU_MGMT_05_validation_before_save', () => {
    const onSubmit = vi.fn();
    render(<MenuForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/ชื่อเมนู/), { target: { value: 'ชาไทย' } });
    fireEvent.click(screen.getByRole('button', { name: 'บันทึกเมนู' }));

    expect(screen.getByRole('alert')).toHaveTextContent('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('test_AC_MENU_MGMT_11_invalid_data_is_rejected', () => {
    const onSubmit = vi.fn();
    render(<MenuForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/ชื่อเมนู/), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText(/ราคา \(บาท\)/), { target: { value: '45' } });
    fireEvent.click(screen.getByRole('button', { name: 'บันทึกเมนู' }));

    expect(screen.getByRole('alert')).toHaveTextContent('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('test_AC_MENU_MGMT_05_price_must_be_positive', () => {
    const onSubmit = vi.fn();
    render(<MenuForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/ชื่อเมนู/), { target: { value: 'ชาไทย' } });
    fireEvent.change(screen.getByLabelText(/ราคา \(บาท\)/), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'บันทึกเมนู' }));

    expect(screen.getByRole('alert')).toHaveTextContent('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('test_AC_MENU_MGMT_02_accepts_image_browse_file', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ menu_id: 9 });
    vi.stubGlobal('FileReader', class {
      readAsDataURL() {
        this.result = 'data:image/png;base64,preview';
        this.onload();
      }
    });
    render(<MenuForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/ชื่อเมนู/), { target: { value: 'ชาไทย' } });
    fireEvent.change(screen.getByLabelText(/ราคา \(บาท\)/), { target: { value: '45' } });
    fireEvent.change(screen.getByLabelText('เลือกรูปภาพ'), {
      target: { files: [new File(['image'], 'tea.png', { type: 'image/png' })] },
    });
    expect(await screen.findByAltText('ตัวอย่างรูปภาพเมนู')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'บันทึกเมนู' }));
    expect(await screen.findByRole('status')).toHaveTextContent('บันทึกเมนูสำเร็จ');
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      image_url: 'data:image/png;base64,preview',
    }));
  });

  it('test_AC_MENU_MGMT_02_cancel_does_not_submit', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    render(<MenuForm onSubmit={onSubmit} onCancel={onCancel} />);

    fireEvent.change(screen.getByLabelText(/ชื่อเมนู/), { target: { value: 'ชาไทย' } });
    fireEvent.click(screen.getByRole('button', { name: 'ยกเลิก' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
