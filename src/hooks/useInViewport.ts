import { useEffect, useState, type RefObject } from "react";

/**
 * «Элемент у экрана» (с запасом margin) — как useInView из motion, но один IntersectionObserver
 * на каждый margin для всех подписчиков (у motion — свой наблюдатель на каждый вызов;
 * на странице их было за полсотни). Для пауз per-frame эффектов: бегущих строк, перекоса по скорости.
 *
 *   const near = useInViewport(ref, "200px 0px");
 *
 * Важно: IntersectionObserver не видит, что элемент накрыт другой секцией или visibility:hidden, —
 * для этого у компонентов есть проп paused.
 */
type Listener = (inView: boolean) => void;
const observers = new Map<string, { io: IntersectionObserver; listeners: Map<Element, Listener> }>();

function observe(el: Element, margin: string, cb: Listener) {
  let entry = observers.get(margin);
  if (!entry) {
    const listeners = new Map<Element, Listener>();
    const io = new IntersectionObserver(
      (records) => {
        // при быстром скролле по одному элементу может прийти несколько записей — важна последняя
        const last = new Map<Element, boolean>();
        for (const r of records) last.set(r.target, r.isIntersecting);
        last.forEach((v, t) => listeners.get(t)?.(v));
      },
      { rootMargin: margin },
    );
    entry = { io, listeners };
    observers.set(margin, entry);
  }
  entry.listeners.set(el, cb);
  entry.io.observe(el);
  const e = entry;
  return () => {
    e.listeners.delete(el);
    e.io.unobserve(el);
  };
}

export function useInViewport(ref: RefObject<Element | null>, margin = "0px", enabled = true) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || typeof IntersectionObserver === "undefined") return;
    return observe(el, margin, setInView);
  }, [ref, margin, enabled]);
  return inView;
}
