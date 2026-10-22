import { useSyncExternalStore } from "react";

/**
 * Подписка на media query: true/false, перерисовка при смене (поворот, ресайз).
 *   const touch = useMedia("(hover: none)");
 *   const desktop = useMedia("(min-width: 1024px)");
 */
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
