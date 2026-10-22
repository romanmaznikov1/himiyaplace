import { useEffect } from "react";
import type Lenis from "lenis";

import { whenAllMounted } from "@/lib/mount";
import { prefersReducedMotion } from "@/lib/motion";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/**
 * Плавный скролл колесом — только для мыши/тачпада. На тач-экранах Lenis ничего не сглаживает
 * (syncTouch выключен, скролл нативный), но вешал на window touchstart/touchmove с passive:false
 * (браузер ждал главный поток перед каждым свайпом) и крутил requestAnimationFrame 60 раз в секунду
 * даже в простое. Поэтому на тач его нет вовсе, и модуль грузится отдельным чанком только для мыши.
 * Все вызовы window.__lenis?.… имеют нативный фолбэк (scrollToId → scrollIntoView, jumpTo → scrollTo).
 */
const SMOOTH = "(hover: hover) and (pointer: fine)";

/** Плавный скролл для всей страницы. Экземпляр доступен как window.__lenis (якоря, скриншоты). */
export function useLenis() {
  useEffect(() => {
    if (prefersReducedMotion() || !window.matchMedia(SMOOTH).matches) return;
    let alive = true;
    let lenis: Lenis | undefined;
    let raf = 0;
    void import("lenis").then(({ default: L }) => {
      if (!alive) return;
      lenis = new L({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true });
      window.__lenis = lenis;
      // чанк пришёл, когда прелоадер/меню/модалка уже заблокировали скролл (lockScroll ждёт Lenis лишь
      // пару десятков кадров) — встаём на стоп сразу; разблокировка сама вызовет __lenis.start()
      if (document.documentElement.style.overflow === "hidden") lenis.stop();
      const loop = (t: number) => {
        lenis!.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      lenis?.destroy();
      if (window.__lenis === lenis) delete window.__lenis;
    };
  }, []);
}

/**
 * Старые якоря himiyaplace.ru → секции нового сайта (ссылки из поиска, мессенджеров, закладок).
 * #trial вёл на блок «Пробное занятие» — теперь это полоса пробного в «Ценах».
 */
export const HASH_ALIASES: Record<string, string> = {
  contacts: "contact",
  trainers: "coaches",
  schedule: "location",
  studios: "location",
  studio: "location",
  trial: "prices",
};

/** «#trainers» → «coaches», если такая секция есть на странице; иначе null. */
export function resolveHash(hash: string): string | null {
  let raw = hash.replace(/^#/, "");
  try {
    raw = decodeURIComponent(raw);
  } catch {
    /* битый % — берём как есть */
  }
  if (!raw) return null;
  const id = HASH_ALIASES[raw] ?? raw;
  return document.getElementById(id) ? id : null;
}

type ScrollOpts = {
  /** Без анимации (восстановление позиции, переход по ссылке с якорем). */
  immediate?: boolean;
  /** Записать #id в адресную строку (replaceState — без лишних шагов «Назад»). По умолчанию да. */
  hash?: boolean;
};

/**
 * Прокрутка к секции по id — через Lenis, если он есть.
 * При prefers-reduced-motion — мгновенный переход без анимации.
 * Адрес обновляется на #id, чтобы ссылкой на секцию можно было поделиться.
 */
export function scrollToId(id: string, { immediate = false, hash = true }: ScrollOpts = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  // секция ещё не смонтирована (на её месте заглушка): домонтируем всё и прокрутим к настоящей
  if (el.hasAttribute("data-pending")) {
    whenAllMounted(() =>
      requestAnimationFrame(() => {
        if (!document.getElementById(id)?.hasAttribute("data-pending")) scrollToId(id, { immediate, hash });
      }),
    );
    return;
  }
  const instant = immediate || prefersReducedMotion();
  if (window.__lenis) {
    window.__lenis.scrollTo(el, instant ? { immediate: true, force: true } : { duration: 1.4 });
  } else {
    el.scrollIntoView({ behavior: instant ? "instant" : "smooth", block: "start" });
  }
  if (hash) {
    try {
      const base = window.location.pathname + window.location.search;
      history.replaceState(history.state, "", id === "top" ? base : `${base}#${id}`);
    } catch {
      /* sandbox / file:// — адрес не трогаем */
    }
  }
}

/** Мгновенно поставить страницу на y (с Lenis — синхронно с его состоянием). */
export function jumpTo(y: number) {
  const lenis = window.__lenis;
  if (lenis) {
    lenis.resize();
    lenis.scrollTo(y, { immediate: true, force: true });
  } else {
    window.scrollTo({ top: y, behavior: "instant" });
  }
}
