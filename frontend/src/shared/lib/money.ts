/**
 * Money helpers. All amounts are integer cents (e.g. 2250 = ¥22.50).
 * Never use floating point arithmetic for money math in feature code.
 */

/** Format integer cents as `¥xx.xx`. */
export function formatCents(cents: number): string {
  const safe = Math.trunc(cents);
  const sign = safe < 0 ? '-' : '';
  const abs = Math.abs(safe);
  const yuan = Math.floor(abs / 100);
  const remainder = abs % 100;
  return `${sign}¥${yuan}.${remainder.toString().padStart(2, '0')}`;
}

/** Convert a user-entered yuan amount to integer cents, rounding half up. */
export function yuanToCents(yuan: number): number {
  return Math.round(yuan * 100);
}

/** Convert integer cents to a yuan number for display in inputs only. */
export function centsToYuan(cents: number): number {
  return cents / 100;
}

/** Sum integer cents. */
export function sumCents(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}
