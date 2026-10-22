import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import type { Hall } from "@/lib/content";
import { cn } from "@/lib/utils";
import { HALL_SIZES, hallWebpSrcSet } from "./parts";

const EASE = [0.16, 1, 0.3, 1] as const;

type Word = {
  text: string;
  /** Чьё фото «просвечивает» сквозь буквы. */
  hall: Hall;
  /** Откуда влетает слово: -1 слева, 1 справа. */
  from: -1 | 1;
  position: string;
  /** Тонировка фото внутри букв и режим смешивания слоя-заливки. */
  tint: string;
  blend: "multiply" | "color";
  chip: string;
  chipClass: string;
};

/**
 * Фото для заливки букв. CSS-фон не бывает ленивым: раньше оба 1400w-файла (125 КБ) качались
 * при первой загрузке, пока секция была в 10 000px ниже. Теперь грузим, только когда заголовок
 * в ~1.5 экранах от вьюпорта, и через srcset/sizes фото ниже — браузер выбирает тот же файл,
 * что потом возьмут карточки/панели (из кэша), а на узком экране с DPR 2 это 720w.
 * До загрузки буквы залиты самим тоном (ice / toxic) — их всё равно ещё не видно.
 */
function useHallFills(ref: RefObject<HTMLElement | null>, halls: Hall[]) {
  const near = useInView(ref, { once: true, margin: "150% 0px 150% 0px" });
  const [srcs, setSrcs] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!near) return;
    let alive = true;
    const imgs = halls.map((h) => {
      const img = new Image();
      img.decoding = "async";
      img.sizes = HALL_SIZES.title;
      img.srcset = hallWebpSrcSet(h.image);
      img.onload = () => {
        const src = img.currentSrc;
        if (alive && src) setSrcs((prev) => ({ ...prev, [h.id]: src }));
      };
      return img;
    });
    return () => {
      alive = false;
      imgs.forEach((img) => (img.onload = null));
    };
  }, [near, halls]);
  return srcs;
}

/**
 * «ДВА ЗАЛА», вырезанное из фотографий самих залов: «ДВА» — светлый большой зал (айс),
 * «ЗАЛА» — тёмный малый (токсичный). Слова влетают навстречу друг другу, как два постера,
 * которые клеят встык; номера-наклейки 01/02 связывают слова с панелями ниже.
 */
export function HallsTitle({ halls, className }: { halls: Hall[]; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLHeadingElement>(null);
  const photos = useHallFills(ref, halls);
  const words: Word[] = [
    {
      text: "Два",
      hall: halls[0],
      from: -1,
      position: "38% 30%",
      tint: "var(--color-ice)",
      blend: "multiply",
      chip: `01 · ${halls[0].tag}`,
      chipClass: "bg-toxic text-ink -rotate-[4deg] shadow-[4px_4px_0_0_var(--color-ink)]",
    },
    {
      text: "зала",
      hall: halls[1],
      from: 1,
      position: "70% 42%",
      tint: "var(--color-toxic)",
      blend: "color",
      chip: `02 · ${halls[1].tag}`,
      chipClass: "bg-paper text-ink rotate-[3deg] shadow-[4px_4px_0_0_var(--color-ultra)]",
    },
  ];

  return (
    <h2
      ref={ref}
      aria-label={words.map((w) => w.text).join(" ")}
      className={cn("display flex flex-wrap items-end gap-x-[0.12em] gap-y-[0.24em] leading-[0.8] md:gap-y-[0.06em]", className)}
    >
      {words.map((w, i) => {
        const photo = photos[w.hall.id];
        const fill: CSSProperties = {
          // тонировка — слой-заливка поверх фото (color: яркость фото + оттенок цвета, дуотон без filter)
          backgroundImage: photo ? `linear-gradient(${w.tint}, ${w.tint}), url(${photo})` : `linear-gradient(${w.tint}, ${w.tint})`,
          backgroundBlendMode: photo ? `${w.blend}, normal` : "normal",
          backgroundSize: "cover, cover",
          backgroundPosition: `center, ${w.position}`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        };
        return (
          <motion.span
            key={w.text}
            aria-hidden
            className="relative inline-block"
            initial={reduce ? false : { opacity: 0, x: `${w.from * 0.32}em`, skewX: w.from * -9 }}
            whileInView={{ opacity: 1, x: "0em", skewX: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.85, delay: i * 0.08, ease: EASE }}
          >
            {/* жёсткая тень-смещение, как у наклеек: буквы «отклеиваются» от синей стены */}
            <span className="absolute inset-0 translate-x-[0.04em] translate-y-[0.045em] select-none py-[0.1em] text-ink/85 -my-[0.1em]">
              {w.text}
            </span>
            <span className="relative block py-[0.1em] -my-[0.1em]" style={fill}>
              {w.text}
            </span>
            <span
              className={cn(
                "label absolute top-[calc(100%+0.07em)] whitespace-nowrap px-2.5 py-1.5 text-[0.62rem] md:px-3 md:py-2 md:text-[0.72rem]",
                i ? "right-[0.06em]" : "left-[0.04em]",
                w.chipClass,
              )}
            >
              {w.chip}
            </span>
          </motion.span>
        );
      })}
    </h2>
  );
}
