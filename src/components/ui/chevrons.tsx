import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * Ряд шевронов »»»»»» как в шапках референсов. Подсветка бежит слева направо в ритме bpm.
 * Ключевые кадры chev-run — в index.css (раньше <style> вставлялся в каждый экземпляр);
 * класс .anim ставит их на паузу вместе с секцией вне экрана ([data-offscreen] в index.css).
 *   <Chevrons count={6} bpm={120} className="text-toxic" />
 */
export function Chevrons({
  count = 6,
  bpm = 120,
  className,
  size = "1em",
}: {
  count?: number;
  bpm?: number;
  className?: string;
  size?: string;
}) {
  const beat = 60 / bpm;
  return (
    <span aria-hidden className={cn("inline-flex items-center", className)} style={{ height: size }}>
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 12 20"
          className="anim -ml-[0.12em] h-full w-auto first:ml-0"
          style={
            {
              animation: `chev-run ${beat * count * 0.5}s steps(1,end) infinite`,
              animationDelay: `${(i * beat * 0.5) / 1}s`,
            } as CSSProperties
          }
        >
          <path d="M1 1 L9 10 L1 19 H4.5 L12.5 10 L4.5 1 Z" fill="currentColor" />
        </svg>
      ))}
    </span>
  );
}
