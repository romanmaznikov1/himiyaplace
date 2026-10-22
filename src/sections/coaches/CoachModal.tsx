import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "motion/react";

import { Chevrons } from "@/components/ui/chevrons";
import { StickerButton, TelegramIcon } from "@/components/ui/sticker-button";
import { TornEdge, tornClipPath } from "@/components/ui/torn-edge";
import { useMedia } from "@/hooks/useMedia";
import { COACHES, CONTACTS, TRIAL, type Coach } from "@/lib/content";
import { cn, rub } from "@/lib/utils";

import { PlayGlyph } from "./CoachCard";
import { blurFrom, blurTo } from "@/lib/motion";

/**
 * Модалка тренера: интервью со звуком + био. Рендерится порталом в body —
 * секция изолирована (isolate), и z-[95] внутри неё не перекрыл бы следующие секции.
 */
export function CoachModal({
  coachId,
  onClose,
  onChange,
}: {
  coachId: Coach["id"] | null;
  onClose: () => void;
  onChange: (id: Coach["id"]) => void;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {coachId && <Sheet key="coach-modal" coachId={coachId} onClose={onClose} onChange={onChange} />}
    </AnimatePresence>,
    document.body,
  );
}

const FOCUSABLE = 'a[href], button:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])';

/** Мышь и ховер — десктоп: там страница видна за размытой подложкой. */
const FINE_POINTER = "(hover: hover) and (pointer: fine)";
/** Телефон лёжа: экран ниже 500px — видео и текст встают рядом, а не друг под другом. */
const SHORT_LANDSCAPE = "(orientation: landscape) and (max-height: 500px) and (max-width: 1023.98px)";

/**
 * На тач-экранах лист закрывает почти весь экран (видна полоска ~28px под рваной кромкой),
 * а страница под ним продолжает жить: шевроны, ленты, бегущая строка — и браузер каждый кадр
 * пересобирает слои всей страницы. Пока модалка открыта и уже «приклеилась», прячем #root
 * (visibility, без перестройки раскладки — скролл на месте) и ставим CSS-анимации на паузу.
 * Возвращаем, как только начинается уход листа.
 */
function useHidePageBehind(active: boolean) {
  useEffect(() => {
    if (!active || window.matchMedia(FINE_POINTER).matches) return;
    const app = document.getElementById("root");
    if (!app) return;
    const main = app.querySelector("main");
    const prev = app.style.visibility;
    app.style.visibility = "hidden";
    main?.setAttribute("data-offscreen", "");
    return () => {
      app.style.visibility = prev;
      main?.removeAttribute("data-offscreen");
    };
  }, [active]);
}

function Sheet({
  coachId,
  onClose,
  onChange,
}: {
  coachId: Coach["id"];
  onClose: () => void;
  onChange: (id: Coach["id"]) => void;
}) {
  const reduce = !!useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const i = Math.max(0, COACHES.findIndex((c) => c.id === coachId));
  const coach = COACHES[i];
  const prev = COACHES[(i - 1 + COACHES.length) % COACHES.length];
  const next = COACHES[(i + 1) % COACHES.length];
  const currentId = useRef(coachId);
  currentId.current = coachId;
  const present = useIsPresent();
  const [entered, setEntered] = useState(false);
  const short = useMedia(SHORT_LANDSCAPE);

  // раньше эффекта с фокусом: при размонтировании страница должна стать видимой до возврата фокуса на карточку
  useHidePageBehind(present && entered);

  // блокировка скролла страницы + фокус на «Закрыть»; при закрытии фокус возвращается на карточку
  useEffect(() => {
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    const prevPad = html.style.paddingRight;
    const sbw = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    if (sbw > 0) html.style.paddingRight = `${sbw}px`;
    window.__lenis?.stop();
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      html.style.overflow = prevOverflow;
      html.style.paddingRight = prevPad;
      window.__lenis?.start();
      const card = document.querySelector<HTMLElement>(`[data-coach="${currentId.current}"] button`);
      (card ?? opener)?.focus({ preventScroll: true });
    };
  }, []);

  // при смене тренера — наверх списка (на мобильном модалка прокручивается)
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [coachId]);

  // клавиатура слушается на window: даже если фокус «упал» на body после клика по тексту
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      const target = e.target as HTMLElement | null;
      if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && target?.tagName !== "VIDEO") {
        onChange(e.key === "ArrowRight" ? next.id : prev.id);
        return;
      }
      if (e.key !== "Tab" || !root.current) return;
      // ловушка фокуса внутри диалога
      const els = Array.from(root.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      const inside = root.current.contains(document.activeElement);
      if (!inside || (e.shiftKey && document.activeElement === first)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next.id, prev.id, onChange, onClose]);

  const sheetIn = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { y: "108%", rotate: 3.5 },
        animate: { y: "0%", rotate: 0, transition: { type: "spring" as const, stiffness: 210, damping: 26, mass: 0.9 } },
        exit: { y: "112%", rotate: -2.5, transition: { duration: 0.42, ease: [0.7, 0, 0.84, 0] as const } },
      };

  return (
    <motion.div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[95]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 1, transition: { duration: 0.45 } }}
    >
      {/* размытие — только на десктопе: на телефоне подложку видно полоской над листом,
          а полноэкранный blur пересчитывался бы каждый кадр под играющим видео */}
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-ink/90 pointer-fine:bg-ink/80 pointer-fine:backdrop-blur-[6px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.3 } }}
        exit={{ opacity: 0, transition: { duration: 0.35, delay: 0.1 } }}
        onClick={onClose}
      />

      {/* лист-постер с рваным верхом, «приклеивается» снизу */}
      <motion.div
        className="absolute inset-x-0 bottom-0 top-7 origin-bottom-left bg-ink-900 md:top-[4.5svh]"
        {...sheetIn}
        onAnimationComplete={() => setEntered(true)}
      >
        <TornEdge side="top" color="var(--color-ink-900)" fiber="var(--color-paper)" seed={31} height={34} />

        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="halftone halftone-fade absolute -right-[10%] -top-[20%] h-[80%] w-[60%] text-cobalt/30 [--dot:8px]" />
          <div className="scanlines absolute inset-0 opacity-60" />
        </div>

        {/* до lg лист прокручивается и текст уезжает под кнопку «Закрыть» — подложка, чтобы он гас под ней */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 z-[9] bg-linear-to-b from-ink-900 via-ink-900/90 to-transparent lg:hidden",
            // лёжа текст начинается сразу под кнопкой — подложка не выше отступа, иначе гасила бы первую строку
            short ? "h-14" : "h-24 md:h-28",
          )}
        />
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          data-cursor="hover"
          className="label absolute right-4 top-4 z-10 flex items-center gap-2 bg-paper px-4 py-3 text-ink shadow-[4px_4px_0_0_var(--color-cobalt)] transition-transform duration-200 ease-[var(--ease-snap)] [rotate:2deg] hover:rotate-0 hover:translate-x-[2px] hover:translate-y-[2px] md:right-8 md:top-6"
        >
          Закрыть
          <svg viewBox="0 0 16 16" aria-hidden className="size-3.5">
            <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" />
          </svg>
        </button>

        <div ref={scroller} data-lenis-prevent className="relative h-full overflow-y-auto overscroll-contain">
          <AnimatePresence mode="wait" initial={true}>
            <Body
              key={coach.id}
              coach={coach}
              index={i}
              titleId={titleId}
              reduce={reduce}
              short={short}
              prev={prev}
              next={next}
              onChange={onChange}
            />
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Body({
  coach,
  index,
  titleId,
  reduce,
  short,
  prev,
  next,
  onChange,
}: {
  coach: Coach;
  index: number;
  titleId: string;
  reduce: boolean;
  /** Телефон лёжа: видео слева во всю высоту листа, текст справа. */
  short: boolean;
  prev: Coach;
  next: Coach;
  onChange: (id: Coach["id"]) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [first, ...rest] = coach.name.split(" ");
  const surname = rest.join(" ");
  const roles = coach.role.split(" · ");
  const num = String(index + 1).padStart(2, "0");
  const seed = index * 13 + 5;

  const play = () => {
    const v = video.current;
    if (!v) return;
    v.play().catch(() => {});
    v.focus({ preventScroll: true });
  };

  const whip = (d: number) =>
    reduce
      ? { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.3, delay: d } }, exit: { opacity: 0 } }
      : {
          initial: { opacity: 0, x: 90, skewX: -10, ...blurFrom(10) },
          animate: {
            opacity: 1,
            x: 0,
            skewX: 0,
            ...blurTo(),
            transition: { duration: 0.65, delay: d, ease: [0.16, 1, 0.3, 1] as const },
          },
          exit: { opacity: 0, x: -40, ...blurFrom(6), transition: { duration: 0.18 } },
        };

  return (
    <motion.div className="relative flex min-h-full flex-col" exit={{ opacity: 1, transition: { duration: 0.2 } }}>
      {/* гигантское имя на фоне; обрезается краем листа и не удлиняет прокрутку */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.span
          className="display absolute -left-[2vw] bottom-[-0.12em] select-none whitespace-nowrap text-[34vw] text-ink-700/70 lg:text-[24vw]"
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: "12%" }}
          animate={{ opacity: 1, x: "0%", transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] } }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
        >
          {coach.firstName}
        </motion.span>
      </div>

      {/* lg: всё — видео, имя, био, запись и «другие тренеры» — помещается в экран от 1280×720 */}
      {/* телефон лёжа (экран ниже 500px): видео и текст рядом, как на lg, иначе имя и запись
          оказывались на ~600px ниже крошечного видео */}
      <div
        className={cn(
          "relative mx-auto grid w-full max-w-[1320px] px-5 md:px-10",
          short
            ? "grid-cols-[auto_minmax(0,1fr)] items-start gap-8 pb-10 pt-14 md:gap-12"
            : "gap-10 pb-16 pt-20 lg:my-auto lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-16 lg:py-8 xl:gap-24",
        )}
      >
        {/* видео в рваной рамке: слева и сверху — бумажная кромка */}
        <motion.div
          className={cn(
            "relative mx-auto aspect-[9/16]",
            // лёжа: от верхнего отступа листа почти до низа экрана (лист начинается на 28px ниже края)
            short ? "h-[calc(100svh-104px)]" : "h-[min(58svh,560px)] lg:h-[min(76svh,calc(100svh-180px),820px)]",
          )}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.22, rotate: -9, y: 30 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: -2,
            y: 0,
            transition: reduce ? { duration: 0.3 } : { type: "spring", stiffness: 360, damping: 20, delay: 0.12 },
          }}
          exit={{ opacity: 0, scale: 0.94, rotate: 2, transition: { duration: 0.18 } }}
        >
          <div aria-hidden className="absolute inset-0 bg-paper" style={{ clipPath: tornClipPath(seed, { left: true, top: true }, 1.6, 40) }} />
          <div
            className="absolute inset-0 overflow-hidden bg-ink shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9)]"
            style={{ clipPath: tornClipPath(seed + 3, { left: true, top: true }, 2.8, 40) }}
          >
            <video
              ref={video}
              src={coach.video}
              poster={coach.videoPoster}
              controls={playing}
              preload="none"
              playsInline
              className="h-full w-full bg-ink object-cover"
              aria-label={`Интервью: ${coach.name}`}
              onPlay={() => setPlaying(true)}
            />
          </div>

          <AnimatePresence>
            {!playing && (
              <motion.button
                type="button"
                onClick={play}
                data-cursor="hover"
                aria-label={`Смотреть интервью: ${coach.name}`}
                className="group/play absolute inset-0 grid place-items-center"
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
              >
                <span aria-hidden className="absolute inset-0 bg-linear-to-t from-ink/70 via-transparent to-transparent" />
                <span className="relative flex rotate-[-4deg] items-center gap-3 bg-toxic px-4 py-3 text-ink shadow-[5px_5px_0_0_var(--color-cobalt)] transition-transform duration-200 ease-[var(--ease-snap)] group-hover/play:rotate-0 group-hover/play:scale-105">
                  <span
                    className="grid size-9 animate-beat place-items-center rounded-full bg-ink text-toxic"
                    style={{ "--bpm": 95, "--beat-scale": 1.12 } as CSSProperties}
                  >
                    <PlayGlyph className="size-4 translate-x-[1px]" />
                  </span>
                  <span className="label text-[0.78rem]">Смотреть интервью</span>
                </span>
              </motion.button>
            )}
          </AnimatePresence>

          {!playing && (
            <span aria-hidden className="label pointer-events-none absolute -bottom-3 -right-3 rotate-[5deg] bg-cobalt px-3 py-2 text-paper shadow-[3px_3px_0_0_var(--color-toxic)]">
              Со звуком
            </span>
          )}
        </motion.div>

        {/* текст */}
        <div className="relative min-w-0 lg:pr-6">
          <motion.div {...whip(0.18)} className="flex items-center gap-3 text-toxic">
            <span className="label tabular-nums">[{num}]</span>
            <span className="label">Тренер «Химии»</span>
            <Chevrons count={5} bpm={95} size="0.8rem" />
          </motion.div>

          <motion.h2
            {...whip(0.24)}
            id={titleId}
            className="display mt-5 text-[clamp(64px,10.5vw,176px)] leading-[0.8] lg:mt-4 lg:text-[clamp(64px,min(10.5vw,15svh),176px)]"
          >
            <span className="block text-paper">{first}</span>{" "}
            <span
              className="block text-transparent"
              style={{ WebkitTextStroke: "clamp(1.5px, 0.2vw, 3px) var(--color-toxic)" }}
            >
              {surname}
            </span>
          </motion.h2>

          <motion.ul {...whip(0.32)} className="mt-7 flex flex-wrap gap-2 lg:mt-6" aria-label="Направления">
            {roles.map((r, k) => (
              <li
                key={r}
                className={cn("label px-2.5 py-1.5", k === 0 ? "bg-toxic text-ink" : "bg-ink-600 text-paper")}
              >
                {r}
              </li>
            ))}
          </motion.ul>

          <motion.p {...whip(0.38)} className="mt-7 max-w-xl text-[15px] leading-relaxed text-paper/85 md:text-[17px] lg:mt-6 lg:max-w-[40rem]">
            {coach.bio}
          </motion.p>

          <motion.div {...whip(0.46)} className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4 lg:mt-7">
            <StickerButton href={CONTACTS.telegram.url} variant="toxic" size="lg" tilt={-2} icon={<TelegramIcon />}>
              Записаться к тренеру
            </StickerButton>
            <span className="label leading-relaxed text-mute">
              Пробное — {rub(TRIAL.price)}
              <br />
              {CONTACTS.telegram.handle} · {CONTACTS.replyTime}
            </span>
          </motion.div>

          <motion.nav
            {...whip(0.54)}
            aria-label="Другие тренеры"
            className="mt-12 flex items-stretch justify-between gap-4 border-t border-line pt-5 lg:mt-8 lg:pt-4"
          >
            <NavBtn dir="prev" coach={prev} onClick={() => onChange(prev.id)} />
            <NavBtn dir="next" coach={next} onClick={() => onChange(next.id)} />
          </motion.nav>
        </div>
      </div>
    </motion.div>
  );
}

function NavBtn({ dir, coach, onClick }: { dir: "prev" | "next"; coach: Coach; onClick: () => void }) {
  const isNext = dir === "next";
  return (
    <button
      type="button"
      onClick={onClick}
      data-cursor="hover"
      className={cn(
        "group/nav flex min-h-11 min-w-0 items-center gap-2.5 text-left min-[360px]:gap-3",
        isNext && "flex-row-reverse text-right",
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center border border-paper/30 text-paper transition-colors duration-200 group-hover/nav:border-toxic group-hover/nav:bg-toxic group-hover/nav:text-ink">
        <svg viewBox="0 0 24 24" aria-hidden className={cn("size-4", !isNext && "rotate-180")}>
          <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="square" />
        </svg>
      </span>
      <span className="min-w-0">
        {/* на 320px «Предыдущий»/«Следующий» упирались друг в друга, а имена резались до «МИХА…» */}
        <span className="label block text-mute">
          <span className="min-[360px]:hidden">{isNext ? "Дальше" : "Назад"}</span>
          <span className="max-[359px]:hidden">{isNext ? "Следующий" : "Предыдущий"}</span>
        </span>
        <span className="display block truncate text-[24px] text-paper transition-colors group-hover/nav:text-toxic min-[360px]:text-[28px] md:text-[34px]">
          {coach.firstName}
        </span>
      </span>
    </button>
  );
}
