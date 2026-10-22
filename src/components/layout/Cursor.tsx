import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, useVelocity } from "motion/react";

import { MEDIA } from "@/lib/content";

/**
 * Кастомный курсор (только мышь и без reduced-motion): буква «Х» из логотипа ровно под указателем —
 * кренится по ходу движения и пружинит обратно, когда мышь останавливается.
 * Над ссылками/кнопками/[data-cursor] «Х» подрастает, вокруг на пружине догоняет кольцо (difference —
 * над светлым инвертируется), над [data-cursor-label] — наклейка с подписью.
 * Над полями ввода и iframe прячется: там остаётся системный курсор.
 */
type Mode = "idle" | "hover" | "label" | "native";

const INTERACTIVE = "a[href], button, [role='button'], [data-cursor], label, summary";
const NATIVE = "input, textarea, select, iframe, [contenteditable='true'], [data-native-cursor]";

// системный курсор прячем классом на <html>, но поля ввода и [data-native-cursor] (прелоадер) — не трогаем
const CSS = `
html.has-cursor, html.has-cursor * { cursor: none !important; }
html.has-cursor :is(input, textarea, select, [contenteditable="true"]) { cursor: auto !important; }
html.has-cursor :is([data-native-cursor], [data-native-cursor] *) { cursor: pointer !important; }
`;

const SPRING = { type: "spring", stiffness: 520, damping: 30, mass: 0.6 } as const;

/** Размер «Х» на экране и точка клика — пересечение штрихов, в долях картинки (печатает scripts/cut-flat-logo.py). */
const X_W = 27.5;
const X_H = 50;
const HOT = { x: 0.536, y: 0.395 };

export default function Cursor() {
  const reduce = useReducedMotion();
  const [fine, setFine] = useState(() => window.matchMedia("(pointer: fine)").matches);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => setFine(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (!fine || reduce) return null;
  return <CustomCursor />;
}

function CustomCursor() {
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const rx = useSpring(x, { stiffness: 420, damping: 34, mass: 0.6 });
  const ry = useSpring(y, { stiffness: 420, damping: 34, mass: 0.6 });
  // крен «Х» от горизонтальной скорости мыши (px/s), с пружиной — чтобы покачивалась, а не дёргалась
  const vx = useVelocity(x);
  const tilt = useSpring(useTransform(vx, [-2400, 0, 2400], [-26, 0, 26], { clamp: true }), {
    stiffness: 300,
    damping: 15,
    mass: 0.5,
  });

  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<Mode>("idle");
  const [label, setLabel] = useState("");
  const [down, setDown] = useState(false);
  const pos = useRef({ x: -200, y: -200 });
  const shown = useRef(false);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("has-cursor");

    const resolve = (target: EventTarget | null) => {
      const el = target instanceof Element ? target : null;
      if (!el) return;
      if (el.closest(NATIVE)) return setMode("native");
      const tagged = el.closest<HTMLElement>("[data-cursor-label]");
      const text = tagged?.dataset.cursorLabel?.trim();
      if (text) {
        setLabel(text);
        return setMode("label");
      }
      setMode(el.closest(INTERACTIVE) ? "hover" : "idle");
    };

    const hide = () => {
      shown.current = false;
      setVisible(false);
      setDown(false);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pos.current = { x: e.clientX, y: e.clientY };
      if (!shown.current) {
        // после входа в окно кольцо не должно лететь из угла, а «Х» — крениться от «скорости» прыжка из-за края
        shown.current = true;
        x.jump(e.clientX);
        y.jump(e.clientY);
        rx.jump(e.clientX);
        ry.jump(e.clientY);
        setVisible(true);
        resolve(e.target);
      } else {
        x.set(e.clientX);
        y.set(e.clientY);
      }
    };
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "touch") resolve(e.target);
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") hide();
      else setDown(true);
    };
    const onUp = () => setDown(false);
    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) hide();
    };

    // при прокрутке под неподвижной мышью оказывается другой элемент — перепроверяем
    let raf = 0;
    const onScroll = () => {
      if (raf || !shown.current) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        resolve(document.elementFromPoint(pos.current.x, pos.current.y));
      });
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("mouseout", onLeave);
    window.addEventListener("blur", hide);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      html.classList.remove("has-cursor");
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseout", onLeave);
      window.removeEventListener("blur", hide);
      window.removeEventListener("scroll", onScroll);
    };
  }, [x, y, rx, ry]);

  const on = visible && mode !== "native";
  const letter = on && mode !== "label";
  const hover = on && mode === "hover";
  const tag = on && mode === "label";

  return (
    <>
      <style>{CSS}</style>

      {/* кольцо над ссылками и кнопками — режим difference: над светлым фоном цвет инвертируется */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[100] mix-blend-difference"
        style={{ x: rx, y: ry }}
      >
        <motion.span
          className="absolute block size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-toxic"
          initial={false}
          animate={{ opacity: hover ? 1 : 0, scale: hover ? (down ? 0.78 : 1) : 0.4 }}
          transition={SPRING}
        />
      </motion.div>

      {/* наклейка с подписью над [data-cursor-label] — без смешивания, чтобы текст читался всегда */}
      <motion.div aria-hidden className="pointer-events-none fixed left-0 top-0 z-[100]" style={{ x: rx, y: ry }}>
        <motion.span
          className="absolute grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-toxic text-ink shadow-[4px_4px_0_0_var(--color-cobalt)]"
          initial={false}
          animate={{ opacity: tag ? 1 : 0, scale: tag ? (down ? 0.88 : 1) : 0.3, rotate: tag ? -8 : -40 }}
          transition={SPRING}
        >
          <span className="label max-w-[5.5rem] text-center text-[0.62rem] leading-tight">{label}</span>
        </motion.span>
      </motion.div>

      {/*
        «Х» — ровно под указателем, точкой клика служит пересечение штрихов. Без смешивания: чернильная обводка
        и тень вшиты в картинку, она читается и на тёмном, и на светлых панелях. Внешний span нулевого размера
        стоит в точке клика и кренится вокруг неё; масштаб — у картинки, с той же точкой опоры.
      */}
      <motion.div aria-hidden className="pointer-events-none fixed left-0 top-0 z-[100]" style={{ x, y }}>
        <motion.span className="absolute left-0 top-0 block" style={{ rotate: tilt }}>
          <motion.img
            src={MEDIA.cursorX}
            alt=""
            width={83}
            height={151}
            draggable={false}
            className="absolute block max-w-none select-none"
            style={{
              width: X_W,
              height: X_H,
              left: -X_W * HOT.x,
              top: -X_H * HOT.y,
              transformOrigin: `${HOT.x * 100}% ${HOT.y * 100}%`,
            }}
            initial={false}
            animate={{ opacity: letter ? 1 : 0, scale: letter ? (down ? 0.78 : hover ? 1.2 : 1) : 0.4 }}
            transition={SPRING}
          />
        </motion.span>
      </motion.div>
    </>
  );
}
