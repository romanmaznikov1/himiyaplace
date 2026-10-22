import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useReducedMotion } from "motion/react";

import { useScrollVelocity } from "@/hooks/useScrollVelocity";
import { cn } from "@/lib/utils";

import { useMedia } from "./useMedia";

/**
 * Изогнутая лента внизу секции: толстая чернильная полоса с toxic-кантом и тенью-смещением,
 * по ней бегут «ХИМИЯ ✕». Разгоняется и разворачивается от скорости скролла.
 *
 * Производительность (своя лента вместо общего MarqueeAlongSvgPath):
 * - элементы едут через transform по заранее посчитанной таблице точек пути, каждый на своём слое —
 *   кадр движения = работа композитора, без перерисовки (offset-distance перерисовывал элементы каждый кадр);
 * - скорость живёт в замыкании rAF, а не в состоянии React — на скролле нет ни одного рендера;
 * - скорость скролла — общая сглаженная (useScrollVelocity), без своей цепочки useScroll → useVelocity → useSpring;
 * - лента едет только пока есть импульс: несколько секунд после появления и во время скролла,
 *   в покое плавно тормозит до нуля, и цикл rAF останавливается совсем.
 */
type Config = {
  vbW: number;
  vbH: number;
  aspect: string;
  path: string;
  /** Шаг между центрами элементов, в единицах viewBox. */
  step: number;
  width: number;
};

const DESKTOP: Config = {
  vbW: 1440,
  vbH: 400,
  aspect: "aspect-[1440/400]",
  path: "M-140 318 C 180 392, 400 140, 720 196 S 1150 92, 1580 6",
  step: 104,
  width: 100,
};

const MOBILE: Config = {
  vbW: 800,
  vbH: 520,
  aspect: "aspect-[800/520]",
  path: "M-160 520 C 80 560, 230 400, 400 300 S 640 70, 980 -10",
  step: 104,
  width: 100,
};

const WORDS = ["ХИМИЯ", "✕"] as const;

/** Крейсерская скорость ленты (% пути в секунду) и тайминги «импульса». */
const CRUISE = 3.2;
const INTRO_MS = 4000;
const IDLE_MS = 1600;
const BRAKE_MS = 700;
/** Скорость скролла (px/с), на которой лента идёт вдвое быстрее крейсерской (как прежние [0, 1000] → [0, 5]). */
const VELOCITY_UNIT = 200;
/** Точек в таблице пути: шаг ≈ 2–3 единицы viewBox, между ними — линейная интерполяция. */
const SAMPLES = 720;
const DEG = 180 / Math.PI;

function pathLength(d: string, fallback: number) {
  try {
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", d);
    return p.getTotalLength() || fallback;
  } catch {
    return fallback;
  }
}

/** x, y и угол касательной (°) на равных шагах длины пути — как offset-path с offset-rotate: auto. */
function buildTable(path: SVGPathElement) {
  const len = path.getTotalLength();
  const t = new Float32Array((SAMPLES + 1) * 3);
  for (let i = 0; i <= SAMPLES; i++) {
    const p = path.getPointAtLength((len * i) / SAMPLES);
    t[i * 3] = p.x;
    t[i * 3 + 1] = p.y;
  }
  for (let i = 0; i <= SAMPLES; i++) {
    const a = Math.max(0, i - 1) * 3;
    const b = Math.min(SAMPLES, i + 1) * 3;
    t[i * 3 + 2] = Math.atan2(t[b + 1] - t[a + 1], t[b] - t[a]) * DEG;
  }
  return t;
}

export function Ribbon({ className }: { className?: string }) {
  const mobile = useMedia("(max-width: 767px)");
  const reduce = useReducedMotion();
  const cfg = mobile ? MOBILE : DESKTOP;
  const velocity = useScrollVelocity(undefined, !reduce);

  const wrapper = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const track = useRef<SVGPathElement>(null);
  const items = useRef<(HTMLDivElement | null)[]>([]);

  // сколько элементов нужно, чтобы они шли с ровным шагом по всей длине пути
  const count = useMemo(() => {
    const len = pathLength(cfg.path, 1800);
    const repeat = Math.max(2, Math.round(len / (cfg.step * WORDS.length)));
    return repeat * WORDS.length;
  }, [cfg]);

  // координаты viewBox ↔ px 1:1: внутренний блок размером с viewBox масштабируется под обёртку
  useEffect(() => {
    const w = wrapper.current;
    const c = inner.current;
    if (!w || !c) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const s = Math.min(width / cfg.vbW, height / cfg.vbH);
      const x = (width - cfg.vbW * s) / 2;
      const y = (height - cfg.vbH * s) / 2;
      c.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    });
    ro.observe(w);
    return () => ro.disconnect();
  }, [cfg]);

  // расстановка до первой отрисовки, затем — цикл импульса
  useLayoutEffect(() => {
    const path = track.current;
    const box = wrapper.current;
    if (!path || !box) return;
    let table: Float32Array;
    try {
      table = buildTable(path);
    } catch {
      return;
    }
    const els = items.current.slice(0, count);

    let offset = 0; // доля пути, 0..1
    let dir = 1;
    let holdUntil = 0;
    let raf = 0;
    let last = 0;
    let visible = false;

    const place = () => {
      const n = els.length;
      for (let i = 0; i < n; i++) {
        const el = els[i];
        if (!el) continue;
        let f = (offset + i / n) % 1;
        if (f < 0) f += 1;
        const pos = f * SAMPLES;
        const k = Math.floor(pos);
        const r = pos - k;
        const a = k * 3;
        const b = Math.min(SAMPLES, k + 1) * 3;
        const x = table[a] + (table[b] - table[a]) * r;
        const y = table[a + 1] + (table[b + 1] - table[a + 1]) * r;
        const deg = table[a + 2] + (table[b + 2] - table[a + 2]) * r;
        el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${deg.toFixed(2)}deg) translate(-50%, -50%)`;
      }
    };
    place();
    if (reduce) return;

    const tick = (t: number) => {
      raf = 0;
      const dt = last ? Math.min(64, t - last) : 1000 / 60;
      last = t;
      const now = performance.now();
      const k = (now - holdUntil) / BRAKE_MS;
      const base =
        now < holdUntil ? CRUISE : k >= 1 ? 0 : CRUISE * (1 - k) * (1 - k);
      const v = velocity.get() / VELOCITY_UNIT;
      if (v < 0) dir = -1;
      else if (v > 0) dir = 1;
      const move = (dir * base * (1 + Math.abs(v)) * dt) / 100_000; // % в секунду → доля за кадр
      if (move) {
        offset = (offset + move) % 1;
        place();
      }
      if (base > 0 && visible) raf = requestAnimationFrame(tick);
      else last = 0;
    };
    const run = () => {
      if (!raf && visible) raf = requestAnimationFrame(tick);
    };
    const wake = (hold: number) => {
      holdUntil = Math.max(holdUntil, performance.now() + hold);
      run();
    };
    const onScroll = () => wake(IDLE_MS);

    const io = new IntersectionObserver(
      ([entry]) => {
        const was = visible;
        visible = entry.isIntersecting;
        if (visible && !was) wake(INTRO_MS);
        if (!visible && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
          last = 0;
        }
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(box);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [cfg, count, reduce, velocity]);

  const w = cfg.width;
  const d = cfg.path;

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none relative select-none", className)}
    >
      <div
        key={mobile ? "m" : "d"}
        ref={wrapper}
        className={cn("relative w-full", cfg.aspect)}
      >
        <div
          ref={inner}
          className="relative origin-top-left"
          style={{ width: cfg.vbW, height: cfg.vbH, contain: "layout style" }}
        >
          <svg
            viewBox={`0 0 ${cfg.vbW} ${cfg.vbH}`}
            className="absolute inset-0 size-full overflow-visible"
          >
            {/* лента: жёсткая кобальтовая тень, чернила, toxic-кант, снова чернила */}
            <path
              d={d}
              transform="translate(9 12)"
              stroke="var(--color-cobalt)"
              strokeWidth={w}
              fill="none"
            />
            <path
              ref={track}
              d={d}
              stroke="var(--color-ink)"
              strokeWidth={w}
              fill="none"
            />
            <path
              d={d}
              stroke="var(--color-toxic)"
              strokeWidth={w - 16}
              fill="none"
            />
            <path
              d={d}
              stroke="var(--color-ink)"
              strokeWidth={w - 24}
              fill="none"
            />
          </svg>
          {Array.from({ length: count }, (_, i) => {
            const word = WORDS[i % WORDS.length];
            return (
              <div
                key={i}
                ref={(el) => {
                  items.current[i] = el;
                }}
                className="absolute left-0 top-0 origin-top-left will-change-transform"
              >
                <span
                  className={cn(
                    "display block whitespace-nowrap pt-[0.07em] leading-none text-toxic",
                    word === "✕"
                      ? "text-[40px] text-toxic/70"
                      : "text-[60px] tracking-[0.02em]",
                  )}
                >
                  {word}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
