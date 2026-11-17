export type SecretNode = { id: string; name: string; children?: SecretNode[]; locked?: boolean; media?: "photo" | "video" };
export const SECRET_ROOTS: SecretNode[] = Array.from({ length: 24 }, (_, i) => ({
  id: `vanessa-${i}`, name: "кто такая ванесса рысь?", children: [],
}));
function chain(names: string[], leaf: SecretNode): SecretNode[] {
  return names.reduceRight<SecretNode[]>((children, name, i) => [{ id: `${leaf.id}-${i}`, name, children }], [leaf]);
}
const videoRoot = SECRET_ROOTS[17];
if (videoRoot) videoRoot.children = chain(["андре", "пирокине", "кокша", "авокадо", "НЕ СМОТРИ", "ТОЧНО НЕ СМОТРИ"], {
  id: "locked-video", name: "секрет", locked: true, children: [{ id: "video", name: "Classic.mp4", media: "video" }],
});
const photoRoot = SECRET_ROOTS[6];
if (photoRoot) photoRoot.children = chain(["точно не пароль", "ну точно не здесь", "уйди"], { id: "photo", name: "IMG_7323.jpeg", media: "photo" });
export const PASSWORD_HASH = "20a5ca3f015870f8c5aa0a9f5896a78d3d92092aa7eab24087b7c8bd6d6c5fda";
export async function checkFolderPassword(password: string): Promise<boolean> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`chibi-folder-v1:${password}`));
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, "0")).join("") === PASSWORD_HASH;
}
export function deleteSecretFolder(deleted: string[], id: string): string[] {
  return SECRET_ROOTS.some(node => node.id === id) ? Array.from(new Set([...deleted, id])) : deleted;
}
export function scatterFolders(ids: string[], saved: Record<string, { c: number; r: number }>, cols: number, occupied: Record<string, { c: number; r: number }>) {
  const out = { ...occupied };
  const busy = new Set(Object.values(out).map(p => `${p.c},${p.r}`));
  const rows = Math.ceil((ids.length + busy.size) / cols) + 3;
  const cells = Array.from({ length: rows * cols }, (_, i) => ({ c: i % cols, r: Math.floor(i / cols) }));
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = cells[i], b = cells[j];
    if (a && b) { cells[i] = b; cells[j] = a; }
  }
  for (const id of ids) {
    const p = saved[id];
    const cell = p && p.c >= 0 && p.c < cols && p.r >= 0 && !busy.has(`${p.c},${p.r}`) ? p : cells.find(p => !busy.has(`${p.c},${p.r}`));
    if (cell) { out[id] = cell; busy.add(`${cell.c},${cell.r}`); }
  }
  return out;
}