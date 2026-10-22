import { useMemo } from "react";

import { cn, mulberry32 } from "@/lib/utils";

/**
 * Рваный край бумаги/постера. Ставится внутрь relative-блока и «вылезает» за его границу,
 * перекрывая соседний блок — так получаются неровные переходы между секциями и карточками.
 *
 *   <section className="relative bg-toxic">
 *     <TornEdge side="top" color="var(--color-toxic)" seed={4} />
 *     ...
 *   </section>
 *
 * fiber — светлая «волокнистая» кромка под рваным краем, как у настоящей рваной бумаги.
 */
export type TornEdgeProps = {
  side?: "top" | "bottom";
  /** Цвет заливки = цвет блока, к которому крепится край. */
  color: string;
  /** Цвет волокна под краем; false — без волокна. */
  fiber?: string | false;
  /** Глубина разрыва в px. */
  height?: number;
  seed?: number;
  /** Сколько «зубцов» на ширину: больше — мельче рвань. */
  density?: number;
  className?: string;
};

const VB_W = 1000;

function tornPoints(seed: number, h: number, density: number) {
  const rnd = mulberry32(seed * 9973 + 17);
  const phase = rnd() * Math.PI * 2;
  const phase2 = rnd() * Math.PI * 2;
  const pts: [number, number][] = [];
  let x = 0;
  const step = VB_W / density;
  while (x <= VB_W) {
    const t = x / VB_W;
    const wave = Math.sin(t * Math.PI * 2.3 + phase) * 0.22 + Math.sin(t * Math.PI * 6.1 + phase2) * 0.1;
    const jitter = (rnd() - 0.5) * 0.42;
    const notch = rnd() < 0.07 ? rnd() * 0.45 : 0;
    const y = h * (0.5 + wave + jitter + notch);
    pts.push([x, Math.min(h - 1.5, Math.max(1.5, y))]);
    x += step * (0.45 + rnd() * 1.1);
  }
  pts.push([VB_W, pts[pts.length - 1][1]]);
  return pts;
}

export function TornEdge({
  side = "top",
  color,
  fiber = "var(--color-paper)",
  height = 48,
  seed = 1,
  density = 70,
  className,
}: TornEdgeProps) {
  const { main, rim } = useMemo(() => {
    const pts = tornPoints(seed, height, density);
    const rnd = mulberry32(seed * 31 + 7);
    const toPath = (p: [number, number][]) =>
      `M0 ${height + 1} L` + p.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L") + ` L${VB_W} ${height + 1} Z`;
    const rimPts = pts.map(([x, y]) => [x, Math.max(0.5, y - (1.5 + rnd() * 4.5))] as [number, number]);
    return { main: toPath(pts), rim: toPath(rimPts) };
  }, [seed, height, density]);

  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${VB_W} ${height + 1}`}
      preserveAspectRatio="none"
      className={cn(
        "pointer-events-none absolute inset-x-0 z-[2] block w-full",
        side === "top" ? "bottom-full -mb-px" : "top-full -mt-px -scale-y-100",
        className,
      )}
      style={{ height }}
    >
      {fiber && <path d={rim} fill={fiber} opacity={0.92} />}
      <path d={main} fill={color} />
    </svg>
  );
}

/**
 * clip-path с рваными краями для фото и карточек:
 *   style={{ clipPath: tornClipPath(3, { top: true, bottom: true }) }}
 * depth — глубина разрыва в процентах от размера блока.
 */
export function tornClipPath(
  seed: number,
  edges: { top?: boolean; right?: boolean; bottom?: boolean; left?: boolean } = { top: true, bottom: true },
  depth = 2.4,
  segments = 36,
) {
  const rnd = mulberry32(seed * 7919 + 3);
  const j = (on?: boolean) => (on ? depth * (0.15 + rnd() * 0.85) : 0);
  const pts: string[] = [];
  for (let i = 0; i <= segments; i++) pts.push(`${(i / segments) * 100}% ${j(edges.top)}%`);
  for (let i = 1; i <= segments; i++) pts.push(`${100 - j(edges.right)}% ${(i / segments) * 100}%`);
  for (let i = segments - 1; i >= 0; i--) pts.push(`${(i / segments) * 100}% ${100 - j(edges.bottom)}%`);
  for (let i = segments - 1; i >= 1; i--) pts.push(`${j(edges.left)}% ${(i / segments) * 100}%`);
  return `polygon(${pts.join(",")})`;
}

/**
 * Рваный clip-path с глубиной разрыва в пикселях (а не в % стороны, как tornClipPath):
 * у широкого баннера верх/низ рвутся глубже, а бока — мельче и не превращаются в «пилу».
 * Профиль как у TornEdge: плавная волна + дрожание + редкие глубокие надрывы.
 *   style={{ clipPath: tornClipPathPx(5, { x: 8, y: 14 }) }}
 */
export function tornClipPathPx(seed: number, { x = 8, y = 14, stepsX = 72, stepsY = 22 } = {}) {
  const rnd = mulberry32(seed * 7919 + 3);
  const edge = (n: number, depth: number) => {
    const p1 = rnd() * Math.PI * 2;
    const p2 = rnd() * Math.PI * 2;
    return Array.from({ length: n + 1 }, (_, i) => {
      const t = i / n;
      const wave = 0.5 + Math.sin(t * Math.PI * 2.3 + p1) * 0.22 + Math.sin(t * Math.PI * 7.1 + p2) * 0.1;
      const jitter = (rnd() - 0.5) * 0.45;
      const notch = rnd() < 0.08 ? rnd() * 0.5 : 0;
      return Math.max(0, Math.min(1, wave + jitter + notch)) * depth;
    });
  };
  const pct = (i: number, n: number) => `${((i / n) * 100).toFixed(2)}%`;
  const top = edge(stepsX, y);
  const right = edge(stepsY, x);
  const bottom = edge(stepsX, y);
  const left = edge(stepsY, x);

  const pts: string[] = [];
  for (let i = 0; i <= stepsX; i++) pts.push(`${pct(i, stepsX)} ${top[i].toFixed(1)}px`);
  for (let i = 1; i < stepsY; i++) pts.push(`calc(100% - ${right[i].toFixed(1)}px) ${pct(i, stepsY)}`);
  for (let i = stepsX; i >= 0; i--) pts.push(`${pct(i, stepsX)} calc(100% - ${bottom[i].toFixed(1)}px)`);
  for (let i = stepsY - 1; i >= 1; i--) pts.push(`${left[i].toFixed(1)}px ${pct(i, stepsY)}`);
  return `polygon(${pts.join(",")})`;
}
