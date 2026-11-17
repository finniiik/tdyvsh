import { describe, expect, it } from "vitest";
import { SKINS } from "@/routes/index";

describe("Skin rarities", () => {
  it("keeps Alisa epic", () => {
    expect(SKINS.find((skin) => skin.id === "alisa")?.rarity).toBe("epic");
  });
  it("makes Andrey with Pikachu legendary", () => {
    expect(SKINS.find((skin) => skin.id === "pikachu")?.rarity).toBe("legendary");
  });
});