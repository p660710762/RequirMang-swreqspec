import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import CustomerMenuPage from './CustomerMenuPage.jsx';

const menuItems = [
  {
    menu_id: 1,
    name: 'ชาไทย',
    price: 50,
    description: 'ชาดำเข้มข้น',
    status: 'open',
    promotion: { id: 1, title: 'ลด 10%', discountPercent: 10, status: 'active' },
  },
  {
    menu_id: 2,
    name: 'กาแฟเย็น',
    price: 60,
    description: 'กาแฟคั่วหอม',
    status: 'open',
  },
  {
    menu_id: 3,
    name: 'โกโก้',
    price: 55,
    description: 'โกโก้เข้มข้น',
    status: 'sold_out',
  },
];

function response(payload, ok = true) {
  return { ok, json: async () => payload };
}

function stubMenuApi(items = menuItems, promotions = [
  { id: 1, title: 'ลด 10%', discountPercent: 10, status: 'active' },
]) {
  const fetchMock = vi.fn(async (url) => {
    if (url === '/api/menu') return response({ items });
    if (url === '/api/promotions/active') return response(promotions);
    return response({}, false);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('CustomerMenuPage menu acceptance criteria', () => {
  test('test_AC_MENU_01_displays_items_and_empty_state', async () => {
    stubMenuApi([]);
    render(
      <CustomerMenuPage
        isLoggedIn={false}
        onLoginRequired={vi.fn()}
        onContinueToOrder={vi.fn()}
        onOpenLogin={vi.fn()}
      />,
    );

    expect(await screen.findByText('ขณะนี้ไม่มีรายการเครื่องดื่ม')).toBeInTheDocument();
  });

  test('test_AC_MENU_02_displays_details_and_disables_sold_out_order', async () => {
    stubMenuApi();
    render(
      <CustomerMenuPage
        isLoggedIn
        onLoginRequired={vi.fn()}
        onContinueToOrder={vi.fn()}
        onOpenLogin={vi.fn()}
      />,
    );

    const soldOutCard = (await screen.findByText('โกโก้')).closest('article');
    expect(within(soldOutCard).getByText('โกโก้')).toBeInTheDocument();
    expect(within(soldOutCard).getByText('โกโก้เข้มข้น')).toBeInTheDocument();
    expect(within(soldOutCard).getAllByText('หมด').length).toBeGreaterThanOrEqual(1);
    expect(within(soldOutCard).getByRole('button', { name: 'หมด' })).toBeDisabled();

    const openCard = screen.getByText('ชาไทย').closest('article');
    expect(within(openCard).getByText('ชาดำเข้มข้น')).toBeInTheDocument();
    expect(within(openCard).getByText(/เปิดขาย/)).toBeInTheDocument();
    expect(within(openCard).getByRole('button', { name: 'สั่งซื้อ' })).toBeEnabled();
  });

  test('test_AC_MENU_03_filters_only_partial_case_insensitive_matches', async () => {
    stubMenuApi();
    render(
      <CustomerMenuPage
        isLoggedIn={false}
        onLoginRequired={vi.fn()}
        onContinueToOrder={vi.fn()}
        onOpenLogin={vi.fn()}
      />,
    );

    const search = await screen.findByRole('textbox', { name: 'ค้นหาเมนู' });
    fireEvent.change(search, { target: { value: 'กาแฟ' } });
    expect(screen.getByRole('heading', { name: 'กาแฟเย็น' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'ชาไทย' })).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'ชา' } });
    expect(screen.getByRole('heading', { name: 'ชาไทย' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'กาแฟเย็น' })).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'ไม่มีเมนูนี้' } });
    expect(screen.getByText('ไม่พบเมนู')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'ชาไทย' })).not.toBeInTheDocument();
  });

  test('test_AC_MENU_04_displays_active_promotion_discount_and_order', async () => {
    stubMenuApi();
    render(
      <CustomerMenuPage
        isLoggedIn
        onLoginRequired={vi.fn()}
        onContinueToOrder={vi.fn()}
        onOpenLogin={vi.fn()}
      />,
    );

    expect(await screen.findByRole('region', { name: 'โปรโมชั่นที่กำลังใช้งาน' }))
      .toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'โปรโมชั่นที่กำลังใช้งาน' }))
      .getAllByText('ลด 10%').length).toBeGreaterThanOrEqual(1);
    const cards = screen.getAllByRole('article');
    expect(within(cards[0]).getByText('ชาไทย')).toBeInTheDocument();
    expect(within(cards[0]).getByText('฿45.00')).toBeInTheDocument();
    expect(within(cards[1]).getByText('กาแฟเย็น')).toBeInTheDocument();
    expect(within(cards[2]).getByText('โกโก้')).toBeInTheDocument();
  });

  test('test_AC_MENU_04_hides_promotion_section_when_no_active_promotion', async () => {
    stubMenuApi(menuItems, []);
    render(
      <CustomerMenuPage
        isLoggedIn
        onLoginRequired={vi.fn()}
        onContinueToOrder={vi.fn()}
        onOpenLogin={vi.fn()}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'ชาไทย' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'โปรโมชั่นที่กำลังใช้งาน' }))
      .not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'หมด' })).toBeDisabled();
  });

  test('test_AC_MENU_05_shows_error_and_retries_menu_and_promotions', async () => {
    const menuCalls = { count: 0 };
    const fetchMock = vi.fn(async (url) => {
      if (url === '/api/menu') {
        menuCalls.count += 1;
        if (menuCalls.count === 1) return response({}, false);
      }
      if (url === '/api/menu') return response({ items: menuItems });
      return response([{ id: 1, title: 'ลด 10%', discountPercent: 10, status: 'active' }]);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <CustomerMenuPage
        isLoggedIn={false}
        onLoginRequired={vi.fn()}
        onContinueToOrder={vi.fn()}
        onOpenLogin={vi.fn()}
      />,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('ไม่สามารถโหลดข้อมูลได้');
    fireEvent.click(screen.getByRole('button', { name: 'ลองใหม่' }));
    expect(await screen.findByRole('heading', { name: 'ชาไทย' })).toBeInTheDocument();
    await waitFor(() => {
      expect(fetchMock.mock.calls.filter(([url]) => url === '/api/menu')).toHaveLength(2);
      expect(fetchMock.mock.calls.filter(([url]) => url === '/api/promotions/active')).toHaveLength(1);
    });
  });
});
