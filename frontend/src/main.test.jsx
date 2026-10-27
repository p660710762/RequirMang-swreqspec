import { beforeEach, describe, expect, it, vi } from 'vitest';

const { captureRender } = vi.hoisted(() => ({
  captureRender: vi.fn(),
}));

vi.mock('react-dom/client', () => ({
  createRoot: () => ({ render: captureRender }),
}));

vi.mock('./pages/AdminMenuPage.jsx', () => ({
  default: function AdminMenuPage() {
    return null;
  },
}));

vi.mock('./pages/OrderPage.jsx', () => ({
  default: function OrderPage() {
    return null;
  },
}));

import AdminMenuPage from './pages/AdminMenuPage.jsx';
import OrderPage from './pages/OrderPage.jsx';

async function getRenderedPage(pathname) {
  window.history.replaceState({}, '', pathname);
  captureRender.mockClear();
  vi.resetModules();
  await import('./main.jsx');

  const appElement = captureRender.mock.calls[0][0].props.children;
  return appElement.type().type;
}

describe('application routes', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
  });

  it('renders OrderPage at /order', async () => {
    await expect(getRenderedPage('/order')).resolves.toBe(OrderPage);
  });

  it('preserves AdminMenuPage at /', async () => {
    await expect(getRenderedPage('/')).resolves.toBe(AdminMenuPage);
  });
});
