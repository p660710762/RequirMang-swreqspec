import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import StaffOrdersPage from '../pages/StaffOrdersPage.jsx';
import { getStaffOrderDetails, getStaffOrders } from '../api/client.js';

vi.mock('../api/client.js', () => ({
  getStaffOrderDetails: vi.fn(),
  getStaffOrders: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
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
    expect(getStaffOrderDetails).toHaveBeenCalledWith('006');
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
});
