// Адаптация компонента 21st.dev «Marquee Along SVG Path» (danielpetho).
// Что поменяно: хуки вынесены в MarqueeItem (в оригинале они вызывались внутри .map),
// по умолчанию слушаем скролл окна, id пути через useId, добавлен renderPath —
// чтобы под бегущими элементами нарисовать саму ленту (толстый stroke по тому же пути).

import React, { useEffect, useId, useMemo, useRef, type ReactNode, type RefObject } from "react";
import {
  cancelFrame,
  frame,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type FrameData,
  type MotionValue,
  type SpringOptions,
} from "motion/react";

import { useInViewport } from "@/hooks/useInViewport";
import { useScrollVelocity as useSharedScrollVelocity } from "@/hooks/useScrollVelocity";
import { cn, wrap } from "@/lib/utils";

interface MarqueeAlongSvgPathProps {
  children: ReactNode;
  className?: string;
  path: string;
  viewBox?: string;
  preserveAspectRatio?: string;
  showPath?: boolean;
  /** Отрисовать декор по тому же пути (лента, обводка). Получает d пути. */
  renderPath?: (d: string) => ReactNode;
  baseVelocity?: number;
  direction?: "normal" | "reverse";
  slowdownOnHover?: boolean;
  slowDownFactor?: number;
  slowDownSpringConfig?: SpringOptions;
  useScrollVelocity?: boolean;
  scrollAwareDirection?: boolean;
  scrollSpringConfig?: SpringOptions;
  scrollContainer?: RefObject<HTMLElement | null>;
  repeat?: number;
  draggable?: boolean;
  dragSensitivity?: number;
  dragVelocityDecay?: number;
  grabCursor?: boolean;
  /** Масштабировать контейнер под размер обёртки (координаты viewBox ↔ px 1:1). */
  responsive?: boolean;
}

/**
 * Скорость скролла для ленты: своя цепочка useScroll → useVelocity → useSpring нужна только
 * при собственном скролл-контейнере; для окна берётся общая пружина страницы (useScrollVelocity),
 * а при useScrollVelocity=false подписки нет вовсе.
 */
export default function MarqueeAlongSvgPath(props: MarqueeAlongSvgPathProps) {
  return props.scrollContainer && props.useScrollVelocity ? <WithContainerVelocity {...props} /> : <MarqueeCore {...props} />;
}

function WithContainerVelocity(props: MarqueeAlongSvgPathProps) {
  const { scrollY } = useScroll({ container: props.scrollContainer });
  const velocity = useSpring(useVelocity(scrollY), props.scrollSpringConfig ?? { damping: 50, stiffness: 400 });
  return <MarqueeCore {...props} velocity={velocity} />;
}

function MarqueeCore({
  children,
  className,
  path,
  viewBox = "0 0 100 100",
  preserveAspectRatio = "xMidYMid meet",
  showPath = false,
  renderPath,
  baseVelocity = 5,
  direction = "normal",
  slowdownOnHover = false,
  slowDownFactor = 0.3,
  slowDownSpringConfig = { damping: 50, stiffness: 400 },
  useScrollVelocity = false,
  scrollAwareDirection = false,
  scrollSpringConfig = { damping: 50, stiffness: 400 },
  repeat = 3,
  draggable = false,
  dragSensitivity = 0.2,
  dragVelocityDecay = 0.96,
  grabCursor = false,
  responsive = true,
  velocity,
}: MarqueeAlongSvgPathProps & { velocity?: MotionValue<number> }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  // вне экрана и при reduced-motion лента стоит: кадры motion не подписаны вовсе
  const inView = useInViewport(wrapper, "200px 0px");
  const active = inView && !reduce;
  const baseOffset = useMotionValue(0);
  const pathId = useId();

  const [, , vbW = 100, vbH = 100] = viewBox.split(" ").map(Number);

  useEffect(() => {
    if (!responsive) return;
    const update = () => {
      const w = wrapper.current;
      const c = inner.current;
      if (!w || !c) return;
      const scale = Math.min(w.clientWidth / vbW, w.clientHeight / vbH);
      const offsetX = (w.clientWidth - vbW * scale) / 2;
      const offsetY = (w.clientHeight - vbH * scale) / 2;
      c.style.width = `${vbW}px`;
      c.style.height = `${vbH}px`;
      c.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
      c.style.transformOrigin = "top left";
    };
    update();
    const ro = new ResizeObserver(update);
    if (wrapper.current) ro.observe(wrapper.current);
    return () => ro.disconnect();
  }, [responsive, vbW, vbH]);

  const items = useMemo(() => {
    const arr = React.Children.toArray(children);
    return arr.flatMap((child, childIndex) =>
      Array.from({ length: repeat }, (_, repeatIndex) => ({
        child,
        repeatIndex,
        itemIndex: repeatIndex * arr.length + childIndex,
        key: `${childIndex}-${repeatIndex}`,
      })),
    );
  }, [children, repeat]);

  const shared = useSharedScrollVelocity(scrollSpringConfig, useScrollVelocity && !velocity && active);
  const velocityFactor = useTransform(velocity ?? shared, [0, 1000], [0, 5], {
    clamp: false,
  });

  const isHovered = useRef(false);
  const isDragging = useRef(false);
  const dragVelocity = useRef(0);
  const directionFactor = useRef(direction === "normal" ? 1 : -1);
  const hoverFactor = useMotionValue(1);
  const smoothHover = useSpring(hoverFactor, slowDownSpringConfig);
  const lastPointer = useRef({ x: 0, y: 0 });

  const step = useRef<(delta: number) => void>(() => {});
  step.current = (delta: number) => {
    if (isDragging.current && draggable) {
      baseOffset.set(baseOffset.get() + dragVelocity.current);
      dragVelocity.current *= 0.9;
      if (Math.abs(dragVelocity.current) < 0.01) dragVelocity.current = 0;
      return;
    }
    hoverFactor.set(isHovered.current && slowdownOnHover ? slowDownFactor : 1);
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000) * smoothHover.get();
    if (scrollAwareDirection) {
      const v = velocityFactor.get();
      if (v < 0) directionFactor.current = -1;
      else if (v > 0) directionFactor.current = 1;
    }
    moveBy += directionFactor.current * moveBy * velocityFactor.get();
    if (draggable) {
      moveBy += dragVelocity.current;
      dragVelocity.current = Math.abs(dragVelocity.current) > 0.01 ? dragVelocity.current * dragVelocityDecay : 0;
    }
    baseOffset.set(baseOffset.get() + moveBy);
  };

  useEffect(() => {
    if (!active) return;
    const tick = ({ delta }: FrameData) => step.current(delta);
    frame.update(tick, true);
    return () => cancelFrame(tick);
  }, [active]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!draggable) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isDragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    dragVelocity.current = 0;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggable || !isDragging.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    dragVelocity.current = (dx > 0 ? d : -d) * dragSensitivity;
    lastPointer.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!draggable) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    isDragging.current = false;
  };

  return (
    <div
      ref={wrapper}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={cn("relative", draggable && grabCursor && "cursor-grab active:cursor-grabbing", className)}
    >
      <div ref={inner} className="relative" style={{ contain: "layout style" }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={viewBox}
          preserveAspectRatio={preserveAspectRatio}
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden
        >
          {renderPath?.(path)}
          <path id={pathId} d={path} fill="none" stroke={showPath ? "currentColor" : "none"} />
        </svg>
        {items.map(({ child, repeatIndex, itemIndex, key }) => (
          <MarqueeItem
            key={key}
            baseOffset={baseOffset}
            position={(itemIndex * 100) / items.length}
            path={path}
            hidden={repeatIndex > 0}
            onEnter={() => (isHovered.current = true)}
            onLeave={() => (isHovered.current = false)}
          >
            {child}
          </MarqueeItem>
        ))}
      </div>
    </div>
  );
}

function MarqueeItem({
  baseOffset,
  position,
  path,
  hidden,
  onEnter,
  onLeave,
  children,
}: {
  baseOffset: MotionValue<number>;
  position: number;
  path: string;
  hidden: boolean;
  onEnter: () => void;
  onLeave: () => void;
  children: ReactNode;
}) {
  const offsetDistance = useTransform(baseOffset, (v) => `${wrap(0, 100, v + position)}%`);
  return (
    <motion.div
      className="absolute left-0 top-0"
      style={{
        offsetPath: `path('${path}')`,
        offsetDistance,
        willChange: "offset-distance",
        backfaceVisibility: "hidden",
      }}
      aria-hidden={hidden}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {children}
    </motion.div>
  );
}
