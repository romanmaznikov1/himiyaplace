import type { MouseEvent, Ref } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

const SNAP = { type: "spring", stiffness: 420, damping: 22 } as const;

/**
 * Бургер-наклейка: токсичный квадрат с жёсткой тенью. Две полоски (нижняя короче)
 * сходятся в ✕, а сама плашка переворачивается в чернильную.
 */
export function Burger({
  open,
  onClick,
  ref,
  controls,
}: {
  open: boolean;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  ref?: Ref<HTMLButtonElement>;
  controls: string;
}) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls={controls}
      aria-label={open ? "Закрыть меню" : "Открыть меню"}
      className="group -mr-1 flex items-center gap-3 py-1 pl-2 pr-1 outline-offset-2"
    >
      {/* подписи сложены в одну ячейку сетки — ширина по длинной, «перекатываются» вверх */}
      <span aria-hidden className="label grid h-[1.2em] overflow-hidden text-right text-[0.66rem] leading-[1.2em]">
        <motion.span className="[grid-area:1/1] text-paper/85" initial={false} animate={{ y: open ? "-110%" : "0%" }} transition={SNAP}>
          Меню
        </motion.span>
        <motion.span
          className="[grid-area:1/1] text-toxic"
          initial={false}
          animate={{ y: open ? "0%" : "110%" }}
          transition={SNAP}
        >
          Закрыть
        </motion.span>
      </span>
      <motion.span
        aria-hidden
        className={cn(
          "relative grid size-11 place-items-center transition-[background-color,color,box-shadow] duration-200",
          open
            ? "bg-ink text-toxic shadow-[3px_3px_0_0_var(--color-toxic)]"
            : "bg-toxic text-ink shadow-[3px_3px_0_0_var(--color-cobalt)] group-active:shadow-none",
        )}
        initial={false}
        animate={{ rotate: open ? 4 : -4 }}
        transition={SNAP}
      >
        <motion.span
          className="absolute h-[2.5px] w-[22px] bg-current"
          initial={false}
          animate={open ? { y: 0, rotate: 45, scaleX: 1 } : { y: -4, rotate: 0, scaleX: 1 }}
          transition={SNAP}
        />
        <motion.span
          className="absolute h-[2.5px] w-[22px] bg-current"
          initial={false}
          // короткая нижняя полоска прижата вправо: сдвиг = (22 − 22·0.62) / 2
          animate={open ? { x: 0, y: 0, rotate: -45, scaleX: 1 } : { x: 4.2, y: 4, rotate: 0, scaleX: 0.62 }}
          transition={SNAP}
        />
      </motion.span>
    </button>
  );
}
