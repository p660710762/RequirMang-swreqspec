export default function Toast({ type = 'info', message, onClose }) {
  if (!message) {
    return null;
  }

  const variant = type === 'error' ? 'toast--error' : 'toast--success';

  return (
    <div className={`toast ${variant}`} role={type === 'error' ? 'alert' : 'status'} aria-live="polite">
      <span>{message}</span>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="ปิดข้อความ">
          ×
        </button>
      )}
    </div>
  );
}
