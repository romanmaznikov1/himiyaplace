import { frame, motionValue, springValue, type MotionValue, type SpringOptions } from "motion/react";

/**
 * Одна сглаженная скорость скролла окна на всю страницу.
 * Раньше каждый MotionBlurTitle / VelocityMarquee держал свою цепочку useScroll → useVelocity → useSpring
 * (≈ 20 одинаковых пружин на один scrollY); теперь все берут общее значение и строят из него
 * свои useTransform. Пружины кэшируются по настройкам.
 *
 *   const v = useScrollVelocity();                       // px/с, сглаженная
 *   const skewX = useTransform(v, [-2500, 0, 2500], [7, 0, -7], { clamp: true });
 */
let raw: MotionValue<number> | null = null;
const springs = new Map<string, MotionValue<number>>();

/** Значение, которое никогда не меняется, — для выключенных эффектов (хуки нельзя звать условно). */
export const STILL: MotionValue<number> = motionValue(0);

function rawVelocity(): MotionValue<number> {
  if (raw) return raw;
  const velocity = motionValue(0);
  raw = velocity;
  if (typeof window === "undefined") return velocity;

  const y = motionValue(window.scrollY);
  const update = () => {
    const latest = y.getVelocity();
    velocity.set(latest);
    // пока скорость не погасла — проверяем каждый кадр (как useVelocity)
    if (latest) frame.update(update);
  };
  y.on("change", () => frame.update(update, false, true));
  // scrollY читаем не в самом событии, а в фазе read кадра motion (как useScroll): чтение прямо в scroll-событии
  // синхронно пересчитывало стили всей страницы, если кто-то успел что-то записать (≈1.7 мс на кадр на телефоне)
  let pending = false;
  const read = () => {
    pending = false;
    y.set(window.scrollY);
  };
  window.addEventListener(
    "scroll",
    () => {
      if (pending) return;
      pending = true;
      frame.read(read);
    },
    { passive: true },
  );
  return velocity;
}

export const DEFAULT_SCROLL_SPRING: SpringOptions = { damping: 50, stiffness: 400 };

export function scrollVelocity(options: SpringOptions = DEFAULT_SCROLL_SPRING): MotionValue<number> {
  const key = `${options.damping ?? ""}/${options.stiffness ?? ""}/${options.mass ?? ""}`;
  let s = springs.get(key);
  if (!s) {
    s = springValue(rawVelocity(), options);
    springs.set(key, s);
  }
  return s;
}

/**
 * Хук-обёртка: общий сглаженный MotionValue скорости скролла (px/с).
 * `enabled = false` возвращает неподвижный STILL — подписки и пересчётов нет.
 */
export function useScrollVelocity(options?: SpringOptions, enabled = true): MotionValue<number> {
  return enabled ? scrollVelocity(options) : STILL;
}
