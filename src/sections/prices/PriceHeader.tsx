import { motion, useReducedMotion } from "motion/react";

import { Chevrons } from "@/components/ui/chevrons";
import { MotionBlurTitle } from "@/components/ui/motion-blur-title";
import { PRICE_NOTES, PRICES, SINGLE_CLASS } from "@/lib/content";
import { cn, rub } from "@/lib/utils";
import { tornPolygon } from "./torn";

/** Самый выгодный абонемент — его цена за занятие и есть «от … ₽». */
const BEST = PRICES.reduce((a, b) => (b.perClass < a.perClass ? b : a));

const SHEET = tornPolygon(31, { x: 9, y: 18 });
const UNDER = tornPolygon(52, { x: 12, y: 24 });

/** Обрывок скотча с неровными концами — держит постер на стене. */
function TapeBit({ className, rotate }: { className?: string; rotate: number }) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute z-[3] h-8 w-32 bg-toxic/80 md:h-10 md:w-44", className)}
      style={{
        rotate: `${rotate}deg`,
        clipPath: "polygon(3% 0, 97% 6%, 100% 30%, 96% 55%, 99% 100%, 2% 94%, 5% 62%, 0 36%)",
      }}
    />
  );
}

function Caption({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("flex-col items-start", className)}>
      <span className="label whitespace-nowrap text-[0.72rem] text-ink md:text-[0.8rem]">за занятие</span>
      <span className="mt-1 whitespace-nowrap text-[13px] text-ink/60 md:text-sm">в абонементе на {BEST.count}</span>
    </span>
  );
}

/**
 * Шапка «Цен» — светлый бумажный постер-прайс, наклеенный поверх кобальтового листа.
 * Главное на нём — цифры «от 375 ₽» со смазом движения; слово «Абонементы» — чёткое, чернилами.
 * Рядом зачёркнутое разовое занятие и наклейка «выгода до …» — сразу видно, зачем абонемент.
 */
export function PriceHeader() {
  const reduce = useReducedMotion();

  return (
    <motion.header
      className="relative mt-10 md:mt-14"
      style={{ rotate: -1 }}
      initial={reduce ? false : { opacity: 0, y: 80, rotate: -4.5, scale: 1.04 }}
      whileInView={{ opacity: 1, y: 0, rotate: -1, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ default: { type: "spring", stiffness: 200, damping: 21, mass: 0.9 }, opacity: { duration: 0.3 } }}
    >
      {/* второй лист: кобальтовый постер под светлым, сдвинут и повёрнут иначе */}
      <div
        aria-hidden
        className="absolute inset-0 translate-x-2.5 translate-y-3.5 rotate-[1.6deg] bg-cobalt md:translate-x-5 md:translate-y-6"
        style={{ clipPath: UNDER }}
      />

      <div className="relative overflow-hidden bg-ice text-ink" style={{ clipPath: SHEET }}>
        {/* фактура бумаги: полутон в углу и сгиб листа */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <span className="halftone halftone-fade absolute -right-[12%] -top-[30%] h-[120%] w-[62%] text-cobalt/30 [--dot:9px]" />
          <span className="halftone halftone-fade absolute -bottom-[40%] -left-[14%] h-[90%] w-[46%] text-ink/[0.12] [--dot:7px]" />
          <span className="absolute inset-y-0 left-[61%] hidden w-px bg-ink/[0.08] shadow-[1px_0_0_rgb(255_255_255/0.7)] lg:block" />
        </div>

        <div
          className={cn(
            "relative grid gap-x-14 px-6 pb-11 pt-12 [grid-template-areas:'k'_'t'_'n'_'x'_'p'_'c']",
            "md:px-12 md:pb-14 md:pt-14 xl:px-16",
            "lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:[grid-template-areas:'k_k'_'t_n'_'x_x'_'p_c']",
          )}
        >
          <p className="label flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-ink/70 [grid-area:k]">
            <span className="flex items-center gap-2.5">
              <Chevrons count={4} bpm={104} size="0.7rem" className="text-cobalt" />
              Прайс · {PRICES.length} абонемента
            </span>
            <span className="hidden md:inline">Химия · Ставрополь</span>
          </p>

          <h2 className="display mt-5 text-[16.4vw] leading-[0.8] tracking-[-0.015em] [grid-area:t] md:text-[12.4vw] lg:mt-6 lg:self-end lg:text-[9.4vw] 2xl:text-[150px]">
            Абонементы
          </h2>

          <p className="mt-6 max-w-md text-[17px] leading-relaxed text-ink/80 [grid-area:n] md:text-lg lg:mt-0 lg:self-end lg:pb-[0.6vw]">
            {PRICE_NOTES.allDirections}
          </p>

          {/* линия отрыва, как на билете */}
          <div aria-hidden className="mt-8 border-t-2 border-dashed border-ink/25 [grid-area:x] md:mt-10" />

          <p className="mt-5 flex flex-wrap items-start [grid-area:p] md:mt-6 md:flex-nowrap">
            <span className="sr-only">
              От {rub(BEST.perClass)} за занятие в абонементе на {BEST.count} {BEST.unit}
            </span>
            <span aria-hidden className="display mr-[0.12em] mt-[0.32em] text-[9vw] leading-[0.8] md:text-[6vw] lg:text-[3.6vw]">
              от
            </span>
            <span aria-hidden className="text-cobalt">
              <MotionBlurTitle
                as="span"
                text={String(BEST.perClass)}
                blur="right"
                edge={14}
                smear="soft"
                delay={0.2}
                className="block text-[35vw] leading-[0.76] tracking-[-0.03em] tabular-nums md:text-[30vw] lg:text-[19vw] 2xl:text-[300px]"
              />
            </span>
            <span aria-hidden className="ml-[0.2em] mt-[0.2em] flex flex-col items-start">
              <span className="display text-[14vw] leading-[0.8] text-cobalt md:text-[11vw] lg:text-[7vw] 2xl:text-[110px]">₽</span>
              <Caption className="mt-3 hidden md:flex" />
            </span>
            {/* на узком экране подпись уходит под цифры, чтобы «375» оставалось огромным */}
            <Caption className="mt-3 flex basis-full md:hidden" />
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-5 [grid-area:c] lg:mt-0 lg:flex-col lg:items-start lg:justify-end lg:self-end lg:pb-[1.4vw]">
            <p className="flex items-baseline gap-3">
              <span className="label text-ink/65">Разовое</span>
              <span className="display relative text-[48px] leading-none tabular-nums text-ink/55 md:text-[64px]">
                {rub(SINGLE_CLASS)}
                {/* зачёркнуто маркером, а не типографской чертой */}
                <motion.span
                  aria-hidden
                  className="absolute -left-[6%] top-[46%] h-[0.13em] w-[112%] origin-left -rotate-[7deg] rounded-full bg-cobalt"
                  initial={reduce ? false : { scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.45, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </span>
            </p>
            <motion.p
              className="display inline-flex rotate-[-3deg] items-baseline gap-2 bg-ink px-3.5 pb-1.5 pt-2.5 text-toxic shadow-[5px_5px_0_0_var(--color-cobalt)]"
              initial={reduce ? false : { opacity: 0, scale: 1.6, rotate: -14 }}
              whileInView={{ opacity: 1, scale: 1, rotate: -3 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ type: "spring", stiffness: 420, damping: 16, delay: 0.75 }}
            >
              <span className="label text-[0.68rem] text-paper md:text-[0.76rem]">выгода до</span>
              <span className="text-[40px] leading-[0.8] tabular-nums md:text-[52px]">{BEST.saving}</span>
            </motion.p>
          </div>
        </div>
      </div>

      <TapeBit rotate={-28} className="-left-8 -top-2 md:-left-12 md:top-0" />
      <TapeBit rotate={24} className="-right-8 -top-1 hidden md:block md:-right-12" />
      <TapeBit rotate={-22} className="-bottom-3 -right-6 md:-right-10" />
    </motion.header>
  );
}
