// FR-22: display the selected order's saved product names, quantities, and unit prices.
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
          </li>
        ))}
      </ul>
    </section>
  );
}
