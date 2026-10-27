import React, { useEffect, useState } from "react";

import {
  addOrderItem,
  createDraft,
  getMenu,
  getOrderSummary,
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
export default function OrderPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [draft, setDraft] = useState(null);
  const [selections, setSelections] = useState({});
  const [addedItems, setAddedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingMenuId, setSavingMenuId] = useState(null);
  const [error, setError] = useState("");
  const [view, setView] = useState("menu");
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

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

  if (loading) {
    return <p role="status">กำลังโหลดเมนู</p>;
  }

  return (
    <main>
      <h1>เลือกเครื่องดื่ม</h1>
      {error && <p role="alert">{error}</p>}

      {view === "menu" ? (
        <>
          <section aria-label="รายการเมนู">
            {menuItems.map((menuItem) => {
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
                <article key={menuItem.menu_id} aria-label={menuItem.name}>
                  <h2>{menuItem.name}</h2>
                  <p>{menuItem.status === "open" ? "เปิดขาย" : "หมด"}</p>
                  {isAvailable && (
                    <>
                      <label>
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

                      <label>
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

                      <fieldset>
                        <legend>toppings (เลือกได้ตามต้องการ)</legend>
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
                      </fieldset>

                      <label>
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
                    </>
                  )}
                  <button
                    type="button"
                    disabled={!canAdd}
                    onClick={() => handleAddItem(menuItem)}
                  >
                    {isAvailable ? "สั่งซื้อ" : "หมด"}
                  </button>
                </article>
              );
            })}
          </section>

          {addedItems.length > 0 && (
            <section aria-label="รายการใน Order">
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
            disabled={addedItems.length === 0 || loadingSummary}
            onClick={handleShowSummary}
          >
            {loadingSummary ? "กำลังโหลดสรุป Order" : "ตรวจสอบ Order"}
          </button>
        </>
      ) : (
        <section aria-label="สรุป Order">
          <h2>สรุป Order</h2>
          {summary?.items.length ? (
            <>
              <ul>
                {summary.items.map((item) => (
                  <li key={item.order_item_id}>
                    <h3>{item.name}</h3>
                    <p>จำนวน {item.quantity}</p>
                    <p>ราคา {formatPrice(item.unit_price)}</p>
                    <p>รวม {formatPrice(item.line_total)}</p>
                  </li>
                ))}
              </ul>
              <p>ยอดรวม {formatPrice(summary.total_amount)}</p>
            </>
          ) : (
            <p>ไม่มีรายการใน Order</p>
          )}
          <button type="button" onClick={() => setView("menu")}>
            เลือกเครื่องดื่มเพิ่ม
          </button>
        </section>
      )}
    </main>
  );
}
