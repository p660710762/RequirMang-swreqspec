import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import AppShell from './AppShell.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppShell />
  </StrictMode>,
);
