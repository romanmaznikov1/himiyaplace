/**
 * Статичный кадр логотипа до JS («оболочка» hero, index.html → #hero-shell).
 *
 * Зачем: до JS (≈150 KB gz) на экране не было ничего, и на мобильной сети первый кадр (FCP/LCP)
 * приходил только через 2.4–2.7 с. Оболочка — постер петли логотипа ровно на месте кадра hero
 * (позиция считается в CSS из тех же формул, что .hx-frame в Hero.tsx) с CSS-появлением
 * (opacity + scale, на композиторе) — логотип виден, как только пришли CSS и постер (~1 с).
 * Только телефоны и только когда не будет прелоадера (решает инлайн-скрипт в index.html).
 *
 * Передача: когда Hero смонтирован, оболочка подстраивается под настоящий .hx-frame (если оценка
 * разошлась на несколько px — мягко переезжает), ждёт, пока видео hero проявится, и растворяется.
 * Тронули скролл раньше — растворяется сразу (сцена hero при скролле отъезжает, а оболочка нет).
 */
const SHELL_CLASS = "hero-shell";

/** Оболочка показана (для Hero: можно не проигрывать появление видео — логотип уже на экране). */
export function heroShellShown() {
  return typeof document !== "undefined" && document.documentElement.classList.contains(SHELL_CLASS) && !!document.getElementById("hero-shell");
}

/** Итоговая прозрачность элемента с учётом предков до stop (motion-варианты интро ставят opacity на обёртки). */
function opacityUpTo(el: Element | null, stop: Element | null) {
  let o = 1;
  for (let n = el; n && n !== stop?.parentElement; n = n.parentElement) o *= Number(getComputedStyle(n).opacity) || 0;
  return o;
}

let started = false;

/** Вызывается App после коммита Hero (layout-эффект, до первой отрисовки React). */
export function handOffHeroShell() {
  if (started) return;
  started = true;
  const root = document.documentElement;
  const shell = document.getElementById("hero-shell");
  if (!shell) return;
  if (!root.classList.contains(SHELL_CLASS)) {
    shell.remove();
    return;
  }
  const pos = shell.firstElementChild as HTMLElement | null;
  const est = pos?.getBoundingClientRect();
  let gone = false;
  let timer = 0;

  const remove = () => {
    shell.remove();
    root.classList.remove(SHELL_CLASS);
  };
  const fade = (ms: number) => {
    if (gone) return;
    gone = true;
    clearTimeout(timer);
    window.removeEventListener("scroll", onScroll);
    shell.style.transition = `opacity ${ms}ms ease-out`;
    shell.style.opacity = "0";
    window.setTimeout(remove, ms + 80);
  };
  const onScroll = () => fade(160);
  window.addEventListener("scroll", onScroll, { passive: true });

  const frameEl = () => document.querySelector<HTMLElement>(".hx-frame");
  // подгоняем оценку из CSS под настоящий кадр hero (шрифты/вёрстка могли дать пару px разницы)
  const align = (animate: boolean) => {
    const f = frameEl();
    if (!f || !pos || !est || !est.width) return;
    const r = f.getBoundingClientRect();
    const dx = r.left - est.left;
    const dy = r.top - est.top;
    const s = r.width / est.width;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(s - 1) < 0.002) return;
    pos.style.transition = animate ? "transform 320ms cubic-bezier(0.16, 1, 0.3, 1)" : "";
    pos.style.transform = `translate(${dx}px, ${dy}px) scale(${s})`;
  };
  align(true);

  const t0 = performance.now();
  const check = () => {
    if (gone) return;
    const f = frameEl();
    const video = f?.querySelector("video") ?? null;
    align(true);
    // видео hero проявилось (интро motion закончилось) — растворяем оболочку поверх него
    const visible = video ? opacityUpTo(video, f) >= 0.97 : false;
    const elapsed = performance.now() - t0;
    if ((visible && elapsed > 150) || elapsed > 3000 || !f) fade(visible ? 380 : 260);
    else timer = window.setTimeout(check, 90);
  };
  timer = window.setTimeout(check, 90);
}
