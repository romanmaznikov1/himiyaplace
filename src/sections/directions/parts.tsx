import { useMemo, type CSSProperties, type ReactNode } from "react";
import { motion, useReducedMotion, type MotionValue } from "motion/react";

import { Duotone, LoopVideo } from "@/components/ui/loop-video";
import { Tape } from "@/components/ui/tape";
import { tornClipPath } from "@/components/ui/torn-edge";
import type { Direction } from "@/lib/content";
import { cn, mulberry32 } from "@/lib/utils";

import { APPEAR, type Motion, type Theme } from "./themes";
import { useCovered } from "./usePanelState";

/** Появление блока с «характером» направления. */
export function Appear({
  kind,
  delay = 0,
  className,
  children,
  style,
}: {
  kind: Motion;
  delay?: number;
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const reduce = useReducedMotion();
  const p = APPEAR[kind];
  if (reduce)
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  return (
    <motion.div
      className={className}
      style={style}
      initial={p.initial}
      whileInView={p.animate}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ ...p.transition, delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Фото-постер направления: наклеенная карточка 3:4 с бумажной рамкой и жёсткой тенью.
 * Стоит рядом со слоганом — там, где раньше была плитка «элемента».
 */
export function DirectionPhoto({ d, className, style }: { d: Direction; className?: string; style?: CSSProperties }) {
  return (
    <figure className={cn("relative aspect-[3/4] shrink-0 p-1.5 shadow-hard md:p-2", className)} style={style}>
      <picture className="block h-full w-full overflow-hidden">
        <source type="image/webp" srcSet={`${d.photo.webp480} 480w, ${d.photo.webp900} 900w`} sizes="(min-width: 1024px) 180px, 120px" />
        <img
          src={d.photo.jpg}
          width={900}
          height={1200}
          alt={`${d.title}: иллюстрация направления`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </picture>
    </figure>
  );
}

/** Штрих-код из детерминированных полос — одним <path> (было по <rect> на полосу: ~20 узлов на билет). */
export function Barcode({ seed, className }: { seed: number; className?: string }) {
  const d = useMemo(() => {
    const r = mulberry32(seed * 131 + 5);
    let path = "";
    let y = 0;
    while (y < 58) {
      const h = 0.7 + Math.floor(r() * 3) * 0.9;
      path += `M0 ${+y.toFixed(3)}h12v${+h.toFixed(3)}h-12Z`;
      y += h + 0.8 + r() * 1.4;
    }
    return path;
  }, [seed]);
  return (
    <svg aria-hidden viewBox="0 0 12 60" preserveAspectRatio="none" className={className}>
      <path d={d} fill="currentColor" />
    </svg>
  );
}

/**
 * Билетик расписания: день | перфорация | время + кто ведёт | штрих-код.
 * dense — плотная сетка (3 колонки на xl, 2 колонки на телефоне уже 360px): там штрих-код уступает место
 * подписи, чтобы «женственный» не обрезался.
 */
export function Ticket({
  day,
  time,
  note,
  theme,
  seed,
  dense = false,
}: {
  day: string;
  time: string;
  note?: string;
  theme: Theme;
  seed: number;
  dense?: boolean;
}) {
  const notch = { background: theme.bg } as CSSProperties;
  return (
    <li className={cn("relative flex h-[3.4rem] min-w-0 items-stretch md:h-[3.9rem]", theme.ticket)}>
      <span className="display grid w-[2.6rem] shrink-0 place-items-center text-[1.45rem] leading-none md:w-[3.1rem] md:text-[1.8rem]">
        {day}
      </span>
      <span aria-hidden className="relative w-0 border-l-2 border-dashed border-current opacity-45">
        <span className="absolute -top-[7px] -left-[7px] size-3 rounded-full" style={notch} />
        <span className="absolute -bottom-[7px] -left-[7px] size-3 rounded-full" style={notch} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center pl-2 pr-1.5 md:pl-3 md:pr-2">
        <span className="display text-[1.45rem] leading-none tabular-nums md:text-[1.8rem]">{time}</span>
        {/* кто ведёт — функциональный факт: без прозрачности, крупнее 11px; узкий display-шрифт помещает «женственный» */}
        {note && (
          <span className="display mt-1 truncate text-[0.9rem] font-bold leading-none tracking-[0.01em]" title={note}>
            {note}
          </span>
        )}
      </span>
      <Barcode seed={seed} className={cn("my-2 mr-1.5 w-2.5 shrink-0 opacity-70 md:mr-2 md:w-3.5", dense && "max-[359px]:hidden xl:hidden")} />
    </li>
  );
}

/** Эквалайзер в ритме направления (декор, без цифр). */
export function EqBars({ bpm, className }: { bpm: number; className?: string }) {
  return (
    <span aria-hidden className={cn("flex h-3.5 shrink-0 items-end gap-[3px]", className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="dir-eq block h-full w-[3px] bg-current"
          style={{ "--bpm": bpm, animationDelay: `${(-i * 37) % 100}ms` } as CSSProperties}
        />
      ))}
    </span>
  );
}

/**
 * Видео как наклеенное фото: рваные края, жёсткая цветная тень, полоски скотча по углам,
 * лента с бегущим текстом поперёк.
 */
export function VideoPoster({
  d,
  theme,
  cover,
  seed,
  tapeWords,
  className,
}: {
  d: Direction;
  theme: Theme;
  /** Насколько панель накрыта следующей (0…1): накрытую целиком — видео на паузу. */
  cover: MotionValue<number>;
  seed: number;
  tapeWords: string[];
  className?: string;
}) {
  const clip = useMemo(() => tornClipPath(seed, { top: true, right: true, bottom: true, left: true }, 1.6, 28), [seed]);
  const electro = theme.motion === "glitch";
  const heels = theme.motion === "sleek";

  return (
    <figure className={cn("relative aspect-[9/16]", className)}>
      <div
        aria-hidden
        className="absolute inset-0 translate-x-[5%] translate-y-[3.5%]"
        style={{ clipPath: clip, background: theme.frameShadow }}
      />
      <div className={cn("absolute inset-0 overflow-hidden p-[3.2%]", theme.frame)} style={{ clipPath: clip }}>
        <Duotone className="h-full w-full" shadow={theme.duo.shadow} highlight={theme.duo.highlight}>
          <PanelLoop d={d} cover={cover} className={theme.videoTone} />
        </Duotone>
        {/* печатный полутон поверх кадра */}
        <div
          aria-hidden
          className="halftone pointer-events-none absolute inset-[3.2%] text-ink opacity-25 mix-blend-multiply [--dot:5px]"
        />
        {electro && <div aria-hidden className="scanlines pointer-events-none absolute inset-[3.2%] opacity-90" />}
        {heels && (
          <div aria-hidden className="pointer-events-none absolute inset-[3.2%] overflow-hidden">
            <div className="dir-sheen absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
          </div>
        )}
      </div>
      {electro && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-[2px] shadow-[0_0_0_2px_var(--color-toxic),0_0_38px_4px_rgb(31_242_255/0.45)]"
          style={{ clipPath: clip }}
        />
      )}
      {/* скотч по углам */}
      <span aria-hidden className="absolute -top-[2%] left-[10%] h-[4.5%] w-[30%] -rotate-[8deg] bg-paper/45" style={{ clipPath: TAPE_CLIP }} />
      <span aria-hidden className="absolute -bottom-[1.5%] right-[8%] h-[4.5%] w-[28%] rotate-[10deg] bg-paper/45" style={{ clipPath: TAPE_CLIP }} />
      {/* лента уходит за внешний край панели, не залезая на текст */}
      <Tape
        text={tapeWords}
        variant={theme.tape}
        rotate={theme.flip ? 8 : -8}
        speed={Math.round((60 / d.bpm) * 24)}
        reverse={theme.flip}
        className={cn("absolute bottom-[14%] z-[3] w-[160%]", theme.flip ? "-right-[5%]" : "-left-[5%]")}
        textClassName="text-[clamp(14px,1.45vw,24px)]"
      />
      <figcaption className="sr-only">Фрагмент занятия: {d.title}</figcaption>
    </figure>
  );
}

/**
 * Петля направления. Панель накрыта целиком — убираем видео из раскладки, чтобы LoopVideo встал на паузу
 * (IntersectionObserver накрытия не видит). Состояние живёт здесь: при накрытии перерисовывается только <video>,
 * а не вся панель. Без своего DOM-узла — Duotone красит прямого потомка.
 */
function PanelLoop({ d, cover, className }: { d: Direction; cover: MotionValue<number>; className?: string }) {
  const covered = useCovered(cover);
  return <LoopVideo src={d.video} poster={d.poster} className={cn(className, covered && "hidden")} />;
}

/** Зубчатые торцы скотча. */
const TAPE_CLIP =
  "polygon(0 8%, 6% 0, 12% 10%, 18% 0, 24% 6%, 100% 0, 96% 50%, 100% 100%, 90% 92%, 84% 100%, 78% 90%, 0 100%, 4% 50%)";
