export default function DeleteMenuDialog({ menuItem, onConfirm, onCancel }) {
  if (!menuItem) {
    return null;
  }

  return (
    <div className="delete-menu-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-menu-title">
      <div className="delete-menu-dialog__panel">
        <h3 id="delete-menu-title">ลบเมนู</h3>
        <p>
          ต้องการลบเมนู <strong>{menuItem.name}</strong> จาก catalog ปัจจุบันหรือไม่?
          รายการ snapshot/history จะถูกเก็บไว้เพื่อให้ Order เก่าใช้งานต่อได้
        </p>
        <div className="delete-menu-dialog__actions">
          <button type="button" className="row-button row-button--secondary" onClick={onCancel}>
            ยกเลิก
          </button>
          <button type="button" className="row-button row-button--danger" onClick={onConfirm}>
            ลบเมนู
          </button>
        </div>
      </div>
    </div>
  );
}
