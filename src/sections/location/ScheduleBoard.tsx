import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

import { Chevrons } from "@/components/ui/chevrons";
import { CONTACTS } from "@/lib/content";
import { cn } from "@/lib/utils";

import { Barcode, classes, DAYS, todayIndex } from "./bits";

/**
 * Недельное расписание в духе клубного лайн-ап постера: 7 колонок, время — токсичным табличным шрифтом.
 * Сегодняшний день (по Москве/Ставрополю) подсвечен и помечен наклейкой «Сегодня».
 * На мобильном — горизонтальная лента карточек со снапом и переключатель дней.
 */
const list: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};
const col: Variants = {
  hidden: { opacity: 0, y: 70 },
  shown: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

export function ScheduleBoard({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const [today] = useState(todayIndex);
  const [current, setCurrent] = useState(today);
  const track = useRef<HTMLOListElement>(null);
  const raf = useRef(0);

  // на мобильном лента сразу открыта на сегодняшнем дне (скроллим только саму ленту, не страницу)
  useEffect(() => {
    const el = track.current;
    const card = el?.children[today] as HTMLElement | undefined;
    if (!el || !card || el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft =
      card.offsetLeft -
      parseFloat(getComputedStyle(el).scrollPaddingLeft || "0");
  }, [today]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const onScroll = () => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = track.current;
      if (!el) return;
      const cards = Array.from(el.children) as HTMLElement[];
      const pad = parseFloat(getComputedStyle(el).scrollPaddingLeft || "0");
      let best = 0;
      let dist = Infinity;
      cards.forEach((c, i) => {
        const d = Math.abs(c.offsetLeft - pad - el.scrollLeft);
        if (d < dist) {
          dist = d;
          best = i;
        }
      });
      setCurrent(best);
    });
  };

  const goTo = (i: number) => {
    const el = track.current;
    const card = el?.children[i] as HTMLElement | undefined;
    if (!el || !card) return;
    const pad = parseFloat(getComputedStyle(el).scrollPaddingLeft || "0");
    el.scrollTo({
      left: card.offsetLeft - pad,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  return (
    <div id="schedule" className={cn("relative scroll-mt-24", className)}>
      {/* шапка постера */}
      <div
        className="hazard h-2.5 w-full [--hz-a:var(--color-toxic)] [--hz-b:var(--color-ink)]"
        aria-hidden
      />
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-paper/25 pb-5 pt-6 md:pb-7 md:pt-8">
        <div>
          {/* подпись привязывает расписание к [05] — это часть «Локации», а не седьмая секция */}
          <p className="label mb-3 flex items-center gap-3 text-toxic">
            <span>
              <span className="text-mute">[05] Локация · </span>Вся неделя
            </span>
            <Chevrons count={5} bpm={120} size="0.8rem" />
          </p>
          <h3 className="display text-[clamp(52px,14.5vw,80px)] text-paper md:text-[clamp(72px,6.2vw,112px)]">
            Расписание
          </h3>
        </div>
        <div className="flex items-end gap-5 pb-1 md:gap-8">
          <div className="label leading-[1.6] text-mute lg:text-right">
            <span className="text-paper">{CONTACTS.studio}</span>
            <br />
            Пн — Вс · {CONTACTS.city}
          </div>
          <Barcode seed={5} className="h-12 w-28 text-paper md:h-16 md:w-40" />
        </div>
      </div>

      {/* переключатель дней — только на мобильном; 7 равных ячеек, без скрытой прокрутки даже на 320px */}
      <div
        className="mt-5 grid grid-cols-7 gap-1 lg:hidden"
        role="group"
        aria-label="Дни недели"
      >
        {DAYS.map((d, i) => (
          <button
            key={d.short}
            type="button"
            onClick={() => goTo(i)}
            aria-pressed={current === i}
            aria-label={d.day}
            className={cn(
              "display relative grid h-11 min-w-0 place-items-center text-[22px] leading-none transition-colors max-[359px]:text-[20px]",
              current === i
                ? "bg-toxic text-ink"
                : "bg-ink-800 text-paper ring-1 ring-inset ring-line",
            )}
          >
            {d.short}
            {i === today && current !== i && (
              <span
                aria-hidden
                className="absolute right-1 top-1 size-1.5 rounded-full bg-toxic"
              />
            )}
          </button>
        ))}
      </div>

      <motion.ol
        ref={track}
        onScroll={onScroll}
        tabIndex={0}
        aria-label="Расписание по дням недели"
        variants={list}
        initial={reduce ? undefined : "hidden"}
        whileInView={reduce ? undefined : "shown"}
        viewport={{ once: true, amount: 0.15 }}
        className={cn(
          // overscroll-x-contain: рывок за край ленты не уводит страницу вбок и не включает жест «назад»
          "no-scrollbar relative -mx-5 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-px-5 px-5 pb-8 pt-7 outline-none",
          "focus-visible:ring-2 focus-visible:ring-toxic focus-visible:ring-inset",
          "md:-mx-10 md:scroll-px-10 md:px-10",
          "lg:mx-0 lg:mt-0 lg:grid lg:snap-none lg:grid-cols-7 lg:gap-0 lg:overflow-visible lg:border-b lg:border-paper/25 lg:px-0 lg:pb-0 lg:pt-0",
        )}
      >
        {DAYS.map((d, i) => {
          const isToday = i === today;
          return (
            <motion.li
              key={d.short}
              variants={col}
              aria-current={isToday ? "date" : undefined}
              className={cn(
                "group/day relative flex w-[78%] max-w-[340px] shrink-0 snap-start flex-col bg-ink-800 ring-1 ring-inset ring-line sm:w-[44%]",
                "lg:w-auto lg:max-w-none lg:bg-transparent lg:ring-0 lg:border-l lg:border-paper/12 lg:last:border-r",
                "lg:transition-colors lg:duration-300 lg:hover:bg-ink-800",
                isToday &&
                  "bg-ink-700 ring-2 ring-toxic lg:bg-toxic/[0.07] lg:ring-2 lg:hover:bg-toxic/[0.1]",
              )}
            >
              {isToday && (
                <motion.span
                  className="label absolute -top-4 right-3 z-[2] bg-toxic px-3 py-2 text-[0.7rem] text-ink shadow-[4px_4px_0_0_var(--color-cobalt)] lg:-top-5 lg:left-1/2 lg:right-auto lg:-translate-x-1/2"
                  initial={
                    reduce ? undefined : { opacity: 0, scale: 1.6, rotate: -18 }
                  }
                  whileInView={
                    reduce ? undefined : { opacity: 1, scale: 1, rotate: -6 }
                  }
                  style={reduce ? { rotate: -6 } : undefined}
                  viewport={{ once: true }}
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 16,
                    delay: 0.55,
                  }}
                >
                  Сегодня
                </motion.span>
              )}
              <div className="border-b border-paper/12 px-5 pb-4 pt-5 lg:px-4 lg:pb-5 lg:pt-7 xl:px-5">
                <span
                  className={cn(
                    "label tabular-nums",
                    isToday ? "text-toxic" : "text-mute",
                  )}
                >
                  {classes(d.slots.length)}
                </span>
                <h4
                  aria-label={isToday ? `${d.day}, сегодня` : d.day}
                  className={cn(
                    "display mt-1.5 text-[64px] leading-[0.8] transition-colors lg:text-[clamp(56px,5.6vw,96px)]",
                    isToday
                      ? "glow-toxic text-toxic"
                      : "text-paper lg:group-hover/day:text-toxic",
                  )}
                >
                  {d.short}
                </h4>
                <p aria-hidden className="label mt-2 text-[0.64rem] text-mute">
                  {d.day}
                </p>
              </div>
              <ul className="flex flex-1 flex-col gap-4 px-5 py-5 lg:px-4 lg:py-6 xl:px-5">
                {d.slots.map((s, k) => (
                  <li key={k} className="flex flex-col">
                    <span className="flex items-baseline justify-between gap-2">
                      <time className="display text-[34px] leading-none tabular-nums text-toxic lg:text-[clamp(26px,2.3vw,38px)]">
                        {s.time}
                      </time>
                      {s.symbol && (
                        <span
                          aria-hidden
                          className="grid h-5 min-w-6 place-items-center border border-current px-1 font-sans text-[10px] font-bold leading-none text-mute"
                        >
                          {s.symbol}
                        </span>
                      )}
                    </span>
                    <span className="mt-1.5 text-[15px] font-semibold leading-tight text-paper lg:text-[14px]">
                      {s.title}
                    </span>
                    {s.note && (
                      <span className="mt-0.5 text-[13px] leading-tight text-mute">
                        {s.note}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {/* крупный контурный номер дня внизу колонки — ритм постера и заполнение пустот */}
              <span
                aria-hidden
                className={cn(
                  "display mt-auto flex select-none items-end justify-between gap-2 px-5 pb-4 pt-6 text-[88px] leading-[0.78] text-transparent lg:px-4 lg:text-[clamp(64px,6.4vw,116px)] xl:px-5",
                  isToday
                    ? "[-webkit-text-stroke:1.5px_rgb(31_242_255/0.6)]"
                    : "[-webkit-text-stroke:1.5px_rgb(234_244_255/0.14)]",
                )}
              >
                0{i + 1}
                <Barcode
                  seed={11 + i}
                  bars={14}
                  className={cn(
                    "mb-1 h-3.5 w-10",
                    isToday ? "text-toxic/50" : "text-paper/20",
                  )}
                />
              </span>
            </motion.li>
          );
        })}
      </motion.ol>
    </div>
  );
}
