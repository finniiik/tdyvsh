import { describe, expect, it } from "vitest";
import { SECRET_ROOTS, checkFolderPassword, deleteSecretFolder, scatterFolders } from "@/lib/secret-folders";
describe("Secret folders", () => {
  it("accepts 22 and rejects another two-digit password", async () => {
    expect(await checkFolderPassword("22")).toBe(true);
    expect(await checkFolderPassword("21")).toBe(false);
  });
  it("never deletes a main game folder", () => {
    expect(deleteSecretFolder([], "clicker")).toEqual([]);
    expect(deleteSecretFolder([], "collection")).toEqual([]);
    expect(deleteSecretFolder([], "fortune")).toEqual([]);
    expect(deleteSecretFolder([], "quests")).toEqual([]);
    expect(deleteSecretFolder([], "scratch")).toEqual([]);
    expect(deleteSecretFolder([], "vanessa-17")).toEqual(["vanessa-17"]);
  });
  it("keeps the requested video folder chain", () => {
    let node = SECRET_ROOTS[17]?.children?.[0];
    for (const name of ["андре", "пирокине", "кокша", "авокадо", "НЕ СМОТРИ", "ТОЧНО НЕ СМОТРИ"]) {
      expect(node?.name).toBe(name); node = node?.children?.[0];
    }
    expect(node?.locked).toBe(true); expect(node?.children?.[0]?.media).toBe("video");
  });
  it("keeps the photo in its separate misleading folder chain", () => {
    let node = SECRET_ROOTS[6]?.children?.[0];
    for (const name of ["точно не пароль", "ну точно не здесь", "уйди"]) {
      expect(node?.name).toBe(name); node = node?.children?.[0];
    }
    expect(node?.media).toBe("photo");
  });
  it("scatters folders without moving or covering game icons", () => {
    const main = { clicker: { c: 0, r: 0 }, collection: { c: 1, r: 0 } };
    const result = scatterFolders(SECRET_ROOTS.map(n => n.id), {}, 4, main);
    expect(result['clicker']).toEqual(main.clicker); expect(result['collection']).toEqual(main.collection);
    expect(new Set(Object.values(result).map(p => `${p.c},${p.r}`)).size).toBe(26);
  });
});