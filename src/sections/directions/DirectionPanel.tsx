import { useCallback, useRef, type CSSProperties } from "react";
import { motion, useReducedMotion, useTransform, type MotionValue } from "motion/react";

import { Chevrons } from "@/components/ui/chevrons";
import { MotionBlurTitle } from "@/components/ui/motion-blur-title";
import { ScrambleText } from "@/components/ui/scramble-text";
import { Spray } from "@/components/ui/spray";
import { StickerButton, TelegramIcon } from "@/components/ui/sticker-button";
import { TornEdge } from "@/components/ui/torn-edge";
import { useScrollVelocity } from "@/hooks/useScrollVelocity";
import { CONTACTS, type Direction } from "@/lib/content";
import { cn } from "@/lib/utils";

import { Appear, DirectionPhoto, EqBars, Ticket, VideoPoster } from "./parts";
import { THEMES, type Theme } from "./themes";
import { usePanelState } from "./usePanelState";

type Props = {
  d: Direction;
  index: number;
  enter: MotionValue<number>;
  cover: MotionValue<number>;
  panelRef: (el: HTMLElement | null) => void;
};

/** Слова теглайна для ленты: «Грув. Бит. Свобода.» → ["Грув", "Бит", "Свобода", "Хип-хоп"]. Имя — кириллицей, как в заголовке. */
const tapeWords = (d: Direction) => [
  ...d.tagline
    .split(".")
    .map((s) => s.trim())
    .filter(Boolean),
  d.title,
];

const TITLE_SIZE = "whitespace-nowrap text-[25.5vw] md:text-[22vw] lg:text-[19.5vw]";

export function DirectionPanel({ d, index, enter, cover, panelRef }: Props) {
  const t = THEMES[d.id];
  const reduce = useReducedMotion();
  const electro = t.motion === "glitch";
  const fluid = t.motion === "fluid";
  const punch = t.motion === "punch";
  const flip = t.flip;

  // накрытая панель: темнеет и чуть «отклеивается»; полностью накрытая — скрыта целиком
  // (data-dir-covered), а пока она ниже экрана или накрыта — её CSS-петли выключены (data-dir-idle)
  const ref = useRef<HTMLElement | null>(null);
  const setRef = useCallback(
    (el: HTMLElement | null) => {
      ref.current = el;
      panelRef(el);
    },
    [panelRef],
  );
  const live = usePanelState(ref, enter, cover);
  const shade = useTransform(cover, [0, 1], [0, 0.78]);
  const peel = useTransform(cover, [0, 1], [0, flip ? 1.2 : -1.2]);

  // въезд панели: заголовок едет по горизонтали, кадр докручивается до своего наклона
  const dir = flip ? -1 : 1;
  const titleX = useTransform(enter, [0, 1], [`${dir * 12}%`, "0%"]);
  const frameRotate = useTransform(enter, [0, 1], [t.tilt + dir * 10, t.tilt]);
  const frameY = useTransform(enter, [0, 1], ["24%", "0%"]);
  const numberY = useTransform(enter, [0, 1], ["35%", "0%"]);

  return (
    // will-change: наклон, сдвиги и затемнение меняются каждый кадр скролла — на своих слоях их двигает
    // композитор, а не перерастрирует всю панель (Spray, размытые заголовки) на главном потоке
    <motion.article
      ref={setRef}
      id={`dir-${d.id}`}
      aria-label={`${d.number}. ${d.title}`}
      className={cn("relative min-h-svh origin-top will-change-transform", t.surface, t.text)}
      style={{ rotate: reduce ? 0 : peel }}
    >
      <TornEdge side="top" color={t.bg} fiber={t.fiber} seed={t.tornSeed} height={t.tornHeight} density={64} />

      <div className="relative flex min-h-svh flex-col overflow-hidden">
        <Decor d={d} t={t} index={index} numberY={reduce ? undefined : numberY} />

        {/* ---------- контент ---------- */}
        {/* снизу запас под рваный край следующей панели — он ложится поверх низа этой.
            На десктопе сетка не растягивается: её высоту задаёт кадр, расписание садится на его низ,
            а лишняя высота экрана (1920×1200, 2560×1440) делится поровну сверху и снизу — без пустоты посередине. */}
        <div className="relative z-10 flex flex-1 flex-col px-5 pb-24 pt-20 md:px-10 md:pt-24 lg:justify-center lg:pb-[88px] xl:px-16">
          <PanelLabel d={d} t={t} />

          <div className="relative mt-3 grid flex-1 grid-cols-12 content-start gap-x-3 gap-y-6 md:mt-4 md:gap-x-6 lg:flex-none lg:grid-rows-[auto_auto_1fr] lg:gap-y-5">
            {/* заголовок — всегда поверх кадра */}
            <motion.div
              className={cn("relative z-30 col-span-12 col-start-1 row-start-1 will-change-transform", flip && "text-right")}
              style={{ x: reduce ? 0 : titleX }}
            >
              <PanelTitle d={d} t={t} live={live} />
            </motion.div>

            {/* лид: плитка-элемент + теглайн + стили */}
            <Appear
              kind={t.motion}
              className={cn(
                "relative z-30 col-span-7 row-start-2 flex flex-col gap-4 lg:col-span-4 lg:pt-2",
                flip ? "col-start-6 items-end text-right lg:col-start-9" : "col-start-1 lg:col-start-1",
              )}
            >
              <div className={cn("flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-5", flip ? "items-end lg:flex-row-reverse" : "items-start")}>
                <DirectionPhoto
                  d={d}
                  className={cn("w-[clamp(108px,11.5vw,210px)]", t.photoFrame)}
                  style={{ rotate: `${flip ? 4 : -4}deg` }}
                />
                <p
                  className={cn(
                    electro
                      ? "font-glitch text-[21px] leading-[1.05] text-toxic md:text-[28px] lg:text-[clamp(22px,2vw,34px)]"
                      : "display text-[30px] leading-[0.88] md:text-[40px] lg:text-[clamp(30px,2.9vw,50px)]",
                  )}
                >
                  {d.tagline}
                </p>
              </div>
              <ul className={cn("flex flex-wrap gap-1.5 md:gap-2", flip && "justify-end")} aria-label="Стили">
                {d.styles.map((s, i) => (
                  <li
                    key={s}
                    className={cn("label border-[1.5px] px-2.5 py-1.5 !text-[0.7rem] md:px-3", t.chip)}
                    style={{ rotate: `${((i * 53) % 5) - 2}deg`, background: t.bg }}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </Appear>

            {/* описание */}
            <Appear
              kind={t.motion}
              delay={0.08}
              className={cn(
                // self-start: ячейка не растягивается на всю 1fr-строку — CornerMark (top-full) висит ровно под абзацем
                "relative z-30 col-span-12 col-start-1 row-start-3 lg:col-span-4 lg:row-start-3 lg:self-start",
                flip ? "lg:col-start-9 lg:text-right" : "lg:col-start-1",
              )}
            >
              <p className={cn("max-w-xl text-[15px] leading-relaxed md:text-[17px] lg:max-w-md", flip && "lg:ml-auto", t.soft)}>
                {d.description}
              </p>
              <CornerMark d={d} t={t} numberY={reduce ? undefined : numberY} />
            </Appear>

            {/* видео-кадр: на мобильном рядом с лидом, на десктопе — внешняя колонка во всю высоту */}
            <div
              className={cn(
                "relative z-20 col-span-5 row-span-1 row-start-2 self-start lg:col-span-3 lg:row-span-3 lg:row-start-1 lg:mt-[0.5vw]",
                // на широких экранах кадр (с наклоном и тенью) держим ≥40px от края панели — не срезается
                flip
                  ? "col-start-1 -ml-9 mr-1 md:-ml-6 lg:col-start-1 lg:-ml-[2.5vw] lg:mr-0 2xl:ml-[1.25vw]"
                  : "col-start-8 -mr-9 ml-1 md:-mr-6 lg:col-start-10 lg:-mr-[2.5vw] lg:ml-0 2xl:mr-[1.25vw]",
              )}
            >
              <motion.div className="will-change-transform" style={reduce ? { rotate: t.tilt } : { rotate: frameRotate, y: frameY }}>
                <div
                  className={cn(fluid && "dir-float", electro && "dir-jitter", punch && "animate-beat")}
                  style={{ "--bpm": d.bpm, "--beat-scale": 1.018 } as CSSProperties}
                >
                  <VideoPoster d={d} theme={t} cover={cover} seed={index * 11 + 2} tapeWords={tapeWords(d)} />
                </div>
              </motion.div>
            </div>

            {/* расписание + запись */}
            <Appear
              kind={t.motion}
              delay={0.16}
              className={cn(
                "relative z-30 col-span-12 col-start-1 row-start-4 flex flex-col gap-5 lg:col-span-5 lg:row-span-2 lg:row-start-2 lg:self-end",
                flip ? "lg:col-start-4 lg:pl-[2.5vw]" : "lg:col-start-5 lg:pr-[1vw]",
              )}
            >
              <div>
                <p className={cn("label mb-2.5 flex items-center gap-2", t.soft)}>
                  <span>Расписание</span>
                  <span className="h-px flex-1 bg-current opacity-30" />
                  <span>{CONTACTS.studio}</span>
                </p>
                <ul
                  className={cn("grid gap-2", d.schedule.length > 2 ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3" : "grid-cols-2")}
                  aria-label={`Расписание: ${d.title}`}
                >
                  {d.schedule.map((s, i) => (
                    <Ticket
                      key={`${s.day}-${s.time}-${i}`}
                      day={s.day}
                      time={s.time}
                      note={s.note}
                      theme={t}
                      seed={index * 10 + i}
                      dense={d.schedule.length > 2}
                    />
                  ))}
                </ul>
              </div>
              <div>
                <StickerButton
                  href={CONTACTS.telegram.url}
                  variant={t.sticker}
                  size="lg"
                  tilt={flip ? 2 : -2}
                  icon={<TelegramIcon />}
                  className={t.stickerShadow}
                  aria-label={`Записаться на ${d.title.toLowerCase()} в Telegram`}
                >
                  Записаться
                </StickerButton>
              </div>
            </Appear>
          </div>
        </div>
      </div>

      {/* затемнение, когда панель уходит под следующую */}
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-40 bg-ink will-change-[opacity]" style={{ opacity: shade }} />
    </motion.article>
  );
}

const TONE = { toxic: "text-toxic", ink: "text-ink", paper: "text-paper", cobalt: "text-cobalt" } as const;

/**
 * Шапка панели: номер + имя направления кириллицей, шевроны и эквалайзер.
 * Скобки «[NN]» остаются только у шести секций сайта.
 * Декоративная (дублирует h3) — скрыта от скринридеров; в одну строку даже на 360px.
 */
function PanelLabel({ d, t }: { d: Direction; t: Theme }) {
  return (
    <div aria-hidden className={cn("flex items-center gap-3 whitespace-nowrap md:gap-4", TONE[t.labelTone])}>
      <span className="grid h-6 min-w-8 place-items-center border-[1.5px] border-current px-1.5 font-sans text-[0.8rem] font-bold leading-none tabular-nums">
        {d.number}
      </span>
      <ScrambleText text={d.title} className="label" />
      <span className="h-px min-w-4 flex-1 bg-current opacity-25" />
      <Chevrons count={6} bpm={d.bpm} className="h-3.5" size="0.9rem" />
      <EqBars bpm={d.bpm} />
    </div>
  );
}

/** Фон панели: мазок баллончика, полутон, свечение, сканлайны, огромный контурный номер. */
function Decor({ d, t, index, numberY }: { d: Direction; t: Theme; index: number; numberY?: MotionValue<string> }) {
  const electro = t.motion === "glitch";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {t.spray && (
        <Spray
          seed={index * 7 + 3}
          color={t.spray}
          drips={electro ? 5 : 9}
          className={cn(
            "absolute aspect-[5/2] w-[170%] md:w-[90%]",
            t.flip
              ? "-left-[45%] top-[30%] rotate-[7deg] md:-left-[30%] md:top-[36%]"
              : "-right-[50%] top-[30%] -rotate-[7deg] md:-right-[24%] md:top-[36%]",
            electro ? "opacity-60" : "opacity-95",
          )}
        />
      )}
      {t.motion === "fluid" && (
        <>
          <FlowLines />
          <div className="absolute -right-[25%] top-[6%] size-[90vw] rounded-full bg-[radial-gradient(closest-side,var(--color-toxic-soft),transparent)] opacity-80 md:size-[55vw]" />
          <div className="absolute -left-[25%] bottom-[-20%] size-[80vw] rounded-full bg-[radial-gradient(closest-side,rgb(10_87_255/0.2),transparent)] md:size-[45vw]" />
        </>
      )}
      {t.motion === "sleek" && (
        <div className="absolute inset-0 bg-[repeating-linear-gradient(115deg,rgb(234_244_255/0.07)_0_1px,transparent_1px_46px)]" />
      )}
      {electro && (
        <>
          <div className="absolute left-[10%] top-[40%] size-[90vw] rounded-full bg-[radial-gradient(closest-side,rgb(31_242_255/0.14),transparent)] md:size-[60vw]" />
          <div className="scanlines absolute inset-0" />
          <div className="dir-scanbar absolute inset-0" style={{ "--bpm": d.bpm } as CSSProperties} />
        </>
      )}
      {/* Мобильный/планшет: «пустой угол» справа от кнопки «Записаться» — огромный контурный номер
          (и полутон хип-хопа) уходят за нижний край. Маска гасит всё выше нижней трети панели, чтобы
          штрихи не заходили на билеты и подписи. На десктопе номер живёт под описанием (CornerMark). */}
      <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent_64%,#000_80%)] lg:hidden">
        {t.motion === "punch" && (
          <div className="halftone halftone-fade absolute -bottom-[14%] -right-[24%] size-[85vw] text-ink/30 [--dot:9px] md:size-[50vw]" />
        )}
        <OutlineNumber d={d} t={t} numberY={numberY} className="absolute -bottom-[5%] -right-[2%] text-[50vw] md:text-[32vw]" />
      </div>
    </div>
  );
}

/** Огромный контурный номер направления («атомный номер»). */
function OutlineNumber({
  d,
  t,
  numberY,
  className,
}: {
  d: Direction;
  t: Theme;
  numberY?: MotionValue<string>;
  className?: string;
}) {
  return (
    <motion.span
      aria-hidden
      className={cn(
        "display block will-change-transform",
        // .text-outline берёт обводку из currentColor, а сам же ставит color: transparent — задаём цвет обводки явно
        "text-transparent [-webkit-text-stroke:var(--num-stroke)]",
        t.motion === "glitch" ? "opacity-45" : "opacity-30",
        className,
        // после размера шрифта: tailwind-merge выкидывает leading-*, стоящий перед text-[…]
        "leading-none",
      )}
      style={{ y: numberY ?? 0, "--num-stroke": `2px ${t.numberStroke}` } as CSSProperties & Record<string, unknown>}
    >
      {d.number}
    </motion.span>
  );
}

/**
 * Десктоп: номер (и полутон хип-хопа) подвешены прямо под абзацем описания, во внешней от кадра колонке,
 * и уходят за нижний край панели. Якорь — сам текст, поэтому штрихи никогда не пересекают абзац:
 * на высоком экране номер виден почти целиком, на низком — просто глубже срезается краем.
 */
function CornerMark({ d, t, numberY }: { d: Direction; t: Theme; numberY?: MotionValue<string> }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute top-full mt-3 hidden lg:block", t.flip ? "right-0" : "left-0")}
    >
      {t.motion === "punch" && (
        <div className="halftone halftone-fade absolute -left-[7vw] -top-[2vw] size-[32vw] text-ink/30 [--dot:9px]" />
      )}
      {/* при leading-none верх цифр этого шрифта — на 0.14em ниже бокса, низ — на 0.8em: поднимаем бокс,
          чтобы цифры начинались сразу под абзацем; маска мягко проявляет их верхнюю четверть */}
      <OutlineNumber
        d={d}
        t={t}
        numberY={numberY}
        className={cn(
          "relative -mt-[0.1em] text-[24vw] [mask-image:linear-gradient(to_bottom,transparent_14%,#000_42%)]",
          t.flip ? "-mr-[0.04em]" : "-ml-[0.06em]",
        )}
      />
    </div>
  );
}

/**
 * Контемп: тонкие «траектории движения» прорисовываются через панель. Видимая (после маски) середина
 * идёт по зазору между заголовком и расписанием и уходит под кадр — линии не режут подписи и билеты.
 */
const FLOW = [
  "M-40 700 C 260 680, 420 470, 700 430 S 1080 330, 1500 300",
  "M-40 745 C 280 725, 440 515, 720 475 S 1100 375, 1500 345",
  "M-40 790 C 300 770, 460 560, 740 520 S 1120 420, 1500 390",
];

function FlowLines() {
  const reduce = useReducedMotion();
  return (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="none"
      className="absolute inset-0 hidden h-full w-full lg:block [mask-image:linear-gradient(90deg,transparent_30%,#000_42%)]"
    >
      {FLOW.map((dPath, i) => (
        <motion.path
          key={i}
          d={dPath}
          fill="none"
          stroke={i === 1 ? "var(--color-cobalt)" : "var(--color-toxic-deep)"}
          strokeWidth={i === 1 ? 2 : 1.25}
          strokeOpacity={i === 1 ? 0.45 : 0.5}
          vectorEffect="non-scaling-stroke"
          initial={reduce ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 2.6, delay: 0.3 + i * 0.25, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </svg>
  );
}

/**
 * Скорость скролла → перекос группы (заголовок + его «тень» перекашиваются вместе).
 * Скорость — общая на страницу пружина (как у MotionBlurTitle); пока панель вне экрана или накрыта
 * (live = 0), перекос стоит на нуле — стиль не пишется каждый кадр скролла по соседним секциям.
 */
function useVelocitySkew(live: MotionValue<number>, enabled: boolean) {
  const v = useScrollVelocity({ damping: 40, stiffness: 300 }, enabled);
  return useTransform([v, live], ([vel, on]: number[]) => (on ? Math.max(-7, Math.min(7, (-vel * 7) / 2500)) : 0));
}

/**
 * Заголовок панели. На светлых панелях смазанные края «пачкаются», поэтому там другой приём:
 * хип-хоп — сбитая печать (жёсткая кобальтовая копия со сдвигом), контемп — мягкий шлейф-эхо.
 * Хилс — фирменный motion blur, электро — неон + RGB-сдвиг.
 */
function PanelTitle({ d, t, live }: { d: Direction; t: Theme; live: MotionValue<number> }) {
  const bleed = t.flip ? "-mr-[0.05em]" : "-ml-[0.05em]";

  if (t.motion === "glitch") {
    return (
      <div className="relative inline-block">
        <MotionBlurTitle as="h3" text={d.title} className={cn(TITLE_SIZE, "text-toxic glow-toxic", bleed)} />
        {(["dir-glitch-a text-cobalt", "dir-glitch-b text-paper"] as const).map((c) => (
          <span
            key={c}
            aria-hidden
            className={cn("display pointer-events-none absolute inset-0 mix-blend-screen motion-reduce:hidden", TITLE_SIZE, bleed, c)}
            style={{ "--bpm": d.bpm } as CSSProperties}
          >
            {d.title}
          </span>
        ))}
      </div>
    );
  }

  if (t.motion === "sleek") {
    return (
      <MotionBlurTitle
        as="h3"
        text={d.title}
        blur={t.flip ? "left" : "right"}
        edge={7}
        className={cn(TITLE_SIZE, t.text, bleed)}
        accents={{ 1: "text-toxic" }}
      />
    );
  }

  return <EchoTitle d={d} t={t} live={live} bleed={bleed} />;
}

/** Хип-хоп и контемп: заголовок с «эхом» (сбитая печать / мягкий шлейф), перекос по скорости — всей группой. */
function EchoTitle({ d, t, live, bleed }: { d: Direction; t: Theme; live: MotionValue<number>; bleed: string }) {
  const reduce = useReducedMotion();
  const skewX = useVelocitySkew(live, !reduce);
  const punch = t.motion === "punch";
  const echoes = punch
    ? [{ cls: "text-cobalt", x: "0.045em", y: "0.04em", o: 1 }]
    : [
        { cls: "text-cobalt", x: "0.08em", y: "0", o: 0.22 },
        { cls: "text-toxic-deep", x: "0.16em", y: "0", o: 0.14 },
      ];

  return (
    <motion.div className="relative inline-block" style={reduce ? undefined : { skewX, willChange: "transform" }}>
      {echoes.map((e, i) => (
        <motion.span
          key={i}
          aria-hidden
          className={cn("display pointer-events-none absolute left-0 top-0 block", TITLE_SIZE, bleed, e.cls)}
          initial={reduce ? false : { opacity: 0, x: "0em", y: "0em" }}
          whileInView={{ opacity: e.o, x: e.x, y: e.y }}
          viewport={{ once: true, amount: 0.4 }}
          transition={
            punch
              ? { type: "spring", stiffness: 420, damping: 14, delay: 0.45 }
              : { duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.4 + i * 0.15 }
          }
        >
          {d.title}
        </motion.span>
      ))}
      <MotionBlurTitle as="h3" text={d.title} blur="none" velocitySkew={false} className={cn(TITLE_SIZE, t.text, bleed)} />
    </motion.div>
  );
}
