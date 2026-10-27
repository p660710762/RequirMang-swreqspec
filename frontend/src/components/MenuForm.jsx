import { useRef, useState } from 'react';

// FR-43, FR-46: collect required menu fields and submit only valid values.
export default function MenuForm({ onSubmit, onCancel }) {
  const [formValues, setFormValues] = useState({
    name: '',
    price: '',
    status: 'open',
    description: '',
    image_url: '',
  });
  const [formState, setFormState] = useState('idle');
  const [message, setMessage] = useState('');
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const imageInputRef = useRef(null);

  // FR-43: accept an optional image from Browse or drag-and-drop as a Data URL.
  function readImageFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      setFormState('error');
      setMessage('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormValues((current) => ({ ...current, image_url: reader.result }));
      setFormState('idle');
      setMessage('');
    };
    reader.onerror = () => {
      setFormState('error');
      setMessage('ไม่สามารถอ่านไฟล์รูปภาพได้');
    };
    reader.readAsDataURL(file);
  }

  function handleImageChange(event) {
    readImageFile(event.target.files[0]);
  }

  function handleImageDrop(event) {
    event.preventDefault();
    setIsDraggingImage(false);
    readImageFile(event.dataTransfer.files[0]);
  }

  // FR-43: keep each required and optional field in controlled form state.
  function updateField(event) {
    setFormValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  // FR-43, FR-46: reject incomplete values before calling the save handler.
  async function submitForm(event) {
    event.preventDefault();
    setMessage('');

    const name = formValues.name.trim();
    const price = Number(formValues.price);
    const status = formValues.status;
    if (!name || formValues.price === '' || !Number.isFinite(price) || price <= 0 || !status) {
      setFormState('error');
      setMessage('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    setFormState('saving');
    try {
      await onSubmit({
        name,
        price,
        status,
        description: formValues.description.trim() || null,
        image_url: formValues.image_url.trim() || null,
      });
      setFormValues({ name: '', price: '', status: 'open', description: '', image_url: '' });
      setFormState('success');
      setMessage('บันทึกเมนูสำเร็จ');
    } catch (error) {
      setFormState('error');
      setMessage(error.message || 'ไม่สามารถบันทึกข้อมูลได้');
    }
  }

  return (
    <form className="menu-form" noValidate onSubmit={submitForm}>
      <div className="menu-form__heading">
        <div>
          <p className="eyebrow">NEW ITEM</p>
          <h2>เพิ่มเมนู</h2>
        </div>
      </div>

      <div className="menu-form__grid">
        <label className="form-field" htmlFor="menu-name">
          <span>ชื่อเมนู <b aria-hidden="true">*</b></span>
          <input id="menu-name" name="name" value={formValues.name} onChange={updateField} />
        </label>
        <label className="form-field" htmlFor="menu-price">
          <span>ราคา (บาท) <b aria-hidden="true">*</b></span>
          <input id="menu-price" name="price" type="number" value={formValues.price} onChange={updateField} />
        </label>
        <label className="form-field" htmlFor="menu-status">
          <span>สถานะ <b aria-hidden="true">*</b></span>
          <select id="menu-status" name="status" value={formValues.status} onChange={updateField}>
            <option value="open">เปิดขาย</option>
            <option value="sold_out">หมด</option>
          </select>
        </label>
        <label className="form-field form-field--wide" htmlFor="menu-description">
          <span>รายละเอียด</span>
          <textarea id="menu-description" name="description" rows="2" value={formValues.description} onChange={updateField} />
        </label>
        <div className="form-field form-field--wide">
          <span>รูปภาพ</span>
          <label
            className={`image-dropzone${isDraggingImage ? ' image-dropzone--active' : ''}`}
            htmlFor="menu-image-file"
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDraggingImage(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setIsDraggingImage(false)}
            onDrop={handleImageDrop}
          >
            {formValues.image_url ? (
              <img className="image-preview" src={formValues.image_url} alt="ตัวอย่างรูปภาพเมนู" />
            ) : (
              <>
                <strong>ลากรูปภาพมาวางที่นี่</strong>
                <span>หรือ Browse เพื่อเลือกไฟล์รูปภาพ</span>
                <button
                  className="image-browse-button"
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    imageInputRef.current?.click();
                  }}
                >
                  เลือกไฟล์รูปภาพ
                </button>
              </>
            )}
            <input
              id="menu-image-file"
              ref={imageInputRef}
              aria-label="เลือกรูปภาพ"
              name="image_file"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </label>
        </div>
      </div>

      <div className="menu-form__footer">
        <p className={`form-message form-message--${formState}`} role={formState === 'error' ? 'alert' : 'status'} aria-live="polite">
          {message}
        </p>
        <div className="menu-form__actions">
          <button className="secondary-button" type="button" onClick={onCancel}>ยกเลิก</button>
          <button className="primary-button" type="submit" disabled={formState === 'saving'}>
            {formState === 'saving' ? 'กำลังบันทึก' : 'บันทึกเมนู'}
          </button>
        </div>
      </div>
    </form>
  );
}
