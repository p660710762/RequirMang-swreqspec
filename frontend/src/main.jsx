import React from 'react';
import { createRoot } from 'react-dom/client';

import AdminMenuPage from './pages/AdminMenuPage.jsx';
import OrderPage from './pages/OrderPage.jsx';
import './styles.css';

// FR-06, FR-08: expose Order separately while preserving the Admin menu page.
export function App() {
  return window.location.pathname === '/order' ? <OrderPage /> : <AdminMenuPage />;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);