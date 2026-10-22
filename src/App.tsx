import {
  Component,
  lazy,
  startTransition,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { MotionConfig } from "motion/react";

import { Grain } from "@/components/ui/grain";
import { useLenis } from "@/hooks/useLenis";
import { useMedia } from "@/hooks/useMedia";
import { hasInitialTarget, useScrollRestore } from "@/hooks/useScrollRestore";
import { handOffHeroShell } from "@/lib/hero-shell";
import { markAllMounted, onMountAllRequest } from "@/lib/mount";
import { markReady, onReady, shouldShowPreloader } from "@/lib/ready";
// Hero — LCP-секция: грузим сразу, без лишнего круга за чанком и без сдвига вёрстки (CLS)
import Hero from "@/sections/Hero";
// прелоадер — в основном бандле: он должен закрыть экран с первого кадра, без пустой паузы на загрузку чанка
import Preloader from "@/components/layout/Preloader";

/**
 * Hero — в основном бандле, остальные секции — ленивые модули со своей ErrorBoundary:
 * ошибка в одной секции не роняет страницу.
 *
 * Секции ниже первого экрана монтируются по одной (useStagedMount): сначала рисуется hero,
 * после интро — «Направления», дальше по секции в простое главного потока, а если человек
 * скроллит быстрее — сразу та, к которой он подъезжает (за 1.5 экрана). Раньше все семь секций
 * (~3.5 тыс. узлов) монтировались одним куском — задача на полсекунды на телефоне сразу после
 * первой отрисовки, плюс шрифты и картинки всех секций в первые секунды загрузки.
 * Пришли по ссылке с #якорем / перезагрузили посреди страницы — монтируем всё сразу (нужна
 * настоящая высота документа). App ждёт, пока смонтируются все, и только тогда восстанавливает
 * позицию скролла / переходит к #якорю; переход к ещё не смонтированной секции — см. lib/mount.ts.
 *
 * Режим предпросмотра: ?only=hero (или directions, coaches, prices, halls, location, contact, nav)
 * рендерит одну секцию; ?nopreload — без прелоадера. Используется скриптом scripts/shot.mjs.
 * ?only=kit (витрина общих компонентов) есть только в dev-сборке.
 */
const Nav = lazy(() => import("@/components/layout/Nav"));
const Cursor = lazy(() => import("@/components/layout/Cursor"));

type Loader = () => Promise<{ default: ComponentType }>;
const LOADERS = {
  directions: () => import("@/sections/Directions"),
  coaches: () => import("@/sections/Coaches"),
  prices: () => import("@/sections/Prices"),
  halls: () => import("@/sections/Halls"),
  location: () => import("@/sections/Location"),
  contact: () => import("@/sections/Contact"),
  footer: () => import("@/components/layout/Footer"),
} satisfies Record<string, Loader>;

const SECTIONS: Record<string, ComponentType> = {
  hero: Hero,
  directions: lazy(LOADERS.directions),
  coaches: lazy(LOADERS.coaches),
  prices: lazy(LOADERS.prices),
  halls: lazy(LOADERS.halls),
  location: lazy(LOADERS.location),
  contact: lazy(LOADERS.contact),
};
// витрина компонентов не попадает в продакшен-бандл (import.meta.env.DEV → false, импорт вырезается)
if (import.meta.env.DEV) SECTIONS.kit = lazy(() => import("@/sections/_Kit"));
const Footer = lazy(LOADERS.footer);

const ORDER = ["hero", "directions", "coaches", "prices", "halls", "location", "contact"];

/** Примерная высота каждой секции до загрузки чанка — чтобы документ сразу был «длинным». */
const FALLBACK: Record<string, string> = {
  directions: "min-h-[520svh]",
  coaches: "min-h-[180svh]",
  prices: "min-h-[200svh]",
  halls: "min-h-[170svh]",
  location: "min-h-[180svh]",
  contact: "min-h-[120svh]",
};

const params = new URLSearchParams(window.location.search);
const ONLY = params.get("only");

// полная страница: чанк «Направлений» — сразу (они следующие), остальные — после первой отрисовки hero
// (useStagedMount), чтобы не отнимать канал у постера, шрифтов и видео первого экрана
if (ONLY === null) void LOADERS.directions().catch(() => {});
const prefetchRest = () =>
  Object.entries(LOADERS).forEach(([k, load]) => k !== "directions" && void load().catch(() => {}));

type Idle = (cb: () => void, opts?: { timeout: number }) => number;
const ric: Idle =
  typeof window.requestIdleCallback === "function"
    ? (cb, opts) => window.requestIdleCallback(cb, opts)
    : (cb) => window.setTimeout(cb, 120);
const cancelRic = (id: number) =>
  typeof window.cancelIdleCallback === "function" ? window.cancelIdleCallback(id) : clearTimeout(id);

/** Пауза после старта интро hero, прежде чем монтировать секции ниже: интро не должно дёргаться. */
const INTRO_MS = 900;

/**
 * Сколько первых секций из list уже можно монтировать. full — сразу все.
 * Следующая — по requestIdleCallback после интро hero, или немедленно, когда её заглушка
 * подъехала на 1.5 экрана (быстрый скролл), или по запросу перехода (whenAllMounted).
 */
function useStagedMount(total: number, full: boolean) {
  const [count, setCount] = useState(() => (full ? total : Math.min(total, 1)));
  const [started, setStarted] = useState(full);

  // старт: интро hero пошло (прелоадер ушёл / его нет) + пауза, или человек уже скроллит;
  // чанки остальных секций — тогда же
  useEffect(() => {
    if (started) return;
    let t = 0;
    const start = () => {
      prefetchRest();
      setStarted(true);
    };
    const off = onReady(() => {
      t = window.setTimeout(start, INTRO_MS);
    });
    window.addEventListener("scroll", start, { passive: true, once: true });
    return () => {
      off();
      clearTimeout(t);
      window.removeEventListener("scroll", start);
    };
  }, [started]);

  // цепочка в простое: по одной секции за раз (startTransition — рендер нарезается, не блокируя кадры)
  useEffect(() => {
    if (!started || count >= total) return;
    const id = ric(() => startTransition(() => setCount((c) => Math.max(c, count + 1))), { timeout: 1500 });
    return () => cancelRic(id);
  }, [started, count, total]);

  // человек скроллит быстрее цепочки — монтируем ту, к которой подъезжаем (до старта не смотрим:
  // заглушка «Направлений» с самого начала в 1.5 экранах от верха, и монтировалась бы посреди интро)
  useEffect(() => {
    if (!started || count >= total) return;
    const next = document.querySelector<HTMLElement>("main [data-pending]");
    if (!next) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setCount((c) => Math.max(c, count + 1));
      },
      { rootMargin: "0px 0px 150% 0px" },
    );
    io.observe(next);
    return () => io.disconnect();
  }, [started, count, total]);

  // переход по меню/якорю к ещё не смонтированной секции
  useEffect(() => {
    if (count >= total) return;
    return onMountAllRequest(() => {
      prefetchRest();
      setStarted(true);
      setCount(total);
    });
  }, [count, total]);

  return count;
}

/**
 * Секции один раз отрисованы — дальше на телефонах вне экрана они пропускаются (content-visibility,
 * класс html.cv-ready в index.css). Раньше нельзя: браузер должен запомнить их настоящую высоту.
 */
function useContentVisibility(settled: boolean) {
  useEffect(() => {
    if (!settled) return;
    let raf = 0;
    let alive = true;
    const fonts = document.fonts?.ready ?? Promise.resolve();
    void Promise.race([fonts, new Promise((r) => setTimeout(r, 2000))]).then(() => {
      if (!alive) return;
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => document.documentElement.classList.add("cv-ready"));
      });
    });
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("cv-ready");
    };
  }, [settled]);
}

class Boundary extends Component<{ name: string; children: ReactNode; onError?: () => void }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch() {
    this.props.onError?.();
  }
  render() {
    if (this.state.error) {
      return import.meta.env.DEV ? (
        <div className="m-6 border border-red-500 p-4 font-mono text-sm text-red-400">
          [{this.props.name}] {String(this.state.error.message)}
        </div>
      ) : null;
    }
    return this.props.children;
  }
}

/** Сообщает App, что содержимое Suspense-границы смонтировано (siblings монтируются вместе с секцией). */
function Mounted({ name, onMount }: { name: string; onMount?: (name: string) => void }) {
  useLayoutEffect(() => {
    onMount?.(name);
  }, [name, onMount]);
  return null;
}

function Slot({
  name,
  children,
  fallback,
  onSettled,
  onError,
}: {
  name: string;
  children: ReactNode;
  fallback?: ReactNode;
  onSettled?: (name: string) => void;
  onError?: () => void;
}) {
  const fail = useCallback(() => {
    onError?.();
    onSettled?.(name);
  }, [name, onError, onSettled]);
  return (
    <Boundary name={name} onError={fail}>
      <Suspense fallback={fallback === undefined ? <div className={FALLBACK[name] ?? "min-h-svh"} /> : fallback}>
        {children}
        <Mounted name={name} onMount={onSettled} />
      </Suspense>
    </Boundary>
  );
}

/** Секции вне экрана ставят свои CSS-анимации на паузу (см. [data-offscreen] в index.css). */
function useOffscreenPause(settled: boolean) {
  useEffect(() => {
    if (!settled) return;
    const roots = [...document.querySelectorAll<HTMLElement>("main > *, #root > footer")];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.target.toggleAttribute("data-offscreen", !e.isIntersecting);
      },
      { rootMargin: "200px 0px" },
    );
    roots.forEach((r) => io.observe(r));
    return () => {
      io.disconnect();
      roots.forEach((r) => r.removeAttribute("data-offscreen"));
    };
  }, [settled]);
}

export default function App() {
  useLenis();
  const only = ONLY;
  // решаем один раз: прелоадер сам пишет флаг в sessionStorage и не должен размонтироваться посреди анимации.
  // Пришли по ссылке с #якорем или перезагрузили страницу посреди — прелоадер не нужен.
  const [noPreload] = useState(() => !shouldShowPreloader() || hasInitialTarget());

  useEffect(() => {
    if (noPreload) markReady();
    // страховка: если прелоадер не смог загрузиться или завис — hero и навигация всё равно проявятся
    const t = window.setTimeout(markReady, 6000);
    return () => clearTimeout(t);
  }, [noPreload]);

  const list = only && only in SECTIONS ? [only] : only ? [] : ORDER;
  const showChrome = only === null || only === "nav";
  const showFooter = only === null || only === "contact" || only === "footer";
  // курсор — только для мыши: на тач-экранах его чанк даже не запрашиваем (компонент и так рисует null)
  const finePointer = useMedia("(pointer: fine)");

  const [mountAll] = useState(() => only !== null || hasInitialTarget());
  const mountedCount = useStagedMount(list.length, mountAll);

  // ждём монтирования всех секций (и футера), чтобы высота документа была настоящей
  const expected = useRef<Set<string> | null>(null);
  if (expected.current === null) expected.current = new Set([...list, ...(showFooter ? ["footer"] : [])]);
  const [settled, setSettled] = useState(expected.current.size === 0);
  const onSettled = useCallback((name: string) => {
    const set = expected.current!;
    if (!set.delete(name)) return;
    if (set.size === 0) setSettled(true);
  }, []);

  // статичный кадр логотипа из index.html передаёт эстафету настоящему hero (после его коммита, до отрисовки)
  useLayoutEffect(() => handOffHeroShell(), []);

  useScrollRestore(settled);
  useOffscreenPause(settled);
  useContentVisibility(settled);
  useEffect(() => {
    if (settled) markAllMounted();
  }, [settled]);

  return (
    <MotionConfig reducedMotion="user">
      {!noPreload && (
        <Slot name="preloader" fallback={<div className="fixed inset-0 z-[110] bg-ink" />} onError={markReady}>
          <Preloader />
        </Slot>
      )}
      {showChrome && (
        <>
          <Slot name="nav" fallback={null}>
            <Nav />
          </Slot>
          {finePointer && (
            <Slot name="cursor" fallback={null}>
              <Cursor />
            </Slot>
          )}
        </>
      )}
      <main className="relative">
        {only === "nav" && (
          <Slot name="hero">
            <Hero />
          </Slot>
        )}
        {list.map((k, i) => {
          const S = SECTIONS[k];
          // ещё не смонтирована: заглушка той же примерной высоты и с тем же id (якоря, scrollToId)
          const slot =
            i < mountedCount ? (
              <Slot key={k} name={k} onSettled={onSettled}>
                <S />
              </Slot>
            ) : (
              <div key={k} id={k} data-pending="" aria-hidden className={FALLBACK[k] ?? "min-h-svh"} />
            );
          // Directions наезжает на «приколотый» hero: hero = 145svh, последние 45svh — зона наезда
          return k === "directions" && list.includes("hero") ? (
            <div key={k} className="-mt-[45svh]">
              {slot}
            </div>
          ) : (
            slot
          );
        })}
      </main>
      {showFooter && mountedCount >= list.length && (
        <Slot name="footer" fallback={null} onSettled={onSettled}>
          <Footer />
        </Slot>
      )}
      <Grain />
    </MotionConfig>
  );
}
