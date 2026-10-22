import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
} from "motion/react";

import { Chevrons } from "@/components/ui/chevrons";
import { ScrambleText } from "@/components/ui/scramble-text";
import { TornEdge } from "@/components/ui/torn-edge";
import { DIRECTIONS } from "@/lib/content";
import { markReady, rememberPreloaderShown } from "@/lib/ready";
import { cn } from "@/lib/utils";

import { lockScroll } from "./nav/scroll-lock";

/**
 * Прелоадер (один раз за сессию, ≤ 1.8 с, клик/клавиша — пропустить).
 * Чернильный экран: гигантский счётчик 00→100 с «несведённой» кобальтовой печатью,
 * плитка «Хм» из таблицы Химии и расшифровывающийся статус. На 100 постер срывается вверх
 * рваным краем, за ним — токсичный слой, а под ними уже играет интро hero.
 */
/** Строки статуса: на телефоне каждая — своей строкой без переноса (шум глифов не перекладывает текст, CLS). */
const STEPS = [["Смешиваем", "реагенты…"], ["Нагреваем", "колбу…"], ["Реакция", "пошла!"], ["Химия"]];
const TEAR = [0.76, 0, 0.24, 1] as const;
const LAG_S = 0.08;

/*
 * Прелоадер стартует, когда JS уже загружен, — загрузку он не прячет, а только откладывает hero (LCP).
 * На телефоне отыгрываем его быстрее; при «Экономии трафика» и на медленной сети не показываем вовсе.
 */
type Conn = { saveData?: boolean; effectiveType?: string };
const conn = () => (navigator as Navigator & { connection?: Conn }).connection;
const slowNet = () => {
  const c = conn();
  return !!c && (c.saveData === true || ["slow-2g", "2g", "3g"].includes(c.effectiveType ?? ""));
};
const PHONE = "(max-width: 767px), (max-height: 500px)";
const TIMING = {
  desktop: { count: 1.0, hold: 100, tear: 0.62 },
  phone: { count: 0.6, hold: 40, tear: 0.55 },
};

/** Не показывать: сразу отпускаем hero, ничего не рисуем. */
function Skip() {
  useLayoutEffect(() => {
    rememberPreloaderShown();
    markReady();
  }, []);
  return null;
}

export default function Preloader() {
  const [skip] = useState(slowNet);
  return skip ? <Skip /> : <PreloaderScreen />;
}

function PreloaderScreen() {
  const reduce = useReducedMotion();
  const [{ count: COUNT_S, hold: HOLD_MS, tear: TEAR_S }] = useState(() =>
    window.matchMedia(PHONE).matches ? TIMING.phone : TIMING.desktop,
  );
  const [phase, setPhase] = useState<"load" | "tear" | "done">("load");
  const [step, setStep] = useState(0);
  const [lit, setLit] = useState(0);
  const progress = useMotionValue(0);
  const digits = useTransform(progress, (v) => String(Math.round(v)).padStart(2, "0"));
  const mini = useTransform(progress, (v) => String(Math.round(v)).padStart(3, "0"));
  const bar = useTransform(progress, [0, 100], [0, 1]);
  // «несведённая» печать: кобальтовая копия разъезжается по мере реакции
  const ghostX = useTransform(progress, (v) => `${(v * 0.00038).toFixed(4)}em`);
  const ghostY = useTransform(progress, (v) => `${(v * 0.00016).toFixed(4)}em`);

  const root = useRef<HTMLDivElement>(null);
  const ctrl = useRef<AnimationPlaybackControls | null>(null);
  const torn = useRef(false);
  const unlock = useRef<(() => void) | null>(null);

  useMotionValueEvent(progress, "change", (v) => {
    setStep(v >= 100 ? 3 : v >= 68 ? 2 : v >= 34 ? 1 : 0);
    setLit(Math.min(4, Math.floor((v + 6) / 25)));
  });

  const tear = useCallback(() => {
    if (torn.current) return;
    torn.current = true;
    ctrl.current?.stop();
    progress.set(100);
    rememberPreloaderShown();
    unlock.current?.();
    // hero начинает интро прямо во время срыва
    markReady();
    setPhase("tear");
  }, [progress]);

  // блокировка скролла на всё время показа
  useEffect(() => {
    window.scrollTo(0, 0);
    const release = lockScroll();
    unlock.current = release;
    return release;
  }, []);

  // счётчик «рывками», как настоящая загрузка
  useEffect(() => {
    if (torn.current) return;
    let alive = true;
    let t = 0;
    ctrl.current = animate(progress, [0, 12, 19, 46, 58, 83, 100], {
      duration: reduce ? 0.4 : COUNT_S,
      times: [0, 0.14, 0.27, 0.46, 0.6, 0.8, 1],
      ease: "easeOut",
      onComplete: () => {
        if (alive) t = window.setTimeout(tear, HOLD_MS);
      },
    });
    return () => {
      alive = false;
      clearTimeout(t);
      ctrl.current?.stop();
    };
  }, [progress, reduce, tear, COUNT_S, HOLD_MS]);

  // пока постер на экране, страница под ним недоступна: inert на main/header/footer
  // (Nav и Footer — ленивые и появляются позже, поэтому следим за детьми #root)
  useEffect(() => {
    if (phase !== "load") return;
    const sel = "main, header, footer";
    const apply = () => document.querySelectorAll<HTMLElement>(sel).forEach((el) => el.setAttribute("inert", ""));
    apply();
    const host = root.current?.parentElement ?? document.body;
    const mo = new MutationObserver(apply);
    mo.observe(host, { childList: true });
    root.current?.focus({ preventScroll: true });
    return () => {
      mo.disconnect();
      document.querySelectorAll<HTMLElement>(sel).forEach((el) => el.removeAttribute("inert"));
    };
  }, [phase]);

  // пропуск с клавиатуры; Enter/Space не должны заодно «нажать» что-то под постером, Tab — увести фокус
  useEffect(() => {
    if (phase !== "load") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") e.preventDefault();
      else if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        tear();
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [phase, tear]);

  // страховка: если анимация срыва не отчиталась (reduced motion, фоновая вкладка) — всё равно убираемся
  useEffect(() => {
    if (phase !== "tear") return;
    const t = window.setTimeout(() => setPhase("done"), (TEAR_S + LAG_S) * 1000 + 400);
    return () => clearTimeout(t);
  }, [phase, TEAR_S]);

  if (phase === "done") return null;
  const tearing = phase === "tear";
  const away = reduce ? { opacity: 0 } : { y: "-112%" };
  const stay = reduce ? { opacity: 1 } : { y: "0%" };

  return (
    <div
      ref={root}
      data-native-cursor
      role="status"
      aria-label="Загрузка сайта"
      tabIndex={-1}
      onClick={tear}
      className={`fixed inset-0 z-[110] select-none outline-none ${tearing ? "pointer-events-none" : "cursor-pointer"}`}
    >
      {/* токсичный слой под постером: мелькает полосой между двумя срывами */}
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-toxic"
        initial={false}
        animate={tearing ? away : stay}
        transition={{ duration: TEAR_S, delay: LAG_S, ease: TEAR }}
        onAnimationComplete={() => tearing && setPhase("done")}
      >
        <TornEdge side="bottom" color="var(--color-toxic)" fiber="var(--color-paper)" height={46} seed={23} density={58} />
      </motion.div>

      {/* чернильный постер */}
      <motion.div
        className="absolute inset-0 bg-ink"
        initial={false}
        animate={tearing ? away : stay}
        transition={{ duration: TEAR_S, ease: TEAR }}
      >
        <TornEdge side="bottom" color="var(--color-ink)" fiber="var(--color-paper)" height={64} seed={7} density={64} />

        <div aria-hidden className="relative h-full overflow-hidden">
          <div className="scanlines pointer-events-none absolute inset-0 opacity-50" />
          <div className="halftone pointer-events-none absolute -bottom-[20%] -right-[12%] h-[75%] w-[60%] text-cobalt opacity-40 [--dot:9px] [mask-image:radial-gradient(closest-side,#000,transparent)]" />
          <div className="halftone pointer-events-none absolute -left-[15%] -top-[20%] h-[55%] w-[45%] text-cobalt-deep opacity-30 [--dot:7px] [mask-image:radial-gradient(closest-side,#000,transparent)]" />

          <div className="relative flex h-full flex-col px-5 pb-6 pt-5 md:px-10 md:pb-9 md:pt-7 xl:px-16">
            {/* верх: подпись и подсказка */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="label text-toxic">
                  [<span className="normal-case">Хм</span>] Школа танцев
                </span>
                <span className="label text-mute">Ставрополь</span>
              </div>
              <span className="label flex items-center gap-2 text-right text-paper/70">
                <span className="block size-1.5 animate-flicker bg-toxic" />
                Клик — пропустить
              </span>
            </div>

            {/* середина: статус слева, плитка «Хм» справа (на телефоне — плитка и реагенты сверху) */}
            <div className="flex flex-1 flex-col justify-center gap-8 pb-6 md:pb-0 md:flex-row-reverse md:items-center md:justify-between md:gap-10">
              <div className="flex items-center gap-6">
                <ElementTile mini={mini} />
                <Reagents lit={lit} className="min-w-0 flex-1 md:hidden" />
              </div>
              <Status lines={STEPS[step]} className="hidden md:block" />
            </div>

            {/* низ: гигантский счётчик, реагенты и линия прогресса */}
            <div className="relative">
              {/* на телефоне статус — подписью прямо над счётчиком: две строки фиксированной высоты без переноса,
                  однострочный шаг встаёт на нижнюю — случайные глифы и смена шага не сдвигают текст (CLS) */}
              <div className="relative mb-4 h-[1.8em] text-[clamp(40px,5.4vw,84px)] md:hidden">
                {(STEPS[step].length === 1 ? ["", STEPS[step][0]] : STEPS[step]).map((line, i) => (
                  <Status key={i} lines={[line]} className="block h-[0.9em] whitespace-nowrap" />
                ))}
              </div>
              <div className="flex items-end justify-between gap-10">
                <div className="relative flex items-start leading-none">
                  <span className="relative block">
                    <motion.span
                      className="display absolute left-0 top-0 block text-[46vw] leading-[0.8] tabular-nums text-cobalt md:text-[clamp(150px,30vw,440px)]"
                      style={{ x: ghostX, y: ghostY }}
                    >
                      {digits}
                    </motion.span>
                    <motion.span className="display relative block text-[46vw] leading-[0.8] tabular-nums text-toxic mix-blend-screen md:text-[clamp(150px,30vw,440px)]">
                      {digits}
                    </motion.span>
                  </span>
                  <span className="display ml-[0.06em] mt-[0.04em] text-[15vw] leading-[0.8] text-paper md:text-[clamp(56px,10vw,150px)]">
                    %
                  </span>
                </div>
                <Reagents lit={lit} className="mb-2 hidden w-[min(340px,26vw)] md:block" />
              </div>

              <div className="mt-5 flex items-center gap-4 md:mt-7">
                <span className="label shrink-0 text-paper/70">Загрузка</span>
                <span className="relative block h-[2px] flex-1 overflow-hidden bg-line">
                  <motion.span className="absolute inset-0 block origin-left bg-toxic" style={{ scaleX: bar }} />
                </span>
                <Chevrons count={6} bpm={128} size="0.8rem" className="shrink-0 text-toxic" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      <span className="sr-only">Загрузка…</span>
    </div>
  );
}

/** Плитка «элемента» Хм из периодической таблицы Химии: номер-счётчик, символ, название. */
function ElementTile({ mini }: { mini: MotionValue<string> }) {
  return (
    <motion.div
      className="relative grid size-[128px] shrink-0 grid-rows-[auto_1fr_auto] border-2 border-toxic bg-ink-800 p-2.5 shadow-[7px_7px_0_0_var(--color-cobalt)] md:size-[200px] md:p-3.5"
      initial={{ opacity: 0, scale: 1.5, rotate: -20 }}
      animate={{ opacity: 1, scale: 1, rotate: -5 }}
      transition={{ type: "spring", stiffness: 400, damping: 17, delay: 0.05 }}
    >
      <div className="flex items-start justify-between">
        <motion.span className="label text-[0.6rem] tabular-nums text-toxic md:text-[0.7rem]">{mini}</motion.span>
        <span className="label text-[0.6rem] text-mute md:text-[0.7rem]">✕</span>
      </div>
      <span className="display grid place-items-center text-[62px] leading-none text-toxic normal-case md:text-[104px]">Хм</span>
      <div className="flex items-end justify-between">
        <span className="label text-[0.6rem] text-paper md:text-[0.7rem]">Химия</span>
        <span className="block h-2 w-8 bg-[repeating-linear-gradient(90deg,var(--color-paper)_0_1px,transparent_1px_3px,var(--color-paper)_3px_5px,transparent_5px_6px)] opacity-60" />
      </div>
    </motion.div>
  );
}

function Status({ lines, className }: { lines: string[]; className?: string }) {
  return (
    <ScrambleText
      text={lines.join(" ")}
      duration={380}
      hover={false}
      className={cn("display max-w-[11em] text-[clamp(40px,5.4vw,84px)] leading-[0.9] text-paper", className)}
    />
  );
}

/** «Реагенты» — четыре направления-элемента; загораются по мере смешивания. */
function Reagents({ lit, className }: { lit: number; className?: string }) {
  return (
    <ul className={cn("flex flex-col", className)}>
      {DIRECTIONS.map((d, i) => {
        const on = i < lit;
        return (
          <li
            key={d.id}
            className={cn(
              "flex items-center gap-3 border-b py-1.5 transition-colors duration-150 md:gap-4 md:py-2",
              on ? "border-toxic/40 text-paper" : "border-line text-mute/45",
            )}
          >
            <span className={cn("display w-7 text-[22px] leading-none normal-case md:w-9 md:text-[28px]", on && "text-toxic")}>
              {d.symbol}
            </span>
            <span className="label min-w-0 flex-1 truncate text-[0.6rem] md:text-[0.68rem]">{d.title}</span>
            <span className={cn("block size-1.5 shrink-0", on ? "bg-toxic shadow-[0_0_8px_var(--color-toxic)]" : "bg-line")} />
          </li>
        );
      })}
    </ul>
  );
}
