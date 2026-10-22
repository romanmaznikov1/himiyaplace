import { useId, type CSSProperties } from "react";

import { CONTACTS } from "@/lib/content";
import { cn } from "@/lib/utils";

/** Вращение кольца — CSS-анимация transform (композитор), а не JS-кадры motion. */
const SPIN_CSS = `
@keyframes contact-spin { to { transform: rotate(360deg) } }
.contact-spin { animation: contact-spin 18s linear infinite; transform-origin: 50% 50%; }
@media (prefers-reduced-motion: reduce) { .contact-spin { animation: none } }
`;

/**
 * Круглая наклейка «ответим за 10 минут»: текст бежит по кольцу, в центре пульсирует «10 мин».
 * Чисто декоративная — тот же текст есть рядом обычной строкой.
 */
export function ReplySticker({
  className,
  bpm = 95,
}: {
  className?: string;
  bpm?: number;
}) {
  const id = `ring-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const ring = `${CONTACTS.replyTime} ✕ ${CONTACTS.replyTime} ✕ `.toUpperCase();
  // «10» берём из самой фразы, чтобы не разъехалось с content.ts
  const minutes = CONTACTS.replyTime.match(/\d+/)?.[0];

  return (
    <div
      aria-hidden
      className={cn(
        "relative grid aspect-square select-none place-items-center rounded-full bg-ink text-toxic shadow-[7px_7px_0_0_var(--color-cobalt)]",
        className,
      )}
    >
      <style>{SPIN_CSS}</style>
      <svg
        viewBox="0 0 200 200"
        className="contact-spin absolute inset-0 h-full w-full"
      >
        <defs>
          <path
            id={id}
            d="M100 100 m-76 0 a76 76 0 1 1 152 0 a76 76 0 1 1 -152 0"
          />
        </defs>
        <text className="display" fontSize="21" fill="currentColor">
          <textPath href={`#${id}`} textLength="474" lengthAdjust="spacing">
            {ring}
          </textPath>
        </text>
      </svg>
      <span className="absolute inset-[26%] rounded-full border border-toxic/30" />
      <span
        className="animate-beat relative flex flex-col items-center leading-none [--beat-scale:1.1]"
        style={{ "--bpm": bpm } as CSSProperties}
      >
        <span className="display text-[clamp(34px,4.4vw,56px)] leading-[0.8] tabular-nums">
          {minutes ?? "10"}
        </span>
        <span className="label mt-1 text-[0.66rem] text-paper">мин</span>
      </span>
    </div>
  );
}
