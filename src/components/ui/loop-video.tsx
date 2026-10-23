import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * Зацикленное беззвучное видео, которое грузится только у экрана и ставится на паузу вне его.
 * При prefers-reduced-motion и в режиме экономии трафика показывает постер.
 * Если браузер не даёт автозапуск (iOS в режиме энергосбережения), вместо видео — анимированная картинка
 * fallback, а без неё — постер, и видео пробует стартовать с первого касания.
 *
 *   <LoopVideo src="/media/directions/hiphop.mp4" poster="/media/directions/hiphop.jpg" className="h-full w-full object-cover" />
 */
type Props = {
  src: string;
  webm?: string;
  poster?: string;
  className?: string;
  style?: CSSProperties;
  /** Грузить сразу (для hero), а не по приближению к экрану. */
  eager?: boolean;
  playbackRate?: number;
  /** Принудительная пауза (например, hero полностью накрыт следующей секцией). */
  paused?: boolean;
  /** Анимированная картинка (AVIF) той же петли — на случай, когда автозапуск видео запрещён. */
  fallback?: string;
};

/**
 * Экономия трафика: Save-Data, сеть 2G или prefers-reduced-data — показываем только постер, как при
 * reduced-motion (петля логотипа — 0.3–0.6 MB, петли направлений — по 0.7–1 MB).
 */
function constrainedData() {
  try {
    const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (c?.saveData) return true;
    if (c?.effectiveType && /(^|-)2g$/.test(c.effectiveType)) return true;
    return window.matchMedia("(prefers-reduced-data: reduce)").matches;
  } catch {
    return false;
  }
}
const SAVE_DATA = typeof window !== "undefined" && constrainedData();

/**
 * Два наблюдателя: «рядом» (±300px) — подставить постер и источники заранее;
 * «видно» (0px) — играть/пауза. Источники вставляются один раз через JSX, без el.load():
 * вставка <source> сама запускает выбор ресурса, а load() обрывал первый запрос (двойная загрузка).
 */
export function LoopVideo({
  src,
  webm,
  poster,
  className,
  style,
  eager = false,
  playbackRate = 1,
  paused = false,
  fallback,
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion() || SAVE_DATA;
  const [near, setNear] = useState(eager);
  const [blocked, setBlocked] = useState(false);
  const visible = useRef(false);
  const want = useRef({ paused, reduce, playbackRate });
  want.current = { paused, reduce, playbackRate };

  const sync = () => {
    const el = ref.current;
    if (!el) return;
    const w = want.current;
    if (visible.current && !w.paused && !w.reduce && el.querySelector("source")) {
      el.playbackRate = w.playbackRate;
      if (el.paused)
        el.play().catch((err: unknown) => {
          // NotAllowedError — автозапуск запрещён (энергосбережение iOS); AbortError от паузы во время старта — не он
          if (err instanceof DOMException && err.name === "NotAllowedError") setBlocked(true);
        });
    } else if (!el.paused) {
      el.pause();
    }
  };

  // «рядом с экраном»: постер + источники
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[entries.length - 1]?.isIntersecting) setNear(true);
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  // «на экране»: играть / пауза (берём последнюю запись — при быстром скролле их несколько)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      visible.current = entries[entries.length - 1]?.isIntersecting ?? false;
      sync();
    });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // источники появились / изменились условия — играем только если видно
  useEffect(() => {
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near, paused, reduce, playbackRate]);

  // автозапуск запрещён и картинки нет: касание — жест пользователя, из него play() разрешён
  useEffect(() => {
    if (!blocked || fallback) return;
    const retry = () => sync();
    document.addEventListener("touchend", retry, { once: true, passive: true });
    document.addEventListener("click", retry, { once: true });
    return () => {
      document.removeEventListener("touchend", retry);
      document.removeEventListener("click", retry);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocked, fallback]);

  if (blocked && fallback && !reduce) {
    return (
      <picture>
        <source srcSet={fallback} type="image/avif" />
        <img src={poster} alt="" aria-hidden draggable={false} className={cn("block", className)} style={style} />
      </picture>
    );
  }

  const sources = near && !reduce;
  return (
    <video
      ref={ref}
      className={cn("block", className)}
      style={style}
      poster={near ? poster : undefined}
      muted
      loop
      playsInline
      autoPlay={eager && !reduce && !paused}
      preload={eager ? "auto" : sources ? "metadata" : "none"}
      disablePictureInPicture
      aria-hidden
    >
      {sources && webm && <source src={webm} type="video/webm" />}
      {sources && <source src={src} type="video/mp4" />}
    </video>
  );
}

/**
 * Дуотон поверх чёрно-белого медиа: тени → shadow, света → highlight.
 * Оборачивает <img>/<video> (они должны быть ч/б или будут обесцвечены).
 */
export function Duotone({
  children,
  shadow = "var(--color-ink)",
  highlight = "var(--color-toxic)",
  className,
}: {
  children: React.ReactNode;
  shadow?: string;
  highlight?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative isolate overflow-hidden", className)}>
      <div className="h-full w-full [&>*]:h-full [&>*]:w-full [&>*]:object-cover [&>*]:grayscale">{children}</div>
      <div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-multiply" style={{ background: highlight }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-lighten" style={{ background: shadow }} />
    </div>
  );
}
