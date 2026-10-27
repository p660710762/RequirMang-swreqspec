import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import CustomerMenuPage from './pages/CustomerMenuPage.jsx';
import AdminMenuPage from './pages/AdminMenuPage.jsx';
import './styles.css';

function AppShell() {
  const [page, setPage] = useState('customer');

  return (
    <>
      <div className="app-switcher">
        <button
          type="button"
          className={page === 'customer' ? 'app-switcher__button active' : 'app-switcher__button'}
          onClick={() => setPage('customer')}
        >
          Customer Menu
        </button>
        <button
          type="button"
          className={page === 'admin' ? 'app-switcher__button active' : 'app-switcher__button'}
          onClick={() => setPage('admin')}
        >
          Admin Menu
        </button>
      </div>

      {page === 'customer' ? <CustomerMenuPage /> : <AdminMenuPage />}
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppShell />
  </React.StrictMode>,
);