import { useCallback, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { motionValue, useMotionValueEvent, useScroll, type MotionValue } from "motion/react";

import { clamp } from "@/lib/utils";

/**
 * Геометрия стопки панелей (StackingCards). Панели могут быть выше экрана (мобильный),
 * поэтому считаем сами по «естественным» позициям в потоке:
 *  - enter[i] 0→1 — панель i въезжает снизу и накрывает предыдущую;
 *  - cover[i] 0→1 — панель i накрывает следующая (для затемнения/наклона);
 *  - stickyTop[i] — отрицательный top для высокой панели: она прилипает, когда её низ дошёл до низа экрана,
 *    поэтому весь контент успевает показаться, прежде чем следующая панель наедет сверху.
 *
 * Высоту экрана берём не из window.innerHeight, а из скрытого fixed-зонда высотой 100svh: на телефонах
 * innerHeight прыгает на 50–80px, когда прячется адресная строка, и прилипшая панель дёргалась бы посреди скролла.
 * svh постоянна (панели и так min-h-svh), поэтому stickyTop не меняется от сворачивания тулбара.
 */
function createSvhProbe() {
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.style.cssText = "position:fixed;left:0;top:0;width:0;visibility:hidden;pointer-events:none;height:100vh";
  el.style.height = "100svh"; // старые браузеры без svh оставят 100vh
  document.body.appendChild(el);
  return el;
}

export function useStackGeometry(count: number) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLElement | null)[]>([]);
  const geo = useRef({ tops: [] as number[], heights: [] as number[], vh: 1 });
  const [stickyTop, setStickyTop] = useState<number[]>(() => Array(count).fill(0));
  const { scrollY } = useScroll();

  const enter = useMemo(() => Array.from({ length: count }, (_, i) => motionValue(i === 0 ? 1 : 0)), [count]);
  const cover = useMemo(() => Array.from({ length: count }, () => motionValue(0)), [count]);

  const update = useCallback(() => {
    const { tops, heights, vh } = geo.current;
    if (!tops.length) return;
    const y = scrollY.get();
    for (let i = 0; i < count; i++) {
      if (i > 0) enter[i].set(clamp((y - (tops[i] - vh)) / vh, 0, 1));
      if (i < count - 1) {
        const span = Math.max(1, Math.min(vh, heights[i]));
        cover[i].set(clamp((y - (tops[i + 1] - span)) / span, 0, 1));
      }
    }
  }, [count, cover, enter, scrollY]);

  useLayoutEffect(() => {
    const probe = createSvhProbe();
    const measure = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const vh = probe.offsetHeight || window.innerHeight;
      const top0 = wrap.getBoundingClientRect().top + window.scrollY;
      const heights = items.current.map((el) => el?.offsetHeight ?? vh);
      const tops: number[] = [];
      let acc = top0;
      for (const h of heights) {
        tops.push(acc);
        acc += h;
      }
      geo.current = { tops, heights, vh };
      const next = heights.map((h) => Math.min(0, Math.round(vh - h)));
      setStickyTop((prev) => (prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next));
      update();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    items.current.forEach((el) => el && ro.observe(el));
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      probe.remove();
    };
  }, [update]);

  useMotionValueEvent(scrollY, "change", update);

  // стабильные колбэк-рефы: по одному на панель
  const itemRefs = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => (el: HTMLElement | null) => {
        items.current[i] = el;
      }),
    [count],
  );

  /** Прокрутка к панели: её «естественный» верх — момент, когда она целиком накрыла предыдущую. */
  const scrollToItem = useCallback((i: number) => {
    const y = geo.current.tops[i];
    if (y === undefined) return;
    if (window.__lenis) window.__lenis.scrollTo(y, { duration: 1.3 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  }, []);

  return { wrapRef, itemRefs, enter, cover, stickyTop, scrollToItem } as {
    wrapRef: RefObject<HTMLDivElement | null>;
    itemRefs: ((el: HTMLElement | null) => void)[];
    enter: MotionValue<number>[];
    cover: MotionValue<number>[];
    stickyTop: number[];
    scrollToItem: (i: number) => void;
  };
}
