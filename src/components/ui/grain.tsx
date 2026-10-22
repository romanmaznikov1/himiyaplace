/**
 * Плёночное зерно поверх всей страницы. Подключено один раз в App — в секциях не нужно.
 * Шум из SVG feTurbulence, «дрожит» шагами через CSS-анимацию (keyframes grain-shift — в index.css).
 *
 * На телефонах (< md) — без mix-blend-overlay: смешивание полноэкранного слоя на каждом кадре
 * скролла/видео дорого для средних смартфонов. Там зерно обычное и бледнее, и не дрожит —
 * поэтому и без запаса −10% за края (он нужен только дрожи): слой на 44% меньше по площади.
 */
import type { CSSProperties } from "react";

const noise =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export function Grain({ opacity = 0.075 }: { opacity?: number }) {
  return (
    <div
      aria-hidden
      className="grain pointer-events-none fixed inset-0 z-[90] [contain:strict] md:-inset-[10%]"
      style={{ backgroundImage: noise, "--grain-o": opacity } as CSSProperties}
    />
  );
}
