import { useMemo } from "react";

import { cn, mulberry32 } from "@/lib/utils";

/** FNV-1a: строковый id билета → числовой seed. */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const BARS = [0.7, 0.7, 1, 1, 1.4, 2, 2.8, 3.6];
const GAPS = [0.7, 0.9, 1.2, 1.6, 2.2];

/**
 * Штрих-код на корешке: горизонтальные полосы стопкой (код «лежит» вдоль корешка).
 * Один и тот же seed → один и тот же рисунок при каждом рендере.
 */
export function Barcode({ seed, className }: { seed: string; className?: string }) {
  const bars = useMemo(() => {
    const rnd = mulberry32(hash(seed));
    const pick = (a: number[]) => a[Math.floor(rnd() * a.length)];
    // охранные полосы по краям, как у настоящего штрих-кода
    const out: { y: number; h: number }[] = [
      { y: 0, h: 1 },
      { y: 2, h: 1 },
    ];
    let y = 4.2;
    while (y < 94) {
      const h = pick(BARS);
      out.push({ y, h });
      y += h + pick(GAPS);
    }
    out.push({ y: 97, h: 1 }, { y: 99, h: 1 });
    return out.filter((b) => b.y + b.h <= 100);
  }, [seed]);

  return (
    <svg
      aria-hidden
      viewBox="0 0 10 100"
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      className={cn("block", className)}
    >
      {bars.map((b, i) => (
        <rect key={i} x={0} y={b.y} width={10} height={b.h} fill="currentColor" />
      ))}
    </svg>
  );
}
