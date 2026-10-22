import { useEffect, useRef, type ReactNode } from "react";
import { cancelFrame, frame, motion, useMotionValue, useReducedMotion, useTransform, type FrameData } from "motion/react";

import { useInViewport } from "@/hooks/useInViewport";
import { useScrollVelocity } from "@/hooks/useScrollVelocity";
import { cn, wrap } from "@/lib/utils";

/**
 * Бегущая строка, которая разгоняется и меняет направление от скорости скролла
 * (по мотивам 21st.dev «Scroll Velocity Text»). Плюс лёгкий перекос по скорости — ощущение импульса.
 *
 *   <VelocityMarquee baseVelocity={-3}>ХИП-ХОП ✕ ХАЙ ХИЛС ✕ КОНТЕМП ✕ ЭЛЕКТРО ✕</VelocityMarquee>
 *
 * Покадровый колбэк и перекос подписаны на кадры motion только пока строка у экрана и не `paused`:
 * раньше useAnimationFrame держал цикл кадров живым всегда (60 вызовов в секунду на каждую строку
 * в простое), а перекос писал стили в строки далеко за экраном при любом скролле.
 * Дорожка — на своём слое (will-change), пока бежит: сдвиг не перерисовывает огромный текст.
 */
type Props = {
  children: ReactNode;
  /** %-ширины за секунду; знак задаёт направление. */
  baseVelocity?: number;
  className?: string;
  itemClassName?: string;
  /** Перекашивать строку по скорости скролла. */
  skew?: boolean;
  copies?: number;
  /** Стоп: строка у экрана, но накрыта следующей секцией/панелью (IntersectionObserver этого не видит). */
  paused?: boolean;
};

export function VelocityMarquee({ children, baseVelocity = 3, className, itemClassName, skew = true, copies = 4, paused = false }: Props) {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  // вне экрана (с запасом) и на паузе — ни кадров, ни подписки на скорость скролла
  const near = useInViewport(root, "200px 0px");
  const active = near && !paused && !reduce;
  const baseX = useMotionValue(0);
  // общая на страницу пружина скорости скролла (см. useScrollVelocity)
  const smooth = useScrollVelocity({ damping: 50, stiffness: 400 }, active);
  const factor = useTransform(smooth, [0, 1000], [0, 4], { clamp: false });
  const skewX = useTransform(smooth, [-3000, 0, 3000], [10, 0, -10], { clamp: true });
  const x = useTransform(baseX, (v) => `${wrap(-100 / copies, 0, v)}%`);
  const dir = useRef(1);

  useEffect(() => {
    if (!active) return;
    const tick = ({ delta }: FrameData) => {
      let moveBy = dir.current * baseVelocity * (delta / 1000);
      const f = factor.get();
      if (f < 0) dir.current = -1;
      else if (f > 0) dir.current = 1;
      moveBy += dir.current * moveBy * f;
      baseX.set(baseX.get() + moveBy);
    };
    frame.update(tick, true);
    return () => cancelFrame(tick);
  }, [active, baseVelocity, baseX, factor]);

  return (
    <div ref={root} className={cn("flex overflow-hidden whitespace-nowrap", className)}>
      <motion.div
        className="flex w-max flex-nowrap"
        style={{ x, skewX: skew && !reduce ? skewX : 0, willChange: active ? "transform" : undefined }}
      >
        {Array.from({ length: copies }).map((_, i) => (
          <span key={i} aria-hidden={i > 0} className={cn("block shrink-0 pr-[0.35em]", itemClassName)}>
            {children}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
