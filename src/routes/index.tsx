import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import base from "@/assets/chibi_andrey.png.asset.json";
import y2018 from "@/assets/chibi_andrey_2018.png.asset.json";
import alisa from "@/assets/chibi_alisa.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Чиби Андрей — кликер" },
      { name: "description", content: "Уютный кликер с чиби Андреем и скинами." },
      { property: "og:title", content: "Чиби Андрей — кликер" },
      { property: "og:description", content: "Кликай, копи чиби коины, открывай скины." },
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
const SKINS: { id: string; name: string; src: string; clicks: number; cost: number; rarity: Rarity; no: string }[] = [
  { id: "base", name: "Чиби Андрей", src: base.url, clicks: 0, cost: 0, rarity: "common", no: "001" },
  { id: "2018", name: "Чиби Андрей 2018", src: y2018.url, clicks: 5000, cost: 10, rarity: "rare", no: "002" },
  { id: "alisa", name: "Чиби Алиса", src: alisa.url, clicks: 15000, cost: 25, rarity: "epic", no: "003" },
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

type WinId = "clicker" | "collection" | "fortune";
const WINS: { id: WinId; title: string }[] = [
  { id: "clicker", title: "пирочибиклик" },
  { id: "collection", title: "коллекция" },
  { id: "fortune", title: "фортуна" },
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
    <div className="titlebar text-primary-foreground px-3 py-1.5 flex items-center justify-between gap-2 border-b-[2.5px] border-border">
      <div className="flex gap-1.5 items-center">
        <button onClick={onClose} aria-label="закрыть" className="w-3 h-3 rounded-full bg-destructive border border-border" />
        <span className="w-3 h-3 rounded-full bg-chart-4 border border-border" />
        <span className="w-3 h-3 rounded-full bg-chart-2 border border-border" />
      </div>
      <span className="text-base truncate">{title}</span>
      <span className="min-w-12 flex justify-end items-center">{right}</span>
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
  useEffect(() => { const t = setTimeout(() => setBoot(false), 2600); return () => clearTimeout(t); }, []);

  useEffect(() => {
    const s = JSON.parse(localStorage.getItem("chibi") || "null");
    if (s) { setClicks(s.clicks); setCoins(s.coins); setOwned(s.owned); setSkin(s.skin); }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem("chibi", JSON.stringify({ clicks, coins, owned, skin }));
  }, [clicks, coins, owned, skin, loaded]);

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
  const winCls = (id: WinId) => `oswin pill overflow-hidden !rounded-[14px] winopen ${top === id ? "" : "oswin-back"}`;

  if (boot) return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-foreground text-primary-foreground">
      <img src={base.url} alt="" className="w-28 h-28 object-contain bootlogo" />
      <div className="text-3xl">Chibi<span className="text-primary">OS</span></div>
      <div className="w-40 h-4 rounded border-2 border-muted-foreground overflow-hidden p-0.5"><div className="bootbar h-full w-10 flex gap-0.5">{[0,1,2].map(i=><span key={i} className="flex-1 bg-primary rounded-sm" />)}</div></div>
    </main>
  );

  return (
    <main className="min-h-screen p-4 desktop">
      {/* значки на рабочем столе */}
      <div className="flex gap-4 mb-4 flex-wrap justify-center sm:justify-start">
        {WINS.map((w) => (
          <button key={w.id} onClick={() => focus(w.id)}
            className="flex flex-col items-center gap-1 w-20 text-primary-foreground select-none active:scale-95 transition-transform">
            <FolderIco />
            <span className="text-[11px] leading-tight text-center drop-shadow">{w.title}</span>
          </button>
        ))}
      </div>

      <div>
        <section className={winCls("clicker")} style={winStyle("clicker")} onPointerDown={() => focus("clicker")}>
          <TitleBar title="пирочибиклик.exe" onClose={() => close("clicker")}
            right={<button onClick={() => setCredits(true)} aria-label="инфо" className="text-lg leading-none px-1">•••</button>} />
          <div className="scene !border-0 !rounded-none !shadow-none p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-2xl"><Coin />{coins}</div>
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
            <div className="flex items-center gap-2 text-xs">
              <Coin small />
              <div className="flex-1 h-3 rounded-full bg-card border-2 border-border overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${prog * 100}%` }} /></div>
              <span>{clicks % COIN_EVERY}/{COIN_EVERY}</span>
            </div>
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

        <Wheel cls={winCls("fortune")} style={winStyle("fortune")} onFocus={() => focus("fortune")} onWin={(n) => setCoins((c) => c + n)} onClose={() => close("fortune")} />
      </div>

      {/* окошко «о программе» */}
      {credits && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setCredits(false)}>
          <section className="pill overflow-hidden !rounded-[14px] winopen w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
            <TitleBar title="о программе" onClose={() => setCredits(false)} right={<span className="w-6" />} />
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

const PRIZES: number[] = [1, 2, 3, 1, 2, 1];
const COOLDOWN = 60 * 60 * 1000;
function Wheel({ onWin, onClose, cls, style, onFocus }: { onWin: (n: number) => void; onClose: () => void; cls: string; style: React.CSSProperties; onFocus: () => void }) {
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [last, setLast] = useState(0);
  const [now, setNow] = useState(0);
  const [won, setWon] = useState<number | null>(null);
  useEffect(() => { setLast(Number(localStorage.getItem("chibi_wheel") || 0)); setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const left = Math.max(0, last + COOLDOWN - now);
  const spin = () => {
    if (spinning || left > 0) return;
    const i = Math.floor(Math.random() * PRIZES.length);
    const seg = 360 / PRIZES.length;
    setWon(null); setSpinning(true);
    setRot((r) => r - (r % 360) + 360 * 5 + (360 - i * seg - seg / 2));
    setTimeout(() => { setSpinning(false); const w = PRIZES[i] ?? 1; setWon(w); onWin(w); const t = Date.now(); setLast(t); localStorage.setItem("chibi_wheel", String(t)); }, 4000);
  };
  const mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);
  return (
    <section className={cls} style={style} onPointerDown={onFocus}>
      <TitleBar title="фортуна.exe" onClose={onClose} right={<span className="w-6" />} />
      <div className="scene !border-0 !rounded-none !shadow-none p-4 flex flex-col items-center gap-3">
        <div className="relative w-[min(16rem,70vw)] aspect-square">
          <div className="wheel-pin" />
          <div className="wheel" style={{ transform: `rotate(${rot}deg)`, transition: spinning ? "transform 4s cubic-bezier(.15,.9,.25,1)" : "none" }}>
            {PRIZES.map((p, i) => (
              <span key={i} className="absolute inset-0 flex justify-center pt-[8%] text-2xl" style={{ transform: `rotate(${i * 60 + 30}deg)` }}>
                <span className="flex items-center gap-0.5">{p}<Coin small /></span>
              </span>
            ))}
          </div>
          <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-card border-[2.5px] border-border" />
        </div>
        <div className="h-5 text-sm">{won ? <>выпало +{won} <Coin small /></> : null}</div>
        <button onClick={spin} disabled={spinning || left > 0} className="xpbtn px-6 py-1.5 text-primary-foreground disabled:opacity-60">
          {spinning ? "крутится..." : left > 0 ? `ждать ${mm}:${String(ss).padStart(2, "0")}` : "крутить"}
        </button>
      </div>
    </section>
  );
}
