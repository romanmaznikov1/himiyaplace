import { useRef, type CSSProperties } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import { Duotone } from "@/components/ui/loop-video";
import { tornClipPath } from "@/components/ui/torn-edge";
import { cn } from "@/lib/utils";

/**
 * Полароид, «прилепленный» скотчем между строк заголовка: квадратный кадр в духе настоящей
 * плёнки, ч/б снимок в фирменном дуотоне (кобальт → лёд), подпись маркером внизу.
 * Появляется шлепком (пружина из поворота и увеличения), на скролле слегка плывёт и докручивается.
 */
export function Polaroid({
  src,
  alt,
  title,
  caption,
  rotate = -8,
  position = "50% 50%",
  zoom = 1,
  width = 1280,
  height = 720,
  className,
}: {
  src: string;
  alt: string;
  /** Собственный размер файла (для width/height у img — без сдвига вёрстки). */
  width?: number;
  height?: number;
  title: string;
  caption?: string;
  rotate?: number;
  /** object-position кадра внутри квадрата */
  position?: string;
  /** Доп. увеличение кадра (широкий кадр в квадрате показывает всю высоту — так можно срезать край). */
  zoom?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [50, -70]);
  const spin = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-3, 4]);

  return (
    // параллакс и докрутка идут каждый кадр скролла — фигура и кадр на своих слоях (will-change),
    // иначе фото с дуотоном, тенью и полутоном перерисовывалось бы целиком
    <motion.figure
      ref={ref}
      style={reduce ? { y } : { y, willChange: "transform" }}
      className={cn("relative", className)}
    >
      <motion.div
        initial={
          reduce
            ? { opacity: 0 }
            : { opacity: 0, scale: 1.45, rotate: rotate - 16, y: -40 }
        }
        whileInView={{ opacity: 1, scale: 1, rotate, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={
          reduce
            ? { duration: 0.3 }
            : {
                type: "spring",
                stiffness: 400,
                damping: 19,
                mass: 0.9,
                delay: 0.25,
              }
        }
        className="relative"
      >
        <motion.div
          style={reduce ? { rotate: spin } : { rotate: spin, willChange: "transform" }}
          className="group/pol relative bg-paper p-[5%] pb-[22%] shadow-[10px_14px_0_0_var(--color-ink),0_30px_60px_-20px_rgb(3_6_13/0.55)] transition-transform duration-500 ease-out-expo hover:scale-[1.03]"
        >
          <Duotone
            shadow="var(--color-cobalt-deep)"
            highlight="var(--color-paper)"
            className="aspect-square bg-cobalt"
          >
            <img
              src={src}
              width={width}
              height={height}
              alt={alt}
              loading="lazy"
              decoding="async"
              draggable={false}
              style={
                {
                  objectPosition: position,
                  transformOrigin: position,
                  "--z": zoom,
                } as CSSProperties
              }
              className="brightness-[1.45] contrast-[1.1] transition-[scale] duration-700 ease-out-expo [scale:var(--z)] group-hover/pol:[scale:calc(var(--z)*1.05)]"
            />
          </Duotone>
          {/* полутон по низу фото — печатная фактура */}
          <div
            aria-hidden
            className="halftone pointer-events-none absolute inset-x-[5%] top-[5%] aspect-square text-ink/25 [--dot:5px] [mask-image:linear-gradient(to_top,#000,transparent_45%)]"
          />
          {/* ≤359px: подпись плотнее (заголовок, зазор, трекинг) — каждое слово подписи целиком в своей строке */}
          <figcaption className="absolute inset-x-[5%] bottom-0 flex h-[22%] items-center justify-between gap-3 text-ink max-[359px]:gap-2">
            <span className="display shrink-0 text-[clamp(20px,2.2vw,32px)] leading-none max-[359px]:text-[18px]">
              {title}
            </span>
            {caption && (
              <span className="label line-clamp-2 min-w-0 text-right text-[0.66rem] leading-[1.25] tracking-[0.08em] text-ink/65 max-[359px]:tracking-[0.04em]">
                {caption}
              </span>
            )}
          </figcaption>
        </motion.div>

        {/* полоска полупрозрачного скотча с рваными концами */}
        <span
          aria-hidden
          className="absolute -top-[5%] left-1/2 h-[9%] w-[46%] -translate-x-1/2 rotate-[5deg] bg-ice/75 shadow-[0_4px_10px_-4px_rgb(3_6_13/0.4)] backdrop-blur-[1px]"
          style={{
            clipPath: tornClipPath(11, { left: true, right: true }, 6, 12),
          }}
        />
      </motion.div>
    </motion.figure>
  );
}
