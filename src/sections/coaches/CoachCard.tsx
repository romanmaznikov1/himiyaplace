import { useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";

import { Duotone } from "@/components/ui/loop-video";
import { Tape } from "@/components/ui/tape";
import { tornClipPath } from "@/components/ui/torn-edge";
import { useMedia } from "@/hooks/useMedia";
import type { Coach } from "@/lib/content";
import { cn } from "@/lib/utils";

import type { Tile } from "./tiles";
import { blurFrom, blurTo } from "@/lib/motion";

/** Фото тренера: webp 560/1000 + jpg-запасной. */
export function CoachPicture({
  coach,
  sizes,
  className,
  alt,
}: {
  coach: Coach;
  sizes: string;
  className?: string;
  alt: string;
}) {
  return (
    <picture>
      <source type="image/webp" srcSet={`${coach.photo.webp560} 560w, ${coach.photo.webp720} 720w, ${coach.photo.webp1000} 1000w`} sizes={sizes} />
      <img
        src={coach.photo.jpg}
        width={1000}
        height={1250}
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable={false}
        className={className}
      />
    </picture>
  );
}

export const PlayGlyph = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden className={className}>
    <path d="M7 4.5v15l12.5-7.5z" fill="currentColor" />
  </svg>
);

/** «Бросок на стол»: из наклона, снизу и из размытия — пружиной в свой наклон. */
const throwIn: Variants = {
  hidden: ({ tile, reduce }: { tile: Tile; reduce: boolean }) =>
    reduce ? { opacity: 0 } : { opacity: 0, y: 120, rotate: tile.throwRot, scale: 1.1, ...blurFrom(8) },
  shown: ({ tile, reduce }: { tile: Tile; reduce: boolean }) => {
    const delay = tile.order * 0.09;
    return {
      opacity: 1,
      y: 0,
      rotate: tile.rot,
      scale: 1,
      ...blurTo(),
      transition: reduce
        ? { duration: 0.4 }
        : {
            type: "spring",
            stiffness: 230,
            damping: 19,
            mass: 0.9,
            delay,
            opacity: { duration: 0.25, delay },
            filter: { duration: 0.5, delay },
          },
    };
  },
};

const spring = { type: "spring", stiffness: 400, damping: 22 } as const;

/**
 * Ширина плитки = половина/вся строка коллажа минус поля px-5 / md:px-10 (зазора в сетке нет).
 * Честный sizes важен на телефоне: с «50vw» при DPR 3 браузер брал 1000w для плиток в 175px.
 */
const SIZES_FEATURE = "(min-width: 1024px) 38vw, (min-width: 768px) calc(100vw - 80px), calc(100vw - 40px)";
const SIZES_TILE = "(min-width: 1024px) 32vw, (min-width: 768px) calc(50vw - 40px), calc(50vw - 20px)";

type Props = {
  coach: Coach;
  tile: Tile;
  onOpen: (id: Coach["id"]) => void;
};

/**
 * Портрет в коллаже: чистое фото «под обрез», из текста — только имя и стиль внизу.
 * Что карточка открывает интервью, подсказывают шапка секции, маленькая кнопка ▶ и ховер (вспышка + лента).
 */
export function CoachCard({ coach, tile, onOpen }: Props) {
  const reduce = !!useReducedMotion();
  // вспышка-дуотон живёт только на ховере мышью: на тач-экранах её копия фото (560w) не нужна вовсе
  const canHover = useMedia("(hover: hover) and (pointer: fine)");
  const [on, setOn] = useState(false);
  const [lead, ...restRoles] = coach.role.split(" · ");
  const founder = lead.startsWith("Основатель");
  const chips = founder ? restRoles : [lead, ...restRoles];
  const surname = coach.name.split(" ").slice(1).join(" ");

  return (
    <motion.div
      className={cn("relative @container", tile.className)}
      style={{ zIndex: on ? 9 : tile.z }}
      custom={{ tile, reduce }}
      variants={throwIn}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.2 }}
    >
      <motion.article
        data-coach={coach.id}
        data-cursor="hover"
        data-cursor-label="Смотреть"
        className="relative"
        animate={on ? "hover" : "rest"}
        variants={{ rest: { rotate: 0, scale: 1 }, hover: { rotate: -tile.rot, scale: 1.03 } }}
        transition={spring}
        onHoverStart={() => setOn(true)}
        onHoverEnd={() => setOn(false)}
      >
        {/* фото с рваной кромкой */}
        <div
          className={cn(
            "relative aspect-[4/5] overflow-hidden bg-cobalt shadow-[0_40px_60px_-28px_rgb(0_0_0/0.9)]",
            tile.feature && "sm:max-lg:aspect-[5/4]",
          )}
          style={{ clipPath: tornClipPath(tile.seed, tile.edges, 1.8, 28) }}
        >
          <CoachPicture
            coach={coach}
            alt={`${coach.name} — тренер школы танцев «Химия», ${coach.role}`}
            sizes={tile.feature ? SIZES_FEATURE : SIZES_TILE}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)]",
              tile.feature ? "object-[50%_22%]" : "object-[50%_18%]",
              on && "scale-[1.06]",
            )}
          />

          {/* быстрая токсичная вспышка-дуотон при наведении (только мышь) */}
          {canHover && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              variants={{
                rest: { opacity: 0, transition: { duration: 0.2 } },
                hover: { opacity: [0, 1, 0.12], transition: { duration: 0.6, times: [0, 0.2, 1], ease: "easeOut" } },
              }}
            >
              <Duotone className="absolute inset-0" highlight="var(--color-toxic)" shadow="var(--color-ultra)">
                <img
                  src={coach.photo.webp560}
                  alt=""
                  width={560}
                  height={700}
                  loading="lazy"
                  decoding="async"
                  className={tile.feature ? "object-[50%_22%]" : "object-[50%_18%]"}
                />
              </Duotone>
            </motion.div>
          )}

          {/* затемнение под имя */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-linear-to-t from-ink/90 via-ink/45 to-transparent" />
          <div aria-hidden className="halftone halftone-fade pointer-events-none absolute -bottom-[20%] -left-[20%] h-[60%] w-[80%] text-ink/25 [--dot:6px]" />

          {/* ▶ — единственная метка на фото. На тач-экранах видна всегда (ховера нет),
              на десктопе с мышью появляется на наведении: там коллаж внахлёст и про видео
              говорят шапка, курсор «Смотреть» и лента.
              Размытие подложки — только с мышью: на телефоне это 5 лишних backdrop-слоёв поверх фото,
              плотная заливка читается так же */}
          <span
            aria-hidden
            className={cn(
              "absolute right-[4.5cqw] top-[4.5cqw] grid size-8 place-items-center rounded-full transition-[background-color,color,opacity,scale] duration-300 ease-[var(--ease-snap)] pointer-fine:backdrop-blur-[3px] @min-[300px]:size-10",
              on
                ? "bg-toxic text-ink"
                : "bg-ink/65 text-paper ring-1 ring-paper/35 pointer-fine:bg-ink/55 lg:pointer-fine:scale-50 lg:pointer-fine:opacity-0",
            )}
          >
            <span className={cn("grid place-items-center", on && "animate-beat")} style={{ "--bpm": 95, "--beat-scale": 1.18 } as CSSProperties}>
              <PlayGlyph className="size-3.5 translate-x-[1px] @min-[300px]:size-4" />
            </span>
          </span>

          {/* имя + стиль — всё внизу, лицо свободно */}
          <div className="absolute inset-x-0 bottom-0 px-[5cqw] pb-[5cqw]">
            <h3>
              <span
                className={cn(
                  "display block text-paper",
                  tile.feature ? "text-[clamp(52px,24cqw,168px)] sm:max-lg:text-[16cqw]" : "text-[clamp(34px,21cqw,136px)]",
                )}
              >
                {coach.firstName}
              </span>{" "}
              <span className="label mt-[0.6em] block text-paper/75">{surname}</span>
            </h3>
            {chips.length > 0 && (
              <p className="label mt-1.5 text-[0.7rem] leading-snug text-toxic [text-shadow:0_1px_10px_rgb(3_6_13/0.95),0_0_2px_rgb(3_6_13/0.8)] @min-[300px]:mt-2 @min-[300px]:text-[0.74rem]">
                {chips.join(" · ")}
              </p>
            )}
          </div>
        </div>

        {/* лента с именем «наклеивается» поперёк карточки: раскатывается вдоль своей оси */}
        <AnimatePresence>
          {on && !reduce && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -left-[7%] top-[42%] z-[2] w-[114%]"
              style={{ rotate: -7 }}
              initial={{ clipPath: "inset(0 100% 0 0)", x: -24 }}
              animate={{ clipPath: "inset(0 0% 0 0%)", x: 0 }}
              exit={{ clipPath: "inset(0 0% 0 100%)", x: 24, transition: { duration: 0.3, ease: [0.7, 0, 0.2, 1] } }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <Tape text={[coach.firstName, "Смотреть интервью"]} variant="toxic" speed={7} textClassName="text-[clamp(16px,7cqw,34px)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {founder && (
          <span
            aria-hidden
            className="label pointer-events-none absolute -left-2 -top-3 z-[2] rotate-[-6deg] bg-toxic px-3 py-2 text-ink shadow-[4px_4px_0_0_var(--color-cobalt)] lg:-left-4 lg:-top-4"
          >
            {lead}
          </span>
        )}

        {/* вся карточка — кнопка, открывающая интервью */}
        <button
          type="button"
          aria-haspopup="dialog"
          aria-label={`${coach.name}: смотреть интервью и подробнее`}
          className="absolute inset-0 z-[3] cursor-pointer outline-offset-4"
          onClick={() => onOpen(coach.id)}
          onFocus={(e) => e.currentTarget.matches(":focus-visible") && setOn(true)}
          onBlur={() => setOn(false)}
        />
      </motion.article>
    </motion.div>
  );
}
