import { mulberry32 } from "@/lib/utils";

/**
 * Рваный clip-path с глубиной разрыва в пикселях (а не в % стороны, как tornClipPath):
 * у широкого баннера верх/низ рвутся глубже, а бока — мельче и не превращаются в «пилу».
 * Профиль как у TornEdge: плавная волна + дрожание + редкие глубокие надрывы.
 */
export function tornPolygon(seed: number, { x = 8, y = 14, stepsX = 72, stepsY = 22 } = {}) {
  const rnd = mulberry32(seed * 7919 + 3);
  const edge = (n: number, depth: number) => {
    const p1 = rnd() * Math.PI * 2;
    const p2 = rnd() * Math.PI * 2;
    return Array.from({ length: n + 1 }, (_, i) => {
      const t = i / n;
      const wave = 0.5 + Math.sin(t * Math.PI * 2.3 + p1) * 0.22 + Math.sin(t * Math.PI * 7.1 + p2) * 0.1;
      const jitter = (rnd() - 0.5) * 0.45;
      const notch = rnd() < 0.08 ? rnd() * 0.5 : 0;
      return Math.max(0, Math.min(1, wave + jitter + notch)) * depth;
    });
  };
  const pct = (i: number, n: number) => `${((i / n) * 100).toFixed(2)}%`;
  const top = edge(stepsX, y);
  const right = edge(stepsY, x);
  const bottom = edge(stepsX, y);
  const left = edge(stepsY, x);

  const pts: string[] = [];
  for (let i = 0; i <= stepsX; i++) pts.push(`${pct(i, stepsX)} ${top[i].toFixed(1)}px`);
  for (let i = 1; i < stepsY; i++) pts.push(`calc(100% - ${right[i].toFixed(1)}px) ${pct(i, stepsY)}`);
  for (let i = stepsX; i >= 0; i--) pts.push(`${pct(i, stepsX)} calc(100% - ${bottom[i].toFixed(1)}px)`);
  for (let i = stepsY - 1; i >= 1; i--) pts.push(`${left[i].toFixed(1)}px ${pct(i, stepsY)}`);
  return `polygon(${pts.join(",")})`;
}
