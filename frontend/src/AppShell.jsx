import { useEffect, useState } from 'react';

import App from './App.jsx';
import AdminMenuPage from './pages/AdminMenuPage.jsx';
import CustomerMenuPage from './pages/CustomerMenuPage.jsx';
import OrderDetailPage from './pages/OrderDetail.jsx';
import OrderListPage from './pages/OrderList.jsx';
import OrderPage from './pages/OrderPage.jsx';
import StaffOrdersPage from './pages/StaffOrdersPage.jsx';

// รองรับ FR-02: เชื่อม Customer/Login ไป UC-03 โดยไม่ส่งเมนูที่เลือกก่อน Login
export default function AppShell() {
  const [page, setPage] = useState(() => {
    const path = window.location.pathname;
    if (path === '/staff/orders') return 'staffOrders';
    return path === '/order' || path === '/orders/status'
      || /^\/orders\/[^/]+\/details$/.test(path)
      ? 'account'
      : 'customer';
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mockUserId, setMockUserId] = useState('');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrderMenuId, setSelectedOrderMenuId] = useState(null);
  const [selectedTrackingOrderId, setSelectedTrackingOrderId] = useState(null);
  const [selectedTrackingOrderDate, setSelectedTrackingOrderDate] = useState(null);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const orderDate = new URLSearchParams(window.location.search).get('order_date');
      const detailMatch = path.match(/^\/orders\/([^/]+)\/details$/);

      if (path === '/staff/orders') {
        setIsOrderModalOpen(false);
        setSelectedOrderMenuId(null);
        setSelectedTrackingOrderId(null);
        setSelectedTrackingOrderDate(null);
        setPage('staffOrders');
        return;
      }

      if (path === '/order' && !isLoggedIn) {
        setPage('account');
        setIsOrderModalOpen(false);
        setSelectedOrderMenuId(null);
        return;
      }

      if (path === '/orders/status' || detailMatch) {
        setIsOrderModalOpen(false);
        setSelectedOrderMenuId(null);
        if (!isLoggedIn) {
          setPage('account');
          return;
        }
        if (detailMatch) {
          setSelectedTrackingOrderId(decodeURIComponent(detailMatch[1]));
          setSelectedTrackingOrderDate(orderDate);
          setPage('orderDetail');
        } else {
          setSelectedTrackingOrderId(null);
          setSelectedTrackingOrderDate(null);
          setPage('status');
        }
        return;
      }

      setPage('customer');
      setIsOrderModalOpen(window.location.pathname === '/order');
      setSelectedOrderMenuId(null);
      setSelectedTrackingOrderId(null);
      setSelectedTrackingOrderDate(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isLoggedIn]);

  const handleNavigate = (nextPage) => {
    if (nextPage === 'staffOrders') {
      if (window.location.pathname !== '/staff/orders') {
        window.history.pushState({}, '', '/staff/orders');
      }
      setIsOrderModalOpen(false);
      setSelectedOrderMenuId(null);
      setSelectedTrackingOrderId(null);
      setSelectedTrackingOrderDate(null);
      setPage('staffOrders');
      return;
    }

    if (nextPage === 'status' && isLoggedIn) {
      if (window.location.pathname !== '/orders/status') {
        window.history.pushState({}, '', '/orders/status');
      }
      setSelectedTrackingOrderId(null);
      setSelectedTrackingOrderDate(null);
      setIsOrderModalOpen(false);
      setSelectedOrderMenuId(null);
      setPage('status');
      return;
    }

    if (window.location.pathname !== '/') {
      window.history.replaceState({}, '', '/');
    }
    setIsOrderModalOpen(false);
    setSelectedOrderMenuId(null);
    setSelectedTrackingOrderId(null);
    setPage(nextPage);
  };

  const handleSelectOrder = (orderId, orderDate) => {
    const query = orderDate
      ? `?order_date=${encodeURIComponent(orderDate)}`
      : '';
    window.history.pushState(
      {},
      '',
      `/orders/${encodeURIComponent(orderId)}/details${query}`,
    );
    setSelectedTrackingOrderId(orderId);
    setSelectedTrackingOrderDate(orderDate ?? null);
    setPage('orderDetail');
  };

  const handleLoginRequired = () => {
    setIsOrderModalOpen(false);
    setSelectedOrderMenuId(null);
    setPage('account');
  };

  const handleAuthenticationSuccess = (account) => {
    setIsLoggedIn(true);
    setMockUserId(account.id);
    if (window.location.pathname !== '/') {
      window.history.replaceState({}, '', '/');
    }
    setSelectedOrderMenuId(null);
    setSelectedTrackingOrderId(null);
    setSelectedTrackingOrderDate(null);
    setIsOrderModalOpen(false);
    setPage('customer');
  };

  const handleLoginCancel = () => {
    if (window.location.pathname !== '/') {
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
          className={page === 'staffOrders' ? 'app-switcher__button active' : 'app-switcher__button'}
          onClick={() => handleNavigate('staffOrders')}
        >
          Staff Orders
        </button>
        {/* FR-19, AC-STATUS-01: expose order tracking after login. */}
        {isLoggedIn && (
          <button
            type="button"
            className={page === 'status' || page === 'orderDetail'
              ? 'app-switcher__button active'
              : 'app-switcher__button'}
            onClick={() => handleNavigate('status')}
          >
            Status
          </button>
        )}
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
          isActive={page === 'customer'}
          isLoggedIn={isLoggedIn}
          onLoginRequired={handleLoginRequired}
          onContinueToOrder={handleContinueToOrder}
          onOpenLogin={() => handleNavigate('account')}
        />
      </div>
      {page === 'admin' && <AdminMenuPage />}
      {page === 'staffOrders' && <StaffOrdersPage />}
      {page === 'status' && (
        <OrderListPage userId={mockUserId} onSelectOrder={handleSelectOrder} />
      )}
      {page === 'orderDetail' && selectedTrackingOrderId && (
        <OrderDetailPage
          orderId={selectedTrackingOrderId}
          orderDate={selectedTrackingOrderDate}
          userId={mockUserId}
        />
      )}
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
            <OrderPage
              initialMenuId={selectedOrderMenuId}
              userId={mockUserId}
              onGoToStatus={() => handleNavigate('status')}
            />
          </section>
        </div>
      )}
    </>
  );
}
