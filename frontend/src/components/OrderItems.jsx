// FR-22, FR-31: display saved product details and the customer's selected options.
export default function OrderItems({ items }) {
  return (
    <section className="order-detail-section" aria-labelledby="order-items-title">
      <h3 className="order-detail-section__title" id="order-items-title">รายการสินค้า</h3>
      <ul className="order-items-list" aria-label="รายการสินค้าใน Order">
        {items.map((item) => (
          <li className="order-item-card" key={item.order_item_id}>
            <h4 className="order-item-card__name">{item.menu_name}</h4>
            <p>จำนวน: {item.quantity}</p>
            <p>ราคา: {item.unit_price}</p>
            <div className="order-item-card__options" aria-label={`ตัวเลือก ${item.menu_name}`}>
              <span>ตัวเลือกเครื่องดื่ม</span>
              <p>ความหวาน: {item.sweetness_level || 'ไม่ระบุ'}</p>
              <p>น้ำแข็ง: {item.ice_level || 'ใส่น้ำแข็งปริมาณปกติ'}</p>
              <p>
                Topping: {item.toppings?.length ? item.toppings.join(', ') : 'ไม่เลือก'}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
