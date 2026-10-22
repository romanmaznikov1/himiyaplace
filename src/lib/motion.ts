/**
 * Общие константы движения (см. DESIGN.md → «Движение»). Берите отсюда, а не копируйте массивы.
 *
 *   import { EASE_OUT_EXPO, SPRING_SLAP } from "@/lib/motion";
 *   transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
 */

/** Резкий старт, мягкая посадка — для всех появлений. */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
/** «Удар» — для срывов, шторок, быстрых переходов. */
export const EASE_PUNCH = [0.7, 0, 0.2, 1] as const;
/** Срыв бумаги/постера. */
export const EASE_TEAR = [0.76, 0, 0.24, 1] as const;

/** «Шлепок» наклейки. */
export const SPRING_SLAP = { type: "spring", stiffness: 400, damping: 20 } as const;
/** Мягче — для крупных карточек и полароидов. */
export const SPRING_SOFT = { type: "spring", stiffness: 260, damping: 26 } as const;

/** true, если пользователь просит меньше движения (вне React — для скролла и rAF). */
export function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * «Лёгкий» режим движения — телефоны и планшеты: тач без hover или узкий экран.
 * Там появления идут без filter: blur() (он не композитится: каждый кадр анимации — перерисовка
 * огромного размытого слоя на главном потоке, первый скролл страницы был на ~30% тяжелее),
 * а SVG-подтёки Spray нарисованы сразу. Остальное движение (сдвиг, масштаб, прозрачность) — как на десктопе.
 * Решается один раз при загрузке: поворот телефона режим не меняет.
 */
export const LITE_MOTION_QUERY = "(hover: none), (pointer: coarse), (max-width: 767px)";

export const LITE_MOTION: boolean = (() => {
  try {
    return typeof window !== "undefined" && window.matchMedia(LITE_MOTION_QUERY).matches;
  } catch {
    return false;
  }
})();

/**
 * Размытие для начального кадра появления: на десктопе `{ filter: "blur(8px)" }`, на телефоне — ничего.
 *   initial={{ opacity: 0, y: 40, ...blurFrom(8) }}  animate={{ opacity: 1, y: 0, ...blurTo() }}
 */
export const blurFrom = (px: number): { filter?: string } => (LITE_MOTION ? {} : { filter: `blur(${px}px)` });
/** Пара к blurFrom: конечное значение filter (на телефоне — ничего). */
export const blurTo = (): { filter?: string } => (LITE_MOTION ? {} : { filter: "blur(0px)" });
