import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import StaffOrdersPage from '../pages/StaffOrdersPage.jsx';
import {
  getStaffOrderDetails,
  getStaffOrders,
  updateStaffOrderStatus,
} from '../api/client.js';

vi.mock('../api/client.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getStaffOrderDetails: vi.fn(),
    getStaffOrders: vi.fn(),
    updateStaffOrderStatus: vi.fn(),
  };
});

afterEach(() => {
  cleanup();
  getStaffOrderDetails.mockReset();
  getStaffOrders.mockReset();
  updateStaffOrderStatus.mockReset();
  vi.clearAllMocks();
  vi.restoreAllMocks();
  window.history.replaceState({}, '', '/');
});

describe('StaffOrdersPage', () => {
  it('test_AC_STAFF_ORDER_02_show_order_number_and_sequence', async () => {
    getStaffOrders.mockResolvedValue([
      {
        order_id: '006',
        order_number: '006',
        sequence_no: 2,
        created_at: '2026-10-27T09:00:00+00:00',
        status: 'waiting',
      },
      {
        order_id: '005',
        order_number: '005',
        sequence_no: 1,
        created_at: '2026-10-27T08:50:00+00:00',
        status: 'preparing',
      },
    ]);

    render(<StaffOrdersPage />);

    expect(await screen.findByRole('heading', { name: 'Order #006' })).toBeInTheDocument();
    expect(screen.getByText((_, element) => (
      element.tagName === 'P' && element.textContent === 'ลำดับคิว · 2'
    ))).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Order #005' })).toBeInTheDocument();
    expect(screen.getByText((_, element) => (
      element.tagName === 'P' && element.textContent === 'ลำดับคิว · 1'
    ))).toBeInTheDocument();
    expect(getStaffOrders).toHaveBeenCalledOnce();
  });

  it('test_AC_STAFF_ORDER_03_show_order_details_items_and_options', async () => {
    getStaffOrders.mockResolvedValue([
      {
        order_id: '006',
        order_number: '006',
        order_date: '2026-10-27',
        sequence_no: 2,
      },
    ]);
    getStaffOrderDetails.mockResolvedValue({
      order_id: '006',
      items: [
        {
          order_item_id: 'item-1',
          menu_item_name: 'ชาไทย',
          quantity: 2,
          selected_options: ['หวานน้อย', 'ไม่ใส่น้ำแข็ง'],
        },
        {
          order_item_id: 'item-2',
          menu_item_name: 'กาแฟเย็น',
          quantity: 1,
          selected_options: ['หวานปกติ'],
        },
      ],
    });

    render(<StaffOrdersPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'ดูรายละเอียด' }));

    expect(await screen.findByText('ชาไทย')).toBeInTheDocument();
    expect(screen.getByText('จำนวน 2')).toBeInTheDocument();
    expect(screen.getByText('ตัวเลือก หวานน้อย, ไม่ใส่น้ำแข็ง')).toBeInTheDocument();
    expect(screen.getByText('กาแฟเย็น')).toBeInTheDocument();
    expect(screen.getByText('จำนวน 1')).toBeInTheDocument();
    expect(screen.getByText('ตัวเลือก หวานปกติ')).toBeInTheDocument();
    expect(getStaffOrderDetails).toHaveBeenCalledWith('006', '2026-10-27');
  });

  it('test_AC_STAFF_ORDER_04_show_current_status_for_each_order', async () => {
    getStaffOrders.mockResolvedValue([
      {
        order_id: '006',
        order_number: '006',
        sequence_no: 2,
        status: 'waiting',
      },
      {
        order_id: '005',
        order_number: '005',
        sequence_no: 1,
        status: 'preparing',
      },
    ]);

    render(<StaffOrdersPage />);

    expect(await screen.findByText((_, element) => (
      element.tagName === 'P' && element.textContent === 'สถานะ · waiting'
    ))).toBeInTheDocument();
    expect(screen.getByText((_, element) => (
      element.tagName === 'P' && element.textContent === 'สถานะ · preparing'
    ))).toBeInTheDocument();
    expect(getStaffOrders).toHaveBeenCalledOnce();
  });

  it('test_AC_STATUS_01_staff_updates_order_status_to_next_step', async () => {
    getStaffOrders
      .mockResolvedValueOnce([{
        order_id: '006',
        order_number: '006',
        order_date: '2026-10-27',
        sequence_no: 1,
        status: 'PENDING_ACCEPT',
      }])
      .mockResolvedValueOnce([{
        order_id: '006',
        order_number: '006',
        order_date: '2026-10-27',
        sequence_no: 1,
        status: 'PREPARING',
      }]);
    updateStaffOrderStatus.mockResolvedValue({
      order_id: '006',
      order_date: '2026-10-27',
      status: 'PREPARING',
    });

    render(<StaffOrdersPage />);

    const statusSelector = await screen.findByRole('combobox', {
      name: 'อัปเดตสถานะ Order 006',
    });
    expect(within(statusSelector).getAllByRole('option').map((option) => (
      option.textContent
    ))).toEqual([
      'รอรับคำสั่งซื้อ',
      'กำลังจัดทำ',
      'พร้อมรับสินค้า',
      'รับสินค้าแล้ว',
    ]);
    expect(within(statusSelector).getByRole('option', {
      name: 'พร้อมรับสินค้า',
    })).toBeDisabled();

    fireEvent.change(statusSelector, { target: { value: 'PREPARING' } });

    expect(await screen.findByText((_, element) => (
      element.tagName === 'P' && element.textContent === 'สถานะ · กำลังจัดทำ'
    ))).toBeInTheDocument();
    expect(updateStaffOrderStatus).toHaveBeenCalledWith(
      '006',
      '2026-10-27',
      'PREPARING',
    );
    expect(getStaffOrders).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('combobox', { name: 'อัปเดตสถานะ Order 006' }))
      .toHaveValue('PREPARING');
  });

  it('test_AC_STAFF_ORDER_05_queue_is_sorted_by_created_time', async () => {
    getStaffOrders.mockResolvedValue([
      {
        order_id: '004',
        order_number: '004',
        sequence_no: 3,
        created_at: '2026-10-27T09:00:00+00:00',
        status: 'waiting',
      },
      {
        order_id: '003',
        order_number: '003',
        sequence_no: 2,
        created_at: '2026-10-27T08:00:00+00:00',
        status: 'preparing',
      },
      {
        order_id: '002',
        order_number: '002',
        sequence_no: 4,
        created_at: '2026-10-27T10:00:00+00:00',
        status: 'ยกเลิก',
      },
      {
        order_id: '001',
        order_number: '001',
        sequence_no: 1,
        created_at: '2026-10-27T07:00:00+00:00',
        status: 'picked_up',
      },
    ]);

    render(<StaffOrdersPage />);

    await screen.findByRole('heading', { name: 'Order #004' });
    const displayedOrderNumbers = screen
      .getAllByRole('heading', { name: /^Order #/ })
      .map((heading) => heading.textContent);

    expect(displayedOrderNumbers).toEqual([
      'Order #004',
      'Order #003',
      'Order #002',
      'Order #001',
    ]);
    expect(getStaffOrders).toHaveBeenCalledOnce();
  });

  it('test_AC_STAFF_ORDER_06_show_empty_state_when_no_new_orders', async () => {
    getStaffOrders.mockResolvedValue([]);

    render(<StaffOrdersPage />);

    const emptyState = await screen.findByText('ไม่มีรายการ Order ใหม่');

    expect(emptyState).toHaveAttribute('role', 'status');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(getStaffOrders).toHaveBeenCalledOnce();
  });

  it('test_AC_STAFF_ORDER_07_show_retry_when_load_fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    getStaffOrders
      .mockRejectedValueOnce(new Error('Staff orders request failed (503)'))
      .mockResolvedValueOnce([
        {
          order_id: '006',
          order_number: '006',
          sequence_no: 1,
          status: 'waiting',
        },
      ]);

    render(<StaffOrdersPage />);

    const errorMessage = await screen.findByText('ไม่สามารถโหลดรายการ Order ได้');
    expect(errorMessage).toHaveAttribute('role', 'alert');

    fireEvent.click(screen.getByRole('button', { name: 'ลองใหม่' }));

    expect(await screen.findByRole('heading', { name: 'Order #006' }))
      .toBeInTheDocument();
    expect(getStaffOrders).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('test_AC_STAFF_ORDER_09_order_number_sequence_status_are_visible', async () => {
    getStaffOrders.mockResolvedValue([
      {
        order_id: '006',
        order_number: '006',
        sequence_no: 2,
        status: 'waiting',
      },
      {
        order_id: '005',
        order_number: '005',
        sequence_no: 1,
        status: 'preparing',
      },
    ]);

    render(<StaffOrdersPage />);

    const firstOrder = await screen.findByRole('heading', { name: 'Order #006' });
    const firstOrderCard = firstOrder.closest('article');
    const secondOrder = screen.getByRole('heading', { name: 'Order #005' });
    const secondOrderCard = secondOrder.closest('article');

    expect(firstOrderCard).not.toBeNull();
    expect(secondOrderCard).not.toBeNull();
    expect(within(firstOrderCard).getByText((_, element) => (
      element.tagName === 'P' && element.textContent === 'ลำดับคิว · 2'
    ))).toBeInTheDocument();
    expect(within(firstOrderCard).getByText((_, element) => (
      element.tagName === 'P' && element.textContent === 'สถานะ · waiting'
    ))).toBeInTheDocument();
    expect(within(secondOrderCard).getByText((_, element) => (
      element.tagName === 'P' && element.textContent === 'ลำดับคิว · 1'
    ))).toBeInTheDocument();
    expect(within(secondOrderCard).getByText((_, element) => (
      element.tagName === 'P' && element.textContent === 'สถานะ · preparing'
    ))).toBeInTheDocument();
    expect(getStaffOrders).toHaveBeenCalledOnce();
  });

  it('opens the Staff Orders page at its application route', async () => {
    const { default: AppShell } = await import('../AppShell.jsx');
    getStaffOrders.mockResolvedValue([]);
    window.history.replaceState({}, '', '/staff/orders');

    render(<AppShell />);

    expect(await screen.findByRole('heading', { name: 'รายการ Order' }))
      .toBeInTheDocument();
    expect(getStaffOrders).toHaveBeenCalledOnce();
  });

  it('test_TC_STAFF_ORDER_01_1_staff_sees_customer_orders', async () => {
    // Given มี Order อยู่ในระบบ และผู้ใช้เป็นพนักงานที่มีสิทธิ์
    getStaffOrders.mockResolvedValue([
      { order_id: '006', status: 'PENDING_ACCEPT' },
      { order_id: '005', status: 'PREPARING' },
    ]);

    // When พนักงานเปิดหน้ารายการ Order
    render(<StaffOrdersPage />);

    // Then ระบบแสดงรายการ Order ที่ลูกค้าสั่งเข้ามา โดยรายการที่เตรียมไว้ปรากฏในหน้ารายการ
    expect(await screen.findByRole('region', { name: 'รายการ Order' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Order #006' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Order #005' })).toBeInTheDocument();
  });

  it('test_TC_STAFF_ORDER_01_2_staff_sees_single_customer_order', async () => {
    // Given มี Order อยู่ในระบบ 1 รายการ และผู้ใช้เป็นพนักงานที่มีสิทธิ์
    getStaffOrders.mockResolvedValue([
      { order_id: '006', status: 'PENDING_ACCEPT' },
    ]);

    // When พนักงานเปิดหน้ารายการ Order
    render(<StaffOrdersPage />);

    // Then ระบบแสดงรายการ Order ที่ลูกค้าสั่งเข้ามา และรายการนั้นปรากฏในหน้ารายการ
    expect(await screen.findByRole('region', { name: 'รายการ Order' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Order #006' })).toBeInTheDocument();
  });

  it('test_TC_STAFF_ORDER_01_3_staff_sees_empty_order_state', async () => {
    // Given ไม่มี Order อยู่ในระบบ และผู้ใช้เป็นพนักงานที่มีสิทธิ์
    getStaffOrders.mockResolvedValue([]);

    // When พนักงานเปิดหน้ารายการ Order
    render(<StaffOrdersPage />);

    // Then ระบบแสดงข้อความหรือสถานะว่าไม่มีรายการ Order ใหม่ (อ้าง AC-STAFF-ORDER-06)
    const emptyState = await screen.findByText('ไม่มีรายการ Order ใหม่');
    expect(emptyState).toHaveAttribute('role', 'status');
  });

  it('test_TC_STAFF_ORDER_02_1_staff_sees_order_numbers_and_sequences', async () => {
    // Given ระบบมีรายการ Order
    getStaffOrders.mockResolvedValue([
      {
        order_id: '006',
        order_number: '006',
        sequence_no: 2,
        status: 'PENDING_ACCEPT',
      },
      {
        order_id: '005',
        order_number: '005',
        sequence_no: 1,
        status: 'PREPARING',
      },
    ]);

    // When พนักงานเปิดหน้ารายการ Order
    render(<StaffOrdersPage />);

    // Then ระบบแสดงหมายเลข Order และลำดับของแต่ละ Order โดยเห็นข้อมูลทั้งสองส่วนในรายการอย่างชัดเจน
    const firstOrder = await screen.findByRole('heading', { name: 'Order #006' });
    const secondOrder = screen.getByRole('heading', { name: 'Order #005' });

    expect(firstOrder).toBeVisible();
    expect(within(firstOrder.closest('article')).getByText((_, element) => (
      element.tagName === 'P' && element.textContent === 'ลำดับคิว · 2'
    ))).toBeVisible();
    expect(secondOrder).toBeVisible();
    expect(within(secondOrder.closest('article')).getByText((_, element) => (
      element.tagName === 'P' && element.textContent === 'ลำดับคิว · 1'
    ))).toBeVisible();
  });

  it('test_TC_STAFF_ORDER_02_2_staff_sees_number_and_sequence_for_single_order', async () => {
    // Given ระบบมีรายการ Order 1 รายการ
    getStaffOrders.mockResolvedValue([
      {
        order_id: '006',
        order_number: '006',
        sequence_no: 1,
        status: 'PENDING_ACCEPT',
      },
    ]);

    // When พนักงานเปิดหน้ารายการ Order
    render(<StaffOrdersPage />);

    // Then ระบบแสดงหมายเลข Order และลำดับของ Order รายการนั้นอย่างชัดเจน
    const orderNumber = await screen.findByRole('heading', { name: 'Order #006' });
    expect(orderNumber).toBeVisible();
    expect(within(orderNumber.closest('article')).getByText((_, element) => (
      element.tagName === 'P' && element.textContent === 'ลำดับคิว · 1'
    ))).toBeVisible();
  });

  it('test_TC_STAFF_ORDER_02_3_staff_sees_empty_state_without_orders', async () => {
    // Given ระบบไม่มีรายการ Order
    getStaffOrders.mockResolvedValue([]);

    // When พนักงานเปิดหน้ารายการ Order
    render(<StaffOrdersPage />);

    // Then ระบบแสดงข้อความหรือสถานะว่าไม่มีรายการ Order ใหม่ (อ้าง AC-STAFF-ORDER-06);
    // spec ไม่ได้ระบุว่าจะแสดงหมายเลขหรือลำดับเมื่อไม่มี Order
    const emptyState = await screen.findByText('ไม่มีรายการ Order ใหม่');
    expect(emptyState).toHaveAttribute('role', 'status');
  });

  it('test_TC_STAFF_ORDER_03_1_staff_sees_order_items_quantities_and_options', async () => {
    // Given พนักงานเลือกหรือเปิดดู Order
    getStaffOrders.mockResolvedValue([{
      order_id: '006',
      order_number: '006',
      order_date: '2026-10-27',
      sequence_no: 1,
    }]);
    getStaffOrderDetails.mockResolvedValue({
      order_id: '006',
      items: [
        {
          order_item_id: 'item-1',
          menu_item_name: 'ชาไทย',
          quantity: 2,
          selected_options: ['หวานน้อย', 'ไม่ใส่น้ำแข็ง'],
        },
        {
          order_item_id: 'item-2',
          menu_item_name: 'กาแฟเย็น',
          quantity: 1,
          selected_options: ['หวานปกติ'],
        },
      ],
    });

    // When ระบบโหลดรายละเอียด Order สำเร็จ
    render(<StaffOrdersPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'ดูรายละเอียด' }));

    // Then ระบบแสดงรายการเครื่องดื่ม จำนวน และตัวเลือกของเครื่องดื่มอย่างถูกต้อง
    expect(await screen.findByText('ชาไทย')).toBeVisible();
    expect(screen.getByText('จำนวน 2')).toBeVisible();
    expect(screen.getByText('ตัวเลือก หวานน้อย, ไม่ใส่น้ำแข็ง')).toBeVisible();
    expect(screen.getByText('กาแฟเย็น')).toBeVisible();
    expect(screen.getByText('จำนวน 1')).toBeVisible();
    expect(screen.getByText('ตัวเลือก หวานปกติ')).toBeVisible();
  });

  it('test_TC_STAFF_ORDER_03_2_staff_sees_single_order_item_details', async () => {
    // Given พนักงานเลือกหรือเปิดดู Order ที่มีรายการเครื่องดื่มหนึ่งรายการ พร้อมจำนวนและตัวเลือกที่ลูกค้าสั่ง
    getStaffOrders.mockResolvedValue([{
      order_id: '006',
      order_number: '006',
      order_date: '2026-10-27',
      sequence_no: 1,
    }]);
    getStaffOrderDetails.mockResolvedValue({
      order_id: '006',
      items: [
        {
          order_item_id: 'item-1',
          menu_item_name: 'ชาไทย',
          quantity: 1,
          selected_options: ['หวานน้อย', 'ไม่ใส่น้ำแข็ง'],
        },
      ],
    });

    // When ระบบโหลดรายละเอียด Order สำเร็จ
    render(<StaffOrdersPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'ดูรายละเอียด' }));

    // Then ระบบแสดงรายการเครื่องดื่ม จำนวน และตัวเลือกของเครื่องดื่มรายการนั้นอย่างถูกต้อง
    expect(await screen.findByText('ชาไทย')).toBeVisible();
    expect(screen.getByText('จำนวน 1')).toBeVisible();
    expect(screen.getByText('ตัวเลือก หวานน้อย, ไม่ใส่น้ำแข็ง')).toBeVisible();
  });

  it('test_TC_STAFF_ORDER_03_4_hides_unconfirmed_order_details', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Given พนักงานเลือกหรือเปิดดู Order
    getStaffOrders.mockResolvedValue([{
      order_id: '006',
      order_number: '006',
      order_date: '2026-10-27',
      sequence_no: 1,
    }]);
    getStaffOrderDetails.mockRejectedValue(new Error('Order details request failed'));

    // When ระบบไม่สามารถโหลดรายละเอียด Order ได้
    render(<StaffOrdersPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'ดูรายละเอียด' }));

    // Then ระบบไม่แสดงข้อมูล Order ที่ไม่สมบูรณ์หรือไม่ยืนยัน (อ้าง Constraint)
    await screen.findByText('ไม่สามารถโหลดรายละเอียด Order ได้');
    expect(screen.queryByText('ชาไทย')).not.toBeInTheDocument();
    expect(screen.queryByText('จำนวน 1')).not.toBeInTheDocument();
    expect(screen.queryByText('ตัวเลือก หวานน้อย')).not.toBeInTheDocument();
  });
});
