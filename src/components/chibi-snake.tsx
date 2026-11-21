import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChibiSnake } from "@/lib/chibi-snake";
import andrey from "@/assets/chibi_andrey_updated.png";

export function ChibiSnakeGame({ active }: { active: boolean }) {
  const board = useRef<HTMLDivElement>(null);
  const game = useRef<ChibiSnake<HTMLImageElement> | null>(null);
  const statusRef = useRef("ready");
  const [status, setStatus] = useState("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const changeStatus = (s: string) => { statusRef.current = s; setStatus(s); };

  useEffect(() => { try { setBest(Number(localStorage.getItem("chibi_snake_best")) || 0); } catch {} }, []);
  useEffect(() => () => game.current?.stop(), []);
  useEffect(() => {
    if (!active && statusRef.current === "running") { game.current?.stop(); changeStatus("paused"); }
  }, [active]);

  const start = () => {
    const el = board.current;
    if (!el) return;
    game.current?.stop();
    el.replaceChildren(); setScore(0);
    const render = (p: { x: number; y: number }, food: boolean) => {
      const img = document.createElement("img");
      img.src = andrey; img.alt = food ? "Андрей для змейки" : "Чиби Андрей в змейке";
      img.draggable = false; img.className = food ? "snake-chibi snake-food" : "snake-chibi";
      img.style.left = `${p.x * 100 / 16}%`; img.style.top = `${p.y * 100 / 16}%`;
      if (p.x >= 0) el.append(img);
      return img;
    };
    game.current = new ChibiSnake({ width: 16, height: 16, tickRate: 5, continuousSpace: false,
      scoreConfig: { foodMultiplier: 1, movementMultiplier: 0, useSnakeLength: false,
        onScoreUpdate: (n) => {
          setScore(n); setBest(b => { const next = Math.max(b, n); try { localStorage.setItem("chibi_snake_best", String(next)); } catch {} return next; });
        } } },
      { cellSize: 1, snakeRenderer: p => render(p, false), foodRenderer: p => render(p, true), clearRenderer: img => img?.remove() },
      () => { game.current?.stop(); changeStatus("over"); });
    changeStatus("running"); game.current.start();
  };
  const pause = () => {
    if (statusRef.current === "running") { game.current?.stop(); changeStatus("paused"); }
    else if (statusRef.current === "paused") { changeStatus("running"); game.current?.start(); }
  };
  const direction = (x: number, y: number) => { if (statusRef.current === "running") game.current?.setDirection({ x, y }); };
  useEffect(() => {
    if (!active) return;
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea")) return;
      const directions: Record<string, [number, number]> = { ArrowUp: [0,-1], ArrowDown: [0,1], ArrowLeft: [-1,0], ArrowRight: [1,0], w: [0,-1], s: [0,1], a: [-1,0], d: [1,0] };
      const d = directions[e.key];
      if (d) { e.preventDefault(); direction(d[0], d[1]); }
      if (e.code === "Space" && (statusRef.current === "running" || statusRef.current === "paused")) { e.preventDefault(); pause(); }
    };
    const hide = () => { if (document.hidden && statusRef.current === "running") { game.current?.stop(); changeStatus("paused"); } };
    window.addEventListener("keydown", key); document.addEventListener("visibilitychange", hide);
    return () => { window.removeEventListener("keydown", key); document.removeEventListener("visibilitychange", hide); };
  }, [active]);

  return <div className="snake-content">
    <div className="flex items-center justify-between gap-2 text-sm"><span>собрано: {score}</span><span className="text-muted-foreground">рекорд: {best}</span></div>
    <div className="snake-field" onPointerDown={e => { if ((e.target as HTMLElement).closest("button")) return; touch.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerUp={e => { const p = touch.current; touch.current = null; if (!p) return; const x = e.clientX - p.x, y = e.clientY - p.y; if (Math.max(Math.abs(x), Math.abs(y)) < 15) return; if (Math.abs(x) > Math.abs(y)) direction(Math.sign(x), 0); else direction(0, Math.sign(y)); }}>
      <div ref={board} className="absolute inset-0" />
      {status !== "running" && <div className="snake-overlay">
        {status === "ready" && <img src={andrey} alt="Чиби Андрей" className="w-20 h-20 object-contain" />}
        <span>{status === "ready" ? "чиби змейка" : status === "paused" ? "пауза" : score >= 253 ? "все Андреи собраны!" : "игра окончена"}</span>
        <Button variant="os" onClick={status === "paused" ? pause : start}><Play />{status === "paused" ? "продолжить" : status === "ready" ? "играть" : "ещё раз"}</Button>
      </div>}
    </div>
    <div className="snake-controls">
      <Button variant="osIcon" size="icon" aria-label="заново" title="заново" onClick={start}><RotateCcw /></Button>
      <div className="snake-dpad">
        <Button variant="osIcon" size="icon" className="col-start-2" aria-label="вверх" onClick={() => direction(0,-1)}><ArrowUp /></Button>
        <Button variant="osIcon" size="icon" className="row-start-2" aria-label="влево" onClick={() => direction(-1,0)}><ArrowLeft /></Button>
        <Button variant="osIcon" size="icon" className="row-start-2" aria-label="вниз" onClick={() => direction(0,1)}><ArrowDown /></Button>
        <Button variant="osIcon" size="icon" className="row-start-2" aria-label="вправо" onClick={() => direction(1,0)}><ArrowRight /></Button>
      </div>
      <Button variant="osIcon" size="icon" disabled={status === "ready" || status === "over"} aria-label={status === "paused" ? "продолжить" : "пауза"} title="пауза" onClick={pause}>{status === "paused" ? <Play /> : <Pause />}</Button>
    </div>
  </div>;
}