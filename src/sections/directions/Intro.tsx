import { Fragment, useCallback, useRef } from "react";
import { motion, useInView, useTransform, type MotionValue } from "motion/react";

import { MotionBlurTitle } from "@/components/ui/motion-blur-title";
import { Reveal } from "@/components/ui/reveal";
import { SectionLabel } from "@/components/ui/section-label";
import { Spray } from "@/components/ui/spray";
import { TornEdge } from "@/components/ui/torn-edge";
import { VelocityMarquee } from "@/components/ui/velocity-marquee";
import { DIRECTIONS, MEDIA } from "@/lib/content";
import { ty } from "@/lib/typograph";
import { cn } from "@/lib/utils";

import { THEMES } from "./themes";
import { useCovered, usePanelState } from "./usePanelState";

export function Intro({
  cover,
  panelRef,
  onJump,
}: {
  cover: MotionValue<number>;
  panelRef: (el: HTMLElement | null) => void;
  onJump: (i: number) => void;
}) {
  const shade = useTransform(cover, [0, 1], [0, 0.8]);
  // полностью накрытое интро не рисуем и гасим его CSS-петли — как у панелей направлений (без перерисовки React)
  const ref = useRef<HTMLDivElement | null>(null);
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      ref.current = el;
      panelRef(el);
    },
    [panelRef],
  );
  usePanelState(ref, null, cover);

  return (
    <div ref={setRef} className="relative bg-ink-800">
      <TornEdge side="top" color="var(--color-ink-800)" fiber="var(--color-paper)" height={64} seed={5} density={60} />

      <div className="relative overflow-hidden pb-20 pt-16 md:pb-24 md:pt-24">
        {/* декор: мазок кобальта за заголовком, полутон */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <Spray
            seed={21}
            color="var(--color-cobalt-deep)"
            drips={10}
            className="absolute -left-[20%] top-[6%] aspect-[5/2] w-[140%] -rotate-[4deg] opacity-60 md:-left-[6%] md:top-[2%] md:w-[90%]"
          />
          <div className="halftone halftone-fade absolute -right-[12%] top-[30%] size-[70vw] text-toxic/20 [--dot:10px] md:size-[38vw]" />
        </div>

        <div className="relative px-5 md:px-10 xl:px-16">
          <SectionLabel index="01" label="Направления" />
          <div className="relative">
            <MotionBlurTitle as="h2" text="Направления" className="mt-4 -ml-[0.04em] text-[18.4vw] text-paper md:mt-6" />
            {/*
              наклейка: плоский логотип с подтёками — небольшой, сбоку под концом заголовка. На телефоне — у правого
              края, правее тире в «4 направления —»; уже 375px места рядом с ним нет, там её не ставим
            */}
            <picture
              aria-hidden
              className="pointer-events-none absolute -bottom-[13vw] -right-[4vw] w-[20vw] rotate-[-8deg] max-[374px]:hidden md:-bottom-[3.4vw] md:right-[3%] md:w-[11vw] md:max-w-[190px]"
            >
              <source
                type="image/webp"
                srcSet={`${MEDIA.logoFlat.w240} 240w, ${MEDIA.logoFlat.w640} 640w`}
                sizes="(min-width: 768px) min(11vw, 190px), 20vw"
              />
              <img
                src={MEDIA.logoFlat.smallPng}
                width={1551}
                height={845}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                className="block h-auto w-full drop-shadow-[0_3px_0_var(--color-ink)]"
              />
            </picture>
          </div>

          <div className="mt-8 grid gap-8 md:mt-12 lg:grid-cols-12 lg:items-end lg:gap-6">
            <Reveal kind="rise" className="lg:col-span-5">
              <p className="display text-[clamp(44px,5.2vw,84px)] leading-[0.86]">
                <span className="text-toxic">4 направления</span> —
                <br />
                один абонемент
              </p>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-mute md:text-[17px]">{ty("От первых шагов до баттлов и сцены — с нуля и для продвинутых. Выбирай одно направление или совмещай все.")}</p>
            </Reveal>

            {/* карточки-фото направлений: прыжок к панели */}
            <ol className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:gap-3 lg:col-span-7" aria-label="Перейти к направлению">
              {DIRECTIONS.map((d, i) => {
                const t = THEMES[d.id];
                const stripe = d.id === "electro" ? "var(--color-toxic)" : t.bg;
                return (
                  <Reveal key={d.id} as="li" kind="slap" delay={0.06 * i} className={i % 2 ? "sm:translate-y-4" : undefined}>
                    <button
                      type="button"
                      onClick={() => onJump(i)}
                      data-cursor="hover"
                      data-cursor-label="Смотреть"
                      aria-label={`${d.title}: перейти к направлению`}
                      className="group relative block aspect-[3/4] w-full overflow-hidden bg-ink text-left text-paper ring-1 ring-inset ring-line transition-transform duration-200 ease-[var(--ease-snap)] hover:-rotate-2 focus-visible:-rotate-2"
                    >
                      <picture>
                        {/* телефон: карточка ≈ (100vw − 50px) / 2 = 135–190px; бюджет 160px → 480w и при DPR 3
                            (2.5–3 точки на px против 5 у 900w) — минус ~120 КБ, пока на экране ещё hero */}
                        <source type="image/webp" srcSet={`${d.photo.webp480} 480w, ${d.photo.webp900} 900w`} sizes="(min-width: 640px) 22vw, 160px" />
                        <img
                          src={d.photo.jpg}
                          width={900}
                          height={1200}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-[1.06] group-focus-visible:scale-[1.06]"
                        />
                      </picture>
                      {/* затемнение снизу под подпись */}
                      <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent" />
                      {/* полоска цвета панели — связь карточки с её постером ниже */}
                      <span
                        aria-hidden
                        className="absolute inset-x-0 top-0 h-1 transition-[height] duration-200 group-hover:h-2 group-focus-visible:h-2"
                        style={{ background: stripe }}
                      />
                      <span
                        className="absolute left-2.5 top-3 grid h-6 min-w-8 place-items-center px-1.5 font-sans text-[12px] font-bold leading-none tabular-nums text-ink md:left-3 md:top-4"
                        style={{ background: stripe === "var(--color-cobalt)" ? "var(--color-paper)" : stripe }}
                      >
                        {d.number}
                      </span>
                      <span className="display absolute inset-x-2.5 bottom-2.5 text-[clamp(26px,3vw,46px)] leading-[0.86] md:inset-x-3 md:bottom-3">
                        {d.title}
                      </span>
                    </button>
                  </Reveal>
                );
              })}
            </ol>
          </div>
        </div>

        <IntroMarquee cover={cover} />
      </div>

      <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-30 bg-ink will-change-[opacity]" style={{ opacity: shade }} />
    </div>
  );
}

const MARQUEE_ITEM = "display text-[22vw] leading-[0.9] md:text-[12vw]";

/**
 * Бегущая строка направлений. VelocityMarquee крутит свой rAF, пока строка «в поле зрения» IntersectionObserver,
 * а накрытое панелями интро для IO остаётся видимым — поэтому вне экрана и под стопкой вместо неё стоит
 * неподвижная копия того же размера (раскладка и геометрия стопки не меняются, кадры не считаются).
 */
function IntroMarquee({ cover }: { cover: MotionValue<number> }) {
  const box = useRef<HTMLDivElement>(null);
  const near = useInView(box, { margin: "200px 0px" });
  const covered = useCovered(cover);
  const items = DIRECTIONS.map((d, i) => (
    <Fragment key={d.id}>
      <span className={i % 2 ? "text-transparent [-webkit-text-stroke:2px_var(--color-toxic)]" : "text-paper"}>{d.title}</span>
      <span className="mx-[0.18em] align-[0.12em] text-[0.5em] text-toxic">✕</span>
    </Fragment>
  ));
  return (
    <div ref={box} aria-hidden data-dir-marquee className="relative mt-12 -rotate-2 md:mt-16">
      {near && !covered ? (
        <VelocityMarquee baseVelocity={-3} itemClassName={MARQUEE_ITEM}>
          {items}
        </VelocityMarquee>
      ) : (
        // разметка как у VelocityMarquee (одна копия): та же высота строки
        <div className="flex overflow-hidden whitespace-nowrap">
          <div className="flex w-max flex-nowrap">
            <span className={cn("block shrink-0 pr-[0.35em]", MARQUEE_ITEM)}>{items}</span>
          </div>
        </div>
      )}
    </div>
  );
}
