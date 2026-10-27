import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import OrderDetailPage from './OrderDetail.jsx';
import OrderListPage from './OrderList.jsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('OrderDetailPage', () => {
  it('test_AC_STATUS_02_select_order_and_view_detail', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          order_id: 'order-123',
          user_id: 'sample-user',
          status: 'PREPARING',
        }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          order_id: 'order-123',
          created_at: '2026-10-25T09:00:00',
          latest_status: {
            status_code: 'PREPARING',
            status_name: 'กำลังเตรียม',
            changed_at: '2026-10-25T09:10:00',
          },
          items: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          order_id: 'order-123',
          current_status: 'PREPARING',
          latest_status_time: '2026-10-25T09:10:00',
          status_history: [{
            status_code: 'PREPARING',
            status_name: 'กำลังเตรียม',
            changed_at: '2026-10-25T09:10:00',
          }],
        }),
      }));

    render(<OrderListPage />);

    const detailsLink = await screen.findByRole('link', { name: 'ดูรายละเอียด' });
    expect(detailsLink).toHaveAttribute('href', '/orders/order-123/details');

    render(<OrderDetailPage orderId="order-123" />);

    expect(await screen.findByRole('heading', { name: 'Order: order-123' }))
      .toBeInTheDocument();
    expect(screen.getByText('สถานะล่าสุด: กำลังเตรียม')).toBeInTheDocument();
    expect(await screen.findByRole('list', { name: 'ลำดับสถานะ Order' }))
      .toBeInTheDocument();
    expect(fetch).toHaveBeenNthCalledWith(2, '/api/orders/order-123', {
      headers: { 'X-Test-User': 'customer-a' },
    });
    expect(fetch).toHaveBeenNthCalledWith(3, '/api/orders/order-123/status', {
      headers: { 'X-Test-User': 'customer-a' },
    });
  });

  it('test_AC_STATUS_04_show_order_items_and_latest_status', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          order_id: 'order-456',
          created_at: '2026-10-25T09:00:00',
          latest_status: {
            status_code: 'READY_FOR_PICKUP',
            status_name: 'พร้อมรับสินค้า',
            changed_at: '2026-10-25T11:00:00',
          },
          items: [
            {
              order_item_id: 'item-1',
              menu_name: 'ชาไทย',
              quantity: 2,
              unit_price: 45,
              line_total: 90,
            },
            {
              order_item_id: 'item-2',
              menu_name: 'โกโก้',
              quantity: 1,
              unit_price: 50,
              line_total: 50,
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          order_id: 'order-456',
          current_status: 'READY_FOR_PICKUP',
          latest_status_time: '2026-10-25T11:00:00',
          status_history: [{
            status_code: 'READY_FOR_PICKUP',
            status_name: 'พร้อมรับสินค้า',
            changed_at: '2026-10-25T11:00:00',
          }],
        }),
      }));

    render(<OrderDetailPage orderId="order-456" />);

    expect(await screen.findByRole('heading', { name: 'ชาไทย, โกโก้' }))
      .toBeInTheDocument();
    expect(screen.getByText('สถานะล่าสุด: พร้อมรับสินค้า')).toBeInTheDocument();

    const itemsList = screen.getByRole('list', { name: 'รายการสินค้าใน Order' });
    expect(itemsList).toHaveTextContent('ชาไทย');
    expect(itemsList).toHaveTextContent('จำนวน: 2');
    expect(itemsList).toHaveTextContent('ราคา: 45');
    expect(itemsList).toHaveTextContent('โกโก้');
    expect(itemsList).toHaveTextContent('จำนวน: 1');
    expect(itemsList).toHaveTextContent('ราคา: 50');
    expect(screen.getByRole('main')).toHaveClass('tracking-page');
    expect(screen.getByLabelText('Order: order-456')).toHaveClass('order-detail-content');
    expect(screen.getByRole('list', { name: 'ลำดับสถานะ Order' }))
      .toHaveClass('order-detail-progress');
  });

  it('test_AC_STATUS_06_select_order_from_multiple_orders', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          order_id: 'order-selected',
          created_at: '2026-10-25T10:00:00',
          latest_status: {
            status_code: 'READY_FOR_PICKUP',
            status_name: 'พร้อมรับสินค้า',
            changed_at: '2026-10-25T11:00:00',
          },
          items: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          order_id: 'order-selected',
          current_status: 'READY_FOR_PICKUP',
          latest_status_time: '2026-10-25T11:00:00',
          status_history: [{
            status_code: 'READY_FOR_PICKUP',
            status_name: 'พร้อมรับสินค้า',
            changed_at: '2026-10-25T11:00:00',
          }],
        }),
      }));

    render(<OrderDetailPage orderId="order-selected" />);

    expect(await screen.findByRole('heading', { name: 'Order: order-selected' }))
      .toBeInTheDocument();
    expect(screen.getByText('สถานะล่าสุด: พร้อมรับสินค้า')).toBeInTheDocument();
    expect(fetch).toHaveBeenNthCalledWith(1, '/api/orders/order-selected', {
      headers: { 'X-Test-User': 'customer-a' },
    });
  });

  it('test_AC_STATUS_08_show_only_confirmed_status', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          order_id: 'order-confirmed',
          created_at: '2026-10-25T10:00:00',
          latest_status: {
            status_code: 'READY_FOR_PICKUP',
            status_name: 'พร้อมรับสินค้า',
            changed_at: '2026-10-25T11:00:00',
          },
          items: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          order_id: 'order-confirmed',
          current_status: 'READY_FOR_PICKUP',
          latest_status_time: '2026-10-25T11:00:00',
          status_history: [
            {
              status_code: 'PREPARING',
              status_name: 'กำลังเตรียม',
              changed_at: '2026-10-25T10:30:00',
            },
            {
              status_code: 'READY_FOR_PICKUP',
              status_name: 'พร้อมรับสินค้า',
              changed_at: '2026-10-25T11:00:00',
            },
          ],
        }),
      }));

    render(<OrderDetailPage orderId="order-confirmed" />);

    expect(await screen.findByText('สถานะล่าสุด: พร้อมรับสินค้า')).toBeInTheDocument();
    const timeline = await screen.findByRole('list', { name: 'ลำดับสถานะ Order' });
    expect(timeline).toHaveTextContent('พร้อมรับสินค้า');
    expect(timeline).toHaveTextContent('2026-10-25T11:00:00');
    expect(timeline).not.toHaveTextContent('2026-10-25T12:00:00');
    expect(timeline.querySelector('[aria-current="step"]')).toHaveTextContent('พร้อมรับสินค้า');
    expect(timeline.querySelector('[data-state="upcoming"]')).toHaveTextContent('รับสินค้าแล้ว');
  });

  it('test_AC_STATUS_07_show_retry_when_load_fails', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          order_id: 'order-retry',
          created_at: '2026-10-25T10:00:00',
          latest_status: {
            status_code: 'PICKED_UP',
            status_name: 'รับสินค้าแล้ว',
            changed_at: '2026-10-25T11:00:00',
          },
          items: [],
        }),
      })
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          order_id: 'order-retry',
          current_status: 'PREPARING',
          latest_status_time: '2026-10-25T10:30:00',
          status_history: [{
            status_code: 'PREPARING',
            status_name: 'กำลังเตรียม',
            changed_at: '2026-10-25T10:30:00',
          }],
        }),
      }));

    render(<OrderDetailPage orderId="order-retry" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('ไม่สามารถโหลดสถานะได้');
    expect(screen.getByRole('button', { name: 'ลองใหม่' })).toBeInTheDocument();
    expect(screen.queryByText('รับสินค้าแล้ว')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('list', { name: 'ลำดับสถานะ Order' }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'ลองใหม่' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('ไม่สามารถโหลดสถานะได้');
    expect(screen.queryByText('รับสินค้าแล้ว')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'ลองใหม่' }));

    const timeline = await screen.findByRole('list', { name: 'ลำดับสถานะ Order' });
    expect(timeline).toHaveTextContent('กำลังเตรียม');
    expect(timeline.querySelector('[aria-current="step"]')).toHaveTextContent('กำลังเตรียม');
    expect(timeline.querySelectorAll('li')[3]).toHaveAttribute('data-state', 'upcoming');
    expect(timeline).not.toHaveTextContent('2026-10-25T11:00:00');
    expect(fetch).toHaveBeenLastCalledWith('/api/orders/order-retry/status/refresh', {
      method: 'POST',
      headers: { 'X-Test-User': 'customer-a' },
    });
  });
});
