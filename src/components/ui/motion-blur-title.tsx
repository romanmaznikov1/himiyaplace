import { createElement, Fragment, useLayoutEffect, useRef, type CSSProperties } from "react";
import { motion, useReducedMotion, useTransform, type Variants } from "motion/react";

import { useInViewport } from "@/hooks/useInViewport";
import { useScrollVelocity } from "@/hooks/useScrollVelocity";
import { EASE_OUT_EXPO, LITE_MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Фирменный заголовок: края слова «смазаны» движением, центр резкий — как в референсах
 * («PURCHASE TICKET», «ABOUT US»). При появлении слова влетают сбоку из размытия,
 * а при быстром скролле заголовок слегка перекашивается по скорости (velocitySkew).
 *
 *   <MotionBlurTitle as="h2" text="Тренеры" className="text-[22vw] md:text-[12vw]" />
 *
 * Сила смаза зависит от реального кегля: на огромных заголовках — как в референсе,
 * на средних (≈ 45–170 px) зона и шлейф уже, а резкий слой у края не гаснет до конца,
 * чтобы крайняя буква читалась, а не превращалась в «пятно».
 */
type Props = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "div" | "span";
  className?: string;
  /** Где размыть: края, только слева/справа, нигде. */
  blur?: "edges" | "left" | "right" | "none";
  /** Ширина размытой зоны у края, % ширины блока (на крупном кегле; на мелком — уже). */
  edge?: number;
  velocitySkew?: boolean;
  /** Анимировать появление при попадании в экран. */
  reveal?: boolean;
  delay?: number;
  style?: CSSProperties;
  /** Отдельные слова можно подсветить: индексы слов → className. */
  accents?: Record<number, string>;
  /** "soft" — слабее шлейф: для тёмного текста на светлом фоне (toxic, ice), чтобы не было грязного ореола. */
  smear?: "strong" | "soft";
  id?: string;
};

/** Кегль (px), ниже которого смаз почти выключен, и кегль, с которого он в полную силу. */
const FS_MIN = 44;
const FS_FULL = 170;

// на телефонах (LITE_MOTION) слова влетают без blur(14px): размытие огромного кегля не композитится
// и перерисовывало заголовок каждый кадр появления; рывок и растяжение по X остаются
const word: Variants = {
  hidden: { opacity: 0, x: "-0.4em", scaleX: 1.35, ...(LITE_MOTION ? {} : { filter: "blur(14px)" }) },
  shown: ({ i, d }: { i: number; d: number }) => ({
    opacity: 1,
    x: "0em",
    scaleX: 1,
    ...(LITE_MOTION ? {} : { filter: "blur(0px)" }),
    transition: { duration: 0.75, delay: d + i * 0.07, ease: EASE_OUT_EXPO },
  }),
};

/**
 * Кегль всех заголовков меряет один общий ResizeObserver: его колбэк приходит после раскладки,
 * поэтому getComputedStyle там не форсирует пересчёт стилей (раньше он стоял в useLayoutEffect
 * каждого заголовка и при монтировании секций пересчитывал стили всей страницы — ≈ 0.4 с на телефоне).
 * Сначала читаем кегли всех изменившихся заголовков, потом пишем --mb-k.
 */
const fontSizeListeners = new Map<Element, (fs: number) => void>();
let fontSizeRO: ResizeObserver | null = null;

function watchFontSize(el: Element, cb: (fs: number) => void) {
  fontSizeRO ??= new ResizeObserver((entries) => {
    const sizes = entries.map((e) => [e.target, parseFloat(getComputedStyle(e.target).fontSize)] as const);
    for (const [t, fs] of sizes) fontSizeListeners.get(t)?.(fs);
  });
  fontSizeListeners.set(el, cb);
  fontSizeRO.observe(el);
  return () => {
    fontSizeListeners.delete(el);
    fontSizeRO?.unobserve(el);
  };
}

// --mb-k ∈ [0..1] — «сила» смаза от кегля, её ставит ResizeObserver (без ре-рендера)
const K = "var(--mb-k, 1)";

/**
 * Поле вокруг слова под маской. Шлейф смаза (до ≈ 0.2em вправо) и подсветка заголовков (text-shadow до ≈ 0.3em)
 * выходят за глифы, а маска рисует только внутри своего блока: с полем 0.08em свечение обрывалось ровной
 * вертикальной линией. Теперь поле шире, и в нём маска плавно гаснет к краю — шлейф растворяется, а не срезается.
 */
const PAD_X = "0.32em";

function masks(blur: Props["blur"], edge: number) {
  const left = blur === "edges" || blur === "left";
  const right = blur === "edges" || blur === "right";
  const P = PAD_X;
  // зона смаза — доля ширины самого слова (без поля); на мелком кегле уже, резкий слой у края не уходит в ноль
  const word = `(100% - 2 * ${P})`;
  const zone = `${word} * ${edge / 100} * (0.45 + 0.55 * ${K})`;
  const zone2 = `${word} * (${edge / 100} * (0.45 + 0.55 * ${K}) + 0.1 * (0.4 + 0.6 * ${K}))`;
  const L = (d: string) => `calc(${P} + ${d})`;
  const R = (d: string) => `calc(100% - ${P} - ${d})`;
  const floor = `rgb(0 0 0 / calc(1 - 0.85 * ${K}))`;
  const sharp = [
    "transparent 0",
    left ? `${floor} ${P}, #000 ${L(zone)}` : `#000 ${P}`,
    right ? `#000 ${R(zone)}, ${floor} calc(100% - ${P})` : `#000 calc(100% - ${P})`,
    "transparent 100%",
  ];
  const soft = [
    "transparent 0",
    left ? `#000 ${P}, transparent ${L(zone2)}` : null,
    right ? `transparent ${R(zone2)}, #000 calc(100% - ${P})` : null,
    "transparent 100%",
  ];
  const gradient = (stops: (string | null)[]) => `linear-gradient(90deg, ${stops.filter(Boolean).join(", ")})`;
  return { sharp: gradient(sharp), soft: gradient(soft) };
}

/** Длина шлейфа тоже от кегля: на мелком — короче. */
const S = `(0.5 + 0.5 * ${K})`;
const len = (em: number) => `calc(${em}em * ${S})`;
const SMEAR = {
  strong: {
    filter: `blur(${len(0.03)})`,
    textShadow: `${len(0.05)} 0 ${len(0.035)} currentColor, ${len(-0.05)} 0 ${len(0.035)} currentColor, ${len(0.11)} 0 ${len(0.07)} color-mix(in srgb, currentColor 40%, transparent)`,
  },
  soft: {
    filter: `blur(${len(0.025)})`,
    textShadow: `${len(0.04)} 0 ${len(0.02)} color-mix(in srgb, currentColor 55%, transparent), ${len(-0.04)} 0 ${len(0.02)} color-mix(in srgb, currentColor 55%, transparent)`,
  },
} as const;

export function MotionBlurTitle({
  text,
  as = "h2",
  className,
  blur = "edges",
  edge = 9,
  velocitySkew = true,
  reveal = true,
  delay = 0,
  style,
  accents,
  smear = "strong",
  id,
}: Props) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  // одна общая пружина скорости на всю страницу; выключенный перекос не подписывается вовсе,
  // а заголовок далеко за экраном не получает запись стиля на каждом кадре скролла
  const skewOn = velocitySkew && !reduce;
  const near = useInViewport(ref, "200px 0px", skewOn);
  const v = useScrollVelocity({ damping: 40, stiffness: 300 }, skewOn && near);
  const skewX = useTransform(v, [-2500, 0, 2500], [7, 0, -7], { clamp: true });

  // сила смаза от реального кегля (vw/clamp-размеры меняются с окном); подписка — в layout-эффекте,
  // чтобы первое значение пришло до первой отрисовки (колбэк ResizeObserver идёт перед paint)
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || blur === "none") return;
    let last = -1;
    return watchFontSize(el, (size) => {
      const fs = size || FS_FULL;
      const k = Math.round(Math.min(1, Math.max(0, (fs - FS_MIN) / (FS_FULL - FS_MIN))) * 100) / 100;
      if (k === last) return;
      last = k;
      el.style.setProperty("--mb-k", String(k));
    });
  }, [blur]);

  const words = text.split(" ");
  const m = masks(blur, edge);
  const animate = reveal && !reduce;

  // резкий слой — настоящий текст; размытая копия рисует слова через ::before (attr),
  // чтобы текст заголовка не дублировался в textContent (поиск, копирование)
  const renderWords = (layer: "sharp" | "soft") =>
    words.map((w, i) => (
      <Fragment key={`${layer}-${i}`}>
        {i > 0 && " "}
        <motion.span
          custom={{ i, d: delay }}
          variants={animate ? word : undefined}
          className={cn("inline-block whitespace-nowrap", layer === "soft" && "before:content-[attr(data-w)]", accents?.[i])}
          style={{ transformOrigin: "0% 50%" }}
          data-w={layer === "soft" ? w : undefined}
        >
          {layer === "sharp" ? w : null}
        </motion.span>
      </Fragment>
    ));

  // Маски по горизонтали; поле расширяет область маски (а отрицательный margin его компенсирует в раскладке),
  // чтобы не обрезать глифы, размытие и свечение
  const pad = { paddingBlock: "0.3em", marginBlock: "-0.3em", paddingInline: PAD_X, marginInline: `-${PAD_X}` };
  const content = (
    <motion.span
      className="relative inline-block max-w-full align-top"
      initial={animate ? "hidden" : undefined}
      whileInView={animate ? "shown" : undefined}
      viewport={{ once: true, amount: 0.4 }}
      // will-change: перекос по скорости меняется каждый кадр; без своего слоя браузер перерастрирует
      // огромный текст с размытием и тенями на каждом кадре скролла (лаги и мерцание в стопке направлений)
      style={skewOn ? { skewX, willChange: "transform" } : undefined}
    >
      <span
        className="relative block"
        style={blur === "none" ? undefined : { ...pad, WebkitMaskImage: m.sharp, maskImage: m.sharp }}
      >
        {renderWords("sharp")}
      </span>
      {blur !== "none" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 block select-none"
          style={{
            ...pad,
            WebkitMaskImage: m.soft,
            maskImage: m.soft,
            opacity: `calc(0.3 + 0.7 * ${K})`,
            ...SMEAR[smear],
          }}
        >
          {renderWords("soft")}
        </span>
      )}
    </motion.span>
  );

  return createElement(as, { ref, id, className: cn("display relative", className), style, "aria-label": text }, content);
}
