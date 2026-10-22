import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { motionValue, useMotionValue, useMotionValueEvent, type MotionValue } from "motion/react";

/** Порог «накрыта целиком»: под непрозрачной следующей панелью её уже не видно. */
export const COVERED = 0.999;

/** Неподвижное «уже въехала» — для интро (оно первое в стопке, въезда у него нет). */
const ENTERED: MotionValue<number> = motionValue(1);

/**
 * Состояние панели стопки — атрибутами прямо на DOM-узле, без перерисовки React (панель большая):
 *  - `data-dir-covered` — панель целиком под следующей: visibility:hidden, GPU не компонует её слой;
 *  - `data-dir-idle` — панель ещё ниже экрана (не въехала) или накрыта: декоративные CSS-петли
 *    (шевроны, эквалайзер, ленты, пульс кадра, глитч) выключены — см. directions.css. Невидимые
 *    бесконечные анимации Blink не может отдать композитору и тикает на главном потоке каждый кадр,
 *    а секция целиком «на экране», пока виден хоть кусок стопки.
 * Возвращает `live` (1 — панель на экране, 0 — нет) для JS-эффектов, которые тоже стоит гасить.
 */
export function usePanelState(
  ref: RefObject<HTMLElement | null>,
  enter: MotionValue<number> | null,
  cover: MotionValue<number>,
): MotionValue<number> {
  const live = useMotionValue(1);
  const entered = enter ?? ENTERED;
  const last = useRef<{ covered: boolean; idle: boolean } | null>(null);

  const sync = useCallback(() => {
    const covered = cover.get() >= COVERED;
    const idle = covered || entered.get() <= 0;
    const prev = last.current;
    if (prev && prev.covered === covered && prev.idle === idle) return;
    last.current = { covered, idle };
    const el = ref.current;
    if (el) {
      el.toggleAttribute("data-dir-covered", covered);
      el.toggleAttribute("data-dir-idle", idle);
    }
    live.set(idle ? 0 : 1);
  }, [cover, entered, live, ref]);

  useMotionValueEvent(cover, "change", sync);
  useMotionValueEvent(entered, "change", sync);
  useLayoutEffect(sync, [sync]);
  return live;
}

/** «Накрыта целиком» как состояние React — только для маленьких узлов (видео), не для всей панели. */
export function useCovered(cover: MotionValue<number>) {
  const [covered, setCovered] = useState(() => cover.get() >= COVERED);
  useMotionValueEvent(cover, "change", (v) => {
    const next = v >= COVERED;
    setCovered((c) => (c === next ? c : next));
  });
  return covered;
}
