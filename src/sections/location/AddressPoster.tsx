import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "motion/react";

import { Spray } from "@/components/ui/spray";
import { CONTACTS } from "@/lib/content";
import { cn } from "@/lib/utils";
import { blurFrom, blurTo } from "@/lib/motion";

/**
 * Гигантский адрес-постер: «КУЛАКОВА, 29Д» в полный рост, номер дома — подсвеченный.
 * Буквы влетают рывком из размытия (whip), строка потом едет по скорости скролла.
 */
const char: Variants = {
  hidden: { opacity: 0, x: "-0.55em", skewX: -28, ...blurFrom(10) },
  shown: (d: number) => ({
    opacity: 1,
    x: "0em",
    skewX: 0,
    ...blurTo(),
    transition: { duration: 0.75, delay: d, ease: [0.16, 1, 0.3, 1] },
    // после рывка снимаем фильтр совсем: blur(0px) на каждой букве — лишние эффект-узлы при отрисовке
    transitionEnd: { filter: "none" },
  }),
};

function Whip({
  text,
  delay = 0,
  className,
  step = 0.035,
}: {
  text: string;
  delay?: number;
  className?: string;
  step?: number;
}) {
  return (
    <span
      aria-hidden
      className={cn("inline-flex whitespace-nowrap", className)}
    >
      {Array.from(text).map((ch, i) => (
        <motion.span
          key={i}
          custom={delay + i * step}
          variants={char}
          className="inline-block"
          style={{ transformOrigin: "0% 100%" }}
        >
          {ch === " " ? " " : ch}
        </motion.span>
      ))}
    </span>
  );
}

export function AddressPoster({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const xB = useTransform(scrollYProgress, [0, 1], ["1.5%", "-3%"]);

  // «Кулакова, 29Д» → «Кулакова,» / «29Д»
  const [street, house] = CONTACTS.address.split(" ");

  return (
    <motion.div
      ref={ref}
      className={cn("relative", className)}
      initial={reduce ? undefined : "hidden"}
      whileInView={reduce ? undefined : "shown"}
      viewport={{ once: true, amount: 0.35 }}
    >
      {/* мазок кобальта под номером дома */}
      <Spray
        seed={29}
        color="var(--color-cobalt)"
        drips={7}
        thickness={0.42}
        className="absolute -right-[18%] bottom-[-6%] z-0 aspect-[5/2] w-[118%] opacity-95 md:-right-[3%] md:bottom-[-14%] md:w-[46%]"
      />
      {/* aria-label на <p> запрещён: адрес для скринридера — скрытым текстом, буквы постера — aria-hidden */}
      <p className="display relative z-[1] text-paper">
        <span className="sr-only">{`${CONTACTS.address}, ${CONTACTS.city}`}</span>
        {/*
          строка едет по скроллу на своём слое (will-change): сдвиг — работа композитора,
          а не перерисовка огромного текста и подсвеченного «29Д» каждый кадр
        */}
        <motion.span
          aria-hidden
          className="flex flex-wrap items-baseline gap-x-[0.12em] md:flex-nowrap"
          style={reduce ? undefined : { x: xB, willChange: "transform" }}
        >
          <Whip
            text={street}
            delay={0.12}
            className="text-[clamp(66px,21.5vw,140px)] md:text-[clamp(110px,16.4vw,300px)]"
          />
          <Whip
            text={house}
            delay={0.12 + street.length * 0.035}
            step={0.06}
            className="-mt-[0.04em] text-[clamp(150px,50vw,280px)] text-toxic [text-shadow:0_0_0.06em_rgb(31_242_255/0.55),0_0_0.28em_rgb(31_242_255/0.22)] md:mt-0 md:text-[clamp(110px,16.4vw,300px)]"
          />
        </motion.span>
      </p>
    </motion.div>
  );
}
