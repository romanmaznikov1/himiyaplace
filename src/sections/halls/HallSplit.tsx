import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { Chevrons } from "@/components/ui/chevrons";
import type { Hall } from "@/lib/content";
import { cn } from "@/lib/utils";
import { FeatureChips, HALL_SIZES, HallPhoto, HallTicket, OutlineNumber, TapePiece, TornFrame } from "./parts";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Настройки «наклейки» каждой панели: поворот, рванина, скотч по углам, кадрирование фото. */
const LOOK = [
  {
    rotate: -0.8,
    seed: 41,
    position: "42% 50%",
    tapes: [
      { seed: 3, tone: "toxic" as const, rotate: 40, className: "-right-5 -top-1 h-9 w-40" },
      { seed: 8, tone: "ice" as const, rotate: 36, className: "-left-14 bottom-3 h-9 w-36" },
    ],
  },
  {
    rotate: 0.7,
    seed: 57,
    position: "62% 50%",
    tapes: [
      { seed: 5, tone: "ice" as const, rotate: 42, className: "-right-10 top-2 h-9 w-44" },
      { seed: 12, tone: "toxic" as const, rotate: -38, className: "-right-12 bottom-3 h-9 w-40" },
    ],
  },
];

/**
 * Десктоп: два высоких постера рядом. Наведение/фокус/клик по кнопке панели раскрывает её (~64/36),
 * свёрнутая показывает только вертикальную подпись. Фото не масштабируется при раскрытии —
 * слой фиксированной ширины (66cqw) просто открывается, как окно.
 */
export function HallSplit({ halls }: { halls: Hall[] }) {
  const [active, setActive] = useState(0);
  return (
    <div className="@container relative flex h-[clamp(560px,76svh,780px)] gap-5 xl:gap-7">
      {halls.map((hall, i) => (
        <SplitPanel key={hall.id} hall={hall} index={i} active={active === i} onActivate={() => setActive(i)} />
      ))}
    </div>
  );
}

function SplitPanel({
  hall,
  index,
  active,
  onActivate,
}: {
  hall: Hall;
  index: number;
  active: boolean;
  onActivate: () => void;
}) {
  const reduce = useReducedMotion();
  const look = LOOK[index % LOOK.length];
  const number = String(index + 1).padStart(2, "0");
  const titleId = `hall-${hall.id}-title`;
  const contentId = `hall-${hall.id}-content`;

  return (
    <motion.article
      aria-labelledby={titleId}
      data-hall={hall.id}
      data-cursor="hover"
      onMouseEnter={onActivate}
      className="group/panel relative min-w-0"
      initial={false}
      animate={{ flexGrow: active ? 64 : 36 }}
      transition={{ duration: 0.85, ease: EASE }}
      style={{ flexBasis: 0, rotate: look.rotate }}
    >
      {/* «приклеивание» на стену при появлении: стартует, как только край панели показался */}
      <motion.div
        className="absolute inset-0"
        initial={reduce ? false : { opacity: 0, y: 90, rotate: index ? 4 : -4 }}
        whileInView={{ opacity: 1, y: 0, rotate: 0 }}
        viewport={{ once: true, amount: 0.05 }}
        transition={{ duration: 0.9, delay: index * 0.12, ease: EASE }}
      >
        <TornFrame seed={look.seed} className="absolute inset-0">
          <HallPhoto
            hall={hall}
            sizes={HALL_SIZES.split}
            position={look.position}
            layerClassName="left-1/2 right-auto w-[66cqw] -translate-x-1/2"
            imgClassName="transition-transform duration-[1200ms] ease-[var(--ease-out-expo)] group-hover/panel:scale-[1.035]"
          />

          {/* свёрнутая панель чуть притушена, раскрытая — градиент под текст */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-ink/40"
            initial={false}
            animate={{ opacity: active ? 0 : 1 }}
            transition={{ duration: 0.6 }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(3_6_13/0.9)_0%,rgb(3_6_13/0.55)_30%,rgb(3_6_13/0)_62%)]"
          />

          {/* раскрытое содержимое: фиксированная ширина, чтобы текст не переносился во время анимации */}
          <motion.div
            id={contentId}
            aria-hidden={!active}
            className="absolute bottom-0 left-0 w-[min(44rem,52cqw)] p-10 pb-12 xl:p-12 xl:pb-14"
            initial={false}
            animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
            transition={active ? { duration: 0.7, delay: 0.18, ease: EASE } : { duration: 0.25 }}
          >
            <h3 id={titleId}>
              <span className="label inline-flex rotate-[-2deg] items-center gap-2.5 bg-toxic px-3 py-2 text-ink shadow-[4px_4px_0_0_var(--color-ink)]">
                <Chevrons count={3} bpm={110} size="0.7rem" />
                {hall.tag} · {number}
              </span>
              <span className="display mt-5 block text-[clamp(56px,5.4vw,100px)] leading-[0.92] text-paper [text-shadow:0_4px_30px_rgb(3_6_13/0.45)]">
                {hall.title}
              </span>
            </h3>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-paper/90 [text-shadow:0_1px_12px_rgb(3_6_13/0.6)]">{hall.description}</p>
            <FeatureChips features={hall.features} on={active} className="mt-7" />
          </motion.div>

          {/* свёрнутое состояние: подпись вертикально + круглая наклейка «открыть» */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            initial={false}
            animate={{ opacity: active ? 0 : 1 }}
            transition={{ duration: active ? 0.2 : 0.5, delay: active ? 0 : 0.25 }}
          >
            <span className="display absolute bottom-16 left-8 rotate-180 whitespace-nowrap text-[clamp(64px,5.6vw,96px)] text-paper [writing-mode:vertical-rl]">
              {hall.tag}
            </span>
            <span className="absolute bottom-24 right-10 grid size-16 place-items-center rounded-full bg-toxic text-ink shadow-[4px_4px_0_0_var(--color-ink)] transition-transform duration-300 group-hover/panel:rotate-90">
              <svg viewBox="0 0 24 24" className="size-6" fill="none">
                <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
              </svg>
            </span>
          </motion.div>

          <motion.div
            className="absolute bottom-12 right-10 hidden xl:block"
            initial={false}
            animate={active ? { opacity: 1, rotate: 4, y: 0 } : { opacity: 0, rotate: 12, y: 20 }}
            transition={active ? { type: "spring", stiffness: 380, damping: 20, delay: 0.4 } : { duration: 0.2 }}
          >
            <HallTicket number={number} seed={look.seed} />
          </motion.div>
        </TornFrame>

        <OutlineNumber
          number={number}
          filled={active}
          className={cn(
            "absolute -top-[0.42em] z-10 text-[clamp(150px,13vw,230px)]",
            index ? "left-12" : "left-6",
            active ? "text-toxic" : "text-paper",
          )}
        />
        {look.tapes.map((t) => (
          <TapePiece key={t.seed} {...t} delay={index * 0.12} />
        ))}
      </motion.div>

      {/* Настоящая кнопка-раскрывашка поверх всей панели: Tab/Enter/Space, aria-expanded для скринридеров.
          Фокус раскрывает панель сразу (как наведение), клик — то же для тача и мыши. */}
      <button
        type="button"
        aria-expanded={active}
        aria-controls={contentId}
        onFocus={onActivate}
        onClick={onActivate}
        className="absolute inset-0 z-30 cursor-pointer focus-visible:outline-offset-[10px]"
      >
        <span className="sr-only">{hall.tag}</span>
      </button>
    </motion.article>
  );
}
