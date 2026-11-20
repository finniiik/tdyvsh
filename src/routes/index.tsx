import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import base from "@/assets/chibi_andrey_updated.png";
import y2018 from "@/assets/chibi_andrey_2018_updated.png";
import alisa from "@/assets/chibi_alisa_updated.png";
import { Button } from "@/components/ui/button";
import { SecretExplorer } from "@/components/secret-explorer";
import { SECRET_ROOTS, deleteSecretFolder, scatterFolders, type SecretNode } from "@/lib/secret-folders";
import pikachu from "@/assets/chibi_andrey_pikachu.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "чиби андрей пирокинезис" },
      { name: "description", content: "просто чиби кликер:)))" },
      { property: "og:title", content: "чиби андрей пирокинезис" },
      { property: "og:description", content: "просто чиби кликер:)))" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Rarity = "common" | "rare" | "epic" | "legendary";
export const RARITY: Record<Rarity, { name: string; stars: number; cls: string }> = {
  common: { name: "обычная", stars: 1, cls: "r-common" },
  rare: { name: "редкая", stars: 2, cls: "r-rare" },
  epic: { name: "эпическая", stars: 3, cls: "r-epic" },
  legendary: { name: "легендарная", stars: 4, cls: "r-legendary" },
};
export const SKINS: { id: string; name: string; src: string; clicks: number; cost: number; rarity: Rarity; no: string; needOwned?: number }[] = [
  { id: "base", name: "Чиби Андрей", src: base, clicks: 0, cost: 0, rarity: "common", no: "001" },
  { id: "2018", name: "Чиби Андрей 2018", src: y2018, clicks: 5000, cost: 10, rarity: "rare", no: "002" },
  { id: "alisa", name: "Чиби Алиса", src: alisa, clicks: 15000, cost: 25, rarity: "epic", no: "003" },
  { id: "pikachu", name: "Чиби Андрей с Пикачу", src: pikachu, clicks: 50000, cost: 75, rarity: "legendary", no: "004" },
  { id: "chudo", name: "Чиби чудо Андрей", src: "/skins/chudo.png", clicks: 0, cost: 10000, rarity: "legendary", no: "005", needOwned: 3 },
];

function Card({ s, has }: { s: (typeof SKINS)[number]; has: boolean }) {
  const r = RARITY[s.rarity];
  return (
    <div className={`card ${r.cls} ${has ? "" : "locked"}`}>
      <div className="flex justify-between text-[10px] px-1"><span>№{s.no}</span><span>{"★".repeat(r.stars)}</span></div>
      <div className="card-art"><img src={s.src} alt="" className={`h-full w-full object-contain ${has ? "" : "brightness-0 opacity-40"}`} /></div>
      <div className="text-xs truncate text-center">{has ? s.name : "???"}</div>
      <div className="card-tag">{r.name}</div>
    </div>
  );
}
const COIN_EVERY = 500;

/* ===== античит: 1) подпись сохранения 2) проверка честности баланса и скинов 3) защита от автокликера ===== */
const AC_SALT = "chibi-os::\u0441\u043e\u043b\u044c::v1";
function acHash(str: string) { let h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (h2 >>> 0).toString(36) + (h1 >>> 0).toString(36); }
const acSign = (d: object) => acHash(AC_SALT + JSON.stringify(d) + AC_SALT.length);
/** Сколько коинов игрок мог честно заработать минус потраченное. */
function acSanitize(d: { clicks: number; coins: number; owned: string[]; skin: string; claimed: string[]; bonus: number; spent: number; gifts: string[] }) {
  const clicks = Math.max(0, Math.floor(d.clicks) || 0);
  const claimed = Array.from(new Set(d.claimed)).filter((id) => { const q = QUESTS.find((x) => x.id === id); return q && clicks >= q.clicks; });
  const gifts = d.gifts.filter((id) => SKINS.some((x) => x.id === id));
  const owned = Array.from(new Set(["base", ...d.owned.filter((id) => { const sk = SKINS.find((x) => x.id === id); return sk && (clicks >= sk.clicks || gifts.includes(id)); })]));
  const earned = Math.floor(clicks / COIN_EVERY) + claimed.reduce((a, id) => a + (QUESTS.find((x) => x.id === id)?.reward ?? 0), 0) + Math.max(0, d.bonus || 0);
  const coins = Math.max(0, Math.min(Math.floor(d.coins) || 0, earned - Math.max(0, d.spent || 0)));
  return { clicks, coins, owned, skin: owned.includes(d.skin) ? d.skin : "base", claimed, bonus: Math.max(0, d.bonus || 0), spent: Math.max(0, d.spent || 0), gifts };
}
const AC_MAX_CPS = 40;
/** Все коины считаются из прогресса: клики + задания + бонусы − потраченное. Так ничего не теряется. */
export function calcCoins(clicks: number, claimed: string[], bonus: number, spent: number) {
  const q = Array.from(new Set(claimed)).reduce((a, id) => { const x = QUESTS.find((y) => y.id === id); return a + (x && clicks >= x.clicks ? x.reward : 0); }, 0);
  return Math.max(0, Math.floor(Math.max(0, clicks) / COIN_EVERY) + q + Math.max(0, bonus || 0) - Math.max(0, spent || 0));
}

function Bolt() {
  return (
    <svg viewBox="0 0 100 200" className="bolt absolute inset-0 m-auto h-full text-spark pointer-events-none">
      <path d="M60 0 L20 110 L48 110 L30 200 L85 80 L55 80 L75 0Z" fill="currentColor" />
    </svg>
  );
}

function Coin({ small }: { small?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={small ? "w-4 h-4" : "w-7 h-7"}>
      <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"
        fill="var(--primary)" stroke="var(--border)" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function Clock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const f = () => setT(new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));
    f();
    const i = setInterval(f, 1000);
    return () => clearInterval(i);
  }, []);
  return <span className="tabular-nums">{t}</span>;
}

type WinId = "clicker" | "collection" | "fortune" | "quests" | "wallpaper" | "scratch";
const WINS: { id: WinId; title: string }[] = [
  { id: "clicker", title: "пирочибиклик" },
  { id: "collection", title: "коллекция" },
  { id: "fortune", title: "фортуна" },
  { id: "quests", title: "задания" },
  { id: "scratch", title: "полароид" },
];
export const CELL_W = 88, CELL_H = 84;
type Cell = { c: number; r: number };
/** Раскладка значков: сохранённые позиции остаются, остальные встают в первые свободные клетки. */
export function layoutIcons(ids: string[], saved: Record<string, Cell>, cols: number) {
  const out: Record<string, Cell> = {}, busy = new Set<string>();
  for (const id of ids) { const p = saved[id]; if (p && p.c < cols && !busy.has(`${p.c},${p.r}`)) { out[id] = { c: p.c, r: p.r }; busy.add(`${p.c},${p.r}`); } }
  let i = 0;
  for (const id of ids) { if (out[id]) continue; while (busy.has(`${i % cols},${Math.floor(i / cols)}`)) i++; out[id] = { c: i % cols, r: Math.floor(i / cols) }; busy.add(`${i % cols},${Math.floor(i / cols)}`); }
  return out;
}
/** Бросили значок в клетку: если она занята — значки меняются местами. */
export function dropIcon(pos: Record<string, Cell>, id: string, c: number, r: number) {
  const n = { ...pos }, from = n[id];
  if (!from) return n;
  const other = Object.keys(n).find((k) => k !== id && n[k]?.c === c && n[k]?.r === r);
  if (other) n[other] = { ...from };
  n[id] = { c, r };
  return n;
}
function FolderIco({ cls = "" }: { cls?: string }) {
  return (
    <svg viewBox="0 0 48 40" className={`w-12 h-10 ${cls}`}>
      <path d="M3 8a3 3 0 0 1 3-3h12l4 4h20a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" fill="var(--primary)" stroke="var(--border)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M3 15h42" stroke="var(--border)" strokeWidth="2" />
    </svg>
  );
}

function ZipIco() {
  return (
    <svg viewBox="0 0 48 40" className="w-12 h-10">
      <path d="M3 8a3 3 0 0 1 3-3h12l4 4h20a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" fill="var(--accent)" stroke="var(--border)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M24 9v26" stroke="var(--border)" strokeWidth="5" strokeDasharray="3 3" />
      <rect x="20" y="20" width="8" height="8" rx="1" fill="var(--card)" stroke="var(--border)" strokeWidth="2" />
    </svg>
  );
}

function TitleBar({ title, right, onClose }: { title: string; right?: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="titlebar text-primary-foreground pl-3 pr-1 py-1.5 flex items-center justify-between gap-2 border-b-[2.5px] border-border leading-[1.2]">
      <span className="text-base truncate leading-[1.2]">{title}</span>
      <div className="flex items-center gap-1">
        {right}
        <span className="winbtn">–</span><span className="winbtn">□</span>
        <button onClick={onClose} aria-label="закрыть" className="winbtn">X</button>
      </div>
    </div>
  );
}

function Index() {
  const [clicks, setClicks] = useState(0);
  const [owned, setOwned] = useState<string[]>(["base"]);
  const [skin, setSkin] = useState("base");
  const [pop, setPop] = useState(0);
  const [floats, setFloats] = useState<{ id: number; x: number; y: number }[]>([]);
  const [zap, setZap] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [boot, setBoot] = useState(true);
  const [stack, setStack] = useState<WinId[]>(["clicker"]);
  const [off, setOff] = useState<Partial<Record<WinId, { x: number; y: number }>>>({});
  const [folder, setFolder] = useState<Rarity | null>(null);
  const [credits, setCredits] = useState(false);
  const [claimed, setClaimed] = useState<string[]>([]);
  const [bonus, setBonus] = useState(0);
  const [spent, setSpent] = useState(0);
  const [gifts, setGifts] = useState<string[]>([]);
  const coins = calcCoins(clicks, claimed, bonus, spent);
  const clickTimes = useRef<number[]>([]);
  const [cheat, setCheat] = useState("");
  const [wall, setWall] = useState("");
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const pressRef = useRef<number | null>(null);
  const deskRef = useRef<HTMLDivElement>(null);
  const movedRef = useRef(false);
  const [cols, setCols] = useState(4);
  const [deletedFolders, setDeletedFolders] = useState<string[]>([]);
  const [secretRoot, setSecretRoot] = useState<SecretNode | null>(null);
  const [folderMenu, setFolderMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  useEffect(() => { try { const saved = JSON.parse(localStorage.getItem("chibi_deleted_folders_v1") || "[]"); if (Array.isArray(saved)) setDeletedFolders(saved.filter((id): id is string => typeof id === "string")); } catch {} }, []);
  const removeFolder = (id: string) => { setDeletedFolders(previous => { const next = deleteSecretFolder(previous, id); try { localStorage.setItem("chibi_deleted_folders_v1", JSON.stringify(next)); } catch {} return next; }); setSecretRoot(null); setFolderMenu(null); };
  const [look, setLook] = useState(false);
  const [theme, setTheme] = useState("");
  const [folderText, setFolderText] = useState("");
  useEffect(() => { try { setTheme(localStorage.getItem("chibi_theme") || ""); setFolderText(localStorage.getItem("chibi_folder_text") || ""); } catch {} }, []);
  const pickTheme = (n: string) => { setTheme(n); document.documentElement.dataset["theme"] = n; try { localStorage.setItem("chibi_theme", n); } catch {} };
  const pickFolderText = (c: string) => { setFolderText(c); try { localStorage.setItem("chibi_folder_text", c); } catch {} };
  const [unzipped, setUnzipped] = useState(false);
  const [zipMenu, setZipMenu] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => { try { document.documentElement.dataset["theme"] = localStorage.getItem("chibi_theme") || ""; } catch {} }, []);
  useEffect(() => { try { setUnzipped(localStorage.getItem("chibi_unzip") === "1"); } catch {} }, []);
  const unzip = () => { setUnzipped(true); setZipMenu(null); try { localStorage.setItem("chibi_unzip", "1"); } catch {} };
  const rezip = () => { setUnzipped(false); setMenu(null); setSecretRoot(null); try { localStorage.setItem("chibi_unzip", "0"); } catch {} };
  const zipAt = (x: number, y: number) => setZipMenu({ x: Math.min(x, window.innerWidth - 180), y: Math.min(y, window.innerHeight - 60) });
  const deskIcons = [...WINS, ...(unzipped ? [] : [{ id: "zip", title: "квест.zip" }]), ...(!unzipped ? [] : SECRET_ROOTS.filter(node => !deletedFolders.includes(node.id)).map(node => ({ id: node.id, title: node.name })))];
  const [pos, setPos] = useState<Record<string, { c: number; r: number }>>({});
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; tc: number; tr: number } | null>(null);
  useEffect(() => {
    const fit = () => setCols(Math.max(3, Math.floor((deskRef.current?.clientWidth ?? 360) / CELL_W)));
    fit(); window.addEventListener("resize", fit); return () => window.removeEventListener("resize", fit);
  }, [boot]);
  useEffect(() => { let saved: Record<string, { c: number; r: number }> = {}; try { saved = JSON.parse(localStorage.getItem("chibi_pos") || "{}") || {}; } catch {} const game = layoutIcons([...WINS.map((w) => w.id), ...(unzipped ? [] : ["zip"])], saved, cols); const next = scatterFolders((unzipped ? SECRET_ROOTS : []).filter(node => !deletedFolders.includes(node.id)).map(node => node.id), saved, cols, game); setPos(next); try { localStorage.setItem("chibi_pos", JSON.stringify(next)); } catch {} }, [cols, deletedFolders, unzipped]);
  const startDrag = (e: React.PointerEvent<HTMLButtonElement>, id: string) => {
    if (e.button > 0) return;
    if (!deskRef.current) return;
    const box = deskRef.current.getBoundingClientRect(), el = e.currentTarget.getBoundingClientRect();
    const ox = e.clientX - el.left, oy = e.clientY - el.top, sx = e.clientX, sy = e.clientY;
    const touch = e.pointerType !== "mouse"; let armed = !touch, active = false; movedRef.current = false;
    const hold = touch ? window.setTimeout(() => { armed = true; navigator.vibrate?.(15); if (id === "zip") { movedRef.current = true; zipAt(sx, sy); } }, id === "zip" ? 500 : 250) : 0;
    const move = (ev: PointerEvent) => {
      if (!armed) { if (Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) { clearTimeout(hold); cleanup(); } return; }
      if (!active && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 5) return;
      active = true; movedRef.current = true; ev.preventDefault();
      const x = ev.clientX - box.left - ox, y = ev.clientY - box.top - oy;
      setDrag({ id, x, y, tc: Math.min(cols - 1, Math.max(0, Math.round(x / CELL_W))), tr: Math.max(0, Math.round(y / CELL_H)) });
    };
    const up = () => { clearTimeout(hold); cleanup();
      setDrag((d) => { if (d) setPos((p) => { const n = dropIcon(p, d.id, d.tc, d.tr); try { localStorage.setItem("chibi_pos", JSON.stringify(n)); } catch {} return n; }); return null; });
      setTimeout(() => { movedRef.current = false; }, 0); };
    const cleanup = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
    window.addEventListener("pointermove", move, { passive: false }); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  };
  const deskH = (Math.max(0, ...Object.values(pos).map((p) => p.r), drag?.tr ?? 0) + 1) * CELL_H;
  useEffect(() => { const t = setTimeout(() => setBoot(false), 2600); return () => clearTimeout(t); }, []);

  useEffect(() => {
    const read = (k: string) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } };
    const ok = (v: any) => v && v.d && v.sig === acSign(v.d) ? v.d : null;
    const raw = read("chibi"), bak = read("chibi_bak");
    let d = ok(raw) || ok(bak);
    const legacy = (v: any) => v && !v.sig && Number.isFinite(v.clicks) ? { ...v, bonus: Math.min(50, v.coins || 0), spent: 0, gifts: v.owned || [] } : null;
    if (!d) d = legacy(raw) || legacy(bak);
    if (!d && (raw || bak)) { setCheat("сохранение было изменено вручную — прогресс сброшен"); }
    if (d) {
      const c = acSanitize({ clicks: d.clicks, coins: d.coins, owned: Array.isArray(d.owned) ? d.owned : [], skin: String(d.skin), claimed: Array.isArray(d.claimed) ? d.claimed : [], bonus: d.bonus, spent: d.spent, gifts: Array.isArray(d.gifts) ? d.gifts : [] });
      if (c.owned.length !== (d.owned?.length ?? 0)) setCheat("найдены нечестные коины или скины — они убраны");
      setClicks(c.clicks); setOwned(c.owned); setSkin(c.skin); setClaimed(c.claimed); setBonus(c.bonus); setSpent(c.spent); setGifts(c.gifts);
    }
    try { setWall(localStorage.getItem("chibi_wall") || ""); } catch {}
    setLoaded(true);
  }, []);
  const stateRef = acSanitize({ clicks, coins, owned, skin, claimed, bonus, spent, gifts });
  useEffect(() => {
    if (!loaded) return;
    const save = () => { try { const v = JSON.stringify({ d: stateRef, sig: acSign(stateRef) }); localStorage.setItem("chibi", v); localStorage.setItem("chibi_bak", v); } catch {} };
    save();
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", save);
    return () => { window.removeEventListener("pagehide", save); document.removeEventListener("visibilitychange", save); };
  }, [clicks, coins, owned, skin, claimed, bonus, spent, gifts, loaded]);
  const setWallpaper = (file: File) => {
    if (file.type === "image/gif") {
      if (file.size > 3_500_000) { alert("гифка слишком большая — до 3,5 МБ"); return; }
      const fr = new FileReader();
      fr.onload = () => { const d = String(fr.result); try { localStorage.setItem("chibi_wall", d); } catch { alert("гифка не влезла в память, она будет до перезагрузки"); } setWall(d); };
      fr.readAsDataURL(file); return;
    }
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 2560 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      const context = c.getContext("2d"); if (!context) return; context.drawImage(img, 0, 0, c.width, c.height);
      let q = 0.85, d = c.toDataURL("image/jpeg", q);
      while (d.length > 3_000_000 && q > 0.4) { q -= 0.1; d = c.toDataURL("image/jpeg", q); }
      try { localStorage.setItem("chibi_wall", d); } catch {}
      setWall(d); URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  };

  const click = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    if (!e.isTrusted) return;
    const t = performance.now(); clickTimes.current = [...clickTimes.current.filter((x) => t - x < 1000), t];
    if (clickTimes.current.length > AC_MAX_CPS) { setCheat("слишком быстро — похоже на автокликер"); return; }
    const r = e.currentTarget.getBoundingClientRect();
    setClicks((c) => c + 1);
    setPop((p) => p + 1);
    const id = Date.now() + Math.random();
    setFloats((f) => [...f.slice(-10), { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 900);
  };
  const unlock = (s: (typeof SKINS)[number]) => {
    if (clicks < s.clicks || coins < s.cost || owned.length < (s.needOwned ?? 0)) return;
    setSpent((x) => x + s.cost);
    setOwned((o) => [...o, s.id]);
    setSkin(s.id);
    setZap(true);
    setTimeout(() => setZap(false), 1700);
  };
  const cur = SKINS.find((s) => s.id === skin) ?? SKINS[0];
  if (!cur) return null;
  const prog = (clicks % COIN_EVERY) / COIN_EVERY;
  const focusWin = (id: WinId) => setStack((s) => (s[s.length - 1] === id ? s : [...s.filter((x) => x !== id), id]));
  const focus = (id: WinId) => setStack((s) => [...s.filter((x) => x !== id), id]);
  const winDown = (e: React.PointerEvent, id: WinId) => {
    focusWin(id);
    const t = e.target as HTMLElement;
    if (!t.closest(".titlebar") || t.closest("button")) return;
    e.preventDefault();
    const el = e.currentTarget as HTMLElement, sx = e.clientX, sy = e.clientY, o = off[id] ?? { x: 0, y: 0 };
    let raf = 0, nx = o.x, ny = o.y;
    const r = el.getBoundingClientRect();
    const move = (ev: PointerEvent) => {
      nx = o.x + Math.max(80 - r.right, Math.min(ev.clientX - sx, window.innerWidth - r.left - 80));
      ny = o.y + Math.max(44 - r.top, Math.min(ev.clientY - sy, window.innerHeight - r.top - 40));
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; el.style.translate = `${nx}px ${ny}px`; });
    };
    const up = () => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); setOff((p) => ({ ...p, [id]: { x: nx, y: ny } })); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  };
  const close = (id: WinId) => setStack((s) => s.filter((x) => x !== id));
  const top = stack[stack.length - 1];
  const winStyle = (id: WinId) => ({ zIndex: 10 + stack.indexOf(id), display: stack.includes(id) ? undefined : "none", translate: off[id] ? `${off[id].x}px ${off[id].y}px` : undefined });
  const winCls = (id: WinId) => `oswin pill overflow-hidden winopen ${top === id ? "" : "oswin-back"}`;

  if (boot) return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-foreground text-primary-foreground">
      <img src={base} alt="" className="w-28 h-28 object-contain bootlogo" />
      <div className="text-3xl">Chibi<span className="text-primary">OS</span></div>
      <div className="w-40 h-4 rounded border-2 border-muted-foreground overflow-hidden p-0.5"><div className="bootbar h-full w-10 flex gap-0.5">{[0,1,2].map(i=><span key={i} className="flex-1 bg-primary rounded-sm" />)}</div></div>
    </main>
  );

  const isDesktopBg = (e: React.SyntheticEvent) => !(e.target as HTMLElement).closest("section,button,a,input,label,.menubar");
  const openMenu = (x: number, y: number) => setMenu({ x: Math.min(x, window.innerWidth - 180), y: Math.min(y, window.innerHeight - 80) });

  return (
    <main className="min-h-screen p-4 pt-11 desktop"
      style={{ ...(wall ? { backgroundImage: `url(${wall})`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" } : {}), ...(folderText ? { ["--folder-text" as string]: folderText } : {}) }}
      onClick={() => { setMenu(null); setFolderMenu(null); setZipMenu(null); }}
      onContextMenu={(e) => { if (!isDesktopBg(e)) return; e.preventDefault(); openMenu(e.clientX, e.clientY); }}
      onPointerDown={(e) => { if (e.pointerType === "mouse" || !isDesktopBg(e)) return; const { clientX, clientY } = e; pressRef.current = window.setTimeout(() => openMenu(clientX, clientY), 550); }}
      onPointerUp={() => { if (pressRef.current) { clearTimeout(pressRef.current); pressRef.current = null; } }}
      onPointerMove={() => { if (pressRef.current) { clearTimeout(pressRef.current); pressRef.current = null; } }}>
      {/* строка меню системы */}
      <div className="menubar">
        <span className="menubar-brand">Chibi<span className="text-primary">OS</span></span>
        <span className="menubar-item hidden sm:inline truncate">{cur.name}</span>
        <div className="ml-auto flex items-center gap-2">
          <span key={coins} className="tray"><Coin small /><span className="tabular-nums">{coins}</span></span>
          <Clock />
        </div>
      </div>

      {/* значки на рабочем столе — свободное размещение по сетке, как в Windows */}
      <div ref={deskRef} className="relative mb-4" style={{ height: deskH }}>
        {deskIcons.map((w) => { const p = pos[w.id] ?? { c: 0, r: 0 }; const d = drag?.id === w.id; return (
          <Button variant="osFile" key={w.id} data-folder-id={w.id} onClick={(e) => { if (movedRef.current) return; if (w.id === "zip") { e.stopPropagation(); zipAt(e.clientX, e.clientY); return; } const secret = SECRET_ROOTS.find(node => node.id === w.id); if (secret) setSecretRoot(secret); else { const win = WINS.find(win => win.id === w.id); if (win) focus(win.id); } }}
            onPointerDown={(e) => startDrag(e, w.id)}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); if (w.id === "zip") zipAt(e.clientX, e.clientY); else if (SECRET_ROOTS.some(node => node.id === w.id)) setFolderMenu({ id: w.id, x: Math.min(e.clientX, window.innerWidth - 180), y: Math.min(e.clientY, window.innerHeight - 80) }); }}
            style={{ position: "absolute", left: d ? drag.x : p.c * CELL_W, top: d ? drag.y : p.r * CELL_H, touchAction: "none", zIndex: d ? 5 : 1 }}
            className={`${d ? "icon-drag " : ""}desktop-file`}>
            {w.id === "zip" ? <ZipIco /> : <FolderIco />}
            <span className="text-[11px] leading-tight text-center drop-shadow" style={folderText ? { color: folderText } : undefined}>{w.title}</span>
          </Button>); })}
        {drag && <div className="absolute w-20 h-[72px] rounded-md border-2 border-dashed border-primary-foreground/70 pointer-events-none" style={{ left: drag.tc * CELL_W, top: drag.tr * CELL_H }} />}
      </div>

      <div>
        <section className={winCls("clicker")} style={winStyle("clicker")} onPointerDown={(e) => winDown(e, "clicker")}>
          <TitleBar title="пирочибиклик.exe" onClose={() => close("clicker")}
            right={<button onClick={() => setCredits(true)} aria-label="инфо" className="text-lg leading-none px-1">•••</button>} />
          <div className="polaroid">
          <div className="photo p-3">
            <div className="flex justify-end items-start">
              <div className="text-right leading-tight"><div className="text-2xl">{clicks}</div><div className="text-xs text-muted-foreground">кликов</div></div>
            </div>
            <button onPointerDown={click} onContextMenu={(e) => e.preventDefault()} style={{ touchAction: "none", WebkitTouchCallout: "none" }} className="relative mx-auto mt-2 block w-[min(18rem,70vw)] aspect-square select-none">
              <img key={pop} src={cur.src} alt={cur.name} draggable={false}
                className={`w-full h-full object-contain pop ${zap ? "zap" : ""}`} />
              {zap && <Bolt />}
              {floats.map((f) => (
                <span key={f.id} className="floatup absolute text-3xl text-primary-foreground pointer-events-none"
                  style={{ left: f.x - 12, top: f.y - 20, WebkitTextStroke: "1.5px var(--border)" }}>+1</span>
              ))}
            </button>
          </div>
          </div>
          <div className="statusbar">
            <span>до коина</span>
            <div className="flex-1 h-3 rounded-[4px] bg-card border-2 border-border overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${prog * 100}%` }} /></div>
            <span className="tabular-nums">{clicks % COIN_EVERY}/{COIN_EVERY}</span>
          </div>
        </section>

        <section className={winCls("collection")} style={winStyle("collection")} onPointerDown={(e) => winDown(e, "collection")}>
          <TitleBar title={folder ? `коллекция / ${RARITY[folder].name}` : "коллекция.exe"} onClose={() => close("collection")}
            right={<span className="text-xs">{owned.length}/{SKINS.length}</span>} />
          <div className="p-3 flex flex-col gap-3 max-h-[70vh] overflow-auto">
            {!folder ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(Object.keys(RARITY) as Rarity[]).map((rk) => {
                  const list = SKINS.filter((x) => x.rarity === rk);
                  return (
                    <button key={rk} onClick={() => setFolder(rk)} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted active:scale-95 transition">
                      <FolderIco cls={RARITY[rk].cls} />
                      <span className="text-sm">{RARITY[rk].name}</span>
                      <span className="text-xs text-muted-foreground">{list.filter((x) => owned.includes(x.id)).length}/{list.length}</span>
                    </button>);
                })}
              </div>
            ) : (<>
            <button onClick={() => setFolder(null)} className="xpbtn self-start px-3 py-0.5 text-xs text-primary-foreground">‹ назад</button>
            {[folder].map((rk) => {
              const list = SKINS.filter((x) => x.rarity === rk);
              return (
              <div key={rk}>
                {list.length === 0 ? <div className="text-xs text-muted-foreground text-center py-3">скоро...</div> :
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {list.map((s) => {
              const has = owned.includes(s.id);
              const can = clicks >= s.clicks && coins >= s.cost && owned.length >= (s.needOwned ?? 0);
              return (
                <button key={s.id} onClick={() => (has ? setSkin(s.id) : unlock(s))}
                  className={`text-left ${skin === s.id ? "card-on" : ""} ${!has && !can ? "opacity-80" : ""}`}>
                  <Card s={s} has={has} />
                  <div className="text-xs text-muted-foreground flex flex-wrap items-center justify-center gap-1 mt-1">
                    {has ? (skin === s.id ? "надет" : "надеть") : <>{s.needOwned ? `${s.needOwned} скина + ` : `${s.clicks} кликов + `}{s.cost} <Coin small /></>}
                  </div>
                </button>
              );
            })}
                </div>}
              </div>);
            })}
            </>)}
          </div>
        </section>

        <Wheel onSkin={(id) => { setGifts((g) => [...g, id]); if (owned.includes(id)) { setBonus((b) => b + 25); } else setOwned((o) => [...o, id]); }} cls={winCls("fortune")} style={winStyle("fortune")} onFocus={(e: React.PointerEvent) => winDown(e, "fortune")} onWin={(n, epic) => { if (epic) { setGifts((g) => [...g, "alisa"]); setOwned((o) => (o.includes("alisa") ? o : [...o, "alisa"])); if (owned.includes("alisa")) { setBonus((b) => b + 25); } } else { setBonus((b) => b + Math.min(3, n)); } }} onClose={() => close("fortune")} />

        <ScratchPolaroid cls={winCls("scratch")} style={winStyle("scratch")} onFocus={(e: React.PointerEvent) => winDown(e, "scratch")} onClose={() => close("scratch")}
          owned={owned} onWin={(id: string | null) => { const r = scratchReward(id, owned); if (r.coins) { setBonus((b) => b + r.coins); } else if (id) { setGifts((g) => [...g, id]); setOwned((o) => (o.includes(id) ? o : [...o, id])); } }} />

        <section className={winCls("quests")} style={winStyle("quests")} onPointerDown={(e) => winDown(e, "quests")}>
          <TitleBar title="задания.exe" onClose={() => close("quests")} right={<span className="text-xs">{claimed.length}/{QUESTS.length}</span>} />
          <div className="p-3 flex flex-col gap-2 max-h-[70vh] overflow-auto">
            {QUESTS.map((q) => {
              const done = claimed.includes(q.id), ok = clicks >= q.clicks;
              return (
                <div key={q.id} className="flex items-center gap-3 p-2 rounded-md border-2 border-border bg-card">
                  <FolderIco cls={done ? "opacity-50" : ""} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">кликни {q.clicks} раз</div>
                    <div className="h-2 mt-1 rounded bg-muted border border-border overflow-hidden"><div className="h-full bg-primary" style={{ width: `${Math.min(1, clicks / q.clicks) * 100}%` }} /></div>
                  </div>
                  <button disabled={done || !ok} onClick={() => { setClaimed((c) => (c.includes(q.id) ? c : [...c, q.id])); }}
                    className="xpbtn px-3 py-1 text-xs text-primary-foreground disabled:opacity-50 flex items-center gap-1 shrink-0">
                    {done ? "получено" : <>+{q.reward} <Coin small /></>}
                  </button>
                </div>);
            })}
          </div>
        </section>

        <section className={winCls("wallpaper")} style={winStyle("wallpaper")} onPointerDown={(e) => winDown(e, "wallpaper")}>
          <TitleBar title="обои.exe" onClose={() => close("wallpaper")} />
          <div className="p-4 flex flex-col gap-3 items-center">
            <div className="w-full aspect-video rounded-md border-2 border-border desktop" style={wall ? { backgroundImage: `url(${wall})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} />
            <div className="flex gap-2">
              <label className="xpbtn px-4 py-1 text-primary-foreground cursor-pointer">выбрать
                <input type="file" accept="image/*,.gif" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setWallpaper(f); e.target.value = ""; }} />
              </label>
              <button onClick={() => { setWall(""); try { localStorage.removeItem("chibi_wall"); } catch {} }} className="xpbtn px-4 py-1 text-primary-foreground">сбросить</button>
            </div>
          </div>
        </section>
      </div>

      {secretRoot && <SecretExplorer key={secretRoot.id} root={secretRoot} onClose={() => setSecretRoot(null)} onDelete={() => removeFolder(secretRoot.id)} />}
      {unzipped && <button className="xpbtn fixed bottom-3 right-3 z-[55] px-3 py-1 text-primary-foreground shadow-lg" onClick={() => { if (window.confirm("завершить поиск и собрать всё обратно в квест.zip?")) rezip(); }}>завершить поиск</button>}
      {zipMenu && <div className="ctxmenu fixed z-[60] w-44" style={{ left: zipMenu.x, top: zipMenu.y }} onClick={e => e.stopPropagation()}><button className="ctxitem" onClick={() => { if (window.confirm("распаковать квест.zip?")) unzip(); else setZipMenu(null); }}>распаковать</button></div>}
      {folderMenu && <div className="ctxmenu fixed z-[60] w-44" style={{ left: folderMenu.x, top: folderMenu.y }} onClick={e => e.stopPropagation()}><Button variant="osFile" className="ctxitem" onClick={() => removeFolder(folderMenu.id)}>удалить папку</Button></div>}

      {/* контекстное меню рабочего стола */}
      {menu && (
        <div className="ctxmenu fixed z-[60] w-44" style={{ left: menu.x, top: menu.y }} onClick={(e) => e.stopPropagation()}>
          <button className="ctxitem" onClick={() => { setMenu(null); focus("wallpaper"); }}>сменить обои</button>
          <button className="ctxitem" onClick={() => { setMenu(null); setLook(true); }}>оформление</button>
          <button className="ctxitem" onClick={() => { setMenu(null); setCredits(true); }}>о системе</button>
          {unzipped && <button className="ctxitem" onClick={() => { if (window.confirm("завершить поиск и собрать всё обратно в квест.zip?")) rezip(); }}>завершить поиск</button>}
        </div>
      )}

      {cheat && (
        <div className="fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4" onClick={() => setCheat("")}>
          <div className="pill px-4 py-2 text-sm bg-card">античит: {cheat}</div>
        </div>
      )}

      {/* окошко «оформление» — как «персонализация» в windows */}
      {look && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setLook(false)}>
          <section className="pill overflow-hidden winopen w-full max-w-xs bg-card" onClick={(e) => e.stopPropagation()}>
            <TitleBar title="оформление" onClose={() => setLook(false)} />
            <div className="p-4 flex flex-col gap-4 text-sm">
              <div className="flex flex-col gap-2">
                <div>цвет папок и окон</div>
                <div className="flex gap-2">
                  {[["", "розовый"], ["dark", "тёмный"], ["blue", "голубой"]].map(([id, name]) => (
                    <button key={id} onClick={() => pickTheme(id ?? "")} className={`xpbtn flex-1 px-2 py-1 text-xs text-primary-foreground ${theme === id ? "ring-2 ring-border" : "opacity-80"}`}>{name}</button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div>цвет текста папок</div>
                <div className="flex flex-wrap gap-2 items-center">
                  {["", "#ffffff", "#000000", "#ff5fa2", "#ffd84d", "#5fd3ff", "#7dff8a", "#b48cff"].map((c) => (
                    <button key={c || "auto"} aria-label={c || "как в теме"} onClick={() => pickFolderText(c)}
                      className={`w-7 h-7 rounded-md border-2 border-border text-[10px] ${folderText === c ? "ring-2 ring-primary ring-offset-1" : ""}`}
                      style={c ? { background: c } : undefined}>{c ? "" : "авто"}</button>
                  ))}
                  <label className="w-7 h-7 rounded-md border-2 border-border overflow-hidden cursor-pointer relative" title="свой цвет" style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}>
                    <input type="color" value={folderText || "#ffffff"} onChange={(e) => pickFolderText(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </label>
                </div>
                <div className="rounded-md border-2 border-border p-2 flex justify-center desktop" style={folderText ? { ["--folder-text" as string]: folderText } : undefined}>
                  <span className="desktop-file !min-h-0 items-center"><FolderIco /><span style={folderText ? { color: folderText } : undefined}>пример</span></span>
                </div>
              </div>
              <button onClick={() => setLook(false)} className="xpbtn px-4 py-1 text-primary-foreground self-end">ок</button>
            </div>
          </section>
        </div>
      )}

      {/* окошко «о системе» */}
      {credits && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setCredits(false)}>
          <section className="pill overflow-hidden winopen w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
            <TitleBar title="о системе" onClose={() => setCredits(false)}  />
            <div className="p-4 flex flex-col gap-3 text-sm">
              <div>сделано <a href="https://t.me/circleofffortune" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">колесом фортуны</a></div>
              <div>андрей — <a href="https://t.me/pyrokinesistg" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">@pyrokinesistg</a></div>
              <div>алиса — <a href="https://t.me/wkupalice" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">@wkupalice</a></div>
              <div>арт — <a href="https://t.me/w2iksi" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">веикси</a></div>
              <button onClick={() => setCredits(false)} className="xpbtn px-4 py-1 text-primary-foreground self-end mt-1">ок</button>
            </div>
          </section>
        </div>
      )}

    </main>
  );
}

const QUESTS = [
  { id: "q2k", clicks: 2000, reward: 2 },
  { id: "q5k", clicks: 5000, reward: 4 },
  { id: "q10k", clicks: 10000, reward: 6 },
  { id: "q25k", clicks: 25000, reward: 10 },
  { id: "q50k", clicks: 50000, reward: 20 },
];
const EPIC_CHANCE = 0.0001;
export const ANY_SKIN_CHANCE = 0.000000001; // 0,0000001%
const PRIZES: number[] = [1, 2, 3, 1, 2, 1];
const COOLDOWN = 60 * 60 * 1000;
function Wheel({ onSkin, onWin, onClose, cls, style, onFocus }: { onSkin: (id: string) => void; onWin: (n: number, epic?: boolean) => void; onClose: () => void; cls: string; style: React.CSSProperties; onFocus: (e: React.PointerEvent) => void }) {
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [last, setLast] = useState(0);
  const [now, setNow] = useState(0);
  const [won, setWon] = useState<number | null>(null);
  const [epicWon, setEpicWon] = useState(false);
  const [skinWon, setSkinWon] = useState("");
  useEffect(() => { setLast(Number(localStorage.getItem("chibi_wheel") || 0)); setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const left = Math.max(0, last + COOLDOWN - now);
  const spin = () => {
    if (spinning || left > 0) return;
    const any = Math.random() < ANY_SKIN_CHANCE ? SKINS[Math.floor(Math.random() * SKINS.length)] : undefined;
    const epic = !any && Math.random() < EPIC_CHANCE;
    const i = Math.floor(Math.random() * PRIZES.length);
    const seg = 360 / PRIZES.length;
    setWon(null); setEpicWon(false); setSkinWon(""); setSpinning(true);
    setRot((r) => r - (r % 360) + 360 * 5 + (epic ? 0 : any ? 357 : 360 - i * seg - seg / 2));
    setTimeout(() => { setSpinning(false); const w = PRIZES[i] ?? 1; if (any) { setSkinWon(any.name); onSkin(any.id); } else if (epic) { setEpicWon(true); onWin(0, true); } else { setWon(w); onWin(w); } const t = Date.now(); setLast(t); localStorage.setItem("chibi_wheel", String(t)); }, 4000);
  };
  const mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);
  return (
    <section className={cls} style={style} onPointerDown={onFocus}>
      <TitleBar title="фортуна.exe" onClose={onClose}  />
      <div className="wheel-scene scene !border-0 !rounded-none !shadow-none p-4 flex flex-col items-center gap-3">
        <div className="relative w-[min(16rem,70vw)] aspect-square">
          <div className="wheel-pin" />
          <div className="wheel" style={{ willChange: "transform", transform: `rotate(${rot}deg)`, transition: spinning ? "transform 4s cubic-bezier(.15,.9,.25,1)" : "none" }}>
            <span className="absolute left-1/2 top-0 h-1/2 w-[2px] -translate-x-1/2 bg-[var(--r-epic,oklch(0.55_0.2_300))]" />
            <span className="absolute left-1/2 top-0 h-1/2 w-px origin-bottom bg-[var(--r-legendary,oklch(0.8_0.15_85))]" style={{ transform: "translateX(-50%) rotate(3deg)" }} />
            {PRIZES.map((p, i) => (
              <span key={i} className="absolute inset-0 flex justify-center pt-[8%] text-2xl" style={{ transform: `rotate(${i * 60 + 30}deg)` }}>
                <span className="flex items-center gap-0.5">{p}<Coin small /></span>
              </span>
            ))}
          </div>
          <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-card border-[2.5px] border-border" />
        </div>
        <div className="h-5 text-sm">{skinWon ? `скин: ${skinWon}` : epicWon ? "эпический скин: Чиби Алиса" : won ? <>выпало +{won} <Coin small /></> : null}</div>
        <div className="w-full text-[11px] leading-tight grid grid-cols-2 gap-x-3 gap-y-0.5 text-muted-foreground">
          <span>1 коин — 50%</span><span>2 коина — 33%</span><span>3 коина — 17%</span>
          <span>Чиби Алиса — 0,01%</span><span className="col-span-2">любой скин — 0,0000001%</span>
        </div>
        <button onClick={spin} disabled={spinning || left > 0} className="xpbtn px-6 py-1.5 text-primary-foreground disabled:opacity-60">
          {spinning ? "крутится..." : left > 0 ? `ждать ${mm}:${String(ss).padStart(2, "0")}` : "крутить"}
        </button>
      </div>
    </section>
  );
}


export const SCRATCH_COOLDOWN = 24 * 60 * 60 * 1000;
export const SCRATCH_DUP_COINS = 5;
export const SCRATCH_COINS = 3;
export const SCRATCH_CHIBI_CHANCE = 0.0000001;
/** Обычно 3 коина; с шансом 0,0000001 — случайный чибик (если уже есть — 5 коинов). */
export function rollScratch(rnd: () => number = Math.random): string | null {
  return rnd() < SCRATCH_CHIBI_CHANCE ? SKINS[Math.floor(rnd() * SKINS.length)]?.id ?? null : null;
}
export function scratchReward(id: string | null, owned: string[]) {
  if (!id) return { skin: null, coins: SCRATCH_COINS };
  return owned.includes(id) ? { skin: null, coins: SCRATCH_DUP_COINS } : { skin: id, coins: 0 };
}
export const scratchLeft = (last: number, now: number) => Math.max(0, last + SCRATCH_COOLDOWN - now);

function ScratchPolaroid({ cls, style, onFocus, onClose, owned, onWin }: { cls: string; style: React.CSSProperties; onFocus: (e: React.PointerEvent) => void; onClose: () => void; owned: string[]; onWin: (id: string | null) => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [last, setLast] = useState(0);
  const [now, setNow] = useState(0);
  const [prize, setPrize] = useState<string>("");
  const [done, setDone] = useState(false);
  const [dup, setDup] = useState(false);
  const [fresh, setFresh] = useState(false);
  const drawing = useRef(false);
  const prev = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const l = Number(localStorage.getItem("chibi_scratch") || 0);
    setLast(l); setNow(Date.now());
    let p = localStorage.getItem("chibi_scratch_prize2");
    if (p === null) { p = rollScratch() ?? "coins"; localStorage.setItem("chibi_scratch_prize2", p); }
    setPrize(p);
    if (scratchLeft(l, Date.now()) > 0) setDone(true);
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = scratchLeft(last, now);
  // кулдаун кончился — новый полароид
  useEffect(() => {
    if (done && last && now && left === 0) {
      const p = rollScratch() ?? "coins";
      localStorage.setItem("chibi_scratch_prize2", p); setPrize(p); setDone(false); setDup(false);
    }
  }, [left, done, last, now]);
  // рисуем голографический слой
  useEffect(() => {
    const c = cv.current; if (!c || done) return;
    const r = c.getBoundingClientRect(); const d = window.devicePixelRatio || 1;
    c.width = r.width * d; c.height = r.height * d;
    const g = c.getContext("2d"); if (!g) return; g.scale(d, d);
    const gr = g.createLinearGradient(0, 0, r.width, r.height);
    ["#ffb3d9", "#b8e0ff", "#d8c2ff", "#c2ffe4", "#fff1b3", "#ffb3d9"].forEach((col, i, a) => gr.addColorStop(i / (a.length - 1), col));
    g.fillStyle = gr; g.fillRect(0, 0, r.width, r.height);
    g.fillStyle = "rgba(255,255,255,.55)";
    for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(Math.random() * r.width, Math.random() * r.height, Math.random() * 2 + .5, 0, 7); g.fill(); }
    g.fillStyle = "rgba(90,40,70,.75)"; g.font = "20px Zaychik, sans-serif"; g.textAlign = "center";
    g.fillText("сотри меня ✦", r.width / 2, r.height / 2);
  }, [done, prize, style.display]);
  const scratch = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || done) return;
    const c = e.currentTarget, r = c.getBoundingClientRect(), g = c.getContext("2d"); if (!g) return;
    const sx = c.width / r.width, x = (e.clientX - r.left) * sx, y = (e.clientY - r.top) * sx;
    const pr = prev.current ?? { x, y };
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = "destination-out";
    g.lineCap = "round"; g.lineWidth = 40 * sx;
    g.beginPath(); g.moveTo(pr.x, pr.y); g.lineTo(x, y); g.stroke();
    prev.current = { x, y };
  };
  const check = () => {
    drawing.current = false; prev.current = null;
    const c = cv.current; if (!c || done || !prize) return;
    const g = c.getContext("2d"); if (!g || !c.width || !c.height) return;
    const data = g.getImageData(0, 0, c.width, c.height).data;
    let clear = 0, n = 0;
    for (let i = 3; i < data.length; i += 64) { n++; if (data[i] === 0) clear++; }
    if (clear / n > 0.5) {
      const sk = prize === "coins" ? null : prize; setDup(!!sk && owned.includes(sk)); setFresh(!!sk && !owned.includes(sk)); setDone(true); onWin(sk);
      const t = Date.now(); setLast(t); localStorage.setItem("chibi_scratch", String(t));
    }
  };
  const s = SKINS.find((x) => x.id === prize);
  const hh = Math.floor(left / 3600000), mm = Math.floor((left % 3600000) / 60000), ss = Math.floor((left % 60000) / 1000);
  const p2 = (n: number) => String(n).padStart(2, "0");
  return (
    <section className={cls} style={style} onPointerDown={onFocus}>
      <TitleBar title="полароид.exe" onClose={onClose} right={<span className="text-xs">раз в 24ч</span>} />
      <div className="p-4 flex flex-col items-center gap-3">
        <div className="polaroid holo-frame w-[min(16rem,70vw)]">
          <div className="photo relative aspect-square overflow-hidden">
            {!s && prize && <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-4xl">+{SCRATCH_COINS}<Coin /></div>}
            {s && <img src={s.src} alt={done ? s.name : ""} draggable={false} className="absolute inset-[8%] w-[84%] h-[84%] object-contain" />}
            {!done && <canvas ref={cv} className="absolute inset-0 w-full h-full cursor-grab" style={{ touchAction: "none" }}
              onPointerDown={(e) => { drawing.current = true; prev.current = null; e.currentTarget.setPointerCapture(e.pointerId); scratch(e); }}
              onPointerMove={scratch} onPointerUp={check} onPointerCancel={check} />}
          </div>
          <div className="text-center text-sm mt-2 h-5 truncate">{done ? (s ? s.name : "чиби коины") : "???"}</div>
        </div>
        <div className="text-sm text-center min-h-5 flex items-center gap-1">
          {done && !s ? <>+{SCRATCH_COINS} <Coin small /> — чибик выпадает очень редко</> : done && s ? (dup ? <>уже есть — держи +{SCRATCH_DUP_COINS} <Coin small /></> : fresh ? "новый чибик в коллекции!" : "сегодняшний чибик") : <>+{SCRATCH_COINS} <Coin small /> или редчайший чибик</>}
        </div>
        {done && left > 0 && <div className="statusbar w-full justify-center rounded-md border-2">следующий через {p2(hh)}:{p2(mm)}:{p2(ss)}</div>}
      </div>
    </section>
  );
}
