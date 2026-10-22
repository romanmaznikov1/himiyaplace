import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";

import { LITE_MOTION } from "@/lib/motion";
import { cn, mulberry32 } from "@/lib/utils";

/**
 * Процедурный мазок баллончика с брызгами и подтёками — замена красной краски из референсов.
 * Подтёки «стекают» при появлении в экране (перекличка со стекающим логотипом);
 * на телефонах и при reduced-motion — нарисованы сразу.
 *
 *   <Spray seed={3} color="var(--color-cobalt)" className="absolute inset-x-0 top-1/3 h-[40vw] opacity-80" />
 */
type Props = {
  seed?: number;
  color?: string;
  className?: string;
  drips?: number;
  dots?: number;
  /** Толщина мазка относительно высоты (0..1). */
  thickness?: number;
};

/** Уровни прозрачности брызг (раньше — непрерывные 0.35…1; на глаз разницы нет). */
const DOT_OPACITY = [0.43, 0.59, 0.75, 0.91] as const;

const W = 1000;
const H = 400;

export function Spray({ seed = 1, color = "var(--color-cobalt)", className, drips = 8, dots = 320, thickness = 0.32 }: Props) {
  // на телефонах подтёки нарисованы сразу: анимация cy/scaleY у ~10 SVG-фигур на мазок шириной до 170% экрана
  // заново раскладывала и перерисовывала весь SVG каждый кадр (~2.7 с, пока мазок въезжает в экран)
  const still = useReducedMotion() || LITE_MOTION;
  const shape = useMemo(() => {
    const rnd = mulberry32(seed * 104729 + 11);
    const gauss = () => {
      let u = 0;
      for (let i = 0; i < 4; i++) u += rnd();
      return (u - 2) / 2;
    };
    const p = rnd() * Math.PI * 2;
    const q = rnd() * Math.PI * 2;
    const N = 90;
    const center = (t: number) => H * 0.42 + Math.sin(t * Math.PI * 1.25 + p) * H * 0.12;
    const width = (t: number) => H * thickness * (0.75 + Math.sin(t * Math.PI * 2.7 + q) * 0.25) * (t < 0.06 ? t / 0.06 : t > 0.94 ? (1 - t) / 0.06 : 1);
    const top: string[] = [];
    const bottom: string[] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const x = t * W;
      const c = center(t);
      const w = width(t);
      top.push(`${x.toFixed(1)} ${(c - w / 2 + (rnd() - 0.5) * 10).toFixed(1)}`);
      bottom.unshift(`${x.toFixed(1)} ${(c + w / 2 + (rnd() - 0.5) * 10).toFixed(1)}`);
    }
    const body = `M${top.join(" L")} L${bottom.join(" L")} Z`;

    // брызги: все точки одной прозрачности — одним <path> из дуг (было по <circle> на точку, ~300 узлов на мазок)
    const buckets = DOT_OPACITY.map(() => [] as string[]);
    for (let i = 0; i < dots; i++) {
      const t = rnd();
      const w = width(t) + 20;
      const cx = t * W + gauss() * 18;
      const cy = center(t) + gauss() * w * 0.95;
      const r = 0.6 + rnd() * rnd() * 4.2;
      const o = 0.35 + rnd() * 0.65;
      const b = Math.min(DOT_OPACITY.length - 1, Math.floor(((o - 0.35) / 0.65) * DOT_OPACITY.length));
      const rr = r.toFixed(2);
      buckets[b].push(`M${(cx - r).toFixed(1)} ${cy.toFixed(1)}a${rr} ${rr} 0 1 0 ${(2 * r).toFixed(2)} 0a${rr} ${rr} 0 1 0 ${(-2 * r).toFixed(2)} 0Z`);
    }
    const dotPaths = buckets.map((b, i) => ({ d: b.join(""), o: DOT_OPACITY[i] })).filter((p) => p.d);

    const dripList = Array.from({ length: drips }, () => {
      const t = 0.08 + rnd() * 0.84;
      const x = t * W;
      const y = center(t) + width(t) / 2 - 6;
      const len = 30 + rnd() * rnd() * (H - y - 20);
      const w = 3 + rnd() * 7;
      return { x, y, len, w, delay: rnd() * 0.8 };
    });
    return { body, dotPaths, dripList };
  }, [seed, drips, dots, thickness]);

  return (
    <svg aria-hidden viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={cn("pointer-events-none", className)}>
      <path d={shape.body} fill={color} />
      {shape.dotPaths.map((p) => (
        <path key={p.o} d={p.d} fill={color} opacity={p.o} />
      ))}
      {shape.dripList.map((d, i) => {
        if (still) {
          return (
            <g key={i}>
              <rect x={d.x - d.w / 2} y={d.y} width={d.w} height={d.len} rx={d.w / 2} fill={color} />
              <circle cx={d.x} cy={d.y + d.len} r={d.w * 0.8} fill={color} />
            </g>
          );
        }
        const t = { duration: 1.6, delay: 0.3 + d.delay, ease: [0.5, 0, 0.2, 1] as const };
        return (
          <g key={i}>
            <motion.rect
              x={d.x - d.w / 2}
              y={d.y}
              width={d.w}
              height={d.len}
              rx={d.w / 2}
              fill={color}
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={t}
              style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}
            />
            <motion.circle
              cx={d.x}
              r={d.w * 0.8}
              fill={color}
              initial={{ cy: d.y }}
              whileInView={{ cy: d.y + d.len }}
              viewport={{ once: true, amount: 0.3 }}
              transition={t}
            />
          </g>
        );
      })}
    </svg>
  );
}
