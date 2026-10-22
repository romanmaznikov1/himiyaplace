import { useMemo, type CSSProperties, type MouseEvent } from "react";

import { scrollToId } from "@/hooks/useLenis";
import { CONTACTS, DIRECTIONS, WEEK } from "@/lib/content";
import { cn, mulberry32 } from "@/lib/utils";

/**
 * Координаты метки студии — взяты из конструктора Яндекс Карт (CONTACTS.mapWidget, метка «Himiya Север»).
 * В content.ts их нет, поэтому держим рядом с секцией.
 */
export const STUDIO_COORDS = { lat: "45.0627", lon: "41.9235" } as const;

/** Тёмная тема виджета Яндекс Карт включается параметром theme=dark — без CSS-инверсии и «грязных» цветов. */
export const MAP_SRC = `${CONTACTS.mapWidget}&theme=dark&lang=ru_RU`;

export type Slot = {
  time: string;
  title: string;
  note?: string;
  symbol?: string;
};

const symbolOf = (id: (typeof DIRECTIONS)[number]["id"]) =>
  DIRECTIONS.find((d) => d.id === id)?.symbol;

// какому «элементу» Химии относится занятие — только для явных совпадений по названию
const KINDS: [RegExp, (typeof DIRECTIONS)[number]["id"]][] = [
  [/high heels/i, "heels"],
  [/hip ?hop/i, "hiphop"],
  [/контемп/i, "contemp"],
  [/электро/i, "electro"],
];

/** «18:00 HipHop (Миша)» → { time: "18:00", title: "HipHop", note: "Миша", symbol: "Hp" } */
export function parseSlot(raw: string): Slot {
  const m = raw.match(/^(\d{1,2}:\d{2})\s+(.+?)(?:\s+\(([^)]+)\))?$/);
  if (!m) return { time: "", title: raw };
  const [, time, title, note] = m;
  const kind = KINDS.find(([re]) => re.test(title))?.[1];
  return { time, title, note, symbol: kind ? symbolOf(kind) : undefined };
}

export const DAYS = WEEK.map((d) => ({ ...d, slots: d.items.map(parseSlot) }));

/** 1 занятие · 3 занятия · 5 занятий */
export function classes(n: number) {
  const m10 = n % 10;
  const m100 = n % 100;
  const word =
    m10 === 1 && m100 !== 11
      ? "занятие"
      : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)
        ? "занятия"
        : "занятий";
  return `${n} ${word}`;
}

/**
 * Якорь внутри страницы: плавный скролл Lenis, а с клавиатуры (Enter, detail === 0) фокус
 * переезжает к цели — следующий Tab продолжит уже оттуда (как в Nav).
 */
export function jumpTo(e: MouseEvent<HTMLElement>, id: string) {
  e.preventDefault();
  const keyboard = e.detail === 0;
  scrollToId(id);
  const target = document.getElementById(id);
  if (keyboard && target) {
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.setAttribute("data-nav-target", "");
    target.focus({ preventScroll: true });
  }
}

/** Сегодняшний день недели по Ставрополю (МСК), понедельник = 0. */
export function todayIndex(now = new Date()) {
  try {
    const wd = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone: "Europe/Moscow",
    }).format(now);
    const i = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(wd);
    if (i >= 0) return i;
  } catch {
    /* старый браузер без таймзон — берём локальную дату */
  }
  return (now.getDay() + 6) % 7;
}

/** Штрих-код из детерминированных полос — как на билетах в референсе. */
export function Barcode({
  seed = 1,
  bars = 34,
  className,
}: {
  seed?: number;
  bars?: number;
  className?: string;
}) {
  const rects = useMemo(() => {
    const rnd = mulberry32(seed * 131 + 5);
    let x = 0;
    return Array.from({ length: bars }, () => {
      const w = rnd() < 0.3 ? 3 : rnd() < 0.6 ? 2 : 1;
      const r = { x, w };
      x += w + (rnd() < 0.5 ? 1 : 2);
      return r;
    });
  }, [seed, bars]);
  const width = rects.length
    ? rects[rects.length - 1].x + rects[rects.length - 1].w
    : 1;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${width} 20`}
      preserveAspectRatio="none"
      className={cn("block", className)}
    >
      {rects.map((r, i) => (
        <rect
          key={i}
          x={r.x}
          y={0}
          width={r.w}
          height={20}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

/** Кусок малярного скотча: полупрозрачный, с «зубчатыми» оторванными краями. */
export function TapePiece({
  rotate = -35,
  className,
  style,
}: {
  rotate?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute block h-7 w-24 bg-ice/75 shadow-[0_6px_14px_-6px_rgb(0_0_0/0.6)] backdrop-blur-[1px] md:h-9 md:w-32",
        className,
      )}
      style={{
        rotate: `${rotate}deg`,
        clipPath:
          "polygon(0 8%, 4% 0, 8% 10%, 11% 2%, 14% 6%, 86% 4%, 90% 0, 93% 9%, 97% 1%, 100% 10%, 100% 92%, 96% 100%, 92% 90%, 88% 98%, 85% 94%, 14% 96%, 10% 100%, 6% 90%, 3% 99%, 0 90%)",
        ...style,
      }}
    >
      <span className="absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(90deg,transparent_0_6px,rgb(255_255_255/0.5)_6px_7px)]" />
    </span>
  );
}

/** Наклейка-компас: «С» — север, отсылка к студии «Север». */
export function NorthSticker({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid size-[4.5rem] place-items-center rounded-full bg-toxic text-ink shadow-[5px_5px_0_0_var(--color-cobalt)] md:size-24",
        className,
      )}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="2 4"
        />
        <path d="M50 9 L58 30 L50 25 L42 30 Z" fill="currentColor" />
      </svg>
      <span className="display mt-2 text-[2.2rem] leading-none md:text-[2.9rem]">
        С
      </span>
    </span>
  );
}
