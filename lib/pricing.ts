// Discount display: teacher enters an original (struck-through) price and the
// final price the student pays. The % off is derived, never stored — whole
// numbers only (no decimals), and null when there's no genuine discount.
export function discountPct(
  originalINR: number | null | undefined,
  finalINR: number,
): number | null {
  if (!originalINR || originalINR <= finalINR || finalINR < 0) return null;
  return Math.round(((originalINR - finalINR) / originalINR) * 100);
}
