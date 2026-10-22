import { useId, type CSSProperties } from "react";
import type { Variants } from "motion/react";

import { cn } from "@/lib/utils";
import { blurFrom, blurTo } from "@/lib/motion";

/** Общие варианты интро: родитель переключает "off" → "on", дети берут задержку через custom. */
const EASE = [0.16, 1, 0.3, 1] as const;

export const riseIn: Variants = {
  off: { opacity: 0, y: 36, ...blurFrom(8) },
  on: (d: number = 0) => ({
    opacity: 1,
    y: 0,
    ...blurTo(),
    transition: { duration: 0.7, ease: EASE, delay: d },
    transitionEnd: { filter: "none" },
  }),
};

export const fadeIn: Variants = {
  off: { opacity: 0 },
  on: (d: number = 0) => ({ opacity: 1, transition: { duration: 0.4, delay: d } }),
};

/* ------------------------------------------------------------------ */
/* Круглая наклейка с бегущим по кругу текстом                          */
/* ------------------------------------------------------------------ */

/** Размер цифры в центре — от размера самой наклейки (container query), а не от ширины экрана. */
const STICKER: CSSProperties = { containerType: "inline-size" };

export function SpinSticker({ text, center, className }: { text: string; center: string; className?: string }) {
  const id = useId();
  return (
    <div aria-hidden className={cn("relative grid aspect-square place-items-center", className)} style={STICKER}>
      <style>{`@keyframes hero-spin { to { transform: rotate(360deg) } }`}</style>
      <div className="absolute inset-0 rounded-full bg-toxic shadow-[5px_5px_0_0_var(--color-cobalt)]" />
      <svg viewBox="0 0 200 200" className="anim absolute inset-0" style={{ animation: "hero-spin 16s linear infinite" }}>
        <defs>
          <path id={id} d="M100 100 m-74 0 a74 74 0 1 1 148 0 a74 74 0 1 1 -148 0" />
        </defs>
        <text className="font-sans" fill="var(--color-ink)" fontSize="17" fontWeight="800" letterSpacing="3.2">
          <textPath href={`#${id}`} textLength={462} lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
      </svg>
      <div className="relative grid size-[46%] place-items-center rounded-full bg-ink text-center">
        <span className="display text-[21cqw] leading-none text-toxic tabular-nums">{center}</span>
      </div>
    </div>
  );
}
