import { motion, useReducedMotion } from "motion/react";

import { Chevrons } from "@/components/ui/chevrons";
import type { Hall } from "@/lib/content";
import { cn } from "@/lib/utils";
import { FeatureChips, HALL_SIZES, HallPhoto, OutlineNumber, TapePiece, TornFrame } from "./parts";

const EASE = [0.16, 1, 0.3, 1] as const;

const LOOK = [
  {
    seed: 71,
    tilt: -1.2,
    wrap: "mr-5 md:mr-0",
    number: "left-3",
    tag: "right-4 rotate-[-3deg]",
    tapes: [
      { seed: 21, tone: "toxic" as const, rotate: 36, className: "-right-7 -top-1 h-7 w-32" },
      { seed: 22, tone: "ice" as const, rotate: 30, className: "-left-9 bottom-6 h-7 w-28" },
    ],
  },
  {
    seed: 83,
    tilt: 1.1,
    wrap: "ml-5 md:ml-0 md:mt-32",
    number: "right-3",
    tag: "left-4 rotate-[2deg]",
    tapes: [
      { seed: 23, tone: "ice" as const, rotate: -34, className: "-left-7 -top-1 h-7 w-32" },
      { seed: 24, tone: "toxic" as const, rotate: -30, className: "-right-9 bottom-6 h-7 w-28" },
    ],
  },
];

/** Мобильная/планшетная карточка зала: фото 4:3 с рваной кромкой и скотчем, текст под фото. */
export function HallCard({ hall, index }: { hall: Hall; index: number }) {
  const reduce = useReducedMotion();
  const look = LOOK[index % LOOK.length];
  const number = String(index + 1).padStart(2, "0");

  return (
    <article className={cn("relative", look.wrap)} data-hall-card={hall.id}>
      <motion.div
        className="relative aspect-[4/3]"
        style={{ rotate: look.tilt }}
        initial={reduce ? false : { opacity: 0, y: 60, rotate: look.tilt * 4 }}
        whileInView={{ opacity: 1, y: 0, rotate: look.tilt }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.85, ease: EASE }}
      >
        <TornFrame seed={look.seed} className="absolute inset-0" offset={8}>
          <HallPhoto hall={hall} sizes={HALL_SIZES.card} />
        </TornFrame>
        <OutlineNumber
          number={number}
          className={cn("absolute -top-[0.5em] z-10 text-[clamp(96px,26vw,150px)] text-paper", look.number)}
        />
        {look.tapes.map((t) => (
          <TapePiece key={t.seed} {...t} />
        ))}
        <span className={cn("label absolute -bottom-4 z-10 bg-toxic px-3 py-2 text-ink shadow-[4px_4px_0_0_var(--color-ink)]", look.tag)}>
          {hall.tag}
        </span>
      </motion.div>

      <div className="relative mt-10 px-1">
        <h3>
          <span className="label flex items-center gap-3 text-toxic">
            <Chevrons count={4} bpm={110} size="0.75rem" />
            Зал {number}
          </span>
          <span className="sr-only"> — {hall.tag}. </span>
          <span className="display mt-3 block text-[clamp(48px,13vw,72px)] leading-[0.92] text-paper">{hall.title}</span>
        </h3>
        <p className="mt-4 max-w-md text-base leading-relaxed text-paper/85">{hall.description}</p>
        <FeatureChips features={hall.features} className="mt-6" />
      </div>
    </article>
  );
}
