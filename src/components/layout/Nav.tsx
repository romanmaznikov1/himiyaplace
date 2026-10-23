import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, type Variants } from "motion/react";

import { Magnetic } from "@/components/ui/magnetic";
import { StickerButton, TelegramIcon } from "@/components/ui/sticker-button";
import { useMedia } from "@/hooks/useMedia";
import { CONTACTS, NAV, TRIAL } from "@/lib/content";
import { onReady } from "@/lib/ready";
import { cn, rub } from "@/lib/utils";

import { Burger } from "./nav/Burger";
import { Logo } from "./nav/Logo";
import { MobileMenu } from "./nav/MobileMenu";
import { isNavHeld, NAV_HOLD_EVENT, navigateTo } from "./nav/navigate";
import { lockScroll } from "./nav/scroll-lock";
import { useActiveSection } from "./nav/useActiveSection";

const IDS = NAV.map((n) => n.id);
const LEFT = NAV.slice(0, 3);
const RIGHT = NAV.slice(3);
const MENU_ID = "site-menu";
/** Пока скролл выше этой доли экрана — мы над верхом hero: бар прозрачный, логотип спрятан. */
const HERO_ZONE = 0.7;
/** Метка нашего шага истории: открытое меню — отдельный шаг, «Назад» (жест, кнопка Android) его закрывает. */
const MENU_STATE = "himiya:menu";

const num = (id: string) => String(NAV.findIndex((n) => n.id === id) + 1).padStart(2, "0");

// интро бара: пункты падают сверху по очереди, когда ушёл прелоадер
const drop: Variants = {
  off: { opacity: 0, y: -22 },
  on: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.25 + i * 0.05 },
  }),
};

export default function Nav() {
  const [ready, setReady] = useState(false);
  const [past, setPast] = useState(() => window.scrollY > window.innerHeight * HERO_ZONE);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useActiveSection(IDS);
  const burger = useRef<HTMLButtonElement>(null);
  const viaKeyboard = useRef(false);
  const lastY = useRef(0);
  // десктопный ряд ссылок и магнит на телефоне не монтируем (они всё равно display:none)
  const desk = useMedia("(min-width: 1024px)");

  useEffect(() => onReady(() => setReady(true)), []);

  // программный скролл к якорю (бар, меню, CTA в hero): бар на это время остаётся на месте
  useEffect(() => {
    const show = () => setHidden(false);
    window.addEventListener(NAV_HOLD_EVENT, show);
    return () => window.removeEventListener(NAV_HOLD_EVENT, show);
  }, []);

  // ?menu=open — открыть меню сразу (для скриншотов)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("menu") === "open") setOpen(true);
  }, []);

  const { scrollY, scrollYProgress } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    const p = y > window.innerHeight * HERO_ZONE;
    const d = y - lastY.current;
    lastY.current = y;
    setPast(p);
    if (!p || isNavHeld()) setHidden(false);
    else if (d > 6) setHidden(true);
    else if (d < -6) setHidden(false);
  });

  const openRef = useRef(open);
  useLayoutEffect(() => {
    openRef.current = open;
  }, [open]);

  /* --- История: открытое меню — шаг «Назад». Иначе жест «назад» на телефоне уводит с сайта. --- */
  const menuEntry = useRef(false); // наш шаг сейчас текущий
  const popping = useRef(false); // сами вызвали history.back() и ждём popstate
  const afterPop = useRef<Array<() => void>>([]);

  const flushPop = useCallback(() => {
    popping.current = false;
    const queue = afterPop.current;
    afterPop.current = [];
    queue.forEach((fn) => fn());
  }, []);

  useEffect(() => {
    const onPop = () => {
      // «Назад», пока меню открыто, — просто закрываем его
      if (menuEntry.current) {
        menuEntry.current = false;
        setOpen(false);
      }
      flushPop();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [flushPop]);

  /** Сделать fn, когда история не в пути (адрес и новые шаги трогаем только после возврата). */
  const whenSettled = useCallback((fn: () => void) => {
    if (!popping.current) return fn();
    afterPop.current.push(fn);
  }, []);

  /** Меню закрыли не «Назад» — снимаем свой шаг истории. */
  const dropMenuEntry = useCallback(() => {
    if (!menuEntry.current) return;
    menuEntry.current = false;
    popping.current = true;
    history.back();
    // страховка: popstate так и не пришёл
    window.setTimeout(() => popping.current && flushPop(), 400);
  }, [flushPop]);

  // меню: блокируем скролл, прячем остальную страницу от клавиатуры и скринридеров
  useEffect(() => {
    if (!open) return;
    const unlock = lockScroll();
    const rest = Array.from(document.querySelectorAll<HTMLElement>("main, footer"));
    rest.forEach((el) => el.setAttribute("inert", ""));
    const mq = window.matchMedia("(min-width: 1024px)");
    const onMq = () => mq.matches && setOpen(false);
    mq.addEventListener("change", onMq);
    whenSettled(() => {
      if (!openRef.current || menuEntry.current) return;
      try {
        const st: unknown = history.state;
        history.pushState({ ...(st && typeof st === "object" ? st : {}), [MENU_STATE]: true }, "");
        menuEntry.current = true;
      } catch {
        /* sandbox — без шага истории */
      }
    });
    return () => {
      unlock();
      rest.forEach((el) => el.removeAttribute("inert"));
      mq.removeEventListener("change", onMq);
      dropMenuEntry();
    };
  }, [open, whenSettled, dropMenuEntry]);

  // фокус возвращаем на бургер, только если он был внутри меню (клавиатура, скринридер). После касания — нет:
  // iOS Safari рисует программный focus() обводкой :focus-visible, и на бургере оставался прямоугольник
  const refocusBurger = useCallback(() => {
    if (document.getElementById(MENU_ID)?.contains(document.activeElement)) burger.current?.focus({ preventScroll: true });
  }, []);

  const closeMenu = useCallback(() => {
    refocusBurger();
    setOpen(false);
  }, [refocusBurger]);

  const goTo = useCallback((e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const keyboard = e.detail === 0;
    setHidden(false);
    // с клавиатуры фокус переезжает в секцию — следующий Tab продолжит уже оттуда
    const go = () => navigateTo(id, { keyboard });
    if (openRef.current) {
      // из меню: снимаем шаг истории меню, эффект снимает блокировку скролла; едем, когда история вернулась
      // (иначе #id запишется в шаг меню и пропадёт вместе с ним)
      dropMenuEntry();
      if (!keyboard) refocusBurger();
      setOpen(false);
      requestAnimationFrame(() => whenSettled(go));
    } else go();
  }, [dropMenuEntry, whenSettled, refocusBurger]);

  const toTop = useCallback((e: MouseEvent<HTMLAnchorElement>) => goTo(e, "top"), [goTo]);

  const solid = past && !open;
  const showLogo = past || open;
  const barHidden = hidden && !open;

  return (
    <header className="fixed inset-x-0 top-0 z-[80]">
      {/* секция, в которую перевели фокус с клавиатуры, не рисует обводку на весь экран */}
      <style>{`[data-nav-target]:focus{outline:none}`}</style>
      <AnimatePresence>
        {open && (
          <MobileMenu
            id={MENU_ID}
            active={active}
            focusFirst={viaKeyboard.current}
            onNavigate={goTo}
            onClose={closeMenu}
            burgerRef={burger}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="relative"
        initial={false}
        animate={{ y: barHidden ? "-150%" : "0%" }}
        transition={{ type: "spring", stiffness: 380, damping: 36, mass: 0.8 }}
        onFocusCapture={() => setHidden(false)}
      >
        {/* подложка после hero: чернила + волосяная линия; блюр — только на десктопе: на телефоне
            backdrop-filter пересчитывался бы каждый кадр скролла, а за 90% чернил его почти не видно */}
        <motion.div
          aria-hidden
          className="absolute inset-0 border-b border-line bg-ink/90 lg:bg-ink/75 lg:backdrop-blur-md"
          initial={false}
          animate={{ opacity: solid ? 1 : 0 }}
          transition={{ duration: 0.35 }}
        />
        {/* прогресс страницы — тонкая токсичная нить по верхней кромке */}
        <motion.div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[2px] origin-left bg-toxic will-change-transform"
          style={{ scaleX: scrollYProgress }}
          initial={false}
          animate={{ opacity: solid ? 1 : 0 }}
        />

        <motion.nav
          aria-label="Основная навигация"
          className="relative"
          initial="off"
          animate={ready ? "on" : "off"}
        >
          {/* --- десктоп --- */}
          {desk && (
            <div className="hidden h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 px-10 lg:grid xl:gap-6 xl:px-16">
              <ul className="flex items-center gap-[clamp(16px,1.9vw,40px)]">
                {LEFT.map((item, i) => (
                  <DeskLink key={item.id} id={item.id} label={item.label} active={active === item.id} onNav={goTo} i={i} />
                ))}
              </ul>

              <motion.div variants={drop} custom={3} className="relative top-[7px] justify-self-center">
                <Logo show={showLogo} onClick={toTop} imgClassName="w-[110px]" />
              </motion.div>

              <div className="flex items-center justify-end gap-[clamp(16px,1.9vw,40px)]">
                <ul className="flex items-center gap-[clamp(16px,1.9vw,40px)]">
                  {RIGHT.map((item, i) => (
                    <DeskLink key={item.id} id={item.id} label={item.label} active={active === item.id} onNav={goTo} i={4 + i} />
                  ))}
                </ul>
                <motion.div variants={drop} custom={7}>
                  <Magnetic strength={0.3}>
                    <StickerButton
                      href={CONTACTS.telegram.url}
                      variant="toxic"
                      size="sm"
                      tilt={-5}
                      icon={<TelegramIcon />}
                      aria-label={`Пробное ${rub(TRIAL.price)}: записаться на пробное занятие в Telegram`}
                      className="whitespace-nowrap max-xl:[&>span:first-child]:hidden"
                    >
                      Пробное {rub(TRIAL.price)}
                    </StickerButton>
                  </Magnetic>
                </motion.div>
              </div>
            </div>
          )}

          {/* --- телефон / планшет; боком — поля не меньше вырезов экрана (viewport-fit=cover) --- */}
          {!desk && (
            <div className="flex h-[60px] items-center justify-between pl-[max(20px,env(safe-area-inset-left))] pr-[max(20px,env(safe-area-inset-right))] md:pl-[max(40px,env(safe-area-inset-left))] md:pr-[max(40px,env(safe-area-inset-right))] lg:hidden">
              <motion.div variants={drop} custom={0} className="relative top-[5px]">
                {/* плоский логотип с подтёками — всегда, и над hero тоже */}
                <Logo show flat onClick={toTop} imgClassName="w-[88px]" />
              </motion.div>
              <motion.div variants={drop} custom={1}>
                <Burger
                  ref={burger}
                  open={open}
                  controls={MENU_ID}
                  onClick={(e) => {
                    if (open) return closeMenu();
                    viaKeyboard.current = e.detail === 0; // Enter/Space — без координат клика
                    setOpen(true);
                  }}
                />
              </motion.div>
            </div>
          )}
        </motion.nav>
      </motion.div>
    </header>
  );
}

/** Ссылка бара: номер-индекс, текст «перекатывается» вверх токсичной копией, под активной — токсичная планка. */
function DeskLink({
  id,
  label,
  active,
  onNav,
  i,
}: {
  id: string;
  label: string;
  active: boolean;
  onNav: (e: MouseEvent<HTMLAnchorElement>, id: string) => void;
  i: number;
}) {
  return (
    <motion.li variants={drop} custom={i} className="relative flex h-16 items-stretch">
      {/* ссылка на всю высоту бара (64px — удобно пальцем на планшете), обводка фокуса — вокруг текста */}
      <a
        href={`#${id}`}
        onClick={(e) => onNav(e, id)}
        aria-current={active ? "location" : undefined}
        className="group flex items-center outline-none"
      >
        <span className="flex items-baseline gap-1.5 group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-toxic group-focus-visible:[outline-style:solid]">
          <span
            aria-hidden
            className={cn(
              "label hidden text-[0.56rem] tabular-nums transition-colors duration-200 xl:inline",
              active ? "text-toxic" : "text-mute group-hover:text-toxic",
            )}
          >
            {num(id)}
          </span>
          <span className="relative block overflow-hidden">
            <span
              className={cn(
                "label block whitespace-nowrap transition-[translate] duration-[450ms] ease-[var(--ease-out-expo)]",
                "group-hover:-translate-y-full group-focus-visible:-translate-y-full",
                active ? "text-toxic" : "text-paper",
              )}
            >
              {label}
            </span>
            <span
              aria-hidden
              className={cn(
                "label absolute inset-0 block translate-y-full whitespace-nowrap text-toxic transition-[translate] duration-[450ms] ease-[var(--ease-out-expo)]",
                "group-hover:translate-y-0 group-focus-visible:translate-y-0",
              )}
            >
              {label}
            </span>
          </span>
        </span>
      </a>
      {active && (
        <motion.span
          aria-hidden
          layoutId="nav-active"
          className="absolute inset-x-0 bottom-[11px] h-[3px] -skew-x-[20deg] bg-toxic shadow-[0_0_12px_rgb(31_242_255/0.55)]"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}
    </motion.li>
  );
}
