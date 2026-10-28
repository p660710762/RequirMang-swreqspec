import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import AppShell from './AppShell.jsx';
import './styles.css';

// รองรับ FR-02: ให้ AppShell ตรวจ Login ก่อนเปิด route ของ UC-03
export function App() {
  return <AppShell />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
