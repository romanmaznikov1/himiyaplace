import { useRef, useState, type CSSProperties, type FocusEvent, type PointerEvent } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "motion/react";

import { Chevrons } from "@/components/ui/chevrons";
import { StickerButton, TelegramIcon } from "@/components/ui/sticker-button";
import { CONTACTS, type Price } from "@/lib/content";
import { cn, rub } from "@/lib/utils";
import { Barcode } from "./Barcode";

/** Слой маски: прозрачный круг радиуса r в точке at, вокруг — непрозрачно. */
const hole = (at: string, r: string) => `radial-gradient(circle ${r} at ${at}, transparent 92%, #000 100%)`;

// Размеры вырезов задаются CSS-переменными (--sc зубчики, --ph дырки перфорации, --nt вырезы, --step шаг)
// Тело: зубчики по левому краю, полукруги перфорации справа и два выреза на её концах.
const BODY_MASK: CSSProperties = {
  maskImage: [hole("0 50%", "var(--sc)"), hole("100% 50%", "var(--ph)"), hole("100% 0", "var(--nt)"), hole("100% 100%", "var(--nt)")].join(","),
  maskSize: "100% var(--step), 100% var(--step), 100% 100%, 100% 100%",
  maskRepeat: "round, round, no-repeat, no-repeat",
  maskComposite: "intersect",
};
// Корешок — зеркально: полукруги перфорации слева, зубчики справа.
const STUB_MASK: CSSProperties = {
  maskImage: [hole("100% 50%", "var(--sc)"), hole("0 50%", "var(--ph)"), hole("0 0", "var(--nt)"), hole("0 100%", "var(--nt)")].join(","),
  maskSize: "100% var(--step), 100% var(--step), 100% 100%, 100% 100%",
  maskRepeat: "round, round, no-repeat, no-repeat",
  maskComposite: "intersect",
};

/** Откуда «прилетает» билет при раздаче: смещение и лишний поворот. */
const DEAL = [
  { x: -90, y: 150, r: -13 },
  { x: 110, y: 170, r: 11 },
  { x: -80, y: 160, r: 9 },
  { x: 100, y: 180, r: -12 },
];

const Burst = () => (
  <svg viewBox="0 0 20 20" aria-hidden className="size-[1.15em] shrink-0">
    <path
      d="M10 0l2.2 6.1L18.7 4l-3.9 5.3L20 12l-6.4.6.6 6.4-4.2-4.9-4.2 4.9.6-6.4L0 12l5.2-2.7L1.3 4l6.5 2.1z"
      fill="currentColor"
    />
  </svg>
);

type Props = { price: Price; index: number; className?: string };

/**
 * Билет-абонемент: тело с зубчатым краем + корешок за перфорацией со штрих-кодом.
 * Раздаётся «шлепком» при скролле; при наведении — 3D-наклон за курсором, подъём с жёсткой тенью,
 * скан-линия по штрих-коду и корешок, который вот-вот оторвут.
 */
export function Ticket({ price, index, className }: Props) {
  const reduce = useReducedMotion();
  const [hot, setHot] = useState(false);
  const featured = Boolean(price.featured);
  const base = featured ? -3 : 0;
  const no = String(price.count).padStart(2, "0");
  const deal = DEAL[index % DEAL.length];
  const delay = (index % 2) * 0.12;

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const tilt = { stiffness: 320, damping: 20, mass: 0.6 };
  const srx = useSpring(rx, tilt);
  const sry = useSpring(ry, tilt);
  const lift = useSpring(0, { stiffness: 420, damping: 22 });
  const gx = useMotionValue(0);
  const gy = useMotionValue(0);
  const glare = useMotionTemplate`radial-gradient(340px circle at ${gx}px ${gy}px, rgb(255 255 255 / ${featured ? 0.34 : 0.1}), transparent 70%)`;

  // Наклон/подъём — только для мыши и клавиатуры. На таче pointerenter приходит на touchstart:
  // без проверки каждый свайп по билету поднимал его, менял drop-shadow и запускал скан-линию.
  const mouseOver = useRef(false);
  const enter = () => {
    setHot(true);
    if (!reduce) lift.set(-10);
  };
  const leave = () => {
    setHot(false);
    rx.set(0);
    ry.set(0);
    lift.set(0);
  };
  const onEnter = (e: PointerEvent<HTMLLIElement>) => {
    if (e.pointerType !== "mouse") return;
    mouseOver.current = true;
    enter();
  };
  const onLeave = (e: PointerEvent<HTMLLIElement>) => {
    if (e.pointerType !== "mouse") return;
    mouseOver.current = false;
    leave();
  };
  // фокус после тапа по ссылке (Chrome Android) не поднимает билет — только видимый фокус с клавиатуры
  const onFocus = (e: FocusEvent<HTMLLIElement>) => {
    if (e.target.matches(":focus-visible")) enter();
  };
  const onBlur = () => {
    if (!mouseOver.current) leave();
  };
  const move = (e: PointerEvent<HTMLLIElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 12);
    rx.set(-py * 12);
    gx.set(e.clientX - r.left);
    gy.set(e.clientY - r.top);
  };

  const shadow = featured
    ? `drop-shadow(${hot ? "14px 16px" : "9px 10px"} 0 var(--color-cobalt))`
    : `drop-shadow(${hot ? "10px 12px" : "0px 0px"} 0 var(--color-toxic))`;

  const skin = featured ? "border-ink/15 bg-toxic text-ink" : "border-line bg-ink-700 text-paper";
  const label = `Записаться на абонемент: ${price.count} ${price.unit} за ${rub(price.total)} — написать в Telegram`;

  return (
    <motion.li
      data-ticket={price.id}
      className={cn("relative list-none [perspective:1100px]", className)}
      initial={{ opacity: 0, x: deal.x, y: deal.y, rotate: base + deal.r, scale: 1.08 }}
      whileInView={{ opacity: 1, x: 0, y: 0, rotate: base, scale: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        default: { type: "spring", stiffness: 190, damping: 19, mass: 0.9, delay },
        opacity: { duration: 0.3, delay },
      }}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onPointerMove={move}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <motion.div className="@container relative" style={{ rotateX: srx, rotateY: sry, y: lift }}>
        <div
          className={cn(
            "relative flex transition-[filter] duration-300 ease-[var(--ease-snap)]",
            "[--nt:9px] [--ph:4.5px] [--sc:4px] [--step:13px]",
            "@lg:[--nt:13px] @lg:[--ph:6px] @lg:[--sc:5px] @lg:[--step:17px]",
          )}
          style={{ filter: shadow }}
        >
          {/* Тело билета */}
          <div className={cn("relative min-w-0 flex-1 overflow-hidden border border-r-0", skin)} style={BODY_MASK}>
            {featured && (
              <span
                aria-hidden
                className="halftone halftone-fade pointer-events-none absolute -left-[12%] -top-[40%] h-[140%] w-[70%] text-ink/[0.14] [--dot:6px]"
              />
            )}
            {!reduce && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                style={{ background: glare, opacity: hot ? 1 : 0 }}
              />
            )}

            <div
              className={cn(
                "relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-[3cqw] gap-y-[3cqw] px-[5cqw] py-[4.6cqw]",
                "[grid-template-areas:'t_p'_'r_r'_'m_m'_'b_b']",
                "@lg:gap-y-[2.2cqw] @lg:px-[5.4cqw] @lg:py-[4.4cqw] @lg:[grid-template-areas:'l_l'_'t_t'_'r_p'_'m_b']",
              )}
            >
              <p className="label hidden opacity-60 [grid-area:l] @lg:block">Абонемент №{no}</p>

              <h3 className="display flex items-baseline gap-[1.6cqw] [grid-area:t]">
                <span className="text-[16cqw] leading-[0.8] tracking-[-0.02em] tabular-nums @lg:text-[21cqw]">
                  {price.count}
                </span>
                <span className="text-[7.4cqw] leading-[0.8] @lg:text-[8.6cqw]">{price.unit}</span>
              </h3>

              <p
                className={cn(
                  "display justify-self-end whitespace-nowrap border px-[2.4cqw] pb-[1.1cqw] pt-[1.5cqw] text-[6.4cqw] leading-none tabular-nums [grid-area:p]",
                  "@lg:justify-self-stretch @lg:px-[2.6cqw] @lg:text-center @lg:text-[6.6cqw]",
                  featured ? "border-ink/45" : "border-paper/30",
                )}
              >
                <span className="sr-only">Стоимость: </span>
                {rub(price.total)}
              </p>

              <p className="label flex items-center gap-2 [grid-area:r]">
                <Chevrons count={4} bpm={96 + index * 10} size="0.7rem" className={featured ? "text-ink" : "text-toxic"} />
                {price.rhythm}
              </p>

              <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 [grid-area:m]">
                <span className="text-[15px] font-semibold tabular-nums @lg:text-base">
                  {rub(price.perClass)} <span className="font-normal opacity-70">/ занятие</span>
                </span>
                <span
                  className={cn(
                    "label px-1.5 py-1 text-[0.68rem] tabular-nums",
                    featured ? "bg-ink text-toxic" : "bg-toxic text-ink",
                  )}
                >
                  <span className="sr-only">экономия </span>
                  {price.saving}
                </span>
              </p>

              <div className="[grid-area:b] @lg:justify-self-stretch">
                <StickerButton
                  href={CONTACTS.telegram.url}
                  icon={<TelegramIcon />}
                  tilt={featured ? 1.5 : -1.5}
                  aria-label={label}
                  className={cn("w-full", featured && "[--shadow-color:var(--color-ink)]")}
                >
                  Записаться
                </StickerButton>
              </div>
            </div>
          </div>

          {/* Корешок за перфорацией */}
          <motion.div
            aria-hidden
            className={cn("relative w-[21cqw] shrink-0 border border-l-0 @lg:w-[22cqw]", skin)}
            style={{ ...STUB_MASK, transformOrigin: "0% 100%" }}
            animate={hot && !reduce ? { rotate: [0, 5, 1.5, 4, 2.6], x: [0, 3, 1, 2.5, 2] } : { rotate: 0, x: 0 }}
            transition={hot ? { duration: 0.75, ease: "easeOut" } : { type: "spring", stiffness: 420, damping: 16 }}
          >
            <div className="absolute inset-y-[12%] left-[18%] right-[38%] overflow-hidden">
              <Barcode seed={price.id} className={cn("h-full w-full", featured ? "text-ink" : "text-paper")} />
              {!reduce && (
                <motion.div
                  className="absolute inset-0"
                  initial={false}
                  animate={hot ? { y: ["-2%", "102%"], opacity: [0, 1, 1, 0] } : { y: "-2%", opacity: 0 }}
                  transition={hot ? { duration: 1.15, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.1 } : { duration: 0.2 }}
                >
                  <div
                    className={cn(
                      "h-[2px] w-[140%] -translate-x-[15%]",
                      featured ? "bg-cobalt shadow-[0_0_10px_2px_var(--color-cobalt)]" : "bg-toxic shadow-[0_0_10px_2px_var(--color-toxic)]",
                    )}
                  />
                </motion.div>
              )}
            </div>
            <span className="label absolute right-[10%] top-1/2 -translate-y-1/2 rotate-180 whitespace-nowrap text-[max(7px,1.45cqw)] tracking-[0.18em] opacity-70 [text-orientation:sideways] [writing-mode:vertical-rl]">
              Химия · все направления · №{no}
            </span>
          </motion.div>
        </div>

        {price.badge && (
          <motion.span
            className={cn(
              "label absolute -top-5 right-[17cqw] z-[3] flex items-center gap-1.5 px-3 py-2 text-[0.7rem] @lg:-top-4 @lg:right-[19cqw] @lg:text-[0.8rem]",
              featured
                ? "bg-ink text-toxic shadow-[4px_4px_0_0_var(--color-cobalt)]"
                : "bg-cobalt text-paper shadow-[4px_4px_0_0_var(--color-toxic)]",
            )}
            initial={{ opacity: 0, scale: 1.8, rotate: -24 }}
            whileInView={{ opacity: 1, scale: 1, rotate: featured ? 7 : -5 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ type: "spring", stiffness: 420, damping: 16, delay: 0.45 + delay }}
          >
            <Burst />
            {price.badge}
          </motion.span>
        )}
      </motion.div>
    </motion.li>
  );
}
