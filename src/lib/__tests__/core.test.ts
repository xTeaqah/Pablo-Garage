import { describe, expect, it } from "vitest";
import { calcLineTotal, roundMoney, sumMoney } from "@/lib/money";
import {
  canTransitionJobStatus,
  isJobDeletable,
  isJobFinanciallyLocked,
} from "@/lib/job-status";
import { generateInvoiceNumber } from "@/lib/utils";

describe("money", () => {
  it("rounds to two decimal places", () => {
    expect(roundMoney(10.005)).toBe(10.01);
    expect(roundMoney(1.234)).toBe(1.23);
  });

  it("calculates line totals from quantity and unit price", () => {
    expect(calcLineTotal(2, 45)).toBe(90);
    expect(calcLineTotal(1.25, 45)).toBe(56.25);
  });

  it("sums money without drift", () => {
    expect(sumMoney([10.1, 20.2])).toBe(30.3);
  });
});

describe("job status", () => {
  it("allows valid transitions", () => {
    expect(canTransitionJobStatus("SCHEDULED", "IN_PROGRESS")).toBe(true);
    expect(canTransitionJobStatus("COMPLETE", "INVOICED")).toBe(true);
  });

  it("blocks invalid transitions", () => {
    expect(canTransitionJobStatus("PAID", "SCHEDULED")).toBe(false);
    expect(canTransitionJobStatus("INVOICED", "SCHEDULED")).toBe(false);
  });

  it("locks financially settled jobs", () => {
    expect(isJobFinanciallyLocked("INVOICED")).toBe(true);
    expect(isJobFinanciallyLocked("PAID")).toBe(true);
    expect(isJobDeletable("COMPLETE")).toBe(true);
    expect(isJobDeletable("PAID")).toBe(false);
  });
});

describe("invoice numbers", () => {
  it("formats with prefix, year, and padded counter", () => {
    const year = new Date().getFullYear();
    expect(generateInvoiceNumber("MG", 42)).toBe(`MG-${year}-0042`);
  });
});
