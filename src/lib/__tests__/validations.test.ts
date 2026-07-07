import { describe, expect, it } from "vitest";
import {
  createInventorySchema,
  createVehicleSchema,
  vehicleModelField,
} from "@/lib/validations";
import { isValidFormDate, parseFormDate } from "@/lib/dates";

describe("form dates", () => {
  it("accepts YYYY-MM-DD from date inputs", () => {
    expect(isValidFormDate("2026-07-07")).toBe(true);
    expect(parseFormDate("2026-07-07").toISOString()).toBe(
      "2026-07-07T00:00:00.000Z"
    );
  });

  it("accepts full ISO datetime strings", () => {
    const iso = "2026-07-07T14:30:00.000Z";
    expect(isValidFormDate(iso)).toBe(true);
    expect(parseFormDate(iso).toISOString()).toBe(iso);
  });
});

describe("inventory validation", () => {
  it("accepts date-only purchaseDate", () => {
    const result = createInventorySchema.parse({
      registration: "AB12 CDE",
      make: "Ford",
      model: "",
      purchaseCost: 1500,
      purchaseDate: "2026-07-07",
    });

    expect(result.purchaseDate).toBe("2026-07-07");
    expect(result.model).toBe("Unknown");
  });
});

describe("vehicle model", () => {
  it("defaults empty model to Unknown", () => {
    expect(vehicleModelField.parse("")).toBe("Unknown");
    expect(vehicleModelField.parse(undefined)).toBe("Unknown");
    expect(createVehicleSchema.parse({
      registration: "XY99 ZZZ",
      make: "BMW",
      model: "  ",
    }).model).toBe("Unknown");
  });
});
