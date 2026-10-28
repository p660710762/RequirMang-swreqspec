// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import OrderPage from "../pages/OrderPage.jsx";
import { addOrderItem, createDraft, getMenu, getOrderSummary } from "../api/client.js";

vi.mock("../api/client.js", () => ({
  addOrderItem: vi.fn(),
  createDraft: vi.fn(),
  getMenu: vi.fn(),
  getOrderSummary: vi.fn(),
}));

const menuItem = {
  menu_id: 17,
  name: "ชาไทย",
  status: "open",
  price: "65.00",
};
const draft = { order_date: "2026-10-27", order_id: "001" };

beforeEach(() => {
  vi.mocked(getMenu).mockResolvedValue([menuItem]);
  vi.mocked(createDraft).mockResolvedValue(draft);
  vi.mocked(getOrderSummary).mockResolvedValue({
    ...draft,
    items: [],
    total_amount: "0.00",
  });
  vi.mocked(addOrderItem).mockResolvedValue({
    order_item_id: 1,
    ...draft,
    menu_item_id: 17,
    quantity: 1,
    name: "ชาไทย",
    sweetness_level: "หวานปกติ 75%",
    ice_level: "ใส่น้ำแข็งปริมาณปกติ",
    toppings: null,
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("TC-ORDER-01-2", () => {
  it("test_TC_ORDER_01_2_add_open_menu_item", async () => {
    // Given ผู้ใช้เปิดรายการเมนูและมีเครื่องดื่มที่เปิดขาย
    render(<OrderPage />);
    await screen.findByRole("heading", { name: "ชาไทย" });

    // When ผู้ใช้เลือกเครื่องดื่มที่เปิดขายจากหน้าจอ
    fireEvent.change(screen.getByLabelText("ระดับความหวาน"), {
      target: { value: "หวานปกติ 75%" },
    });
    fireEvent.click(screen.getByRole("button", { name: "สั่งซื้อ" }));

    // Then ระบบเพิ่มเครื่องดื่มที่เลือกเข้าสู่รายการ Order
    await waitFor(() => {
      expect(addOrderItem).toHaveBeenCalledWith({
        ...draft,
        menu_item_id: 17,
        quantity: 1,
        sweetness_level: "หวานปกติ 75%",
      });
    });
    expect(await screen.findByText(/ชาไทย จำนวน 1/)).not.toBeNull();
  });
});
