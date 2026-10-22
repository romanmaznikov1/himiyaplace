import { useSyncExternalStore } from "react";

/** Подписка на media query: true/false, перерисовка при смене (поворот, ресайз). */
export function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
