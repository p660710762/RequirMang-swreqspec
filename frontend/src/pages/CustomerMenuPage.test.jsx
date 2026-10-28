import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import CustomerMenuPage from './CustomerMenuPage.jsx';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('CustomerMenuPage', () => {
  it('test_TC_MENU_MGMT_07_1_customer_sees_sold_out_menu_and_cannot_order_it', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (url === '/api/menu') {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, name: 'น้ำส้มคั้น', price: 55, status: 'sold_out' },
          ],
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => [],
      });

      it('test_CON_DISCOUNT_RULES_uses_discount_value_as_amount', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
          if (url === '/api/menu') {
            return Promise.resolve({
              ok: true,
              json: async () => [
                {
                  id: 2,
                  name: 'ชาส่วนลดเป็นเงิน',
                  price: 45,
                  status: 'open',
                  promotion: { id: 2, title: 'ลด 10 บาท', discount_value: 10, status: 'active' },
                },
              ],
            });
          }

          return Promise.resolve({
            ok: true,
            json: async () => [
              { id: 2, title: 'ลด 10 บาท', discount_value: 10, status: 'active' },
            ],
          });
        });

        render(
          <CustomerMenuPage
            isLoggedIn
            onLoginRequired={vi.fn()}
            onContinueToOrder={vi.fn()}
            onOpenLogin={vi.fn()}
          />,
        );

        expect(await screen.findByText('ชาส่วนลดเป็นเงิน')).toBeInTheDocument();
        expect(screen.getByText('฿35.00')).toBeInTheDocument();
        expect(screen.getByText('฿45.00')).toBeInTheDocument();
      });
    });

    const onContinueToOrder = vi.fn();
    render(
      <CustomerMenuPage
        isLoggedIn
        onLoginRequired={vi.fn()}
        onContinueToOrder={onContinueToOrder}
        onOpenLogin={vi.fn()}
      />,
    );

    const soldOutButton = await screen.findByRole('button', { name: 'หมด' });
    expect(screen.getByText('น้ำส้มคั้น')).toBeInTheDocument();
    expect(screen.getByText('หมด', { selector: '.menu-card__meta' })).toBeInTheDocument();
    expect(soldOutButton).toBeDisabled();
    soldOutButton.click();

    await waitFor(() => {
      expect(onContinueToOrder).not.toHaveBeenCalled();
    });
  });
});
