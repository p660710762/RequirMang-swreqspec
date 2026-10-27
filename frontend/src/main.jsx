import React from 'react';
import { createRoot } from 'react-dom/client';

import AdminMenuPage from './pages/AdminMenuPage.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AdminMenuPage />
  </React.StrictMode>,
);