import { scrollToId } from "@/hooks/useLenis";

/**
 * Программный переход к секции (бар, меню, CTA в hero).
 *  - на время прокрутки бар не прячется (Nav слушает isNavHeld / NAV_HOLD_EVENT);
 *  - с клавиатуры (Enter/Space → e.detail === 0) фокус переезжает в целевую секцию;
 *  - прокрутку, reduced motion и #id в адресе берёт на себя scrollToId.
 */
const HOLD_MS = 1700;
let holdUntil = 0;

export const NAV_HOLD_EVENT = "himiya:nav-hold";

export function isNavHeld() {
  return performance.now() < holdUntil;
}

export function navigateTo(id: string, { keyboard = false }: { keyboard?: boolean } = {}) {
  const target = document.getElementById(id);
  if (!target) return;
  holdUntil = performance.now() + HOLD_MS;
  window.dispatchEvent(new Event(NAV_HOLD_EVENT));
  scrollToId(id);

  // фокус в секцию — следующий Tab продолжит уже оттуда; обводку на весь экран гасит Nav ([data-nav-target])
  if (keyboard) {
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.setAttribute("data-nav-target", "");
    target.focus({ preventScroll: true });
  }
}
