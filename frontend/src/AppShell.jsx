import { useEffect, useState } from 'react';

import App from './App.jsx';
import AdminMenuPage from './pages/AdminMenuPage.jsx';
import CustomerMenuPage from './pages/CustomerMenuPage.jsx';
import OrderPage from './pages/OrderPage.jsx';

// รองรับ FR-02: เชื่อม Customer/Login ไป UC-03 โดยไม่ส่งเมนูที่เลือกก่อน Login
export default function AppShell() {
  const [page, setPage] = useState(() => (
    window.location.pathname === '/order' ? 'account' : 'customer'
  ));
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrderMenuId, setSelectedOrderMenuId] = useState(null);

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/order' && !isLoggedIn) {
        setPage('account');
        setIsOrderModalOpen(false);
        setSelectedOrderMenuId(null);
        return;
      }

      setPage('customer');
      setIsOrderModalOpen(window.location.pathname === '/order');
      setSelectedOrderMenuId(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isLoggedIn]);

  const handleNavigate = (nextPage) => {
    if (window.location.pathname === '/order') {
      window.history.replaceState({}, '', '/');
    }
    setIsOrderModalOpen(false);
    setSelectedOrderMenuId(null);
    setPage(nextPage);
  };

  const handleLoginRequired = () => {
    setIsOrderModalOpen(false);
    setSelectedOrderMenuId(null);
    setPage('account');
  };

  const handleAuthenticationSuccess = () => {
    setIsLoggedIn(true);
    if (window.location.pathname === '/order') {
      window.history.replaceState({}, '', '/');
    }
    setSelectedOrderMenuId(null);
    setIsOrderModalOpen(false);
    setPage('customer');
  };

  const handleLoginCancel = () => {
    if (window.location.pathname === '/order') {
      window.history.replaceState({}, '', '/');
    }
    setIsOrderModalOpen(false);
    setSelectedOrderMenuId(null);
    setPage('customer');
  };

  const handleContinueToOrder = (menuId = null) => {
    if (!isLoggedIn) {
      setSelectedOrderMenuId(null);
      setPage('account');
      return;
    }

    setSelectedOrderMenuId(menuId);
    if (window.location.pathname !== '/order') {
      window.history.pushState({}, '', '/order');
    }
    setIsOrderModalOpen(true);
    setPage('customer');
  };

  const handleCloseOrder = () => {
    if (window.location.pathname === '/order') {
      window.history.replaceState({}, '', '/');
    }
    setIsOrderModalOpen(false);
    setSelectedOrderMenuId(null);
    setPage('customer');
  };

  useEffect(() => {
    if (!isOrderModalOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') handleCloseOrder();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOrderModalOpen]);

  return (
    <>
      <nav className="app-switcher" aria-label="เลือกหน้าระบบ">
        <button
          type="button"
          className={page === 'customer' ? 'app-switcher__button active' : 'app-switcher__button'}
          onClick={() => handleNavigate('customer')}
        >
          Customer Menu
        </button>
        <button
          type="button"
          className={page === 'admin' ? 'app-switcher__button active' : 'app-switcher__button'}
          onClick={() => handleNavigate('admin')}
        >
          Admin Menu
        </button>
        <button
          type="button"
          className={page === 'account' ? 'app-switcher__button active' : 'app-switcher__button'}
          onClick={() => handleNavigate('account')}
        >
          Login / Register
        </button>
      </nav>

      <div hidden={page !== 'customer'}>
        <CustomerMenuPage
          isLoggedIn={isLoggedIn}
          onLoginRequired={handleLoginRequired}
          onContinueToOrder={handleContinueToOrder}
          onOpenLogin={() => handleNavigate('account')}
        />
      </div>
      {page === 'admin' && <AdminMenuPage />}
      <div hidden={page !== 'account'}>
        <App
          onAuthenticated={handleAuthenticationSuccess}
          onCancelLogin={handleLoginCancel}
        />
      </div>
      {isOrderModalOpen && (
        <div
          className="order-modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) handleCloseOrder();
          }}
        >
          <section
            className="order-modal"
            role="dialog"
            aria-modal="true"
            aria-label="สั่งซื้อเครื่องดื่ม"
          >
            <button
              type="button"
              className="order-modal__close"
              aria-label="ปิดหน้าสั่งซื้อ"
              onClick={handleCloseOrder}
            >
              ปิด
            </button>
            <OrderPage initialMenuId={selectedOrderMenuId} />
          </section>
        </div>
      )}
    </>
  );
}
