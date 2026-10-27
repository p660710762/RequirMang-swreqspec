// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import OrderPage from "./OrderPage.jsx";
import {
  addOrderItem,
  createDraft,
  getMenu,
  getOrderSummary,
} from "../api/client.js";

vi.mock("../api/client.js", () => ({
  addOrderItem: vi.fn(),
  createDraft: vi.fn(),
  getMenu: vi.fn(),
  getOrderSummary: vi.fn(),
}));

const openMenuItem = {
  menu_id: 17,
  name: "ชาไทย",
  status: "open",
  price: "65.00",
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

    expect(await screen.findByRole("heading", { name: "สรุป Order" })).not.toBeNull();
    expect(screen.getByText("จำนวน 2")).not.toBeNull();
    expect(screen.getByText(/ราคา ฿65\.00/)).not.toBeNull();
    expect(screen.getAllByText(/฿130\.00/)).toHaveLength(2);
    expect(screen.getByText(/ยอดรวม/).textContent).toContain("฿130.00");
    expect(getOrderSummary).toHaveBeenCalledWith(draft);
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
    await screen.findByRole("heading", { name: "สรุป Order" });

    fireEvent.click(screen.getByRole("button", { name: "เลือกเครื่องดื่มเพิ่ม" }));

    expect(screen.getByRole("heading", { name: "ชาไทย" })).not.toBeNull();
    expect(screen.getByText(/ชาไทย จำนวน 1/)).not.toBeNull();
    expect(screen.getByRole("button", { name: "ตรวจสอบ Order" })).not.toBeNull();
  });
});
