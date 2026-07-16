import { describe, it, expect } from "vitest";
import { discountPct } from "@/lib/pricing";

describe("discountPct", () => {
  it("rounds to a whole number of percent", () => {
    expect(discountPct(15000, 12000)).toBe(20);
    expect(discountPct(999, 499)).toBe(50); // 50.05% → 50
    expect(discountPct(1000, 333)).toBe(67); // 66.7% → 67
  });

  it("returns null when there is no genuine discount", () => {
    expect(discountPct(null, 12000)).toBeNull();
    expect(discountPct(undefined, 12000)).toBeNull();
    expect(discountPct(12000, 12000)).toBeNull(); // equal → no badge
    expect(discountPct(10000, 12000)).toBeNull(); // "original" below final
    expect(discountPct(0, 12000)).toBeNull();
  });
});
