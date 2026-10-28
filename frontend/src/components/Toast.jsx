export default function Toast({ type = 'info', message, onClose }) {
  if (!message) {
    return null;
  }

  const variant = type === 'error' ? 'toast--error' : 'toast--success';
  const heading = type === 'error' ? 'ดำเนินการไม่สำเร็จ' : 'ดำเนินการสำเร็จ';

  return (
    <div className={`toast ${variant}`} role={type === 'error' ? 'alert' : 'status'} aria-live="polite">
      <span className="toast__icon" aria-hidden="true">{type === 'error' ? '!' : '✓'}</span>
      <span className="toast__content">
        <strong>{heading}</strong>
        <span>{message}</span>
      </span>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="ปิดข้อความ">
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  );
}
