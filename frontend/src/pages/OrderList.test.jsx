import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import OrderListPage from './OrderList.jsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('OrderListPage', () => {
  it('test_AC_STATUS_01_show_only_user_orders', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          order_id: 'sample-order-older',
          user_id: 'sample-user',
          status: 'PENDING_ACCEPT',
          items: [{ menu_name: 'ชาไทย', quantity: 2, unit_price: 45 }],
        },
        {
          order_id: 'sample-order-newer',
          user_id: 'sample-user',
          status: 'PREPARING',
          items: [{ menu_name: 'โกโก้', quantity: 1, unit_price: 50 }],
        },
      ],
    }));

    render(<OrderListPage />);

    expect(await screen.findByRole('heading', { name: 'ชาไทย' }))
      .toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'โกโก้' }))
      .toBeInTheDocument();
    expect(screen.getByText('Order: sample-order-newer')).toBeInTheDocument();
    expect(screen.getByText('ชาไทย × 2 · ฿45.00')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/orders', {
      headers: { 'X-Test-User': 'customer-a' },
    });
    expect(screen.getByRole('heading', { name: 'ติดตามคำสั่งซื้อ' })).toBeInTheDocument();
    const progressLists = screen.getAllByRole('list', { name: /ความคืบหน้าสถานะ Order/ });
    expect(progressLists).toHaveLength(2);
    expect(progressLists[0].querySelectorAll('li')).toHaveLength(4);
    expect(
      within(progressLists[0]).getByText('รอรับ Order').closest('li'),
    ).toHaveAttribute('aria-current', 'step');
    expect(within(progressLists[1]).getByText('กำลังเตรียม')).toBeInTheDocument();
    expect(screen.queryByText(/Notification|Guest/)).not.toBeInTheDocument();
  });

  it('test_AC_STATUS_05_list_orders_sorted_by_latest_created', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          order_id: 'sample-order-newer',
          user_id: 'sample-user',
          status: 'PREPARING',
          items: [{ menu_name: 'โกโก้', quantity: 1, unit_price: 50 }],
        },
        {
          order_id: 'sample-order-older',
          user_id: 'sample-user',
          status: 'PENDING_ACCEPT',
          items: [{ menu_name: 'ชาไทย', quantity: 1, unit_price: 50 }],
        },
      ],
    }));

    render(<OrderListPage />);

    const orders = await screen.findAllByRole('heading', { name: /ชาไทย|โกโก้/ });
    expect(orders.map((order) => order.textContent)).toEqual([
      'โกโก้',
      'ชาไทย',
    ]);
  });

  it('test_AC_STATUS_06_select_order_from_multiple_orders', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          order_id: 'order-older',
          user_id: 'sample-user',
          status: 'PREPARING',
          items: [{ menu_name: 'ชาไทย', quantity: 1, unit_price: 45 }],
        },
        {
          order_id: 'order-selected',
          user_id: 'sample-user',
          status: 'READY_FOR_PICKUP',
          items: [{ menu_name: 'โกโก้', quantity: 1, unit_price: 50 }],
        },
      ],
    }));

    render(<OrderListPage />);

    const orders = await screen.findAllByRole('heading', { name: /ชาไทย|โกโก้/ });
    expect(orders).toHaveLength(2);

    const firstOrderLink = screen.getAllByRole('link', { name: 'ดูรายละเอียด' })[0];
    expect(firstOrderLink.closest('article')).toHaveTextContent('ชาไทย');
    expect(firstOrderLink.closest('article')).toHaveTextContent('Order: order-older');
    expect(firstOrderLink).toHaveAttribute('href', '/orders/order-older/details');
    expect(screen.getAllByRole('link', { name: 'ดูรายละเอียด' })[1])
      .toHaveAttribute('href', '/orders/order-selected/details');
  });

  it('routes reused daily Order IDs with their order date', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          order_id: '001',
          order_date: '2026-10-26',
          status: 'READY_FOR_PICKUP',
          items: [{ menu_name: 'ชาไทย', quantity: 1, unit_price: 45 }],
        },
        {
          order_id: '001',
          order_date: '2026-10-25',
          status: 'PREPARING',
          items: [{ menu_name: 'โกโก้', quantity: 1, unit_price: 50 }],
        },
      ],
    }));
    const onSelectOrder = vi.fn();

    render(<OrderListPage onSelectOrder={onSelectOrder} />);

    const links = await screen.findAllByRole('link', { name: 'ดูรายละเอียด' });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute(
      'href',
      '/orders/001/details?order_date=2026-10-26',
    );
    expect(links[1]).toHaveAttribute(
      'href',
      '/orders/001/details?order_date=2026-10-25',
    );

    fireEvent.click(links[1]);
    expect(onSelectOrder).toHaveBeenCalledWith('001', '2026-10-25');
  });

  it('test_AC_STATUS_09_show_only_authorized_orders', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{
        order_id: 'order-customer-a',
        user_id: 'sample-user',
        status: 'PREPARING',
        items: [{ menu_name: 'ชาไทย', quantity: 1, unit_price: 45 }],
      }],
    }));

    render(<OrderListPage />);

    expect(await screen.findByRole('heading', { name: 'ชาไทย' }))
      .toBeInTheDocument();
    expect(screen.queryByText('Order: order-customer-b')).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/orders', {
      headers: { 'X-Test-User': 'customer-a' },
    });
  });
});
