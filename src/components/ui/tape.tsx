import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { flushSync } from "react-dom";

import { cn } from "@/lib/utils";

/**
 * Лента-скотч с бегущим текстом — как зелёные ленты «DANCER» в референсах.
 * Ставится поверх фото/границ секций, обычно с поворотом.
 *
 *   <Tape text="ХИМИЯ • DANCE • ХИМИЯ" rotate={-6} className="absolute left-[-5%] top-1/3 w-[110%]" />
 *
 * Лента — декор: для скринридеров она скрыта целиком. Если в ней смысловой текст,
 * передайте `label` — он будет прочитан один раз (визуально скрыт).
 * Повторов текста ровно столько, сколько нужно, чтобы закрыть ширину ленты.
 */
type Variant = "toxic" | "cobalt" | "ink" | "paper" | "hazard";

const styles: Record<Variant, string> = {
  toxic: "bg-toxic text-ink",
  cobalt: "bg-cobalt text-paper",
  ink: "bg-ink text-toxic border-y border-toxic/40",
  paper: "bg-paper text-ink",
  hazard: "hazard text-ink",
};

type Props = {
  text: string | string[];
  variant?: Variant;
  rotate?: number;
  /** Секунд на проход шести повторов текста (исторически). Меньше — быстрее. */
  speed?: number;
  reverse?: boolean;
  separator?: ReactNode;
  className?: string;
  textClassName?: string;
  style?: CSSProperties;
  /** Текст для скринридеров (один раз). Без него лента целиком aria-hidden. */
  label?: string;
};

/** Потолок повторов — страховка от ленты без явной ширины (shrink-to-fit). */
const MAX_REPS = 12;
/** Под столько повторов подобраны `speed` во всех секциях: скорость в px/с сохраняем при любом числе повторов. */
const BASE_REPS = 6;

/** Первая прикидка до замера: ширина одного цикла в em против ~70em ширины ленты на десктопе. */
function guessRepeats(parts: string[]) {
  const em = parts.reduce((s, p) => s + p.length * 0.45 + 1.8, 0);
  return Math.min(8, Math.max(2, Math.ceil(70 / Math.max(em, 1))));
}

export function Tape({
  text,
  variant = "toxic",
  rotate = 0,
  speed = 16,
  reverse = false,
  separator = "✕",
  className,
  textClassName,
  style,
  label,
}: Props) {
  const parts = Array.isArray(text) ? text : [text];
  const key = parts.join("\u0001");
  const root = useRef<HTMLDivElement>(null);
  const firstRow = useRef<HTMLDivElement>(null);
  const [reps, setReps] = useState(() => guessRepeats(parts));
  const repsRef = useRef(reps);
  repsRef.current = reps;
  const isHazard = variant === "hazard";

  // замер: одна строка должна быть не уже ленты — тогда сдвиг на −50% бесшовный.
  // Меряем только в колбэке ResizeObserver: он приходит после раскладки и до отрисовки, поэтому
  // scrollWidth не форсирует синхронную раскладку посреди коммита React (было ~150 мс на телефоне
  // при монтировании hero), а flushSync применяет новое число повторов в том же кадре.
  useLayoutEffect(() => {
    if (isHazard) return;
    const box = root.current;
    const row = firstRow.current;
    if (!box || !row) return;
    const ro = new ResizeObserver(() => {
      const unit = row.scrollWidth / Math.max(1, row.childElementCount / (parts.length * 2));
      const need = unit > 0 ? Math.min(MAX_REPS, Math.max(1, Math.ceil(box.clientWidth / unit))) : 1;
      if (need !== repsRef.current) flushSync(() => setReps(need));
    });
    ro.observe(box);
    // ширина строки меняется и когда догружается шрифт — тогда тоже пересчитываем
    ro.observe(row);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, isHazard]);

  const row = (first: boolean) => (
    <div ref={first ? firstRow : undefined} className="flex shrink-0 items-center gap-[0.6em] pr-[0.6em]">
      {Array.from({ length: reps }).flatMap((_, k) =>
        parts.flatMap((p, i) => [
          <span key={`${k}-${i}`}>{p}</span>,
          <span key={`${k}-${i}-s`} className="opacity-70">
            {separator}
          </span>,
        ]),
      )}
    </div>
  );

  return (
    <div
      ref={root}
      className={cn(
        "pointer-events-none overflow-hidden whitespace-nowrap shadow-[0_10px_30px_-10px_rgb(0_0_0/0.7)]",
        styles[variant],
        className,
      )}
      style={{ rotate: `${rotate}deg`, ...style }}
    >
      {label && <span className="sr-only">{label}</span>}
      {isHazard ? (
        <div aria-hidden className="h-full min-h-4" />
      ) : (
        <div
          aria-hidden
          className={cn(
            "display flex w-max py-[0.32em] text-[clamp(14px,1.6vw,26px)] leading-none tracking-[0.02em]",
            reverse ? "animate-marquee-rev" : "animate-marquee",
            textClassName,
          )}
          style={{ "--marquee-dur": `${((speed * reps) / BASE_REPS).toFixed(2)}s` } as CSSProperties}
        >
          {row(true)}
          {row(false)}
        </div>
      )}
    </div>
  );
}
