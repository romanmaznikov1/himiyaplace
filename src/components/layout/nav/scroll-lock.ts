/**
 * Блокировка прокрутки на время меню/прелоадера: Lenis останавливаем, а нативный скролл
 * (reduced-motion, тач) режем через overflow на <html>. Возвращает функцию разблокировки.
 */
export function lockScroll() {
  const html = document.documentElement;
  const prev = html.style.overflow;
  html.style.overflow = "hidden";
  window.__lenis?.stop();

  // Lenis может появиться чуть позже (App создаёт его в эффекте) — подождём пару кадров
  let raf = 0;
  let tries = 0;
  if (!window.__lenis) {
    const wait = () => {
      if (window.__lenis) window.__lenis.stop();
      else if (++tries < 30) raf = requestAnimationFrame(wait);
    };
    raf = requestAnimationFrame(wait);
  }

  let done = false;
  return () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    html.style.overflow = prev;
    window.__lenis?.start();
  };
}
