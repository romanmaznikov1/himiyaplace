import { useMemo } from "react";

import { cn, mulberry32 } from "@/lib/utils";

/**
 * Штрих-код из детерминированных полос — как на билетах в референсе (общая версия вместо
 * копий в секциях). Рисуется одним <path>, цвет — currentColor.
 *
 *   <Barcode seed={3} className="h-8 w-28 text-ink" />                   // полосы вертикальные
 *   <Barcode seed="p8" orientation="vertical" className="h-24 w-3" />   // код «лежит» вдоль корешка
 */
type Props = {
  /** Число или строка (id билета) — один seed даёт один и тот же рисунок. */
  seed?: number | string;
  /** horizontal — полосы стоят вертикально и идут слева направо; vertical — полосы лежат стопкой. */
  orientation?: "horizontal" | "vertical";
  /** Охранные полосы по краям, как у настоящего кода. */
  guards?: boolean;
  className?: string;
};

const BARS = [0.7, 0.7, 1, 1, 1.4, 2, 2.8, 3.6];
const GAPS = [0.7, 0.9, 1.2, 1.6, 2.2];

/** FNV-1a: строка → числовой seed. */
function toSeed(s: number | string) {
  if (typeof s === "number") return s * 131 + 5;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function Barcode({ seed = 1, orientation = "horizontal", guards = true, className }: Props) {
  const d = useMemo(() => {
    const rnd = mulberry32(toSeed(seed));
    const pick = (a: number[]) => a[Math.floor(rnd() * a.length)];
    const bars: [number, number][] = guards ? [[0, 1], [2, 1]] : [];
    let p = guards ? 4.2 : 0;
    const end = guards ? 94 : 100;
    while (p < end) {
      const w = pick(BARS);
      if (p + w > end) break;
      bars.push([p, w]);
      p += w + pick(GAPS);
    }
    if (guards) bars.push([97, 1], [99, 1]);
    // viewBox 100 × 10 (или 10 × 100): одна полоса — прямоугольник в path
    return bars
      .map(([at, w]) => (orientation === "horizontal" ? `M${at} 0h${w}v10h${-w}Z` : `M0 ${at}h10v${w}h-10Z`))
      .join("");
  }, [seed, orientation, guards]);

  return (
    <svg
      aria-hidden
      viewBox={orientation === "horizontal" ? "0 0 100 10" : "0 0 10 100"}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      className={cn("block", className)}
    >
      <path d={d} fill="currentColor" />
    </svg>
  );
}
