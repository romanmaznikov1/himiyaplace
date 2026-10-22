/**
 * Секции ниже первого экрана App монтирует по одной (см. App.tsx → useStagedMount), а не все разом.
 * Пока секция не смонтирована, на её месте стоит заглушка с тем же id и атрибутом data-pending.
 *
 * Переход к такой секции (меню, якорь, кнопка) сначала просит домонтировать всё, а скроллит уже
 * к настоящей секции: whenAllMounted(cb). scrollToId делает это сам — секциям ничего делать не нужно.
 */
let requestAll: (() => void) | null = null;
let allMounted = false;
const waiters: (() => void)[] = [];

/** App: как домонтировать всё сразу. */
export function onMountAllRequest(cb: () => void) {
  requestAll = cb;
  return () => {
    if (requestAll === cb) requestAll = null;
  };
}

/** App: все секции на месте. */
export function markAllMounted() {
  allMounted = true;
  waiters.splice(0).forEach((cb) => cb());
}

export function isAllMounted() {
  return allMounted;
}

/** Выполнить cb, когда все секции смонтированы (сразу, если уже). */
export function whenAllMounted(cb: () => void) {
  if (allMounted || !requestAll) {
    cb();
    return;
  }
  waiters.push(cb);
  requestAll();
}
