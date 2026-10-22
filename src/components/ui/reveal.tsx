import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

import { blurFrom, blurTo } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Появление блока при скролле. Варианты:
 *  - "rise"  — снизу вверх из лёгкого размытия
 *  - "slap"  — «шлепок» наклейки: из увеличения и поворота, с пружиной
 *  - "whip"  — рывок сбоку с размытием движения
 * На телефонах (LITE_MOTION) — те же движения без filter: blur(): размытие не композитится
 * и перерисовывало блок каждый кадр, пока он въезжал.
 */
type Kind = "rise" | "slap" | "whip";

const presets: Record<Kind, { initial: Record<string, number | string>; animate: Record<string, number | string>; transition: object }> = {
  rise: {
    initial: { opacity: 0, y: 40, ...blurFrom(8) },
    animate: { opacity: 1, y: 0, ...blurTo() },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
  slap: {
    initial: { opacity: 0, scale: 1.35, rotate: -8 },
    animate: { opacity: 1, scale: 1, rotate: 0 },
    transition: { type: "spring", stiffness: 420, damping: 18, mass: 0.8 },
  },
  whip: {
    initial: { opacity: 0, x: -80, skewX: -12, ...blurFrom(10) },
    animate: { opacity: 1, x: 0, skewX: 0, ...blurTo() },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

export function Reveal({
  children,
  kind = "rise",
  delay = 0,
  className,
  amount = 0.25,
  as = "div",
}: {
  children: ReactNode;
  kind?: Kind;
  delay?: number;
  className?: string;
  amount?: number;
  as?: "div" | "span" | "li" | "article";
}) {
  const reduce = useReducedMotion();
  const p = presets[kind];
  const Comp = motion[as];
  if (reduce) return <Comp className={className}>{children}</Comp>;
  return (
    <Comp
      className={cn(className)}
      initial={p.initial}
      whileInView={p.animate}
      viewport={{ once: true, amount }}
      transition={{ ...p.transition, delay }}
    >
      {children}
    </Comp>
  );
}
