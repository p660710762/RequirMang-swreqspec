import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MenuEditPanel from './MenuEditPanel.jsx';

afterEach(cleanup);

describe('MenuEditPanel', () => {
  it('test_AC_MENU_MGMT_03_admin_can_edit_menu_details', async () => {
    const onSubmit = vi.fn().mockResolvedValue({});
    render(
      <MenuEditPanel
        menuItem={{ menu_id: 1, name: 'ชาไทย', price: 45, description: 'เดิม' }}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('ราคา (บาท)'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('รายละเอียด'), { target: { value: 'หวานน้อย' } });
    fireEvent.click(screen.getByRole('button', { name: 'บันทึกการแก้ไข' }));

    expect(await screen.findByRole('status')).toHaveTextContent('บันทึกข้อมูลสำเร็จ');
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      price: 50,
      description: 'หวานน้อย',
    }));
  });

  it('test_AC_MENU_MGMT_06_successful_update_is_persisted', async () => {
    const onSubmit = vi.fn().mockResolvedValue({});
    render(
      <MenuEditPanel
        menuItem={{ menu_id: 2, name: 'โกโก้', price: 50 }}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('ชื่อโปรโมชั่น'), { target: { value: 'ลดพิเศษ' } });
    fireEvent.change(screen.getByLabelText('วันเริ่มต้น', { selector: 'input' }), {
      target: { value: '2026-11-01T10:30' },
    });
    fireEvent.change(screen.getByLabelText('วันสิ้นสุด', { selector: 'input' }), {
      target: { value: '2026-11-30T18:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'บันทึกการแก้ไข' }));

    expect(await screen.findByRole('status')).toHaveTextContent('บันทึกข้อมูลสำเร็จ');
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      promotion: expect.objectContaining({ promotion_name: 'ลดพิเศษ' }),
    }));
  });

  it('test_TC_MENU_MGMT_06_2_successful_update_with_minimum_fields', async () => {
    const onSubmit = vi.fn().mockResolvedValue({});
    render(
      <MenuEditPanel
        menuItem={{ menu_id: 11, name: 'กาแฟเดิม', price: 35 }}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('ชื่อเมนู'), { target: { value: 'กาแฟใหม่' } });
    fireEvent.change(screen.getByLabelText('ราคา (บาท)'), { target: { value: '40' } });
    fireEvent.click(screen.getByRole('button', { name: 'บันทึกการแก้ไข' }));

    expect(await screen.findByRole('status')).toHaveTextContent('บันทึกข้อมูลสำเร็จ');
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: 'กาแฟใหม่',
      price: 40,
      description: null,
      image_url: null,
      promotion: null,
    }));
  });

  it('test_AC_MENU_MGMT_03_promotion_datetime_picker_sends_timezone', async () => {
    const onSubmit = vi.fn().mockResolvedValue({});
    render(
      <MenuEditPanel
        menuItem={{ menu_id: 3, name: 'ชาเขียว', price: 40 }}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /กรุณาเลือกวันเริ่มต้นและเวลา/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /กรุณาเลือกวันสิ้นสุดและเวลา/ })).toBeInTheDocument();
    expect(screen.getByLabelText('วันเริ่มต้น', { selector: 'input' })).not.toHaveAttribute('min');
    expect(screen.getByLabelText('วันสิ้นสุด', { selector: 'input' })).not.toHaveAttribute('min');
    fireEvent.change(screen.getByLabelText('วันเริ่มต้น', { selector: 'input' }), {
      target: { value: '2026-11-01T10:30' },
    });

    fireEvent.change(screen.getByLabelText('วันสิ้นสุด', { selector: 'input' }), {
      target: { value: '2026-11-30T18:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'บันทึกการแก้ไข' }));

    expect(await screen.findByRole('status')).toHaveTextContent('บันทึกข้อมูลสำเร็จ');
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      promotion: expect.objectContaining({
        start_at: expect.stringMatching(/^2026-11-01T10:30:00[+-]\d{2}:\d{2}$/),
        end_at: expect.stringMatching(/^2026-11-30T18:00:00[+-]\d{2}:\d{2}$/),
      }),
    }));
  });

  it('test_TC_MENU_MGMT_15_1_promotion_datetime_is_displayed_in_thai_buddhist_calendar', () => {
    render(
      <MenuEditPanel
        menuItem={{
          menu_id: 7,
          name: 'ชาเขียว',
          price: 40,
          promotion: {
            promotion_name: 'ลดพิเศษ',
            discount_value: 5,
            start_at: '2026-11-01T10:00:00+07:00',
            end_at: '2026-11-30T10:00:00+07:00',
          },
        }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('button', { name: /พ\.ย\. 2569/ })).toHaveLength(2);
  });

  it('test_AC_MENU_MGMT_03_clear_promotion_fields_and_save', async () => {
    const onSubmit = vi.fn().mockResolvedValue({});
    render(
      <MenuEditPanel
        menuItem={{
          menu_id: 4,
          name: 'ชานม',
          price: 40,
          promotion: {
            promotion_name: 'ลดพิเศษ',
            discount_value: 5,
            start_at: '2026-11-01T10:00:00+07:00',
            end_at: '2026-11-30T10:00:00+07:00',
          },
        }}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue('ลดพิเศษ')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'ล้างข้อมูลโปรโมชั่น' }));
    fireEvent.click(screen.getByRole('button', { name: 'บันทึกการแก้ไข' }));

    expect(screen.queryByDisplayValue('ลดพิเศษ')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /กรุณาเลือกวันเริ่มต้นและเวลา/ })).toBeInTheDocument();
    expect(await screen.findByRole('status')).toHaveTextContent('บันทึกข้อมูลสำเร็จ');
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ promotion: null }));
  });

  it('test_AC_MENU_MGMT_03_rejects_discount_above_price', async () => {
    const onSubmit = vi.fn();
    render(
      <MenuEditPanel
        menuItem={{ menu_id: 5, name: 'กาแฟ', price: 50 }}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('ส่วนลด'), { target: { value: '60' } });
    fireEvent.click(screen.getByRole('button', { name: 'บันทึกการแก้ไข' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('ส่วนลดต้องไม่มากกว่าราคาเมนู');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('test_AC_MENU_MGMT_03_requires_both_promotion_dates', async () => {
    const onSubmit = vi.fn();
    render(
      <MenuEditPanel
        menuItem={{ menu_id: 6, name: 'กาแฟ', price: 50 }}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('ชื่อโปรโมชั่น'), { target: { value: 'ลดพิเศษ' } });
    fireEvent.click(screen.getByRole('button', { name: 'บันทึกการแก้ไข' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('กรุณาเลือกวันเริ่มต้นและวันสิ้นสุดของโปรโมชั่น');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('test_AC_MENU_MGMT_03_requires_promotion_name_for_discount', async () => {
    const onSubmit = vi.fn();
    render(
      <MenuEditPanel
        menuItem={{ menu_id: 8, name: 'กาแฟ', price: 50 }}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('ส่วนลด'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'บันทึกการแก้ไข' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('กรุณาระบุชื่อโปรโมชั่น');
    expect(onSubmit).not.toHaveBeenCalled();
  });

});
