import { useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

import { tornClipPath } from "@/components/ui/torn-edge";
import type { Hall } from "@/lib/content";
import { cn, mulberry32 } from "@/lib/utils";

const ALL = { top: true, right: true, bottom: true, left: true } as const;

/**
 * sizes фото залов. Панели HallSplit монтируются только от 1024px, карточки — только ниже,
 * поэтому `title` в каждом диапазоне даёт тот же слот, что и видимые фото: заголовок «Два зала»
 * выбирает по нему тот же файл и берёт его из кэша, без второго запроса.
 */
export const HALL_SIZES = {
  split: "(min-width: 1024px) 66vw, 100vw",
  card: "(min-width: 768px) 50vw, 100vw",
  title: "(min-width: 1024px) 66vw, (min-width: 768px) 50vw, 100vw",
} as const;

export const hallWebpSrcSet = (image: Hall["image"]) => `${image.webp720} 720w, ${image.webp1000} 1000w, ${image.webp1400} 1400w`;

/**
 * Фото, «наклеенное» на стену: снизу жёсткая тень-смещение, под фото — белая бумага
 * с другой рваниной (видна как волокнистая кромка), сверху само фото с рваными краями.
 */
export function TornFrame({
  seed,
  children,
  className,
  shadow = "var(--color-ultra)",
  offset = 12,
}: {
  seed: number;
  children: ReactNode;
  className?: string;
  shadow?: string;
  offset?: number;
}) {
  const clips = useMemo(
    () => ({ rim: tornClipPath(seed, ALL, 1.1, 64), photo: tornClipPath(seed + 7, ALL, 2.2, 64) }),
    [seed],
  );
  return (
    <div className={cn("relative", className)}>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ clipPath: clips.rim, background: shadow, translate: `${offset}px ${offset}px` }}
      />
      <div aria-hidden className="absolute inset-0 bg-ice" style={{ clipPath: clips.rim }} />
      <div className="absolute inset-[5px] overflow-hidden bg-ink" style={{ clipPath: clips.photo }}>
        {children}
      </div>
    </div>
  );
}

/**
 * Фото зала с параллаксом внутри рамки. layerClassName позволяет зафиксировать ширину слоя
 * (в раскрывающихся панелях фото не масштабируется, а «открывается», как окно).
 */
export function HallPhoto({
  hall,
  sizes,
  layerClassName,
  imgClassName,
  position = "50% 50%",
}: {
  hall: Hall;
  sizes: string;
  layerClassName?: string;
  imgClassName?: string;
  position?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-6%", "6%"]);
  const { image } = hall;

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      {/* свой слой: сдвиг параллакса двигает композитор, а не перерисовывает фото на каждом кадре скролла */}
      <motion.div className={cn("absolute inset-x-0 -inset-y-[8%]", !reduce && "will-change-transform", layerClassName)} style={{ y }}>
        <picture>
          <source type="image/webp" srcSet={hallWebpSrcSet(image)} sizes={sizes} />
          <img
            src={image.jpg1400}
            srcSet={`${image.jpg720} 720w, ${image.jpg1400} 1400w`}
            sizes={sizes}
            width={image.width}
            height={image.height}
            alt={hall.alt}
            loading="lazy"
            decoding="async"
            className={cn("h-full w-full object-cover", imgClassName)}
            style={{ objectPosition: position }}
          />
        </picture>
      </motion.div>
    </div>
  );
}

/** Кусок скотча на углу фото: полупрозрачный, с рваными концами и мелким текстом. */
export function TapePiece({
  seed = 1,
  tone = "toxic",
  rotate = 0,
  className,
  delay = 0,
}: {
  seed?: number;
  tone?: "toxic" | "ice";
  rotate?: number;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const clip = useMemo(() => {
    const rnd = mulberry32(seed * 131 + 5);
    const n = 6;
    const right: string[] = [];
    const left: string[] = [];
    for (let i = 0; i <= n; i++) {
      const y = ((i / n) * 100).toFixed(1);
      right.push(`${(100 - rnd() * 6).toFixed(1)}% ${y}%`);
      left.push(`${(rnd() * 6).toFixed(1)}% ${y}%`);
    }
    return `polygon(${[...right, ...left.reverse()].join(",")})`;
  }, [seed]);

  return (
    <motion.div
      aria-hidden
      className={cn("pointer-events-none absolute z-20 drop-shadow-[0_6px_8px_rgb(0_0_0/0.35)]", className)}
      style={{ rotate }}
      initial={reduce ? false : { opacity: 0, scale: 1.6 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ type: "spring", stiffness: 420, damping: 20, delay: 0.45 + delay }}
    >
      <div
        className={cn(
          "display flex h-full items-center justify-center overflow-hidden whitespace-nowrap px-3 text-[13px] tracking-[0.08em] text-ink",
          tone === "toxic" ? "bg-toxic/85" : "bg-ice/80",
        )}
        style={{ clipPath: clip }}
      >
        <span className="opacity-70">Химия ✕ Химия ✕ Химия ✕ Химия</span>
      </div>
    </motion.div>
  );
}

/** Штрих-код как на билетах из референса — чистый декор. */
export function Barcode({ seed = 1, className }: { seed?: number; className?: string }) {
  const bars = useMemo(() => {
    const rnd = mulberry32(seed * 977 + 1);
    const list: { x: number; w: number }[] = [];
    let x = 0;
    while (x < 96) {
      const w = 0.8 + Math.floor(rnd() * 3.2) * 0.9;
      list.push({ x, w });
      x += w + 0.9 + rnd() * 1.6;
    }
    return list;
  }, [seed]);
  return (
    <svg aria-hidden viewBox="0 0 100 30" preserveAspectRatio="none" className={className}>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={30} fill="currentColor" />
      ))}
    </svg>
  );
}

/** Бирка-билет «ЗАЛ 01» со штрих-кодом. */
export function HallTicket({ number, seed, className }: { number: string; seed: number; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("w-32 bg-paper p-2.5 text-ink shadow-[5px_5px_0_0_var(--color-toxic)]", className)}
    >
      <div className="flex items-end justify-between">
        <span className="label text-[0.6rem]">Зал</span>
        <span className="display text-[34px] leading-[0.8] tabular-nums">{number}</span>
      </div>
      <Barcode seed={seed} className="mt-2 h-8 w-full" />
      <div className="label mt-1.5 flex justify-between text-[0.5rem] tracking-[0.18em] opacity-70">
        <span>Химия</span>
        <span>Ставрополь</span>
      </div>
    </div>
  );
}

const TILTS = [-3, 2, -1.5, 3];

/** Особенности зала — наклейки с жёсткой тенью. on=false прячет их (для свёрнутой панели). */
export function FeatureChips({
  features,
  on = true,
  className,
}: {
  features: string[];
  on?: boolean;
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap gap-x-3 gap-y-3", className)} aria-label="Особенности зала">
      {features.map((f, i) => (
        <motion.li
          key={f}
          className={cn(
            "label inline-flex items-center gap-2 px-2.5 py-1.5 text-[0.66rem] text-ink md:px-3 md:py-2 md:text-[0.72rem]",
            i % 2 === 0
              ? "bg-toxic [--chip-shadow:var(--color-ink)]"
              : "bg-paper [--chip-shadow:var(--color-cobalt)]",
          )}
          style={{ boxShadow: "4px 4px 0 0 var(--chip-shadow)" } as CSSProperties}
          initial={false}
          animate={on ? { opacity: 1, scale: 1, rotate: TILTS[i % TILTS.length] } : { opacity: 0, scale: 1.3, rotate: 0 }}
          transition={
            on
              ? { type: "spring", stiffness: 420, damping: 18, delay: 0.32 + i * 0.07 }
              : { duration: 0.15 }
          }
        >
          <span aria-hidden className="text-[0.9em] leading-none">✦</span>
          {f}
        </motion.li>
      ))}
    </ul>
  );
}

/** Огромная контурная цифра «01». */
export function OutlineNumber({
  number,
  className,
  stroke = 2,
  filled = false,
}: {
  number: string;
  className?: string;
  stroke?: number;
  filled?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "display pointer-events-none select-none leading-[0.8] tabular-nums transition-[color,-webkit-text-fill-color] duration-500",
        className,
      )}
      style={{
        WebkitTextStroke: `${stroke}px currentColor`,
        WebkitTextFillColor: filled ? "currentColor" : "transparent",
      }}
    >
      {number}
    </span>
  );
}
