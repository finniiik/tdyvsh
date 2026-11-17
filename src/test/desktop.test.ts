import { describe, it, expect } from "vitest";
import { layoutIcons, dropIcon } from "@/routes/index";

describe("значки рабочего стола", () => {
  it("значок можно поставить в любую пустую клетку", () => {
    const p = dropIcon({ a: { c: 0, r: 0 }, b: { c: 1, r: 0 } }, "a", 3, 2);
    expect(p['a']).toEqual({ c: 3, r: 2 });
    expect(p['b']).toEqual({ c: 1, r: 0 });
  });
  it("в занятую клетку — меняются местами", () => {
    const p = dropIcon({ a: { c: 0, r: 0 }, b: { c: 1, r: 0 } }, "a", 1, 0);
    expect(p).toEqual({ a: { c: 1, r: 0 }, b: { c: 0, r: 0 } });
  });
  it("сохранённые позиции не сбрасываются", () => {
    expect(layoutIcons(["a", "b"], { b: { c: 2, r: 3 } }, 4)).toEqual({ a: { c: 0, r: 0 }, b: { c: 2, r: 3 } });
  });
});
