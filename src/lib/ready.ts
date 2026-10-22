/**
 * Сигнал «можно начинать интро»: прелоадер вызывает markReady(), когда уходит с экрана.
 * Hero (и всё, что ждёт интро) подписывается через onReady(cb) — колбэк вызовется сразу,
 * если прелоадер уже отыграл или не запускался.
 */
let ready = false;
const listeners = new Set<() => void>();

export function markReady() {
  if (ready) return;
  ready = true;
  listeners.forEach((cb) => cb());
  listeners.clear();
}

export function onReady(cb: () => void) {
  if (ready) {
    cb();
    return () => {};
  }
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Прелоадер показываем один раз за сессию и не показываем в режиме предпросмотра (?only / ?nopreload). */
export function shouldShowPreloader() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("nopreload") || params.has("only")) return false;
  try {
    return sessionStorage.getItem("himiya:intro") !== "1";
  } catch {
    return true;
  }
}

export function rememberPreloaderShown() {
  try {
    sessionStorage.setItem("himiya:intro", "1");
  } catch {
    /* приватный режим — просто покажем ещё раз */
  }
}
