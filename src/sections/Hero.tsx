import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";

import { navigateTo } from "@/components/layout/nav/navigate";
import { LoopVideo } from "@/components/ui/loop-video";
import { Magnetic } from "@/components/ui/magnetic";
import { MotionBlurTitle } from "@/components/ui/motion-blur-title";
import { ScrambleText } from "@/components/ui/scramble-text";
import { StickerButton, TelegramIcon } from "@/components/ui/sticker-button";
import { Tape } from "@/components/ui/tape";
import { VelocityMarquee } from "@/components/ui/velocity-marquee";
import { useMedia } from "@/hooks/useMedia";
import { CONTACTS, MEDIA, TRIAL } from "@/lib/content";
import { onReady } from "@/lib/ready";
import { rub } from "@/lib/utils";

import { SpinSticker, fadeIn, riseIn } from "./hero/parts";
import { blurFrom, blurTo } from "@/lib/motion";

const EASE = [0.16, 1, 0.3, 1] as const;
const TAPE = ["ХИМИЯ", "ХИП-ХОП", "ХАЙ ХИЛС", "КОНТЕМП", "ЭЛЕКТРО"];

// контурные буквы: утилиту text-outline перебивает цвет текста, поэтому inline
const OUTLINE: CSSProperties = { color: "transparent", WebkitTextStroke: "2px rgb(10 87 255 / 0.75)" };

/*
 * Петля логотипа. Телефон (портрет и боком) получает 1280×720 (MEDIA.logoLoop.phone): кадр там ≈ 550–590 CSS px,
 * а 1080p — это лишние ~40% байт на мобильной сети и в 2.25 раза больше пикселей на декод каждого кадра.
 * Выбираем один раз до первого рендера: <source> вставляются однократно. Запрос — тот же, что у preload
 * постера в index.html: менять вместе.
 */
const PHONE = "(max-width: 767px), (max-height: 500px)";
const pickLoop = () => (window.matchMedia(PHONE).matches ? MEDIA.logoLoop.phone : MEDIA.logoLoop);

/** Directions начинается на 100svh из 145svh высоты hero: дальше hero целиком под ней. */
const COVERED_AT = 100 / 145;

/*
 * Раскладка. Портрет (телефон, планшет стоя) — колонка: шапка постера / логотип / слоган и CTA.
 * Ландшафт — постер поверх кадра: логотип по центру, внизу слева полоса «подпись + слоган + CTA»,
 * справа наклейка, прижавшая скотч. Размер кадра считается от свободной высоты между баром (--rt)
 * и нижней полосой (--rb): логотип с подтёками занимает ≈ 0.155…0.865 высоты кадра 16:9,
 * т.е. ширина кадра = свободная высота × 2.5. Падающие капли гаснут маской ниже кончиков подтёков,
 * поэтому в слоган не попадают.
 */
const CSS = `
.hx {
  --rt: 68px;
  --hb: max(76px, 7.5svh);
  --tg: clamp(30px, 3.1vw, 48px);
  --tl: 2;
  --rb: calc(var(--hb) + 36px + var(--tl) * 0.84 * var(--tg));
}
@media (min-width: 1360px) { .hx { --tl: 1; } }
/* телефон боком: слоган от высоты экрана (22px читался подписью при пустой ширине); кадр логотипа
   сам ужимается по --rb */
@media (max-height: 500px) {
  .hx { --rt: 50px; --hb: 74px; --tg: clamp(22px, 8svh, 36px); --tl: 2; --rb: calc(var(--hb) + 10px + 1.68 * var(--tg)); }
}
/* портрет: кадр 150% ширины (логотип ≈ 94% экрана), но логотип с подтёками влезает по высоте зоны с запасом;
   если по высоте есть свободное место — чуть ниже центра, ближе к слогану */
.hx-frame {
  --w: min(150cqw, 240cqh);
  left: 50%;
  width: var(--w);
  top: calc(50cqh + clamp(0px, 50cqh - 0.211 * var(--w) - 10px, 4cqh));
  translate: -50% -50%;
}
@media (orientation: landscape) {
  .hx-frame {
    width: min(116cqw, (100cqh - var(--rt) - var(--rb)) * 2.5);
    top: calc(var(--rt) + (100cqh - var(--rt) - var(--rb)) / 2);
  }
}
.hx-video {
  -webkit-mask-image: linear-gradient(#000 87%, transparent 93%);
  mask-image: linear-gradient(#000 87%, transparent 93%);
}
/* hero целиком под Directions: не рисуем и не считаем его (видео на паузе — проп paused) */
.hx[data-covered] { content-visibility: hidden; }
.hx[data-covered] *, .hx[data-covered] *::before, .hx[data-covered] *::after { animation-play-state: paused !important; }
`;

const videoIn: Variants = {
  off: { opacity: 0, scale: 1.15, ...blurFrom(30) },
  on: {
    opacity: 1,
    scale: 1,
    ...blurTo(),
    transition: { duration: 1.1, ease: EASE },
    transitionEnd: { filter: "none" },
  },
};

const tapeIn: Variants = {
  off: ({ x, y }: { x: number; y: number; d: number }) => ({ opacity: 0, scale: 1.25, x, y }),
  on: ({ d }: { x: number; y: number; d: number }) => ({
    opacity: 1,
    scale: 1,
    x: 0,
    y: 0,
    transition: { type: "spring", stiffness: 380, damping: 20, mass: 0.9, delay: d },
  }),
};

const stickerIn: Variants = {
  off: { opacity: 0, scale: 1.8, rotate: -40 },
  on: { opacity: 1, scale: 1, rotate: -8, transition: { type: "spring", stiffness: 400, damping: 16, delay: 0.62 } },
};

/** Скотч обрезан ножницами: зубчатый левый конец (у ленты справа он уходит под наклейку). */
const CUT_END = "polygon(9px 0, 100% 0, 100% 100%, 5px 100%, 0 84%, 8px 67%, 2px 50%, 9px 33%, 1px 16%)";

/** Лента-скотч с бликом пластика поверх. */
function HeroTape({
  variant,
  reverse,
  speed,
  className,
  style,
}: {
  variant: "toxic" | "cobalt";
  reverse?: boolean;
  speed: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`relative ${className ?? ""}`} style={style}>
      <Tape
        text={TAPE}
        variant={variant}
        reverse={reverse}
        speed={speed}
        className="w-full"
        textClassName="text-[clamp(17px,1.9vw,30px)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgb(255_255_255/0.45)_0%,transparent_38%,transparent_70%,rgb(0_0_0/0.14)_100%)] mix-blend-soft-light"
      />
    </div>
  );
}

const sticker = <SpinSticker text={`ПРОБНОЕ ЗАНЯТИЕ ✕ ${TRIAL.minutes} МИНУТ ✕ `} center={rub(TRIAL.price)} />;

/** Магнит — только под мышью: на тач-экране это лишняя обёртка с двумя пружинами. */
function Mag({ on, children }: { on: boolean; children: ReactNode }) {
  return on ? <Magnetic strength={0.25}>{children}</Magnetic> : children;
}

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [go, setGo] = useState(false);
  const [loop] = useState(pickLoop);
  // параллакс и магниты — только для мыши; на телефоне кадр с видео остаётся без 3D-трансформа
  const fine = useMedia("(hover: hover) and (pointer: fine)");

  // интро стартует, когда прелоадер ушёл (в ?only=hero — сразу)
  useEffect(() => onReady(() => setGo(true)), []);

  /* --- «Отодвигание» сцены, пока Directions наезжает снизу (последние 45svh) --- */
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const stageScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 0.88]);
  const stageY = useTransform(scrollYProgress, [0, 1], ["0svh", reduce ? "0svh" : "-4svh"]);
  const dim = useTransform(scrollYProgress, [0, 1], [0, 0.55]);
  const headOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const headY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -70]);
  const ctaOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const tapeX = useTransform(scrollYProgress, [0, 1], ["0vw", reduce ? "0vw" : "-10vw"]);
  const tapeY = useTransform(scrollYProgress, [0, 1], ["0svh", reduce ? "0svh" : "-12svh"]);

  /* --- Hero накрыт Directions целиком: видео на паузу, сцену не рисуем --- */
  const { scrollYProgress: passed } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const [covered, setCovered] = useState(false);
  useMotionValueEvent(passed, "change", (p) => setCovered(p > COVERED_AT + 0.002));

  /* --- Параллакс за мышью: кадр с логотипом плывёт и наклоняется, фон — навстречу --- */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 90, damping: 18, mass: 0.7 };
  const sx = useSpring(mx, spring);
  const sy = useSpring(my, spring);
  const vx = useTransform(sx, (v) => v * 10);
  const vy = useTransform(sy, (v) => v * 10);
  const rotY = useTransform(sx, (v) => v * 3);
  const rotX = useTransform(sy, (v) => v * -3);
  const bgX = useTransform(sx, (v) => v * -22);
  const bgY = useTransform(sy, (v) => v * -12);

  useEffect(() => {
    if (reduce || !fine) return;
    const onMove = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth) * 2 - 1);
      my.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, fine, mx, my]);

  const toDirections = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigateTo("directions", { keyboard: e.detail === 0 });
  };

  // < 360px (iPhone SE 1, узкие Android) обе наклейки должны влезть в одну строку
  const btn =
    "whitespace-nowrap px-3.5 text-[0.75rem] tracking-[0.06em] max-[359px]:gap-1.5 max-[359px]:px-2.5 max-[359px]:text-[0.69rem] max-[359px]:tracking-[0.03em] md:px-6 md:py-3.5 md:text-[0.88rem] md:tracking-[0.1em] xl:px-7 xl:py-4 xl:text-[0.95rem] [@media(max-height:500px)]:px-3.5 [@media(max-height:500px)]:py-2.5 [@media(max-height:500px)]:text-[0.72rem]";

  return (
    <section ref={ref} id="top" className="relative isolate h-[145svh] bg-ink">
      <h1 className="sr-only">Химия — школа танцев в Ставрополе</h1>

      <div className="hx sticky top-0 h-svh overflow-hidden bg-ink" data-covered={covered || undefined}>
        <style>{CSS}</style>

        {/* свой слой: «отодвигание» на скролле — работа композитора, а не перерисовка всей сцены */}
        <motion.div
          className="absolute inset-0 origin-[50%_45%] will-change-transform"
          style={{ scale: stageScale, y: stageY }}
          initial={reduce ? false : "off"}
          animate={reduce || go ? "on" : "off"}
        >
          <div className="absolute inset-0 flex flex-col landscape:block">
            {/* --- портрет: шапка постера — подпись, скотч поперёк, наклейка поверх скотча (pb — запас под наклон скотча) --- */}
            <motion.div
              aria-hidden
              className="relative z-[5] shrink-0 pb-[4.5vw] pt-[84px] will-change-[opacity,transform] md:pt-[104px] landscape:hidden [@media(max-height:700px)]:pt-[76px]"
              style={{ opacity: headOpacity, y: headY }}
            >
              <div className="flex min-h-[2.6rem] flex-col gap-1 px-6 md:min-h-[3.2rem] md:px-10">
                {go && (
                  <>
                    <ScrambleText text="Школа танцев" className="label block text-paper md:text-[0.95rem]" duration={650} />
                    <ScrambleText text="Ставрополь" className="label block text-toxic md:text-[0.95rem]" duration={800} />
                  </>
                )}
              </div>
              <motion.div className="-mx-[8vw] mt-5 md:mt-8" style={{ x: tapeX }}>
                <motion.div variants={tapeIn} custom={{ x: -120, y: 0, d: 0.32 }}>
                  <HeroTape variant="toxic" speed={26} className="-rotate-[5deg]" />
                </motion.div>
              </motion.div>
              <div className="pointer-events-none absolute right-5 top-[66px] w-[clamp(92px,25vw,168px)] md:right-10 md:top-[80px] [@media(max-height:700px)]:top-[58px] [@media(max-height:700px)]:w-[84px]">
                <motion.div variants={stickerIn}>{sticker}</motion.div>
              </div>
            </motion.div>

            {/* --- зона логотипа: контейнер, по которому считается размер кадра --- */}
            <div className="relative z-[1] min-h-0 flex-1 [container-type:size] landscape:absolute landscape:inset-0">
              {/* фон: гигантская контурная строка и полутон — видны сквозь тёмный фон видео (lighten) */}
              <motion.div aria-hidden className="absolute inset-0" style={fine ? { x: bgX, y: bgY } : undefined}>
                <motion.div
                  variants={fadeIn}
                  custom={0.25}
                  className="absolute inset-x-0 top-1/2 -translate-y-1/2 landscape:top-[calc(var(--rt)+(100%-var(--rt)-var(--rb))/2)]"
                >
                  {/* под Directions строку не крутим: у VelocityMarquee нет паузы, а её кадры шли бы и за кадром */}
                  {!covered && (
                    <VelocityMarquee baseVelocity={-1.1} copies={3} itemClassName="display text-[30svh] leading-[0.9] landscape:text-[46svh]">
                      <span style={OUTLINE}>Школа танцев ✕ Ставрополь ✕</span>
                    </VelocityMarquee>
                  )}
                </motion.div>
                <div className="halftone absolute -left-[10%] bottom-[-10%] h-[60%] w-[55%] text-cobalt opacity-40 [--dot:9px] [mask-image:radial-gradient(closest-side,#000,transparent)]" />
                <div className="halftone absolute -right-[12%] top-[-8%] h-[55%] w-[50%] text-cobalt-deep opacity-35 [--dot:8px] [mask-image:radial-gradient(closest-side,#000,transparent)]" />
              </motion.div>

              {/* кадр 16:9 с логотипом (логотип ≈ 63% ширины кадра); размеры и позиция — .hx-frame */}
              <motion.div
                aria-hidden
                className="hx-frame absolute aspect-video mix-blend-lighten"
                style={fine ? { x: vx, y: vy, rotateX: rotX, rotateY: rotY, transformPerspective: 1400 } : undefined}
              >
                <motion.div variants={videoIn} className="h-full w-full">
                  <LoopVideo
                    eager
                    src={loop.mp4}
                    webm={loop.webm}
                    poster={loop.poster}
                    paused={covered}
                    className="hx-video h-full w-full object-cover"
                  />
                </motion.div>
              </motion.div>
            </div>

            {/* --- низ: (ландшафт) подпись школы, слоган, CTA --- */}
            <motion.div
              className="relative z-[6] flex shrink-0 flex-col items-start gap-5 px-6 pb-[96px] will-change-[opacity] max-[359px]:px-5 md:gap-7 md:px-10 md:pb-[120px] landscape:absolute landscape:inset-x-0 landscape:bottom-[var(--hb)] landscape:flex-row landscape:items-end landscape:gap-8 landscape:pl-[max(48px,env(safe-area-inset-left))] landscape:pr-[max(48px,env(safe-area-inset-right))] landscape:pb-0 xl:landscape:gap-10 xl:landscape:px-16 portrait:[@media(max-height:700px)]:gap-4 portrait:[@media(max-height:700px)]:pb-[84px] [@media(max-height:500px)]:gap-6 [@media(max-height:500px)]:pl-[max(24px,env(safe-area-inset-left))] [@media(max-height:500px)]:pr-[max(24px,env(safe-area-inset-right))]"
              style={{ opacity: ctaOpacity }}
            >
              <motion.div variants={riseIn} custom={0.42} className="min-w-0">
                <span aria-hidden className="label mb-2.5 hidden text-paper/85 landscape:block [@media(max-height:500px)]:hidden">
                  {go && (
                    <>
                      <ScrambleText text="Школа танцев" duration={650} /> <span className="text-toxic">✕</span>{" "}
                      <ScrambleText text={CONTACTS.city} className="text-toxic" duration={800} />
                    </>
                  )}
                </span>
                {/* портрет: каждая строка — в одну строку и в запасном шрифте, высота блока не меняется, когда приходит
                    Sofia (CLS). Боком блок не зажат по ширине — там перенос остаётся страховкой от наезда на CTA */}
                <p className="display flex flex-col text-[clamp(28px,11vw,72px)] text-paper portrait:whitespace-nowrap landscape:text-[length:var(--tg)] min-[1360px]:landscape:flex-row min-[1360px]:landscape:gap-[0.2em]">
                  <MotionBlurTitle
                    as="span"
                    text="Твоя химия с танцем"
                    blur="left"
                    edge={7}
                    reveal={false}
                    velocitySkew={false}
                    accents={{ 1: "text-toxic" }}
                    className="block"
                  />
                  <MotionBlurTitle as="span" text="начинается здесь" blur="right" edge={7} reveal={false} velocitySkew={false} className="block" />
                </p>
              </motion.div>
              <motion.div
                variants={riseIn}
                custom={0.52}
                className="pointer-events-auto flex shrink-0 flex-wrap items-center gap-3 max-[359px]:gap-2 md:gap-5 landscape:pb-1 [@media(max-height:500px)]:gap-3"
              >
                <Mag on={fine}>
                  <StickerButton
                    href={CONTACTS.telegram.url}
                    variant="toxic"
                    tilt={-3}
                    icon={<TelegramIcon />}
                    aria-label={`Пробное — ${rub(TRIAL.price)}: записаться в Telegram`}
                    className={btn}
                  >
                    Пробное — {rub(TRIAL.price)}
                  </StickerButton>
                </Mag>
                <Mag on={fine}>
                  {/* у outline-варианта ring перебивается shadow-hard — рамку рисуем border, подложка прячет капли */}
                  <StickerButton
                    href="#directions"
                    variant="outline"
                    tilt={2}
                    onClick={toDirections}
                    className={`${btn} border border-paper/70 bg-ink`}
                  >
                    Направления
                  </StickerButton>
                </Mag>
              </motion.div>
            </motion.div>
          </div>

          {/* --- виньетка и сканлайны (слои с запасом за края: при «отодвигании» их границы не читаются) --- */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-[8%] z-[3] bg-[radial-gradient(ellipse_65%_60%_at_50%_47%,transparent_55%,rgb(3_6_13/0.85)_100%)]"
          />
          <div aria-hidden className="scanlines pointer-events-none absolute -inset-[8%] z-[3] opacity-45" />

          {/* --- ландшафт: скотч от наклейки уходит за правый край, нижний конец прижат наклейкой --- */}
          <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-[5] hidden landscape:block" style={{ opacity: ctaOpacity }}>
            <motion.div
              className="absolute bottom-[calc(var(--hb)+clamp(108px,9vw,150px)/2)] right-[calc(max(3vw,32px)+clamp(108px,9vw,150px)/2-23px)] top-[30%] w-[46px] origin-bottom rotate-[22deg] [container-type:size] [@media(max-height:500px)]:hidden"
              style={{ y: tapeY }}
            >
              <motion.div variants={tapeIn} custom={{ x: 90, y: -120, d: 0.36 }} className="absolute inset-0">
                <HeroTape
                  variant="cobalt"
                  speed={24}
                  className="absolute left-1/2 top-1/2 w-[100cqh] -translate-x-1/2 -translate-y-1/2 -rotate-90"
                  style={{ clipPath: CUT_END }}
                />
              </motion.div>
            </motion.div>
            <div className="absolute bottom-[var(--hb)] right-[max(3vw,32px)] w-[clamp(108px,9vw,150px)] [@media(max-height:500px)]:bottom-auto [@media(max-height:500px)]:right-[max(4vw,env(safe-area-inset-right))] [@media(max-height:500px)]:top-[calc(var(--rt)+(100%-var(--rt)-var(--rb))/2)] [@media(max-height:500px)]:w-[84px] [@media(max-height:500px)]:-translate-y-1/2">
              <motion.div variants={stickerIn}>{sticker}</motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* затемнение при наезде следующей секции */}
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-[7] bg-ink will-change-[opacity]" style={{ opacity: dim }} />
      </div>
    </section>
  );
}
