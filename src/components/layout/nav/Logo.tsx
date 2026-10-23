import type { MouseEvent } from "react";
import { motion } from "motion/react";

import { MEDIA } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * Маленький логотип в баре. На десктопе над верхом hero спрятан (там гигантский логотип),
 * дальше «шлёпается» наклейкой: из увеличения и поворота, на пружине. На телефоне — плоский (flat) и виден всегда.
 * Подтёки свисают ниже бара — поверх нижней линии.
 */
export function Logo({
  show,
  flat = false,
  onClick,
  className,
  imgClassName,
}: {
  show: boolean;
  /** Плоский логотип с подтёками (flat_logo) вместо объёмного */
  flat?: boolean;
  onClick: (e: MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <a
      href="#top"
      onClick={onClick}
      aria-label="Химия — наверх"
      aria-hidden={!show}
      tabIndex={show ? undefined : -1}
      className={cn("relative block outline-offset-4", !show && "pointer-events-none", className)}
    >
      <motion.span
        className="block origin-[50%_40%]"
        initial={false}
        animate={
          show
            ? { opacity: 1, scale: 1, rotate: -3, y: 0 }
            : { opacity: 0, scale: 1.7, rotate: -16, y: -10 }
        }
        transition={show ? { type: "spring", stiffness: 420, damping: 17, mass: 0.8 } : { duration: 0.22, ease: [0.7, 0, 0.2, 1] }}
      >
        {flat ? (
          <picture>
            <source type="image/webp" srcSet={`${MEDIA.logoFlat.w240} 240w, ${MEDIA.logoFlat.w640} 640w`} sizes="88px" />
            <img
              src={MEDIA.logoFlat.smallPng}
              width={1551}
              height={845}
              alt=""
              decoding="async"
              draggable={false}
              className={cn("block h-auto select-none", imgClassName)}
            />
          </picture>
        ) : (
          <picture>
            <source srcSet={MEDIA.logoStatic.small} type="image/webp" />
            <img
              src={MEDIA.logoStatic.smallPng}
              width={320}
              height={189}
              alt=""
              decoding="async"
              draggable={false}
              className={cn("block h-auto select-none drop-shadow-[0_6px_14px_rgb(15_195_248/0.35)]", imgClassName)}
            />
          </picture>
        )}
      </motion.span>
    </a>
  );
}
