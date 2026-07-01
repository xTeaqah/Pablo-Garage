/** GBP amounts — always round to 2 decimal places server-side. */
export function roundMoney(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function calcLineTotal(quantity: number, unitPrice: number): number {
  return roundMoney(quantity * unitPrice);
}

export function sumMoney(amounts: number[]): number {
  return roundMoney(amounts.reduce((sum, n) => sum + n, 0));
}
