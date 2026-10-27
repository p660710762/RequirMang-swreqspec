import { useState } from 'react';

function initialValues(menuItem) {
  return {
    name: menuItem.name ?? '',
    price: String(menuItem.price ?? ''),
    description: menuItem.description ?? '',
    image_url: menuItem.image_url ?? '',
    promotion_name: menuItem.promotion?.promotion_name ?? '',
    discount_value: menuItem.promotion?.discount_value == null
      ? ''
      : String(menuItem.promotion.discount_value),
    start_at: toDateTimeLocal(menuItem.promotion?.start_at),
    end_at: toDateTimeLocal(menuItem.promotion?.end_at),
  };
}

function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function currentDateTimeLocal() {
  const date = new Date();
  const pad = (part) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIsoWithTimezone(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absoluteOffset / 60)).padStart(2, '0');
  const minutes = String(absoluteOffset % 60).padStart(2, '0');
  return `${value}:00${sign}${hours}:${minutes}`;
}

function formatThaiDateTime(value, emptyLabel) {
  if (!value) return emptyLabel;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return emptyLabel;
  return new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

// FR-44, FR-47, ASM-07: edit menu details and promotion values on the same panel.
export default function MenuEditPanel({ menuItem, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => initialValues(menuItem));
  const [state, setState] = useState('idle');
  const [message, setMessage] = useState('');

  function updateField(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updatePromotionDate(fieldName, value) {
    const minimumDateTime = currentDateTimeLocal();
    if (value && value < minimumDateTime) {
      setState('error');
      setMessage('วันและเวลาต้องไม่เป็นเวลาที่ผ่านมาแล้ว');
      return;
    }
    if (fieldName === 'end_at' && values.start_at && value && value < values.start_at) {
      setState('error');
      setMessage('วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น');
      return;
    }
    if (fieldName === 'start_at' && values.end_at && value && values.end_at < value) {
      setState('error');
      setMessage('วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น');
      return;
    }
    setValues((current) => ({ ...current, [fieldName]: value }));
    setMessage('');
    setState('idle');
  }

  // FR-44, ASM-07: clear promotion fields in the current edit form without saving.
  function clearPromotionFields() {
    setValues((current) => ({
      ...current,
      promotion_name: '',
      discount_value: '',
      start_at: '',
      end_at: '',
    }));
    setMessage('');
    setState('idle');
  }

  function openDatePicker(fieldName) {
    document.getElementById(fieldName)?.showPicker?.();
    document.getElementById(fieldName)?.focus();
  }

  async function submitForm(event) {
    event.preventDefault();
    setMessage('');
    const price = Number(values.price);
    const discount = values.discount_value === '' ? null : Number(values.discount_value);
    if (!Number.isFinite(price) || price < 0) {
      setState('error');
      setMessage('ราคาต้องเป็นตัวเลขที่ไม่ติดลบ');
      return;
    }
    if (discount !== null && (!Number.isFinite(discount) || discount < 0)) {
      setState('error');
      setMessage('ส่วนลดต้องเป็นตัวเลขที่ไม่ติดลบ');
      return;
    }
    if (discount !== null && discount > price) {
      setState('error');
      setMessage('ส่วนลดต้องไม่มากกว่าราคาเมนู');
      return;
    }
    const hasPromotionInput = Boolean(
      values.promotion_name.trim()
      || values.discount_value
      || values.start_at
      || values.end_at,
    );
    if (discount !== null && !values.promotion_name.trim()) {
      setState('error');
      setMessage('กรุณาระบุชื่อโปรโมชั่น');
      return;
    }
    if (hasPromotionInput && (!values.start_at || !values.end_at)) {
      setState('error');
      setMessage('กรุณาเลือกวันเริ่มต้นและวันสิ้นสุดของโปรโมชั่น');
      return;
    }
    if (values.start_at && values.end_at && values.end_at < values.start_at) {
      setState('error');
      setMessage('วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น');
      return;
    }
    const minimumDateTime = currentDateTimeLocal();
    if (values.start_at && values.start_at < minimumDateTime) {
      setState('error');
      setMessage('วันเริ่มต้นต้องไม่เป็นวันและเวลาที่ผ่านมาแล้ว');
      return;
    }
    if (values.end_at && values.end_at < minimumDateTime) {
      setState('error');
      setMessage('วันสิ้นสุดต้องไม่เป็นวันและเวลาที่ผ่านมาแล้ว');
      return;
    }
    setState('saving');

    const promotionValues = {
      promotion_name: values.promotion_name.trim(),
      discount_value: discount,
      start_at: toIsoWithTimezone(values.start_at),
      end_at: toIsoWithTimezone(values.end_at),
    };
    const hasPromotion = hasPromotionInput;

    try {
      await onSubmit({
        name: values.name.trim(),
        price,
        description: values.description.trim() || null,
        image_url: values.image_url.trim() || null,
        promotion: hasPromotion ? promotionValues : null,
      });
      setState('success');
      setMessage('บันทึกข้อมูลสำเร็จ');
    } catch (error) {
      setState('error');
      setMessage(error.message || 'ไม่สามารถบันทึกข้อมูลได้');
    }
  }

  return (
    <form className="menu-edit-panel" onSubmit={submitForm}>
      <h3>แก้ไขเมนู</h3>
      <label className="form-field" htmlFor={`edit-name-${menuItem.menu_id}`}>
        <span>ชื่อเมนู</span>
        <input id={`edit-name-${menuItem.menu_id}`} name="name" value={values.name} onChange={updateField} />
      </label>
      <label className="form-field" htmlFor={`edit-price-${menuItem.menu_id}`}>
        <span>ราคา (บาท)</span>
        <input id={`edit-price-${menuItem.menu_id}`} name="price" type="number" value={values.price} onChange={updateField} />
      </label>
      <label className="form-field" htmlFor={`edit-description-${menuItem.menu_id}`}>
        <span>รายละเอียด</span>
        <textarea id={`edit-description-${menuItem.menu_id}`} name="description" rows="2" value={values.description} onChange={updateField} />
      </label>
      <fieldset className="promotion-fields">
        <legend>โปรโมชั่น</legend>
        <button className="clear-promotion-button" type="button" onClick={clearPromotionFields}>
          ล้างข้อมูลโปรโมชั่น
        </button>
        <label className="form-field" htmlFor={`promotion-name-${menuItem.menu_id}`}>
          <span>ชื่อโปรโมชั่น</span>
          <input id={`promotion-name-${menuItem.menu_id}`} name="promotion_name" value={values.promotion_name} onChange={updateField} />
        </label>
        <label className="form-field" htmlFor={`promotion-discount-${menuItem.menu_id}`}>
          <span>ส่วนลด</span>
          <input id={`promotion-discount-${menuItem.menu_id}`} name="discount_value" type="number" min="0" value={values.discount_value} onChange={updateField} />
        </label>
        <label className="form-field" htmlFor={`promotion-start-${menuItem.menu_id}`}>
          <span>วันเริ่มต้น</span>
          <button
            className="thai-date-button"
            type="button"
            onClick={() => openDatePicker(`promotion-start-${menuItem.menu_id}`)}
          >
            {formatThaiDateTime(values.start_at, 'กรุณาเลือกวันเริ่มต้นและเวลา')}
            <span aria-hidden="true">📅</span>
          </button>
          <input
            className="native-date-input"
            id={`promotion-start-${menuItem.menu_id}`}
            name="start_at"
            type="datetime-local"
            lang="th-TH"
            value={values.start_at}
            onChange={(event) => updatePromotionDate('start_at', event.target.value)}
            aria-label="วันเริ่มต้น"
          />
        </label>
        <label className="form-field" htmlFor={`promotion-end-${menuItem.menu_id}`}>
          <span>วันสิ้นสุด</span>
          <button
            className="thai-date-button"
            type="button"
            onClick={() => openDatePicker(`promotion-end-${menuItem.menu_id}`)}
          >
            {formatThaiDateTime(values.end_at, 'กรุณาเลือกวันสิ้นสุดและเวลา')}
            <span aria-hidden="true">📅</span>
          </button>
          <input
            className="native-date-input"
            id={`promotion-end-${menuItem.menu_id}`}
            name="end_at"
            type="datetime-local"
            lang="th-TH"
            value={values.end_at}
            onChange={(event) => updatePromotionDate('end_at', event.target.value)}
            aria-label="วันสิ้นสุด"
          />
        </label>
      </fieldset>
      <div className="menu-edit-panel__footer">
        <p className={`form-message form-message--${state}`} role={state === 'error' ? 'alert' : 'status'}>{message}</p>
        <button type="button" className="secondary-button" onClick={onCancel}>ยกเลิก</button>
        <button type="submit" className="primary-button" disabled={state === 'saving'}>
          {state === 'saving' ? 'กำลังบันทึก' : 'บันทึกการแก้ไข'}
        </button>
      </div>
    </form>
  );
}
