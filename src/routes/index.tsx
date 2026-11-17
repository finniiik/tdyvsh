import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import base from "@/assets/chibi_andrey_updated.png";
import y2018 from "@/assets/chibi_andrey_2018_updated.png";
import alisa from "@/assets/chibi_alisa_updated.png";
import pikachu from "@/assets/chibi_andrey_pikachu.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Чиби Андрей — кликер" },
      { name: "description", content: "Уютный кликер с чиби Андреем и скинами." },
      { property: "og:title", content: "Чиби Андрей — кликер" },
      { property: "og:description", content: "Кликай, копи чиби коины, открывай скины." },
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
export const SKINS: { id: string; name: string; src: string; clicks: number; cost: number; rarity: Rarity; no: string }[] = [
  { id: "base", name: "Чиби Андрей", src: base, clicks: 0, cost: 0, rarity: "common", no: "001" },
  { id: "2018", name: "Чиби Андрей 2018", src: y2018, clicks: 5000, cost: 10, rarity: "rare", no: "002" },
  { id: "alisa", name: "Чиби Алиса", src: alisa, clicks: 15000, cost: 25, rarity: "epic", no: "003" },
  { id: "pikachu", name: "Чиби Андрей с Пикачу", src: pikachu, clicks: 50000, cost: 75, rarity: "legendary", no: "004" },
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
function FolderIco({ cls = "" }: { cls?: string }) {
  return (
    <svg viewBox="0 0 48 40" className={`w-12 h-10 ${cls}`}>
      <path d="M3 8a3 3 0 0 1 3-3h12l4 4h20a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" fill="var(--primary)" stroke="var(--border)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M3 15h42" stroke="var(--border)" strokeWidth="2" />
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
  const [coins, setCoins] = useState(0);
  const [owned, setOwned] = useState<string[]>(["base"]);
  const [skin, setSkin] = useState("base");
  const [pop, setPop] = useState(0);
  const [floats, setFloats] = useState<{ id: number; x: number; y: number }[]>([]);
  const [zap, setZap] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [boot, setBoot] = useState(true);
  const [stack, setStack] = useState<WinId[]>(["clicker"]);
  const [folder, setFolder] = useState<Rarity | null>(null);
  const [credits, setCredits] = useState(false);
  const [claimed, setClaimed] = useState<string[]>([]);
  const [wall, setWall] = useState("");
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const pressRef = useRef<number | null>(null);
  const [order, setOrder] = useState<WinId[]>(() => WINS.map((w) => w.id));
  const [dragId, setDragId] = useState<WinId | null>(null);
  useEffect(() => { try { const o = JSON.parse(localStorage.getItem("chibi_order") || "null"); if (Array.isArray(o)) setOrder([...o.filter((x: WinId) => WINS.some((w) => w.id === x)), ...WINS.map((w) => w.id).filter((x) => !o.includes(x))]); } catch {} }, []);
  const moveIcon = (to: WinId) => { if (!dragId || dragId === to) return; setOrder((o) => { const n = o.filter((x) => x !== dragId); n.splice(n.indexOf(to), 0, dragId); localStorage.setItem("chibi_order", JSON.stringify(n)); return n; }); };
  useEffect(() => { const t = setTimeout(() => setBoot(false), 2600); return () => clearTimeout(t); }, []);

  useEffect(() => {
    const read = (k: string) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } };
    const s = read("chibi") || read("chibi_bak");
    if (s) {
      if (Number.isFinite(s.clicks)) setClicks(s.clicks);
      if (Number.isFinite(s.coins)) setCoins(s.coins);
      if (Array.isArray(s.owned)) setOwned(Array.from(new Set(["base", ...s.owned])));
      if (typeof s.skin === "string") setSkin(s.skin);
      if (Array.isArray(s.claimed)) setClaimed(s.claimed);
    }
    try { setWall(localStorage.getItem("chibi_wall") || ""); } catch {}
    setLoaded(true);
  }, []);
  const stateRef = { clicks, coins, owned, skin, claimed };
  useEffect(() => {
    if (!loaded) return;
    const save = () => { try { const v = JSON.stringify(stateRef); localStorage.setItem("chibi", v); localStorage.setItem("chibi_bak", v); } catch {} };
    save();
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", save);
    return () => { window.removeEventListener("pagehide", save); document.removeEventListener("visibilitychange", save); };
  }, [clicks, coins, owned, skin, claimed, loaded]);
  const setWallpaper = (file: File) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 2560 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      let q = 0.85, d = c.toDataURL("image/jpeg", q);
      while (d.length > 3_000_000 && q > 0.4) { q -= 0.1; d = c.toDataURL("image/jpeg", q); }
      try { localStorage.setItem("chibi_wall", d); } catch {}
      setWall(d); URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  };

  const click = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const n = clicks + 1;
    setClicks(n);
    if (n % COIN_EVERY === 0) setCoins((c) => c + 1);
    setPop((p) => p + 1);
    const id = Date.now() + Math.random();
    setFloats((f) => [...f.slice(-10), { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 900);
  };
  const unlock = (s: (typeof SKINS)[number]) => {
    if (clicks < s.clicks || coins < s.cost) return;
    setCoins((c) => c - s.cost);
    setOwned((o) => [...o, s.id]);
    setSkin(s.id);
    setZap(true);
    setTimeout(() => setZap(false), 1700);
  };
  const cur = SKINS.find((s) => s.id === skin)!;
  const prog = (clicks % COIN_EVERY) / COIN_EVERY;
  const focus = (id: WinId) => setStack((s) => [...s.filter((x) => x !== id), id]);
  const close = (id: WinId) => setStack((s) => s.filter((x) => x !== id));
  const top = stack[stack.length - 1];
  const winStyle = (id: WinId) => ({ zIndex: 10 + stack.indexOf(id), display: stack.includes(id) ? undefined : "none" });
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
      style={wall ? { backgroundImage: `url(${wall})`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" } : undefined}
      onClick={() => setMenu(null)}
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

      {/* значки на рабочем столе */}
      <div className="flex gap-4 mb-4 flex-wrap justify-center sm:justify-start">
        {order.map((id) => WINS.find((w) => w.id === id)!).map((w) => (
          <button key={w.id} data-icon={w.id} onClick={() => focus(w.id)}
            draggable onDragStart={() => setDragId(w.id)} onDragEnd={() => setDragId(null)}
            onDragOver={(e) => { e.preventDefault(); moveIcon(w.id); }}
            onPointerDown={(e) => { if (e.pointerType === "mouse") return; const id = w.id; pressRef.current = window.setTimeout(() => { setDragId(id); navigator.vibrate?.(15); }, 300); }}
            onPointerMove={(e) => { if (e.pointerType === "mouse" || !dragId) return; const el = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-icon]") as HTMLElement | null; if (el) moveIcon(el.dataset["icon"] as WinId); }}
            onPointerUp={() => { if (pressRef.current) clearTimeout(pressRef.current); setTimeout(() => setDragId(null), 0); }}
            onPointerCancel={() => { if (pressRef.current) clearTimeout(pressRef.current); setDragId(null); }}
            onClickCapture={(e) => { if (dragId) { e.preventDefault(); e.stopPropagation(); } }}
            onContextMenu={(e) => e.preventDefault()}
            style={{ touchAction: "none" }}
            className={`${dragId === w.id ? "icon-drag " : ""}flex flex-col items-center gap-1 w-20 text-primary-foreground select-none active:scale-95 transition-transform`}>
            <FolderIco />
            <span className="text-[11px] leading-tight text-center drop-shadow">{w.title}</span>
          </button>
        ))}
      </div>

      <div>
        <section className={winCls("clicker")} style={winStyle("clicker")} onPointerDown={() => focus("clicker")}>
          <TitleBar title="пирочибиклик.exe" onClose={() => close("clicker")}
            right={<button onClick={() => setCredits(true)} aria-label="инфо" className="text-lg leading-none px-1">•••</button>} />
          <div className="polaroid">
          <div className="photo p-3">
            <div className="flex justify-end items-start">
              <div className="text-right leading-tight"><div className="text-2xl">{clicks}</div><div className="text-xs text-muted-foreground">кликов</div></div>
            </div>
            <button onClick={click} className="relative mx-auto mt-2 block w-[min(18rem,70vw)] aspect-square select-none touch-manipulation">
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

        <section className={winCls("collection")} style={winStyle("collection")} onPointerDown={() => focus("collection")}>
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
              const can = clicks >= s.clicks && coins >= s.cost;
              return (
                <button key={s.id} onClick={() => (has ? setSkin(s.id) : unlock(s))}
                  className={`text-left ${skin === s.id ? "card-on" : ""} ${!has && !can ? "opacity-80" : ""}`}>
                  <Card s={s} has={has} />
                  <div className="text-xs text-muted-foreground flex flex-wrap items-center justify-center gap-1 mt-1">
                    {has ? (skin === s.id ? "надет" : "надеть") : <>{s.clicks} кликов + {s.cost} <Coin small /></>}
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

        <Wheel cls={winCls("fortune")} style={winStyle("fortune")} onFocus={() => focus("fortune")} onWin={(n, epic) => { if (epic) { setOwned((o) => (o.includes("alisa") ? o : [...o, "alisa"])); if (owned.includes("alisa")) setCoins((c) => c + 25); } else setCoins((c) => c + n); }} onClose={() => close("fortune")} />

        <ScratchPolaroid cls={winCls("scratch")} style={winStyle("scratch")} onFocus={() => focus("scratch")} onClose={() => close("scratch")}
          owned={owned} onWin={(id: string | null) => { const r = scratchReward(id, owned); if (r.coins) setCoins((c) => c + r.coins); else if (id) setOwned((o) => (o.includes(id) ? o : [...o, id])); }} />

        <section className={winCls("quests")} style={winStyle("quests")} onPointerDown={() => focus("quests")}>
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
                  <button disabled={done || !ok} onClick={() => { setClaimed((c) => [...c, q.id]); setCoins((c) => c + q.reward); }}
                    className="xpbtn px-3 py-1 text-xs text-primary-foreground disabled:opacity-50 flex items-center gap-1 shrink-0">
                    {done ? "получено" : <>+{q.reward} <Coin small /></>}
                  </button>
                </div>);
            })}
          </div>
        </section>

        <section className={winCls("wallpaper")} style={winStyle("wallpaper")} onPointerDown={() => focus("wallpaper")}>
          <TitleBar title="обои.exe" onClose={() => close("wallpaper")} />
          <div className="p-4 flex flex-col gap-3 items-center">
            <div className="w-full aspect-video rounded-md border-2 border-border desktop" style={wall ? { backgroundImage: `url(${wall})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} />
            <div className="flex gap-2">
              <label className="xpbtn px-4 py-1 text-primary-foreground cursor-pointer">выбрать
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setWallpaper(f); e.target.value = ""; }} />
              </label>
              <button onClick={() => { setWall(""); try { localStorage.removeItem("chibi_wall"); } catch {} }} className="xpbtn px-4 py-1 text-primary-foreground">сбросить</button>
            </div>
          </div>
        </section>
      </div>

      {/* контекстное меню рабочего стола */}
      {menu && (
        <div className="ctxmenu fixed z-[60] w-44" style={{ left: menu.x, top: menu.y }} onClick={(e) => e.stopPropagation()}>
          <button className="ctxitem" onClick={() => { setMenu(null); focus("wallpaper"); }}>сменить обои</button>
          <button className="ctxitem" onClick={() => { setMenu(null); setCredits(true); }}>о программе</button>
        </div>
      )}

      {/* окошко «о программе» */}
      {credits && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setCredits(false)}>
          <section className="pill overflow-hidden winopen w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
            <TitleBar title="о программе" onClose={() => setCredits(false)}  />
            <div className="p-4 flex flex-col gap-3 text-sm">
              <div>сделано <a href="https://t.me/circleofffortune" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">колесом фортуны</a></div>
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
const PRIZES: number[] = [1, 2, 3, 1, 2, 1];
const COOLDOWN = 60 * 60 * 1000;
function Wheel({ onWin, onClose, cls, style, onFocus }: { onWin: (n: number, epic?: boolean) => void; onClose: () => void; cls: string; style: React.CSSProperties; onFocus: () => void }) {
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [last, setLast] = useState(0);
  const [now, setNow] = useState(0);
  const [won, setWon] = useState<number | null>(null);
  const [epicWon, setEpicWon] = useState(false);
  useEffect(() => { setLast(Number(localStorage.getItem("chibi_wheel") || 0)); setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const left = Math.max(0, last + COOLDOWN - now);
  const spin = () => {
    if (spinning || left > 0) return;
    const epic = Math.random() < EPIC_CHANCE;
    const i = Math.floor(Math.random() * PRIZES.length);
    const seg = 360 / PRIZES.length;
    setWon(null); setEpicWon(false); setSpinning(true);
    setRot((r) => r - (r % 360) + 360 * 5 + (epic ? 0 : 360 - i * seg - seg / 2));
    setTimeout(() => { setSpinning(false); const w = PRIZES[i] ?? 1; if (epic) { setEpicWon(true); onWin(0, true); } else { setWon(w); onWin(w); } const t = Date.now(); setLast(t); localStorage.setItem("chibi_wheel", String(t)); }, 4000);
  };
  const mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);
  return (
    <section className={cls} style={style} onPointerDown={onFocus}>
      <TitleBar title="фортуна.exe" onClose={onClose}  />
      <div className="scene !border-0 !rounded-none !shadow-none p-4 flex flex-col items-center gap-3">
        <div className="relative w-[min(16rem,70vw)] aspect-square">
          <div className="wheel-pin" />
          <div className="wheel" style={{ transform: `rotate(${rot}deg)`, transition: spinning ? "transform 4s cubic-bezier(.15,.9,.25,1)" : "none" }}>
            <span className="absolute left-1/2 top-0 h-1/2 w-[2px] -translate-x-1/2 bg-[var(--r-epic,oklch(0.55_0.2_300))]" />
            {PRIZES.map((p, i) => (
              <span key={i} className="absolute inset-0 flex justify-center pt-[8%] text-2xl" style={{ transform: `rotate(${i * 60 + 30}deg)` }}>
                <span className="flex items-center gap-0.5">{p}<Coin small /></span>
              </span>
            ))}
          </div>
          <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-card border-[2.5px] border-border" />
        </div>
        <div className="h-5 text-sm">{epicWon ? "эпический скин: Чиби Алиса" : won ? <>выпало +{won} <Coin small /></> : null}</div>
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
  return rnd() < SCRATCH_CHIBI_CHANCE ? SKINS[Math.floor(rnd() * SKINS.length)]!.id : null;
}
export function scratchReward(id: string | null, owned: string[]) {
  if (!id) return { skin: null, coins: SCRATCH_COINS };
  return owned.includes(id) ? { skin: null, coins: SCRATCH_DUP_COINS } : { skin: id, coins: 0 };
}
export const scratchLeft = (last: number, now: number) => Math.max(0, last + SCRATCH_COOLDOWN - now);

function ScratchPolaroid({ cls, style, onFocus, onClose, owned, onWin }: { cls: string; style: React.CSSProperties; onFocus: () => void; onClose: () => void; owned: string[]; onWin: (id: string | null) => void }) {
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
    const g = c.getContext("2d")!; g.scale(d, d);
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
    const c = e.currentTarget, r = c.getBoundingClientRect(), g = c.getContext("2d")!;
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
    const data = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
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
