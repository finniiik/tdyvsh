import { describe, expect, it } from "vitest";
import { rollScratch, scratchReward, scratchLeft, SCRATCH_COOLDOWN } from "@/routes/index";

describe("Scratch polaroid", () => {
  it("gives 5 coins for a duplicate chibi", () => {
    expect(scratchReward("base", ["base"])).toEqual({ skin: null, coins: 5 });
  });
  it("gives the skin when not owned", () => {
    expect(scratchReward("alisa", ["base"])).toEqual({ skin: "alisa", coins: 0 });
  });
  it("usually gives 3 coins", () => {
    expect(rollScratch(() => 0.5)).toBeNull();
    expect(scratchReward(null, ["base"])).toEqual({ skin: null, coins: 3 });
  });
  it("drops a chibi only below 0.0000001", () => {
    expect(rollScratch(() => 0.0000001)).toBeNull();
    expect(rollScratch(() => 0.00000009)).not.toBeNull();
  });
  it("is available once every 24 hours", () => {
    expect(SCRATCH_COOLDOWN).toBe(24 * 60 * 60 * 1000);
    expect(scratchLeft(0, 24 * 3600_000 - 1)).toBe(1);
    expect(scratchLeft(0, 24 * 3600_000)).toBe(0);
  });
});
