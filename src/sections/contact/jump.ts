import type { MouseEvent } from "react";

import { scrollToId } from "@/hooks/useLenis";

/**
 * Якорь внутри страницы: плавный скролл Lenis, а при активации с клавиатуры (Enter → detail === 0)
 * фокус переезжает к цели, чтобы следующий Tab продолжил уже оттуда (как Nav.goTo).
 * data-nav-target гасит рамку фокуса на самой секции (стиль задаёт Nav, дублируем в Footer).
 */
export function jumpTo(e: MouseEvent<HTMLElement>, id: string) {
  e.preventDefault();
  const keyboard = e.detail === 0;
  scrollToId(id);
  const target = document.getElementById(id);
  if (keyboard && target) {
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.setAttribute("data-nav-target", "");
    target.focus({ preventScroll: true });
  }
}
