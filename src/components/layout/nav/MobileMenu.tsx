import { useEffect, useLayoutEffect, useRef, type CSSProperties, type MouseEvent, type RefObject } from "react";
import { motion, type Variants } from "motion/react";

import { Chevrons } from "@/components/ui/chevrons";
import { StickerButton, TelegramIcon } from "@/components/ui/sticker-button";
import { Tape } from "@/components/ui/tape";
import { TornEdge } from "@/components/ui/torn-edge";
import { CONTACTS, DIRECTIONS, NAV, TRIAL } from "@/lib/content";
import { cn, rub } from "@/lib/utils";
import { blurFrom, blurTo } from "@/lib/motion";

const EASE = [0.16, 1, 0.3, 1] as const;
const PUNCH = [0.7, 0, 0.2, 1] as const;
/** Глубина рваного края внизу панели: панель короче экрана ровно на неё. */
const TORN = 34;

const fade: Variants = {
  closed: { opacity: 0, transition: { duration: 0.3 } },
  open: { opacity: 1, transition: { duration: 0.4 } },
};

const panel: Variants = {
  closed: { y: "-106%", transition: { duration: 0.5, ease: PUNCH, delay: 0.06 } },
  open: { y: "0%", transition: { duration: 0.7, ease: EASE } },
};

const list: Variants = {
  closed: { transition: { staggerChildren: 0.025, staggerDirection: -1 } },
  open: { transition: { staggerChildren: 0.06, delayChildren: 0.16 } },
};

// «рывок» сбоку со смазом — как Reveal kind="whip"
const linkIn: Variants = {
  closed: { opacity: 0, x: -70, skewX: -16, ...blurFrom(8), transition: { duration: 0.2 } },
  open: {
    opacity: 1,
    x: 0,
    skewX: 0,
    ...blurTo(),
    transition: { duration: 0.6, ease: EASE },
    transitionEnd: { filter: "none" },
  },
};

const tapeIn: Variants = {
  closed: { opacity: 0, scaleX: 0.3, rotate: -16, transition: { duration: 0.2 } },
  open: { opacity: 1, scaleX: 1, rotate: -6, transition: { type: "spring", stiffness: 380, damping: 20, delay: 0.5 } },
};

const rise: Variants = {
  closed: { opacity: 0, y: 26, transition: { duration: 0.2 } },
  open: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE, delay: 0.56 } },
};

const num = (i: number) => String(i + 1).padStart(2, "0");

/**
 * Полноэкранное меню (< lg): кобальтовый постер, сверху вниз «стягивается» панель
 * с рваным краем; гигантские ссылки 01–06 влетают рывком, поперёк — скотч с направлениями.
 * Фокус заперт между бургером и пунктами меню, Esc закрывает.
 */
export function MobileMenu({
  id,
  active,
  focusFirst,
  onNavigate,
  onClose,
  burgerRef,
}: {
  id: string;
  active: string | null;
  /** Открыто с клавиатуры — сразу ставим фокус на первый пункт. */
  focusFirst: boolean;
  onNavigate: (e: MouseEvent<HTMLAnchorElement>, id: string) => void;
  onClose: () => void;
  burgerRef: RefObject<HTMLButtonElement | null>;
}) {
  const ref = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  useLayoutEffect(() => {
    close.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const root = ref.current;
    const first = root?.querySelector<HTMLElement>("[data-menu-link]");
    const raf = focusFirst ? requestAnimationFrame(() => first?.focus({ preventScroll: true })) : 0;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close.current();
        return;
      }
      if (e.key !== "Tab" || !root) return;
      const nodes = [burgerRef.current, ...root.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")].filter(
        (n): n is HTMLElement => !!n,
      );
      if (!nodes.length) return;
      // ведём фокус сами: бургер в DOM стоит после меню, естественный порядок увёл бы фокус наружу
      e.preventDefault();
      const i = nodes.indexOf(document.activeElement as HTMLElement);
      const n = nodes.length;
      const next = i === -1 ? (e.shiftKey ? n - 1 : 0) : (i + (e.shiftKey ? -1 : 1) + n) % n;
      nodes[next].focus();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
    };
    // фокус ставим один раз при открытии
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burgerRef]);

  return (
    <motion.div className="fixed inset-0 lg:hidden" initial="closed" animate="open" exit="closed">
      <motion.div aria-hidden variants={fade} onClick={onClose} className="absolute inset-0 bg-ink/80" />

      <motion.nav
        id={id}
        ref={ref}
        aria-label="Меню"
        variants={panel}
        className="absolute inset-x-0 top-0 bg-cobalt text-paper"
        style={{ height: `calc(100svh - ${TORN}px)` }}
      >
        <TornEdge side="bottom" color="var(--color-cobalt)" fiber="var(--color-ice)" height={TORN} seed={14} density={56} />

        <div className="relative h-full overflow-hidden">
          {/* декор: полутон и вертикальная подпись по краю (вне прокручиваемого слоя — не раздувают прокрутку) */}
          <div
            aria-hidden
            className="halftone pointer-events-none absolute -right-24 -top-16 size-[26rem] text-ultra opacity-80 [--dot:8px] [mask-image:radial-gradient(closest-side,#000,transparent)] [@media(max-height:500px)]:hidden"
          />
          <div
            aria-hidden
            className="halftone pointer-events-none absolute -bottom-28 -left-28 size-[22rem] text-cobalt-deep [--dot:6px] [mask-image:radial-gradient(closest-side,#000,transparent)] [@media(max-height:500px)]:hidden"
          />
          {/* на планшете — гигантский контурный «Хм» в свободном правом поле */}
          <motion.span
            aria-hidden
            variants={fade}
            className="display pointer-events-none absolute -right-[3vw] top-[22%] hidden text-[40vw] normal-case leading-none sm:block lg:hidden [@media(max-height:500px)]:!hidden"
            style={{ color: "transparent", WebkitTextStroke: "2px rgb(214 246 255 / 0.28)" }}
          >
            Хм
          </motion.span>
          <motion.span
            aria-hidden
            variants={fade}
            className="label pointer-events-none absolute right-[max(12px,env(safe-area-inset-right))] top-[92px] text-[0.56rem] text-ice/45 [writing-mode:vertical-rl]"
          >
            Химия ✕ школа танцев ✕ {CONTACTS.city}
          </motion.span>

          {/* если панель ниже содержимого (телефон боком) — содержимое прокручивается внутри, Lenis не мешает */}
          <div data-lenis-prevent className="relative h-full overflow-y-auto overflow-x-hidden overscroll-contain">
            <div className="relative flex min-h-full flex-col pb-[max(20px,env(safe-area-inset-bottom))] pl-[max(20px,env(safe-area-inset-left))] pr-[max(20px,env(safe-area-inset-right))] pt-[76px] sm:pl-[max(40px,env(safe-area-inset-left))] sm:pr-[max(40px,env(safe-area-inset-right))] [@media(max-height:500px)]:grid [@media(max-height:500px)]:grid-cols-[minmax(0,1fr)_minmax(0,19rem)] [@media(max-height:500px)]:grid-rows-[auto_1fr] [@media(max-height:500px)]:gap-x-10 [@media(max-height:500px)]:pt-[64px]">
              <motion.div variants={fade} aria-hidden className="flex items-center gap-3 pr-6 text-toxic [@media(max-height:500px)]:col-span-2">
                <span className="label text-[0.62rem]">[Навигация]</span>
                <span className="h-px flex-1 bg-current opacity-40" />
                <Chevrons count={5} bpm={100} size="0.75rem" />
              </motion.div>

              <motion.ol variants={list} className="mt-[1.6svh] flex flex-col pr-6">
                {NAV.map((item, i) => {
                  const on = active === item.id;
                  return (
                    <motion.li key={item.id} variants={linkIn} className="origin-left border-b border-paper/15">
                      <a
                        data-menu-link
                        href={`#${item.id}`}
                        onClick={(e) => onNavigate(e, item.id)}
                        aria-current={on ? "location" : undefined}
                        // боком (низкий экран) строка не ниже 44px — палец попадает
                        className="group flex items-start gap-3 py-[0.95svh] outline-offset-[-2px] [@media(max-height:500px)]:min-h-11 [@media(max-height:500px)]:items-center"
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "label mt-[0.6em] w-6 shrink-0 text-[0.66rem] tabular-nums [@media(max-height:500px)]:mt-0",
                            on ? "text-toxic" : "text-ice",
                          )}
                        >
                          {num(i)}
                          {/* на телефоне «ты тут» после длинного слова не помещается — точка под номером */}
                          {on && <span className="mt-1.5 block size-[5px] rounded-full bg-toxic shadow-[0_0_8px_var(--color-toxic)] sm:hidden" />}
                        </span>
                        <span
                          className={cn(
                            "display block text-[min(15.5vw,8.2svh)] leading-[0.86] transition-[color,translate] duration-300 ease-[var(--ease-out-expo)]",
                            "group-hover:translate-x-2 group-hover:text-toxic group-focus-visible:translate-x-2",
                            on ? "text-toxic" : "text-paper",
                          )}
                        >
                          {item.label}
                        </span>
                        {on && (
                          <span aria-hidden className="label ml-auto hidden self-center whitespace-nowrap text-[0.62rem] text-toxic sm:inline">
                            ● ты тут
                          </span>
                        )}
                      </a>
                    </motion.li>
                  );
                })}
              </motion.ol>

              {/* скотч поперёк меню — вылезает за края панели */}
              <motion.div aria-hidden variants={tapeIn} className="pointer-events-none relative -mx-10 my-auto py-[2.4svh] [@media(max-height:500px)]:hidden">
                <Tape
                  text={DIRECTIONS.map((d) => d.title)}
                  variant="toxic"
                  speed={14}
                  className="w-full"
                  textClassName="text-[clamp(17px,4.6vw,26px)]"
                />
              </motion.div>

              <motion.div variants={rise} className="w-full sm:max-w-md [@media(max-height:500px)]:self-end">
                <div className="grid grid-cols-2 gap-4 [@media(max-height:700px)_and_(min-height:501px)]:hidden">
                  <a
                    href={CONTACTS.telegram.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col gap-1.5 outline-offset-4"
                  >
                    <span className="label text-ice">Telegram</span>
                    <span className="text-[15px] font-semibold text-paper transition-colors group-hover:text-toxic">
                      {CONTACTS.telegram.handle}
                    </span>
                  </a>
                  <a href={CONTACTS.phone.tel} className="group flex flex-col gap-1.5 outline-offset-4">
                    <span className="label text-ice">Телефон</span>
                    <span className="whitespace-nowrap text-[15px] font-semibold tabular-nums text-paper transition-colors group-hover:text-toxic">
                      {CONTACTS.phone.display}
                    </span>
                  </a>
                </div>
                <StickerButton
                  href={CONTACTS.telegram.url}
                  variant="toxic"
                  size="lg"
                  tilt={-2}
                  icon={<TelegramIcon />}
                  aria-label={`Пробное — ${rub(TRIAL.price)}: записаться на пробное занятие в Telegram`}
                  className="mt-5 w-full [@media(max-height:700px)_and_(min-height:501px)]:mt-0"
                  style={{ "--shadow-color": "var(--color-ink)" } as CSSProperties}
                >
                  Пробное — {rub(TRIAL.price)}
                </StickerButton>
                <p className="label mt-4 text-balance text-center text-ice">
                  {TRIAL.minutes} минут в группе · {CONTACTS.replyTime}
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.nav>
    </motion.div>
  );
}
