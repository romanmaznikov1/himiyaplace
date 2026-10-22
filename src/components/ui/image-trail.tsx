import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * Шлейф картинок за курсором (по мотивам 21st.dev «Image Trail»): при движении мыши внутри блока
 * вылетают полароиды-фото, крутятся и гаснут. Только для мыши — на тач ничего не делает.
 *
 *   <ImageTrail images={[...]} className="absolute inset-0">…контент…</ImageTrail>
 */
type Spawn = { id: number; x: number; y: number; src: string; rot: number };

export function ImageTrail({
  images,
  children,
  className,
  every = 90,
  life = 900,
  size = 180,
}: {
  images: string[];
  children?: ReactNode;
  className?: string;
  /** Минимальное расстояние в px между вылетами. */
  every?: number;
  /** Время жизни одной картинки, мс. */
  life?: number;
  size?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef({ x: 0, y: 0 });
  const counter = useRef(0);
  const [spawns, setSpawns] = useState<Spawn[]>([]);
  const timers = useRef(new Set<number>());

  // таймеры гашения не должны пережить размонтирование
  useEffect(() => {
    const set = timers.current;
    return () => {
      set.forEach((t) => clearTimeout(t));
      set.clear();
    };
  }, []);

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== "mouse" || !ref.current || images.length === 0) return;
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (Math.hypot(x - last.current.x, y - last.current.y) < every) return;
    last.current = { x, y };
    const id = counter.current++;
    const s: Spawn = { id, x, y, src: images[id % images.length], rot: ((id * 37) % 24) - 12 };
    setSpawns((prev) => [...prev.slice(-9), s]);
    const t = window.setTimeout(() => {
      timers.current.delete(t);
      setSpawns((prev) => prev.filter((p) => p.id !== id));
    }, life);
    timers.current.add(t);
  };

  return (
    <div ref={ref} className={cn("relative", className)} onPointerMove={onMove}>
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
        <AnimatePresence>
          {spawns.map((s) => (
            <motion.img
              key={s.id}
              src={s.src}
              alt=""
              className="absolute rounded-[2px] object-cover ring-4 ring-paper shadow-[0_20px_40px_-10px_rgb(0_0_0/0.8)]"
              style={{ left: s.x - size / 2, top: s.y - (size * 1.25) / 2, width: size, height: size * 1.25 }}
              initial={{ opacity: 0, scale: 0.4, rotate: s.rot - 20 }}
              animate={{ opacity: 1, scale: 1, rotate: s.rot }}
              exit={{ opacity: 0, scale: 0.85, y: 40, filter: "blur(6px)" }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
            />
          ))}
        </AnimatePresence>
      </div>
      {children}
    </div>
  );
}
