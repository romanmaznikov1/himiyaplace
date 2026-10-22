import { useId } from "react";

import { cn } from "@/lib/utils";

/**
 * Вращение кольца — CSS-анимация transform: идёт на композиторе, не будит JS-кадры motion
 * и встаёт на паузу вместе с секцией ([data-offscreen] в index.css). Раньше это был
 * motion.svg animate={{ rotate: 360 }} — 60 записей style в секунду на любом экране.
 */
const SPIN_CSS = `
@keyframes stamp-spin { to { transform: rotate(360deg) } }
.stamp-spin { animation: stamp-spin 18s linear infinite; transform-origin: 50% 50%; }
@media (prefers-reduced-motion: reduce) { .stamp-spin { animation: none } }
`;

/**
 * Круглая печать-наклейка: текст бежит по кругу, в центре — крупная цифра.
 *   <Stamp ring="ПРОБНОЕ · 60 МИНУТ · " value="60" caption="минут" />
 */
export function Stamp({ ring, value, caption, className }: { ring: string; value: string; caption: string; className?: string }) {
  const id = `stamp-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none grid aspect-square place-items-center rounded-full bg-toxic text-ink shadow-[6px_6px_0_0_var(--color-ink)]",
        className,
      )}
    >
      <style>{SPIN_CSS}</style>
      <svg viewBox="0 0 100 100" className="stamp-spin absolute inset-0 h-full w-full">
        <defs>
          <path id={id} d="M50 50 m-39 0 a39 39 0 1 1 78 0 a39 39 0 1 1 -78 0" />
        </defs>
        <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="1.6 2.4" />
        <text fontSize="8.6" fontWeight="700" fill="currentColor" style={{ fontFamily: "var(--font-sans)", textTransform: "uppercase" }}>
          <textPath href={`#${id}`} textLength={243} lengthAdjust="spacing">
            {ring}
          </textPath>
        </text>
      </svg>
      <span className="relative flex flex-col items-center leading-none">
        <span className="display text-[2.9em] leading-[0.8] tabular-nums">{value}</span>
        <span className="label mt-[0.35em] text-[0.62em] tracking-[0.18em]">{caption}</span>
      </span>
    </div>
  );
}
