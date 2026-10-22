// Адаптация компонента 21st.dev «Stacking Cards» (danielpetho / Khoa Phan <https://www.pldkhoa.dev>).
// Что поменяно: по умолчанию слушаем скролл окна, наружу отдаём прогресс карточки
// (useStackingCardProgress) — им секция затемняет/наклоняет уходящую под стопку карточку.

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type HTMLAttributes,
  type PropsWithChildren,
} from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
  type UseScrollOptions,
} from "motion/react";

import { cn } from "@/lib/utils";

interface StackingCardsProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {
  scrollOptions?: UseScrollOptions;
  /** Насколько уменьшается каждая карточка, уходящая под следующую. */
  scaleMultiplier?: number;
  totalCards: number;
}

interface StackingCardItemProps extends HTMLAttributes<HTMLDivElement>, PropsWithChildren {
  index: number;
  /** Смещение «прилипания» карточки от верха окна, например "0px" или "6%". */
  topPosition?: string;
  innerClassName?: string;
}

const StackingCardsContext = createContext<{
  progress: MotionValue<number>;
  scaleMultiplier?: number;
  totalCards: number;
} | null>(null);

const ItemContext = createContext<{ index: number; range: [number, number] } | null>(null);

export function useStackingCardsContext() {
  const context = useContext(StackingCardsContext);
  if (!context) throw new Error("StackingCardItem must be used within StackingCards");
  return context;
}

/**
 * Прогресс конкретной карточки: 0 — карточка только прилипла, 1 — стопка закончилась.
 * Удобно для эффектов «уходящей» карточки (затемнение, наклон, blur).
 */
export function useStackingCardProgress(): { index: number; local: MotionValue<number> } {
  const ctx = useContext(ItemContext);
  if (!ctx) throw new Error("useStackingCardProgress must be used inside StackingCardItem");
  const { progress } = useStackingCardsContext();
  // считаем только у тех, кто спрашивает (раньше — у каждой карточки, даже если никто не читал)
  const local = useTransform(progress, ctx.range, [0, 1]);
  return { index: ctx.index, local };
}

export default function StackingCards({
  children,
  className,
  scrollOptions,
  scaleMultiplier,
  totalCards,
  ...props
}: StackingCardsProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    offset: ["start start", "end end"],
    ...scrollOptions,
    target: targetRef,
  });

  return (
    <StackingCardsContext.Provider value={{ progress: scrollYProgress, scaleMultiplier, totalCards }}>
      <div className={cn("relative", className)} ref={targetRef} {...props}>
        {children}
      </div>
    </StackingCardsContext.Provider>
  );
}

export function StackingCardItem({
  index,
  topPosition,
  className,
  innerClassName,
  children,
  ...props
}: StackingCardItemProps) {
  const { progress, scaleMultiplier, totalCards } = useStackingCardsContext();
  // последняя карточка не уменьшается — её никто не накрывает
  const scaleTo = 1 - (totalCards - 1 - index) * (scaleMultiplier ?? 0.03);
  const rangeScale = useMemo<[number, number]>(() => [index * (1 / totalCards), 1], [index, totalCards]);
  const scale = useTransform(progress, rangeScale, [1, scaleTo]);
  const item = useMemo(() => ({ index, range: rangeScale }), [index, rangeScale]);
  const top = topPosition ?? `${5 + index * 3}%`;

  return (
    <div className={cn("sticky top-0 h-full", className)} {...props}>
      <motion.div className={cn("relative h-full origin-top", innerClassName)} style={{ top, scale }}>
        <ItemContext.Provider value={item}>{children}</ItemContext.Provider>
      </motion.div>
    </div>
  );
}
