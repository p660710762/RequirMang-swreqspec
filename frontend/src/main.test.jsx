import { beforeEach, describe, expect, it, vi } from 'vitest';

const { captureRender } = vi.hoisted(() => ({
  captureRender: vi.fn(),
}));

vi.mock('react-dom/client', () => ({
  createRoot: () => ({ render: captureRender }),
}));

vi.mock('./AppShell.jsx', () => ({
  default: function AppShell() {
    return null;
  },
}));

import AppShell from './AppShell.jsx';

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

  it('renders AppShell at /order to enforce the login gate', async () => {
    await expect(getRenderedPage('/order')).resolves.toBe(AppShell);
  });

  it('preserves the Menu and Account app at /', async () => {
    await expect(getRenderedPage('/')).resolves.toBe(AppShell);
  });
});
