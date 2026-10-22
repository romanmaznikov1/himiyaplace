import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { PinIcon } from "@/components/ui/sticker-button";
import { Tape } from "@/components/ui/tape";
import { tornClipPath } from "@/components/ui/torn-edge";
import { useMedia } from "@/hooks/useMedia";
import { CONTACTS } from "@/lib/content";
import { cn } from "@/lib/utils";

import { MAP_SRC, TapePiece } from "./bits";

const FRAME_CLIP = tornClipPath(
  64,
  { top: true, right: true, bottom: true, left: true },
  1.1,
  48,
);

/**
 * Карта-постер: бумажная рамка с рваным краем и жёсткой тенью, скотч по углам, наклейка «Мы здесь».
 * Фасад: до первого клика/тапа показываем свою схему района (тот же размер — без сдвига вёрстки),
 * а виджет Яндекс Карт с его скриптами, метрикой и рекламными запросами монтируется только по действию.
 * Колесо и тач-свайп над живой картой не перехватываются, пока её не «включили» кликом/тапом.
 *
 * На тач-экране живая карта забирает свайпы себе, поэтому у неё есть явный выход: наклейка «Готово»,
 * касание страницы вне карты или прокрутка страницы на 40px+ снова отдают свайп странице.
 * Там же без фильтров и смешивания поверх iframe — каждый кадр панорамирования не перекрашивается.
 */
export function MapPoster({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const coarse = useMedia("(pointer: coarse)");
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const visible = useInView(box, { amount: 0.05 });
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(false);
  const activeRef = useRef(false);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // ушли от карты — снова отдаём скролл странице
  useEffect(() => {
    if (!visible) setActive(false);
  }, [visible]);

  // тач: касание страницы вне карты или прокрутка страницы (другим пальцем, якорем) — карту «отпускаем»
  useEffect(() => {
    if (!active || !coarse) return;
    const y0 = window.scrollY;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      if (box.current && !box.current.contains(e.target as Node))
        setActive(false);
    };
    const onScroll = () => {
      if (Math.abs(window.scrollY - y0) > 40) setActive(false);
    };
    document.addEventListener("pointerdown", onDown, {
      capture: true,
      passive: true,
    });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onDown, { capture: true });
      window.removeEventListener("scroll", onScroll);
    };
  }, [active, coarse]);

  // load у виджета может прийти очень поздно (метрики, тайлы) — показываем карту не позже чем через 9 с
  useEffect(() => {
    if (!mounted || loaded) return;
    const t = window.setTimeout(() => setLoaded(true), 9000);
    return () => window.clearTimeout(t);
  }, [mounted, loaded]);

  const ready = mounted && loaded;
  // живая карта на тач-экране — без фильтра и смешивания поверх iframe (панорамирование на скорости GPU)
  const plain = coarse && ready;

  return (
    <motion.figure
      className={cn("relative", className)}
      initial={reduce ? undefined : { opacity: 0, scale: 1.06, rotate: -4 }}
      whileInView={reduce ? undefined : { opacity: 1, scale: 1, rotate: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ type: "spring", stiffness: 380, damping: 22, mass: 0.9 }}
    >
      <div className="relative md:-rotate-[1.2deg]">
        {/*
          жёсткая тень повторяет рваный контур: та же форма за рамкой со сдвигом, а не drop-shadow
          на предке iframe (фильтр перерисовывал бы каждый кадр живой карты)
        */}
        <div
          aria-hidden
          className="absolute inset-0 translate-x-[10px] translate-y-[12px] bg-cobalt md:translate-x-[16px] md:translate-y-[18px]"
          style={{ clipPath: FRAME_CLIP }}
        />
        <div
          className="relative bg-paper p-[7px] md:p-2.5"
          style={{ clipPath: FRAME_CLIP }}
        >
          <div
            ref={box}
            // тач: в альбомной ориентации карта не выше ~70% экрана — рядом всегда есть полоса для прокрутки
            // (w-full: иначе max-height через aspect-ratio сужал бы и ширину)
            className="relative aspect-[4/5] w-full overflow-hidden bg-ink-800 sm:aspect-[16/11] [@media(pointer:coarse)]:max-h-[70svh]"
            onPointerLeave={(e) => {
              if (e.pointerType === "mouse") setActive(false);
            }}
          >
            <MapPlaceholder loading={mounted && !loaded} />
            {mounted && (
              <iframe
                ref={frame}
                src={MAP_SRC}
                title="Карта: студия «Химия», просп. Кулакова, 29Д"
                className={cn(
                  "absolute inset-0 size-full border-0 transition-opacity duration-700",
                  loaded ? "opacity-100" : "opacity-0",
                )}
                style={{
                  colorScheme: "dark",
                  filter: plain ? undefined : "saturate(1.25) contrast(1.06)",
                }}
                onLoad={() => {
                  window.setTimeout(() => setLoaded(true), 300);
                  // карту включили кликом и ещё смотрят на неё — сразу отдаём ей клавиатуру
                  if (activeRef.current)
                    frame.current?.focus({ preventScroll: true });
                }}
              />
            )}
            {/* фирменный оттенок и виньетка — поверх карты, но не мешают её трогать */}
            {!plain && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-cobalt/20 mix-blend-color"
              />
            )}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 shadow-[inset_0_0_90px_rgb(3_6_13/0.85)]"
            />

            {/*
              наклейка у метки на схеме; на живой карте у Яндекса своя подпись — прячем.
              Прозрачность — на обычной обёртке: motion пишет opacity в style внутреннего шлепка,
              и класс opacity-0 на том же элементе проигрывал бы ему.
            */}
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute left-[calc(44%+18px)] top-[calc(53.6%-92px)] z-[4] transition-opacity duration-500 sm:left-[calc(50%-4px)] md:top-[calc(53.6%-104px)]",
                ready && "opacity-0",
              )}
            >
              <motion.div
                initial={
                  reduce ? undefined : { opacity: 0, scale: 1.7, rotate: -22 }
                }
                whileInView={
                  reduce ? undefined : { opacity: 1, scale: 1, rotate: -5 }
                }
                style={reduce ? { rotate: -5 } : undefined}
                viewport={{ once: true, amount: 0.6 }}
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 17,
                  delay: 0.5,
                }}
              >
                <span className="relative inline-flex items-center gap-2.5 bg-toxic py-2 pl-2.5 pr-3.5 text-ink shadow-[5px_5px_0_0_var(--color-cobalt)] md:gap-3 md:py-2.5 md:pl-3 md:pr-4">
                  <span className="grid size-6 place-items-center md:size-7 [&>svg]:size-full">
                    <PinIcon />
                  </span>
                  <span className="flex flex-col">
                    <span className="display text-[26px] leading-[0.85] md:text-[32px]">
                      Мы здесь
                    </span>
                    <span className="label mt-1 text-[0.66rem] text-ink/75">
                      {CONTACTS.studio}
                    </span>
                  </span>
                  {/* хвостик наклейки — к метке на схеме */}
                  <span className="absolute -bottom-2 left-3 size-4 rotate-45 bg-toxic" />
                </span>
              </motion.div>
            </div>

            {!active && (
              <button
                type="button"
                className="group/map absolute inset-0 z-[3] cursor-pointer outline-none"
                aria-label={
                  mounted
                    ? "Включить управление картой"
                    : "Показать живую карту Яндекса"
                }
                onClick={() => {
                  setActive(true);
                  if (!mounted) setMounted(true);
                  else frame.current?.focus({ preventScroll: true });
                }}
              >
                <span
                  className={cn(
                    "label absolute bottom-14 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap bg-ink/90 px-3.5 py-2.5 text-[0.7rem] text-paper ring-1 ring-toxic/50 transition-[opacity,background-color,color] duration-300",
                    "group-hover/map:bg-toxic group-hover/map:text-ink group-focus-visible/map:ring-2 group-focus-visible/map:ring-toxic",
                    // до первого клика подсказка видна всегда, потом — только при наведении/фокусе
                    mounted &&
                      "[@media(hover:hover)]:opacity-0 group-hover/map:opacity-100 group-focus-visible/map:opacity-100",
                  )}
                >
                  <span className="size-1.5 animate-pulse rounded-full bg-current" />
                  Нажми — и карта оживёт
                </span>
              </button>
            )}

            {/* тач: явный выход из живой карты — свайпы снова листают страницу */}
            {active && coarse && (
              <button
                type="button"
                onClick={() => setActive(false)}
                aria-label="Готово: выключить карту и вернуть прокрутку страницы"
                className="label absolute left-3 top-16 z-[5] inline-flex min-h-11 -rotate-2 items-center gap-2 bg-toxic px-4 text-[0.72rem] text-ink shadow-[4px_4px_0_0_var(--color-cobalt)] outline-none focus-visible:ring-2 focus-visible:ring-paper active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_var(--color-cobalt)]"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 16 16"
                  className="size-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="square"
                >
                  <path d="M2.5 8.5 6.5 12.5 13.5 3.5" />
                </svg>
                Готово
              </button>
            )}
          </div>
        </div>
      </div>

      <figcaption className="sr-only">
        {CONTACTS.city}, {CONTACTS.address}. {CONTACTS.studio}.
      </figcaption>

      {/* скотч: углы + лента с бегущим текстом поперёк верхнего края */}
      <TapePiece rotate={-38} className="-left-7 -top-2 md:-left-9 md:-top-3" />
      <TapePiece
        rotate={-38}
        className="-bottom-1 -right-6 md:-bottom-2 md:-right-8"
      />
      <TapePiece rotate={42} className="-right-12 -top-4 hidden md:block" />
      <Tape
        text={[CONTACTS.address, CONTACTS.studio, CONTACTS.city]}
        variant="toxic"
        rotate={-3.5}
        speed={22}
        className="absolute -left-6 top-3 z-[5] w-[78%] md:-left-12 md:top-4 md:w-[64%]"
        textClassName="text-[15px] md:text-[clamp(16px,1.4vw,22px)]"
      />
    </motion.figure>
  );
}

/** Схема района до загрузки виджета: та же геометрия, что у карты (проспект Кулакова по диагонали, метка в центре). */
function MapPlaceholder({ loading }: { loading: boolean }) {
  return (
    <div aria-hidden className="absolute inset-0 text-ink-600">
      <svg
        viewBox="0 0 900 560"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
      >
        <defs>
          <pattern
            id="loc-blocks"
            width="64"
            height="48"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-8)"
          >
            <rect
              x="6"
              y="6"
              width="52"
              height="36"
              rx="2"
              fill="currentColor"
              opacity=".55"
            />
          </pattern>
        </defs>
        <rect width="900" height="560" fill="url(#loc-blocks)" />
        {/* промзона слева — крупные коробки */}
        <rect
          x="40"
          y="40"
          width="250"
          height="380"
          fill="var(--color-ink-700)"
        />
        {/* просп. Кулакова */}
        <path
          d="M300 590 L540 -30"
          stroke="var(--color-ink)"
          strokeWidth="46"
        />
        <path
          d="M300 590 L540 -30"
          stroke="var(--color-cobalt-deep)"
          strokeWidth="30"
          opacity=".75"
        />
        <path
          d="M300 590 L540 -30"
          stroke="var(--color-ink-800)"
          strokeWidth="2"
          strokeDasharray="14 12"
        />
        {/* просп. Юности */}
        <path
          d="M395 330 Q 600 450 920 410"
          stroke="var(--color-ink)"
          strokeWidth="26"
          fill="none"
        />
        <path
          d="M395 330 Q 600 450 920 410"
          stroke="var(--color-ink-600)"
          strokeWidth="14"
          fill="none"
        />
        <text
          x="0"
          y="0"
          transform="translate(352 470) rotate(-68.8)"
          fill="var(--color-mute)"
          fontSize="15"
          letterSpacing="3"
          className="font-sans uppercase"
        >
          просп. Кулакова
        </text>
        {/* метка */}
        <g transform="translate(425 300)">
          <circle
            r="54"
            fill="none"
            stroke="var(--color-toxic)"
            strokeOpacity=".25"
          />
          <circle
            r="26"
            fill="none"
            stroke="var(--color-toxic)"
            strokeOpacity=".45"
          />
          <path
            d="M0 0 C -14 -18 -16 -26 -16 -32 A16 16 0 0 1 16 -32 C 16 -26 14 -18 0 0 Z"
            fill="var(--color-toxic)"
          />
          <circle cy="-32" r="6" fill="var(--color-ink)" />
        </g>
      </svg>
      <div className="scanlines absolute inset-0 opacity-60" />
      <span className="label absolute bottom-4 left-4 inline-flex items-center gap-2 text-[0.62rem] text-mute">
        <span
          className={cn(
            "size-1.5 rounded-full bg-toxic",
            loading && "animate-pulse",
          )}
        />
        {loading ? "Загружаем карту…" : "Схема района"}
      </span>
    </div>
  );
}
