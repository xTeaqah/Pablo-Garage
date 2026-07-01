import { roundMoney, sumMoney } from "@/lib/money";

export function withInventoryTotals<
  T extends {
    purchaseCost: number;
    parts: { cost: number }[];
    salePrice: number | null;
  },
>(car: T) {
  const partsCost = sumMoney(car.parts.map((part) => part.cost));
  const totalCost = roundMoney(car.purchaseCost + partsCost);
  const profit =
    car.salePrice != null ? roundMoney(car.salePrice - totalCost) : null;

  return { ...car, partsCost, totalCost, profit };
}
