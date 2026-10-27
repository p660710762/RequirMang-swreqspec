import { useState } from 'react';

import App from './App.jsx';
import AdminMenuPage from './pages/AdminMenuPage.jsx';
import CustomerMenuPage from './pages/CustomerMenuPage.jsx';

export default function AppShell() {
  const [page, setPage] = useState('customer');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pendingSelection, setPendingSelection] = useState(null);

  const handleNavigate = (nextPage) => {
    if (pendingSelection && nextPage !== 'account') {
      setPendingSelection(null);
    }
    setPage(nextPage);
  };

  const handleLoginRequired = (item) => {
    setPendingSelection(item);
    setPage('account');
  };

  const handleAuthenticationSuccess = () => {
    setIsLoggedIn(true);
    setPage('customer');
  };

  const handleLoginCancel = () => {
    setPendingSelection(null);
    setPage('customer');
  };

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
          pendingSelection={pendingSelection}
          onLoginRequired={handleLoginRequired}
          onOpenLogin={() => handleNavigate('account')}
          onPendingSelectionConsumed={() => setPendingSelection(null)}
        />
      </div>
      {page === 'admin' && <AdminMenuPage />}
      <div hidden={page !== 'account'}>
        <App
          pendingSelection={pendingSelection}
          onAuthenticated={handleAuthenticationSuccess}
          onLoginFailed={() => setPendingSelection(null)}
          onCancelLogin={handleLoginCancel}
        />
      </div>
    </>
  );
}
