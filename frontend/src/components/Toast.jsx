import { useEffect } from 'react';

export default function Toast({ type = 'info', message, onClose }) {
  useEffect(() => {
    if (!message || !onClose) return undefined;
    const timer = window.setTimeout(onClose, 3000);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  if (!message) {
    return null;
  }

  const variant = type === 'error' ? 'toast--error' : 'toast--success';

  return (
    <div className={`toast ${variant}`} role={type === 'error' ? 'alert' : 'status'} aria-live="polite">
      <span className="toast__icon" aria-hidden="true">{type === 'error' ? '!' : '✓'}</span>
      <span className="toast__message">{message}</span>
      {onClose && (
        <button className="toast__close" type="button" onClick={onClose} aria-label="ปิดข้อความ">
          ×
        </button>
      )}
    </div>
  );
}
