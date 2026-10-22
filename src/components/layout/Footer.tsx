import { useEffect, useId, useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

import { Chevrons } from "@/components/ui/chevrons";
import { Reveal } from "@/components/ui/reveal";
import { Spray } from "@/components/ui/spray";
import { StickerButton, TelegramIcon } from "@/components/ui/sticker-button";
import { TornEdge } from "@/components/ui/torn-edge";
import { useMedia } from "@/hooks/useMedia";
import { CONTACTS, DIRECTIONS, MEDIA, NAV, TRIAL } from "@/lib/content";
import { cn, mulberry32, rub } from "@/lib/utils";
import { jumpTo } from "@/sections/contact/jump";

/** CSS-вращение колец (анимация на композиторе, а не JS-кадры motion) + без рамки фокуса на секции-цели якоря. */
const FOOTER_CSS = `
@keyframes footer-spin { to { transform: rotate(-360deg) } }
.footer-spin { animation: footer-spin 20s linear infinite; transform-origin: 50% 50%; }
@media (prefers-reduced-motion: reduce) { .footer-spin { animation: none } }
[data-nav-target]:focus { outline: none }
`;

/**
 * Футер — тихая подпись под постером: логотип-наклейка (меньше, чем в hero, со свечением за курсором
 * и кнопкой пробного), рядом разделы и связь, под логотипом — студия и направления, «Наверх ↑».
 * Без ленты: финальную ленту «ХИМИЯ ✕» рисует секция контактов прямо над рваным краем.
 */
export default function Footer() {
  return (
    <footer className="relative isolate overflow-x-clip bg-ink pb-8 pt-14 text-paper md:pt-20">
      <style>{FOOTER_CSS}</style>
      <TornEdge
        side="top"
        color="var(--color-ink)"
        fiber="var(--color-paper)"
        seed={83}
        height={64}
        density={78}
      />

      {/* фон */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="halftone halftone-fade absolute -left-[10%] top-[8%] h-[40rem] w-[55%] text-ink-600/70 [--dot:9px]" />
        <div className="absolute -right-[10%] bottom-[10%] h-[40vw] w-[40vw] rounded-full bg-cobalt-deep/20 blur-[120px]" />
      </div>

      <div className="relative px-5 md:px-10 xl:px-16">
        <div className="flex items-center justify-between gap-6">
          <p className="label text-mute">
            Школа танцев · <span className="text-paper">{CONTACTS.city}</span>
          </p>
          <Chevrons count={8} bpm={95} className="text-toxic" size="0.9rem" />
        </div>

        {/* grid-cols-1 = minmax(0,1fr): без него колонка растягивалась под неразрывный телефон и «Наверх» уезжал за край на 320px */}
        <div className="mt-6 grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 md:mt-8 lg:grid-cols-12">
          {/* логотип + студия */}
          <div className="sm:col-span-2 lg:col-span-6">
            <Wordmark />
            <div className="mt-6 flex flex-col gap-4 md:mt-4 md:flex-row md:flex-wrap md:items-end md:justify-between md:gap-x-8 lg:flex-col lg:items-start">
              <div>
                <p className="display whitespace-nowrap text-[clamp(34px,4vw,56px)] leading-[0.9] text-paper">
                  {CONTACTS.studio}
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-mute">
                  {CONTACTS.city}, {CONTACTS.address}
                </p>
              </div>
              <p className="label flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.7rem] text-mute sm:text-[0.72rem] md:pb-1.5">
                {DIRECTIONS.map((d, i) => (
                  <span key={d.id} className="flex items-center gap-2.5">
                    {i > 0 && (
                      <span aria-hidden className="text-toxic">
                        ✕
                      </span>
                    )}
                    <span className="text-paper/80">{d.title}</span>
                  </span>
                ))}
              </p>
            </div>
          </div>

          <nav
            aria-label="Разделы сайта"
            className="sm:col-span-2 lg:col-span-3 lg:pt-10"
          >
            <p className="label text-mute">Разделы</p>
            <ul className="mt-3 grid grid-cols-2 gap-x-6 sm:grid-cols-3 lg:grid-cols-1">
              {NAV.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    data-cursor="hover"
                    onClick={(e) => jumpTo(e, item.id)}
                    className="group/nav display inline-flex min-h-11 items-center py-1.5 text-[28px] leading-[1.15] text-paper transition-colors hover:text-toxic focus-visible:text-toxic md:text-[32px]"
                  >
                    <span
                      aria-hidden
                      className="inline-block w-0 overflow-hidden text-toxic transition-[width] duration-300 ease-out-expo group-hover/nav:w-[0.7em] group-focus-visible/nav:w-[0.7em]"
                    >
                      »
                    </span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* связь + «Наверх»: один экземпляр кнопки — до lg справа от контактов, на lg под ними */}
          <div className="flex items-start justify-between gap-6 max-[359px]:gap-4 sm:col-span-2 lg:col-span-3 lg:flex-col lg:justify-start lg:gap-10 lg:pt-10">
            <div className="min-w-0">
              <p className="label text-mute">Связь</p>
              <ul className="mt-3 space-y-1">
                <li>
                  <a
                    href={CONTACTS.telegram.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="hover"
                    className="display inline-block whitespace-nowrap py-1.5 text-[28px] normal-case leading-none text-paper transition-colors hover:text-toxic md:text-[32px]"
                  >
                    {CONTACTS.telegram.handle}
                  </a>
                </li>
                <li>
                  <a
                    href={CONTACTS.phone.tel}
                    data-cursor="hover"
                    className="display inline-block whitespace-nowrap py-1.5 text-[28px] leading-none tabular-nums text-paper transition-colors hover:text-toxic md:text-[32px]"
                  >
                    {CONTACTS.phone.display}
                  </a>
                </li>
                <li>
                  <a
                    href={CONTACTS.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="hover"
                    className="inline-block py-2.5 text-[15px] text-mute underline decoration-line underline-offset-4 transition-colors hover:text-toxic hover:decoration-toxic"
                  >
                    Открыть в Яндекс Картах
                  </a>
                </li>
              </ul>
              <p className="label mt-4 flex items-center gap-2 text-toxic">
                <span className="inline-block size-1.5 shrink-0 animate-pulse rounded-full bg-toxic" />
                {CONTACTS.replyTime}
              </p>
            </div>
            <UpButton className="mt-6 lg:mt-0" />
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-5 border-t border-line pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-[13px] text-mute">
            © 2026 Химия — школа танцев, Ставрополь
          </p>
          <div aria-hidden className="flex items-center gap-5 text-paper/35">
            <Barcode className="h-7 w-28" />
            <picture className="-rotate-6 opacity-85">
              <source type="image/webp" srcSet={`${MEDIA.logoFlat.w240} 240w, ${MEDIA.logoFlat.w640} 640w`} sizes="84px" />
              <img
                src={MEDIA.logoFlat.smallPng}
                width={1551}
                height={845}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                className="h-auto w-[84px]"
              />
            </picture>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Логотип-подпись: свечение за буквами и блик по самим буквам едут за курсором, логотип чуть наклоняется.
 * Блик и наклон — только для мыши: слой блика с CSS-маской (маска грузится сразу, без lazy) на тач-экранах
 * не монтируется, а телефоны берут логотип 900w вместо 1760w.
 */
function Wordmark() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const fine = useMedia("(hover: hover) and (pointer: fine)");
  const follow = fine && !reduce;
  const gx = useMotionValue(0);
  const gy = useMotionValue(0);
  const fx = useMotionValue(0);
  const fy = useMotionValue(0);
  const spring = { stiffness: 140, damping: 20, mass: 0.7 };
  const sx = useSpring(gx, spring);
  const sy = useSpring(gy, spring);
  const tilt = { stiffness: 160, damping: 18 };
  const rotateY = useSpring(useTransform(fx, [-0.5, 0.5], [-7, 7]), tilt);
  const rotateX = useSpring(useTransform(fy, [-0.5, 0.5], [6, -6]), tilt);
  // блик по буквам виден только пока курсор над логотипом
  const shine = useMotionValue(0);
  const shineOpacity = useSpring(shine, { stiffness: 180, damping: 26 });

  // по умолчанию свечение — в центре; при ресайзе пересчитываем
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const center = () => {
      gx.set(el.clientWidth / 2);
      gy.set(el.clientHeight * 0.55);
    };
    center();
    const ro = new ResizeObserver(center);
    ro.observe(el);
    return () => ro.disconnect();
  }, [gx, gy]);

  const onMove = (e: React.PointerEvent) => {
    if (!follow || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    gx.set(e.clientX - r.left);
    gy.set(e.clientY - r.top);
    fx.set((e.clientX - r.left) / r.width - 0.5);
    fy.set((e.clientY - r.top) / r.height - 0.5);
    shine.set(1);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    gx.set(el.clientWidth / 2);
    gy.set(el.clientHeight * 0.55);
    fx.set(0);
    fy.set(0);
    shine.set(0);
  };

  const mask = `url(${MEDIA.logoStatic.webp})`;

  return (
    <div
      className="relative max-w-[760px] px-3 py-5 md:px-5 md:py-6"
      style={{ perspective: 1400 }}
    >
      {/* метки обреза по углам — как на печатном постере */}
      {(
        [
          "left-0 top-0",
          "right-0 top-0 rotate-90",
          "right-0 bottom-0 rotate-180",
          "left-0 bottom-0 -rotate-90",
        ] as const
      ).map((pos) => (
        <svg
          key={pos}
          aria-hidden
          viewBox="0 0 24 24"
          className={cn("absolute size-5 text-toxic/60 md:size-7", pos)}
        >
          <path
            d="M1 9V1h8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      ))}
      <motion.div
        ref={ref}
        onPointerMove={follow ? onMove : undefined}
        onPointerLeave={follow ? onLeave : undefined}
        style={follow ? { rotateX, rotateY } : undefined}
        className="relative aspect-[900/531] w-full"
      >
        {/* мазок баллончика за логотипом — подтёки перекликаются с самим логотипом */}
        <Spray
          seed={27}
          color="var(--color-cobalt-deep)"
          drips={9}
          dots={260}
          thickness={0.38}
          className="absolute -left-[6%] top-[26%] aspect-[5/2] w-[112%] opacity-70"
        />

        {/* свечение за буквами */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0"
          style={{ x: sx, y: sy }}
        >
          <div className="animate-beat size-[min(110vw,640px)] lg:size-[46vw] lg:max-h-[640px] lg:max-w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(31_242_255/0.42)_0%,rgb(31_242_255/0.14)_38%,transparent_68%)] [--beat-scale:1.05] [--bpm:48]" />
        </motion.div>

        <Reveal kind="rise" amount={0.3} className="relative h-full w-full">
          <picture>
            {/*
              телефон в портрете: логотип ≈ 100vw − 64px, 900w даёт 2.2–2.8× — на глаз как 3×, но в 1.8 раза
              легче 1760w; альбомная ориентация и планшеты — прежний набор
            */}
            <source
              type="image/webp"
              media="(max-width: 480px)"
              srcSet={`${MEDIA.logoStatic.small} 320w, ${MEDIA.logoStatic.webp} 900w`}
              sizes="calc(100vw - 64px)"
            />
            <source
              type="image/webp"
              srcSet={`${MEDIA.logoStatic.small} 320w, ${MEDIA.logoStatic.webp} 900w, ${MEDIA.logoStatic.large} 1760w`}
              sizes="(min-width: 1024px) 46vw, 92vw"
            />
            <img
              src={MEDIA.logoStatic.png}
              width={900}
              height={531}
              alt="Химия — школа танцев"
              loading="lazy"
              decoding="async"
              draggable={false}
              className="h-full w-full object-contain drop-shadow-[0_0_22px_rgb(31_242_255/0.32)]"
            />
          </picture>

          {/* блик по буквам: маска = сам логотип, внутри едет светлое пятно (только мышь) */}
          {follow && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden"
              style={{
                opacity: shineOpacity,
                maskImage: mask,
                WebkitMaskImage: mask,
                maskSize: "100% 100%",
                WebkitMaskSize: "100% 100%",
              }}
            >
              <motion.div
                className="absolute left-0 top-0"
                style={{ x: sx, y: sy }}
              >
                <div className="size-[min(60vw,340px)] lg:size-[24vw] lg:max-h-[340px] lg:max-w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(234_244_255/0.85)_0%,rgb(140_248_255/0.45)_30%,transparent_66%)]" />
              </motion.div>
            </motion.div>
          )}
        </Reveal>

        {/* наклейка-кнопка поверх логотипа, как SUBSCRIBE в референсе */}
        <div className="absolute bottom-[2%] left-1/2 z-[2] -translate-x-1/2 md:bottom-[6%]">
          <StickerButton
            href={CONTACTS.telegram.url}
            variant="cobalt"
            size="md"
            tilt={-4}
            icon={<TelegramIcon />}
            className="whitespace-nowrap md:px-6 md:py-3.5 md:text-[0.9rem]"
          >
            Пробное — {rub(TRIAL.price)}
          </StickerButton>
        </div>
      </motion.div>
    </div>
  );
}

/** Круглая кнопка «Наверх ↑»: кольцо текста крутится, стрелка подпрыгивает при наведении. */
function UpButton({ className }: { className?: string }) {
  const id = `up-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <button
      type="button"
      onClick={(e) => jumpTo(e, "top")}
      data-cursor="hover"
      className={cn(
        // ≤359px: 96px вместо 112px — у наклейки остаётся поле справа, тень и кольцо не срезаются краем
        "group/up relative grid size-28 shrink-0 place-items-center rounded-full bg-toxic text-ink shadow-[6px_6px_0_0_var(--color-cobalt)] max-[359px]:size-24 md:size-36",
        "transition-[translate,box-shadow] duration-200 ease-[var(--ease-snap)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0_0_var(--color-cobalt)]",
        "focus-visible:outline-paper active:translate-x-[6px] active:translate-y-[6px] active:shadow-none",
        className,
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 200 200"
        className="footer-spin absolute inset-0 h-full w-full"
      >
        <defs>
          <path
            id={id}
            d="M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0"
          />
        </defs>
        <text className="display" fontSize="22" fill="currentColor">
          <textPath href={`#${id}`} textLength="486" lengthAdjust="spacing">
            НАВЕРХ ✕ НАВЕРХ ✕ НАВЕРХ ✕
          </textPath>
        </text>
      </svg>
      <span className="relative flex flex-col items-center">
        <span
          aria-hidden
          className="display text-[42px] leading-[0.7] transition-transform duration-300 ease-out-expo group-hover/up:-translate-y-1.5 max-[359px]:text-[36px]"
        >
          ↑
        </span>
        <span className="label mt-1.5 text-[0.66rem]">Наверх</span>
      </span>
    </button>
  );
}

/** Декоративный штрих-код. */
function Barcode({
  className,
  seed = 9,
}: {
  className?: string;
  seed?: number;
}) {
  const rnd = mulberry32(seed);
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  while (x < 112) {
    const w = 1 + Math.floor(rnd() * 3.2);
    bars.push({ x, w });
    x += w + 1 + Math.floor(rnd() * 2.4);
  }
  return (
    <svg
      viewBox="0 0 112 28"
      preserveAspectRatio="none"
      className={cn("block", className)}
    >
      {bars.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={0}
          width={b.w}
          height={28}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}
