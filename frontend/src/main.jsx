import React from 'react';
import { createRoot } from 'react-dom/client';

import AdminMenuPage from './pages/AdminMenuPage.jsx';
import OrderDetailPage from './pages/OrderDetail.jsx';
import OrderListPage from './pages/OrderList.jsx';
import './styles.css';

// FR-19: expose the Order list at its planned route without changing the existing menu route.
const orderDetailMatch = window.location.pathname.match(/^\/orders\/([^/]+)\/details$/);
const Page = orderDetailMatch
  ? () => <OrderDetailPage orderId={decodeURIComponent(orderDetailMatch[1])} />
  : window.location.pathname === '/orders/status'
    ? OrderListPage
    : AdminMenuPage;

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>,
);
