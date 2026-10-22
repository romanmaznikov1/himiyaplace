import { useEffect, useState } from "react";

import { HASH_ALIASES, jumpTo, resolveHash, scrollToId } from "@/hooks/useLenis";
import { NAV } from "@/lib/content";

/**
 * Позиция при перезагрузке/«Назад» и переход по ссылке с якорем.
 *
 * Секции грузятся лениво, поэтому в момент, когда браузер сам восстанавливает скролл или прыгает
 * к #якорю, документ ещё короткий — позиция обрезается (попадали в «Направления» или наверх).
 * Поэтому: history.scrollRestoration = "manual" (ставится ещё в index.html), позиция пишется
 * в sessionStorage при уходе со страницы, а применяется, когда все секции смонтированы.
 */
const KEY = "himiya:scroll:";
const keyFor = () => KEY + window.location.pathname + window.location.search;

type Target = { y: number } | { hash: string } | null;

function navType(): string | undefined {
  try {
    return (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type;
  } catch {
    return undefined;
  }
}

/** Куда встать после загрузки: сохранённая позиция (reload / back-forward) или #якорь. */
export function initialScrollTarget(): Target {
  const type = navType();
  if (type === "reload" || type === "back_forward") {
    try {
      const y = Number(sessionStorage.getItem(keyFor()));
      if (y > 0) return { y };
    } catch {
      /* приватный режим */
    }
  }
  if (window.location.hash.length > 1) return { hash: window.location.hash };
  return null;
}

const KNOWN = new Set<string>(["top", ...NAV.map((n) => n.id), ...Object.keys(HASH_ALIASES)]);

/**
 * Есть ли куда «прыгать» — тогда прелоадер не показываем: человек пришёл к конкретному месту
 * (перезагрузка посреди страницы или ссылка на секцию; посторонний #utm-якорь не в счёт).
 */
export function hasInitialTarget() {
  const t = initialScrollTarget();
  if (!t) return false;
  if ("y" in t) return true;
  const id = t.hash.slice(1);
  return KNOWN.has(id) && id !== "top";
}

function save() {
  try {
    sessionStorage.setItem(keyFor(), String(Math.round(window.scrollY)));
  } catch {
    /* приватный режим */
  }
}

const frames = (n: number) =>
  new Promise<void>((r) => {
    const step = (k: number) => (k <= 0 ? r() : requestAnimationFrame(() => step(k - 1)));
    step(n);
  });

/**
 * @param settled все секции смонтированы (App отслеживает Suspense каждой секции)
 */
export function useScrollRestore(settled: boolean) {
  const [target] = useState<Target>(() => initialScrollTarget());

  // запоминаем позицию при уходе (pagehide надёжнее beforeunload; visibilitychange — для мобильного Safari)
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const onHide = () => save();
    const onVis = () => document.visibilityState === "hidden" && save();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // применяем, когда все секции на месте и шрифты легли (иначе высоты ещё «плывут»)
  useEffect(() => {
    if (!settled || !target) return;
    let alive = true;
    const fonts = document.fonts?.ready ?? Promise.resolve();
    const go = () => {
      if (!alive) return null;
      if ("y" in target) {
        jumpTo(target.y);
        return () => target.y;
      }
      const id = resolveHash(target.hash);
      if (!id) return null;
      // алиас старого сайта (#trainers) заменяем на настоящий id в адресе
      scrollToId(id, { immediate: true, hash: `#${id}` !== target.hash });
      return () => (document.getElementById(id)?.getBoundingClientRect().top ?? 0) + window.scrollY;
    };
    Promise.race([fonts, new Promise((r) => setTimeout(r, 1500))])
      .then(() => frames(2))
      .then(async () => {
        const where = go();
        if (!where) return;
        // картинки/липкие панели могут ещё сдвинуть высоты — поправим, если человек сам не скроллил
        let expected = Math.round(window.scrollY);
        for (const ms of [250, 700]) {
          await new Promise((r) => setTimeout(r, ms));
          if (!alive || Math.abs(window.scrollY - expected) > 2) return;
          const y = Math.round(where());
          if (Math.abs(y - window.scrollY) > 2) {
            jumpTo(y);
            expected = Math.round(window.scrollY);
          }
        }
      });
    return () => {
      alive = false;
    };
  }, [settled, target]);

  // #якорь, набранный/вставленный в адресную строку уже на странице
  useEffect(() => {
    const onHash = () => {
      const id = resolveHash(window.location.hash);
      if (id) scrollToId(id, { hash: `#${id}` !== window.location.hash });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
}
