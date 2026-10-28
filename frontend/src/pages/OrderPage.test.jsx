// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import OrderPage from "./OrderPage.jsx";
import {
  addOrderItem,
  confirmOrder,
  createDraft,
  getMenu,
  getOrderSummary,
  updateOrderItem,
} from "../api/client.js";

vi.mock("../api/client.js", () => ({
  addOrderItem: vi.fn(),
  confirmOrder: vi.fn(),
  createDraft: vi.fn(),
  getMenu: vi.fn(),
  getOrderSummary: vi.fn(),
  updateOrderItem: vi.fn(),
}));

const openMenuItem = {
  menu_id: 17,
  name: "ชาไทย",
  status: "open",
  price: "65.00",
  promotion_price: null,
  effective_price: "65.00",
};

const draft = { order_date: "2026-10-27", order_id: "001" };

beforeEach(() => {
  vi.mocked(getMenu).mockResolvedValue([
    openMenuItem,
    { menu_id: 18, name: "เมนูหมด", status: "out_of_stock", price: "50.00" },
  ]);
  vi.mocked(createDraft).mockResolvedValue(draft);
  vi.mocked(getOrderSummary).mockResolvedValue({
    ...draft,
    items: [
      {
        order_item_id: 4,
        menu_item_id: 17,
        name: "ชาไทย",
        quantity: 2,
        unit_price: "65.00",
        line_total: "130.00",
        regular_price: "65.00",
        promotion_price: null,
      },
    ],
    total_amount: "130.00",
  });
  vi.mocked(addOrderItem).mockImplementation(async (item) => ({
    order_item_id: 4,
    ...item,
    ice_level: item.ice_level ?? "ใส่น้ำแข็งปริมาณปกติ",
    toppings: item.toppings ?? null,
  }));
  vi.mocked(updateOrderItem).mockImplementation(async (itemId, changes) => ({
    order_item_id: changes.quantity === 0 ? null : itemId,
    quantity: changes.quantity ?? 1,
    sweetness_level: changes.sweetness_level ?? "หวานปกติ 75%",
    toppings: null,
    ice_level: "ใส่น้ำแข็งปริมาณปกติ",
    total_amount: changes.quantity === 0 ? "0.00" : "65.00",
  }));
  vi.mocked(confirmOrder).mockResolvedValue({
    ...draft,
    payment_status: "pending",
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("OrderPage", () => {
  it("test_AC_ORDER_01_add_item_to_order", async () => {
    render(<OrderPage />);

    await screen.findByRole("heading", { name: "ชาไทย" });
    expect(screen.getByRole("button", { name: "หมด" }).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "สั่งซื้อ" }).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("จำนวน"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("ระดับความหวาน"), {
      target: { value: "หวานปกติ 75%" },
    });
    fireEvent.click(screen.getByRole("button", { name: "สั่งซื้อ" }));

    await waitFor(() => {
      expect(addOrderItem).toHaveBeenCalledWith({
        ...draft,
        menu_item_id: 17,
        quantity: 2,
        sweetness_level: "หวานปกติ 75%",
      });
    });
    expect(await screen.findByText(/ชาไทย จำนวน 2/)).not.toBeNull();
  });

  it("test_AC_ORDER_02_save_item_options", async () => {
    render(<OrderPage />);

    await screen.findByRole("heading", { name: "ชาไทย" });
    fireEvent.change(screen.getByLabelText("ระดับความหวาน"), {
      target: { value: "หวานน้อย 50%" },
    });

    fireEvent.click(screen.getByLabelText("ไข่มุก"));
    fireEvent.click(screen.getByLabelText("ชีส"));
    fireEvent.change(screen.getByLabelText("ระดับน้ำแข็ง"), {
      target: { value: "แยกน้ำแข็ง" },
    });
    fireEvent.click(screen.getByRole("button", { name: "สั่งซื้อ" }));

    await waitFor(() => {
      expect(addOrderItem).toHaveBeenCalledWith({
        ...draft,
        menu_item_id: 17,
        quantity: 1,
        sweetness_level: "หวานน้อย 50%",
        toppings: ["ไข่มุก", "ชีส"],
        ice_level: "แยกน้ำแข็ง",
      });
    });
    expect(
      await screen.findByText(/ระดับความหวาน หวานน้อย 50% น้ำแข็ง แยกน้ำแข็ง toppings ไข่มุก, ชีส/),
    ).not.toBeNull();
  });

  it("test_TC_ORDER_02_4_reject_missing_sweetness", async () => {
    render(<OrderPage />);

    await screen.findByRole("heading", { name: "ชาไทย" });
    fireEvent.click(screen.getByRole("button", { name: "สั่งซื้อ" }));

    expect(addOrderItem).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "สั่งซื้อ" }).disabled).toBe(true);
  });

  it("omits optional toppings and ice so the API applies the ice default", async () => {
    render(<OrderPage />);

    await screen.findByRole("heading", { name: "ชาไทย" });
    fireEvent.change(screen.getByLabelText("ระดับความหวาน"), {
      target: { value: "ไม่หวาน" },
    });
    fireEvent.click(screen.getByRole("button", { name: "สั่งซื้อ" }));

    await waitFor(() => {
      expect(addOrderItem).toHaveBeenCalledWith({
        ...draft,
        menu_item_id: 17,
        quantity: 1,
        sweetness_level: "ไม่หวาน",
      });
    });
    expect(await screen.findByText(/น้ำแข็ง ใส่น้ำแข็งปริมาณปกติ/)).not.toBeNull();
  });

  it("test_AC_ORDER_03_show_order_summary", async () => {
    render(<OrderPage />);

    await screen.findByRole("heading", { name: "ชาไทย" });
    fireEvent.change(screen.getByLabelText("ระดับความหวาน"), {
      target: { value: "หวานปกติ 75%" },
    });

    fireEvent.click(screen.getByRole("button", { name: "สั่งซื้อ" }));
    await screen.findByText(/ชาไทย จำนวน 1/);

    fireEvent.click(screen.getByRole("button", { name: "ตรวจสอบ Order" }));

    expect(await screen.findByRole("heading", { name: "ตะกร้าสินค้า" })).not.toBeNull();
    expect(screen.getByText("฿65.00 × 2")).not.toBeNull();
    expect(screen.getByText(/฿65\.00 × 2/)).not.toBeNull();
    expect(screen.getAllByText(/฿130\.00/)).toHaveLength(2);
    expect(screen.getByText("ยอดรวม")).not.toBeNull();
    expect(getOrderSummary).toHaveBeenCalledWith(draft);
  });

  it("test_TC_ORDER_03_1_show_order_summary", async () => {
    vi.mocked(getOrderSummary).mockResolvedValueOnce({
      ...draft,
      items: [
        {
          order_item_id: 4,
          menu_item_id: 17,
          name: "ชาไทย",
          quantity: 2,
          unit_price: "65.00",
          regular_price: "65.00",
          promotion_price: null,
          line_total: "130.00",
        },
        {
          order_item_id: 5,
          menu_item_id: 18,
          name: "โกโก้",
          quantity: 1,
          unit_price: "55.00",
          regular_price: "60.00",
          promotion_price: "55.00",
          line_total: "55.00",
        },
      ],
      total_amount: "185.00",
    });

    render(<OrderPage />);

    await screen.findByRole("heading", { name: "ชาไทย" });
    fireEvent.change(screen.getByLabelText("ระดับความหวาน"), {
      target: { value: "หวานปกติ 75%" },
    });
    fireEvent.click(screen.getByRole("button", { name: "สั่งซื้อ" }));
    await screen.findByText(/ชาไทย จำนวน 1/);

    fireEvent.click(screen.getByRole("button", { name: "ตรวจสอบ Order" }));

    expect(await screen.findByRole("heading", { name: "ตะกร้าสินค้า" })).not.toBeNull();
    expect(screen.getByRole("heading", { name: "ชาไทย" })).not.toBeNull();
    expect(screen.getByRole("heading", { name: "โกโก้" })).not.toBeNull();
    expect(screen.getByText("฿65.00 × 2")).not.toBeNull();
    expect(screen.getByText("฿55.00 × 1")).not.toBeNull();
    expect(screen.getByText("ราคาโปรโมชัน ฿55.00")).not.toBeNull();
    expect(screen.getAllByText(/฿130\.00/)).not.toHaveLength(0);
    expect(screen.getAllByText(/฿55\.00/)).not.toHaveLength(0);
    expect(screen.getByText("฿185.00")).not.toBeNull();
    expect(getOrderSummary).toHaveBeenCalledWith(draft);
  });

  it("test_AC_ORDER_03_show_promotion_price_and_effective_total", async () => {
    vi.mocked(getOrderSummary).mockResolvedValueOnce({
      ...draft,
      items: [{
        order_item_id: 4,
        menu_item_id: 17,
        name: "ชาไทย",
        quantity: 2,
        unit_price: "55.00",
        regular_price: "65.00",
        promotion_price: "55.00",
        line_total: "110.00",
      }],
      total_amount: "110.00",
    });

    render(<OrderPage />);
    await screen.findByRole("heading", { name: "ชาไทย" });
    fireEvent.change(screen.getByLabelText("ระดับความหวาน"), {
      target: { value: "หวานปกติ 75%" },
    });
    fireEvent.click(screen.getByRole("button", { name: "สั่งซื้อ" }));
    await screen.findByText(/ชาไทย จำนวน 1/);
    fireEvent.click(screen.getByRole("button", { name: "ตรวจสอบ Order" }));

    expect(await screen.findByText("ราคาโปรโมชัน ฿55.00")).not.toBeNull();
    expect(screen.getByText("ราคาปกติ ฿65.00")).not.toBeNull();
    expect(screen.getAllByText(/฿110\.00/).length).toBeGreaterThan(0);
  });

  it("renders payment controls as non-interactive mockup placeholders", async () => {
    render(<OrderPage />);

    await screen.findByRole("heading", { name: "ชาไทย" });
    fireEvent.change(screen.getByLabelText("ระดับความหวาน"), {
      target: { value: "หวานปกติ 75%" },
    });
    fireEvent.click(screen.getByRole("button", { name: "สั่งซื้อ" }));
    await screen.findByText(/ชาไทย จำนวน 1/);
    fireEvent.click(screen.getByRole("button", { name: "ตรวจสอบ Order" }));

    expect(await screen.findByRole("heading", { name: "ตะกร้าสินค้า" })).not.toBeNull();
    expect(screen.getByLabelText("ชื่อผู้รับเครื่องดื่ม (ตัวอย่าง)").value).toBe("Guest");
    expect(screen.getByLabelText("วิธีชำระเงิน (ตัวอย่าง)").disabled).toBe(true);
    expect(screen.getByRole("button", { name: "ยืนยันคำสั่งซื้อ / ชำระสำเร็จ" }).disabled)
      .toBe(true);
    expect(screen.getByRole("button", { name: "จำลองกรณีชำระเงินล้มเหลว" }).disabled)
      .toBe(true);
  });

  it("test_AC_ORDER_08_return_to_menu_for_more_items", async () => {
    render(<OrderPage />);

    await screen.findByRole("heading", { name: "ชาไทย" });
    fireEvent.change(screen.getByLabelText("ระดับความหวาน"), {
      target: { value: "หวานปกติ 75%" },
    });
    fireEvent.click(screen.getByRole("button", { name: "สั่งซื้อ" }));
    await screen.findByText(/ชาไทย จำนวน 1/);
    fireEvent.click(screen.getByRole("button", { name: "ตรวจสอบ Order" }));
    await screen.findByRole("heading", { name: "ตะกร้าสินค้า" });

    fireEvent.click(screen.getByRole("button", { name: "+ เลือกเครื่องดื่ม" }));

    expect(screen.getByRole("heading", { name: "ชาไทย" })).not.toBeNull();
    expect(screen.getByText(/ชาไทย จำนวน 1/)).not.toBeNull();
    expect(screen.getByRole("button", { name: "ตรวจสอบ Order" })).not.toBeNull();
  });

  it("shows only the clicked menu first and reveals all menus when adding another", async () => {
    vi.mocked(getMenu).mockResolvedValue([
      openMenuItem,
      { menu_id: 19, name: "ชาเขียว", status: "open", price: "55.00" },
      { menu_id: 18, name: "เมนูหมด", status: "out_of_stock", price: "50.00" },
    ]);
    render(<OrderPage initialMenuId={17} />);

    expect(await screen.findByRole("article", { name: "ชาไทย" })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "ชาเขียว" })).not.toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "เมนูหมด" })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("ระดับความหวาน"), {
      target: { value: "หวานปกติ 75%" },
    });
    fireEvent.click(screen.getByRole("button", { name: "สั่งซื้อ" }));
    await screen.findByText(/ชาไทย จำนวน 1/);

    fireEvent.click(screen.getByRole("button", { name: "ตรวจสอบ Order" }));
    await screen.findByRole("heading", { name: "ตะกร้าสินค้า" });
    fireEvent.click(screen.getByRole("button", { name: "+ เลือกเครื่องดื่ม" }));

    expect(await screen.findByRole("article", { name: "ชาเขียว" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "ชาไทย" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "เมนูหมด" })).toBeInTheDocument();
  });

  it("test_AC_ORDER_04_update_quantity_or_remove_item", async () => {
    render(<OrderPage />);

    await screen.findByRole("heading", { name: "ชาไทย" });
    fireEvent.change(screen.getByLabelText("ระดับความหวาน"), {
      target: { value: "หวานปกติ 75%" },
    });
    fireEvent.click(screen.getByRole("button", { name: "สั่งซื้อ" }));
    await screen.findByText(/ชาไทย จำนวน 1/);
    fireEvent.click(screen.getByRole("button", { name: "ตรวจสอบ Order" }));

    const quantity = await screen.findByLabelText("จำนวน ชาไทย");
    fireEvent.change(quantity, { target: { value: "0" } });

    await waitFor(() => {
      expect(updateOrderItem).toHaveBeenCalledWith(4, { quantity: 0 });
    });
    expect(await screen.findByText("ไม่มีรายการใน Order")).not.toBeNull();
  });

  it("test_AC_ORDER_09_recalculate_total_after_edit", async () => {
    render(<OrderPage />);

    await screen.findByRole("heading", { name: "ชาไทย" });
    fireEvent.change(screen.getByLabelText("ระดับความหวาน"), {
      target: { value: "หวานปกติ 75%" },
    });
    fireEvent.click(screen.getByRole("button", { name: "สั่งซื้อ" }));
    await screen.findByText(/ชาไทย จำนวน 1/);
    fireEvent.click(screen.getByRole("button", { name: "ตรวจสอบ Order" }));

    fireEvent.change(await screen.findByLabelText("จำนวน ชาไทย"), {
      target: { value: "3" },
    });

    await waitFor(() => {
      expect(updateOrderItem).toHaveBeenCalledWith(4, { quantity: 3 });
    });
    expect(await screen.findByText("ยอดรวม")).not.toBeNull();
    expect(await screen.findAllByText(/฿65\.00/)).not.toHaveLength(0);
  });

  it("test_AC_ORDER_05_confirm_order_to_payment", async () => {
    render(<OrderPage />);

    await screen.findByRole("heading", { name: "ชาไทย" });
    fireEvent.change(screen.getByLabelText("ระดับความหวาน"), {
      target: { value: "หวานปกติ 75%" },
    });
    fireEvent.click(screen.getByRole("button", { name: "สั่งซื้อ" }));
    await screen.findByText(/ชาไทย จำนวน 1/);
    fireEvent.click(screen.getByRole("button", { name: "ตรวจสอบ Order" }));

    fireEvent.click(await screen.findByRole("button", { name: "ยืนยัน Order เพื่อชำระเงิน" }));

    await waitFor(() => {
      expect(confirmOrder).toHaveBeenCalledWith(draft);
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Order ผ่านการตรวจสอบและเข้าสู่ขั้นตอนชำระเงินแล้ว",
    );
  });

  it("test_AC_ORDER_11_show_out_of_stock_message", async () => {
    vi.mocked(confirmOrder).mockRejectedValueOnce(
      new Error("Menu item is out of stock; choose another menu"),
    );
    render(<OrderPage />);

    await screen.findByRole("heading", { name: "ชาไทย" });
    fireEvent.change(screen.getByLabelText("ระดับความหวาน"), {
      target: { value: "หวานปกติ 75%" },
    });
    fireEvent.click(screen.getByRole("button", { name: "สั่งซื้อ" }));
    await screen.findByText(/ชาไทย จำนวน 1/);
    fireEvent.click(screen.getByRole("button", { name: "ตรวจสอบ Order" }));

    fireEvent.click(await screen.findByRole("button", { name: "ยืนยัน Order เพื่อชำระเงิน" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Menu item is out of stock; choose another menu",
    );
    expect(screen.queryByText("Order ผ่านการตรวจสอบและเข้าสู่ขั้นตอนชำระเงินแล้ว")).toBeNull();
  });
});
