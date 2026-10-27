import { useState } from 'react';

// FR-45, FR-48, ASM-03, ASM-12: confirm and persist the menu status transition.
export default function StatusToggle({ status, onChange }) {
  const nextStatus = status === 'sold_out' ? 'open' : 'sold_out';
  const label = nextStatus === 'sold_out' ? 'ตั้งเป็นหมด' : 'ตั้งเป็นเปิดขาย';
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');

  async function changeStatus() {
    if (!window.confirm('ยืนยันเปลี่ยนสถานะเมนูใช่หรือไม่')) return;
    setState('saving');
    setError('');
    try {
      await onChange(nextStatus);
      setState('idle');
    } catch (changeError) {
      setState('error');
      setError(changeError.message || 'ไม่สามารถเปลี่ยนสถานะเมนูได้');
    }
  }

  return (
    <>
      <button className="row-button" type="button" onClick={changeStatus} disabled={state === 'saving'}>
        {state === 'saving' ? 'กำลังบันทึก' : label}
      </button>
      {error && <span className="status-toggle__error" role="alert">{error}</span>}
    </>
  );
}
