import { useEffect, useLayoutEffect, useRef, type PointerEvent } from "react";
import { cancelFrame, frame, useInView, useReducedMotion, type FrameData } from "motion/react";

import { cn, mulberry32 } from "@/lib/utils";

/**
 * Текст «расшифровывается» из случайных символов (по мотивам 21st.dev «Text Scramble»).
 * Запускается при появлении в экране и повторно при наведении мышью.
 *   <ScrambleText text="[02] Направления" className="label text-toxic" />
 *
 * До старта показывается шум той же длины (а не готовый текст — иначе он мелькал на 2–3 кадра).
 * Скринридеры и поиск получают чистый текст из визуально скрытой копии.
 *
 * Место под строку держит невидимая копия готового текста, а шум рисуется поверх неё абсолютным слоем:
 * ширина глифов шума другая, и раньше каждый кадр расшифровки сдвигал соседей (layout shift).
 * Кадры пишутся прямо в textContent в фазе render цикла motion — без ре-рендера React на каждый кадр.
 */
// только кириллица/ASCII/геометрия: греческие ΔΣΩ тянули отдельный файл шрифта (greek) ради шума
const GLYPHS = "ХИМЯЖФШ01#%&*+=<>/\\▲●◆";

/** Детерминированный шум той же длины: пробелы и знаки-разделители остаются на месте. */
function noiseOf(text: string) {
  let seed = 7;
  for (let i = 0; i < text.length; i++) seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
  const rnd = mulberry32(seed);
  let s = "";
  for (const ch of text) s += ch === " " ? ch : GLYPHS[(rnd() * GLYPHS.length) | 0];
  return s;
}

export function ScrambleText({
  text,
  className,
  duration = 700,
  hover = true,
}: {
  text: string;
  className?: string;
  duration?: number;
  hover?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const out = useRef<HTMLSpanElement>(null);
  // "some" + небольшой порог: строка у самого края экрана тоже должна расшифроваться
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const reduce = useReducedMotion();
  const tickRef = useRef<((d: FrameData) => void) | null>(null);

  const write = (s: string) => {
    const el = out.current;
    if (el && el.textContent !== s) el.textContent = s;
  };
  const stop = () => {
    if (tickRef.current) cancelFrame(tickRef.current);
    tickRef.current = null;
  };

  const run = () => {
    stop();
    if (reduce) {
      write(text);
      return;
    }
    let start = -1;
    const tick = ({ timestamp }: FrameData) => {
      if (start < 0) start = timestamp;
      const p = Math.min(1, (timestamp - start) / duration);
      const settled = Math.floor(p * text.length);
      let s = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        s += i < settled || ch === " " ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      write(s);
      if (p >= 1) stop();
    };
    tickRef.current = tick;
    frame.render(tick, true);
  };

  // первый кадр — шум (или готовый текст при reduced-motion), до отрисовки; смена текста до появления — шум новой длины
  useLayoutEffect(() => {
    if (!inView || reduce) write(reduce ? text : noiseOf(text));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, reduce]);

  useEffect(() => {
    if (inView) run();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, text]);

  const onPointerEnter = (e: PointerEvent) => {
    // на тач-экранах «наведение» приходит вместе с тапом — повторный шум там только мешает
    if (e.pointerType === "mouse") run();
  };

  return (
    <span ref={ref} className={cn("relative inline-block tabular-nums", className)} onPointerEnter={hover ? onPointerEnter : undefined}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="invisible">
        {text}
      </span>
      <span aria-hidden ref={out} className="absolute inset-0" />
    </span>
  );
}
