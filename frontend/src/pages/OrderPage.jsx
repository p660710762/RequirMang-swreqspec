import React, { useEffect, useState } from "react";

import {
  addOrderItem,
  confirmOrder,
  createDraft,
  getMenu,
  getOrderSummary,
  updateOrderItem,
} from "../api/client.js";

const SWEETNESS_LEVELS = [
  "หวานปกติ 75%",
  "หวานน้อย 50%",
  "เพิ่มหวาน 100%",
  "ไม่หวาน",
];

const TOPPINGS = [
  "ไข่มุก",
  "ดับเบิ้ลไข่มุก",
  "เจลลี่ผลไม้",
  "ดับเบิ้ลเจลลี่ผลไม้",
  "บุกขาว",
  "ดับเบิ้ลบุกขาว",
  "คริสตัลใส",
  "ดับเบิ้ลคริสตัลใส",
  "คริสตัลบราวชูการ์",
  "ชีส",
  "ดับเบิ้ลชีส",
  "ซอสบราวน์ชูการ์",
  "ชีสครันช์",
  "ครันช์",
];

const ICE_LEVELS = [
  "น้ำแข็งน้อย (ปริมาณน้ำเท่าเดิม)",
  "ไม่ใส่น้ำแข็ง",
  "แยกน้ำแข็ง",
];

function emptySelection() {
  return { quantity: "1", sweetness: "", toppings: [], iceLevel: "" };
}

function formatPrice(value) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(Number(value));
}

// รองรับ FR-06 และ FR-07, AC-ORDER-01 และ AC-ORDER-02
export default function OrderPage({ initialMenuId = null }) {
  const [menuItems, setMenuItems] = useState([]);
  const [showAllMenuItems, setShowAllMenuItems] = useState(false);
  const [draft, setDraft] = useState(null);
  const [selections, setSelections] = useState({});
  const [addedItems, setAddedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingMenuId, setSavingMenuId] = useState(null);
  const [error, setError] = useState("");
  const [view, setView] = useState("menu");
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [confirmingOrder, setConfirmingOrder] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([getMenu(), createDraft()])
      .then(([items, draftReference]) => {
        if (!active) return;
        setMenuItems(items);
        setDraft(draftReference);
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "โหลดข้อมูลไม่สำเร็จ");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function selectionFor(menuId) {
    return selections[menuId] ?? emptySelection();
  }

  function updateSelection(menuId, field, value) {
    setSelections((current) => ({
      ...current,
      [menuId]: { ...(current[menuId] ?? emptySelection()), [field]: value },
    }));
  }

  function toggleTopping(menuId, topping, checked) {
    const currentToppings = selectionFor(menuId).toppings;
    const toppings = checked
      ? [...currentToppings, topping]
      : currentToppings.filter((item) => item !== topping);
    updateSelection(menuId, "toppings", toppings);
  }

  const visibleMenuItems = (
    initialMenuId === null || showAllMenuItems
      ? menuItems
      : menuItems.filter((menuItem) => String(menuItem.menu_id) === String(initialMenuId))
  );

  // รองรับ FR-06 และ FR-07: ส่งเฉพาะตัวเลือกที่ผู้ใช้เลือกให้ API
  async function handleAddItem(menuItem) {
    const selection = selectionFor(menuItem.menu_id);
    const quantity = Number(selection.quantity);
    if (!draft || !Number.isInteger(quantity) || quantity <= 0 || !selection.sweetness) {
      return;
    }

    const requestBody = {
      ...draft,
      menu_item_id: menuItem.menu_id,
      quantity,
      sweetness_level: selection.sweetness,
      ...(selection.toppings.length > 0 ? { toppings: selection.toppings } : {}),
      ...(selection.iceLevel ? { ice_level: selection.iceLevel } : {}),
    };

    setError("");
    setSavingMenuId(menuItem.menu_id);
    try {
      const savedItem = await addOrderItem(requestBody);
      setAddedItems((current) => [...current, { ...savedItem, name: menuItem.name }]);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "เพิ่มรายการไม่สำเร็จ");
    } finally {
      setSavingMenuId(null);
    }
  }

  // รองรับ FR-08 และ AC-ORDER-03 โดยโหลด summary ของ draft ปัจจุบัน
  async function handleShowSummary() {
    if (!draft) return;
    setError("");
    setLoadingSummary(true);
    try {
      setSummary(await getOrderSummary(draft));
      setView("summary");
    } catch (summaryError) {
      setError(
        summaryError instanceof Error ? summaryError.message : "โหลดสรุป Order ไม่สำเร็จ",
      );
    } finally {
      setLoadingSummary(false);
    }

  }

  // รองรับ FR-07 และ FR-09 โดยบันทึกการแก้ไขและแสดงยอดรวมล่าสุด
  async function handleUpdateItem(item, changes) {
    setError("");
    setUpdatingItemId(item.order_item_id);
    try {
      const updated = await updateOrderItem(item.order_item_id, changes);
      setSummary((current) => {
        if (!current) return current;
        return {
          ...current,
          items: updated.order_item_id === null
            ? current.items.filter((currentItem) => currentItem.order_item_id !== item.order_item_id)
            : current.items.map((currentItem) =>
                currentItem.order_item_id === item.order_item_id
                  ? {
                      ...currentItem,
                      quantity: updated.quantity,
                      line_total: String(Number(currentItem.unit_price) * updated.quantity),
                    }

                  : currentItem,
              ),
          total_amount: updated.total_amount,
        };
      });
      setAddedItems((current) =>
        updated.order_item_id === null
          ? current.filter((currentItem) => currentItem.order_item_id !== item.order_item_id)
          : current.map((currentItem) =>
              currentItem.order_item_id === item.order_item_id
                ? { ...currentItem, quantity: updated.quantity, ...changes }
                : currentItem,
            ),
      );
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "แก้ไขรายการไม่สำเร็จ");
    } finally {
      setUpdatingItemId(null);
    }
  }

  // รองรับ FR-10 และ FR-11 โดยเริ่มขั้นตอนชำระเงินเฉพาะเมื่อ Order ผ่านการตรวจ
  async function handleConfirmOrder() {
    if (!draft || !summary?.items.length) return;
    setError("");
    setConfirmingOrder(true);
    try {
      await confirmOrder(draft);
      setPaymentReady(true);
    } catch (confirmError) {
      setPaymentReady(false);
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : "ไม่สามารถยืนยัน Order ได้",
      );
    } finally {
      setConfirmingOrder(false);
    }
  }

  if (loading) {
    return (
      <main className="order-page">
        <p className="order-state" role="status">กำลังโหลดเมนู</p>
      </main>
    );
  }

  return (
    <main className="order-page">
      <header className="order-page__header">
        <div>
          <h1>03 · Ordering &amp; Payment</h1>
          <p>UC-03 · สั่งซื้อเครื่องดื่ม</p>
        </div>
        <span className="order-guest-badge">Guest</span>
      </header>

      <p className="order-notice">
        ต้นแบบหน้าชำระเงินนี้เป็นเพียงตัวอย่าง UI และยังไม่ดำเนินการชำระเงินจริง
      </p>
      {error && <p className="order-error" role="alert">{error}</p>}

      {view === "menu" ? (
        <section className="order-menu-section" aria-label="รายการเมนู">
          <h2>เลือกเครื่องดื่ม</h2>
          {visibleMenuItems.length === 0 ? (
            <p className="order-empty">ไม่พบเมนูที่เลือกในรายการสั่งซื้อ</p>
          ) : (
            <div className="order-menu-grid">
              {visibleMenuItems.map((menuItem) => {
              const isAvailable = menuItem.status === "open";
              const selection = selectionFor(menuItem.menu_id);
              const quantity = Number(selection.quantity);
              const canAdd =
                isAvailable &&
                Boolean(draft) &&
                Boolean(selection.sweetness) &&
                Number.isInteger(quantity) &&
                quantity > 0 &&
                savingMenuId !== menuItem.menu_id;

              return (
                <article
                  className="order-menu-card"
                  key={menuItem.menu_id}
                  aria-label={menuItem.name}
                >
                  <div className="order-menu-card__heading">
                    <h3>{menuItem.name}</h3>
                    <span className={isAvailable ? "order-status" : "order-status order-status--sold-out"}>
                      {isAvailable ? "เปิดขาย" : "หมด"}
                    </span>
                  </div>
                  {isAvailable && (
                    <div className="order-menu-card__fields">
                      <label className="order-field">
                        จำนวน
                        <input
                          aria-label="จำนวน"
                          type="number"
                          min="1"
                          step="1"
                          value={selection.quantity}
                          onChange={(event) =>
                            updateSelection(menuItem.menu_id, "quantity", event.target.value)
                          }
                        />
                      </label>

                      <label className="order-field">
                        ระดับความหวาน
                        <select
                          aria-label="ระดับความหวาน"
                          required
                          value={selection.sweetness}
                          onChange={(event) =>
                            updateSelection(menuItem.menu_id, "sweetness", event.target.value)
                          }
                        >
                          <option value="">เลือกระดับความหวาน</option>
                          {SWEETNESS_LEVELS.map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </label>

                      <fieldset className="order-toppings">
                        <legend>toppings (เลือกได้ตามต้องการ)</legend>
                        <div className="order-toppings__options">
                          {TOPPINGS.map((topping) => (
                            <label key={topping}>
                              <input
                                type="checkbox"
                                checked={selection.toppings.includes(topping)}
                                onChange={(event) =>
                                  toggleTopping(
                                    menuItem.menu_id,
                                    topping,
                                    event.target.checked,
                                  )
                                }
                              />
                              {topping}
                            </label>
                          ))}
                        </div>
                      </fieldset>

                      <label className="order-field">
                        น้ำแข็ง (ไม่เลือกใช้ใส่น้ำแข็งปริมาณปกติ)
                        <select
                          aria-label="ระดับน้ำแข็ง"
                          value={selection.iceLevel}
                          onChange={(event) =>
                            updateSelection(menuItem.menu_id, "iceLevel", event.target.value)
                          }
                        >
                          <option value="">ใส่น้ำแข็งปริมาณปกติ</option>
                          {ICE_LEVELS.map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}
                  <button
                    type="button"
                    className="order-primary-button"
                    disabled={!canAdd}
                    onClick={() => handleAddItem(menuItem)}
                  >
                    {isAvailable ? "สั่งซื้อ" : "หมด"}
                  </button>
                </article>
              );
              })}
            </div>
          )}

          {addedItems.length > 0 && (
            <section className="order-added-items" aria-label="รายการใน Order">
              <h2>รายการใน Order</h2>
              <ul>
                {addedItems.map((item) => (
                  <li key={item.order_item_id}>
                    {item.name} จำนวน {item.quantity} ระดับความหวาน {item.sweetness_level}
                    {" น้ำแข็ง "}
                    {item.ice_level}
                    {item.toppings?.length > 0 ? ` toppings ${item.toppings.join(", ")}` : ""}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <button
            type="button"
            className="order-primary-button order-summary-button"
            disabled={addedItems.length === 0 || loadingSummary}
            onClick={handleShowSummary}
          >
            {loadingSummary ? "กำลังโหลดสรุป Order" : "ตรวจสอบ Order"}
          </button>
        </section>
      ) : (
        <section className="order-checkout-layout" aria-label="สรุป Order">
          <div className="order-panel order-cart-panel">
            <div className="order-panel__heading">
              <h2>ตะกร้าสินค้า</h2>
              <button
                className="order-secondary-button"
                type="button"
                onClick={() => {
                  setShowAllMenuItems(true);
                  setView("menu");
                }}
              >
                + เลือกเครื่องดื่ม
              </button>
            </div>
            {summary?.items.length ? (
              <>
                <ul className="order-cart-list">
                  {summary.items.map((item) => (
                    <li className="order-cart-item" key={item.order_item_id}>
                      <div>
                        <h3>{item.name}</h3>
                        <p>{formatPrice(item.unit_price)} × {item.quantity}</p>
                        <label className="order-field">
                          จำนวน
                          <input
                            aria-label={`จำนวน ${item.name}`}
                            type="number"
                            min="0"
                            step="1"
                            value={item.quantity}
                            disabled={updatingItemId === item.order_item_id}
                            onChange={(event) =>
                              handleUpdateItem(item, { quantity: Number(event.target.value) })
                            }
                          />
                        </label>
                        <label className="order-field">
                          ระดับความหวาน
                          <select
                            aria-label={`ระดับความหวาน ${item.name}`}
                            defaultValue={
                              addedItems.find(
                                (addedItem) => addedItem.order_item_id === item.order_item_id,
                              )?.sweetness_level ?? ""
                            }
                            disabled={updatingItemId === item.order_item_id}
                            onChange={(event) =>
                              handleUpdateItem(item, { sweetness_level: event.target.value })
                            }
                          >
                            {SWEETNESS_LEVELS.map((level) => (
                              <option key={level} value={level}>{level}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <strong>{formatPrice(item.line_total)}</strong>
                    </li>
                  ))}
                </ul>
                <div className="order-total">
                  <strong>ยอดรวม</strong>
                  <strong>{formatPrice(summary.total_amount)}</strong>
                </div>
              </>
            ) : (
              <p className="order-empty">ไม่มีรายการใน Order</p>
            )}
          </div>

          <div className="order-panel order-payment-panel">
            <h2>ยืนยันและชำระเงิน</h2>
            <p className="order-payment-note">
              ส่วนนี้เป็นตัวอย่างหน้าจอจาก mockup ยังไม่เชื่อมต่อการชำระเงินจริง
            </p>
            <label className="order-field">
              ชื่อผู้รับเครื่องดื่ม
              <input aria-label="ชื่อผู้รับเครื่องดื่ม (ตัวอย่าง)" value="Guest" readOnly />
            </label>
            <label className="order-field">
              วิธีชำระเงิน
              <select aria-label="วิธีชำระเงิน (ตัวอย่าง)" value="qr" disabled>
                <option value="qr">QR Payment (จำลอง)</option>
              </select>
            </label>
            <button className="order-primary-button" type="button" disabled>
              {paymentReady ? "เข้าสู่ขั้นตอนชำระเงินแล้ว" : "ยืนยันคำสั่งซื้อ / ชำระสำเร็จ"}
            </button>
            <button
              className="order-primary-button"
              type="button"
              disabled={!summary?.items.length || confirmingOrder || paymentReady}
              onClick={handleConfirmOrder}
            >
              {confirmingOrder ? "กำลังตรวจสอบ Order" : "ยืนยัน Order เพื่อชำระเงิน"}
            </button>
            {paymentReady && (
              <p role="status">Order ผ่านการตรวจสอบและเข้าสู่ขั้นตอนชำระเงินแล้ว</p>
            )}
            <button className="order-secondary-button" type="button" disabled>
              จำลองกรณีชำระเงินล้มเหลว
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
