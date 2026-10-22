import type { Direction } from "@/lib/content";
import { blurFrom, blurTo } from "@/lib/motion";

/**
 * Оформление панелей направлений. У каждого стиля свой характер движения:
 * хип-хоп — пружинный «шлепок», хилс — гладкий рывок, контемп — медленно и текуче, электро — рвано, по шагам.
 */
export type Motion = "punch" | "sleek" | "fluid" | "glitch";

export type Theme = {
  bg: string;
  /**
   * Класс фона панели. Нужен не только для цвета: глобальные правила `.bg-toxic :focus-visible` /
   * `.bg-ice :focus-visible` в index.css переключают кольцо фокуса на ink — на инлайновом фоне они не сработают.
   */
  surface: string;
  /** Цвет волокна рваного края (ложится на предыдущую панель). */
  fiber: string;
  text: string;
  /** Вторичный текст. */
  soft: string;
  accent: string;
  /** Рамка фото-постера у слогана: фон рамки + цвет жёсткой тени. */
  photoFrame: string;
  ticket: string;
  chip: string;
  duo: { shadow: string; highlight: string };
  /** Подстройка яркости ч/б исходника перед дуотоном. */
  videoTone?: string;
  frame: string;
  frameShadow: string;
  tape: "toxic" | "cobalt" | "ink" | "paper";
  sticker: "cobalt" | "toxic" | "ink" | "paper";
  stickerShadow: string;
  spray?: string;
  /** Цвет обводки огромного фонового номера. */
  numberStroke: string;
  labelTone: "toxic" | "ink" | "paper" | "cobalt";
  motion: Motion;
  /** Наклон фото-кадра, град. */
  tilt: number;
  /** Зеркальная раскладка (видео слева). */
  flip: boolean;
  tornSeed: number;
  tornHeight: number;
};

export const THEMES: Record<Direction["id"], Theme> = {
  hiphop: {
    bg: "var(--color-toxic)",
    surface: "bg-toxic",
    fiber: "var(--color-paper)",
    text: "text-ink",
    soft: "text-ink/75",
    accent: "var(--color-cobalt)",
    photoFrame: "bg-ink [--shadow-color:var(--color-cobalt)]",
    ticket: "bg-ink text-toxic",
    chip: "border-ink/80 text-ink",
    duo: { shadow: "var(--color-ultra)", highlight: "var(--color-paper)" },
    videoTone: "contrast-[1.15]",
    frame: "bg-ink",
    frameShadow: "var(--color-cobalt)",
    tape: "ink",
    sticker: "ink",
    stickerShadow: "[--shadow-color:var(--color-cobalt)]",
    spray: "var(--color-cobalt)",
    numberStroke: "var(--color-ink)",
    labelTone: "ink",
    motion: "punch",
    tilt: 3,
    flip: false,
    tornSeed: 41,
    tornHeight: 64,
  },
  heels: {
    bg: "var(--color-cobalt)",
    surface: "bg-cobalt",
    fiber: "var(--color-ice)",
    text: "text-paper",
    /** paper/80 на кобальте давал 3.70:1 — ниже AA; ice без прозрачности ≈ 4.8:1 и чуть холоднее основного текста. */
    soft: "text-ice",
    accent: "var(--color-toxic)",
    photoFrame: "bg-paper [--shadow-color:var(--color-ink)]",
    ticket: "bg-paper text-cobalt",
    chip: "border-paper/70 text-paper",
    duo: { shadow: "var(--color-ink)", highlight: "var(--color-toxic)" },
    videoTone: "brightness-[1.7] contrast-[1.2]",
    frame: "bg-paper",
    frameShadow: "var(--color-ink)",
    tape: "toxic",
    sticker: "toxic",
    stickerShadow: "[--shadow-color:var(--color-ink)]",
    spray: "var(--color-ultra)",
    numberStroke: "var(--color-paper)",
    labelTone: "paper",
    motion: "sleek",
    tilt: -2.5,
    flip: true,
    tornSeed: 77,
    tornHeight: 58,
  },
  contemp: {
    bg: "var(--color-ice)",
    surface: "bg-ice",
    fiber: "var(--color-paper)",
    text: "text-ink",
    soft: "text-ink/70",
    accent: "var(--color-cobalt)",
    photoFrame: "bg-paper [--shadow-color:var(--color-cobalt)]",
    ticket: "bg-cobalt text-paper",
    chip: "border-ink/60 text-ink",
    duo: { shadow: "var(--color-cobalt-deep)", highlight: "var(--color-ice)" },
    frame: "bg-paper",
    frameShadow: "var(--color-toxic-deep)",
    tape: "cobalt",
    sticker: "cobalt",
    stickerShadow: "[--shadow-color:var(--color-ink)]",
    numberStroke: "var(--color-cobalt)",
    labelTone: "ink",
    motion: "fluid",
    tilt: 2,
    flip: false,
    tornSeed: 12,
    tornHeight: 70,
  },
  electro: {
    bg: "var(--color-ink-900)",
    surface: "bg-ink-900",
    fiber: "var(--color-toxic)",
    text: "text-paper",
    soft: "text-mute",
    accent: "var(--color-toxic)",
    photoFrame: "bg-toxic [--shadow-color:var(--color-cobalt)]",
    ticket: "bg-toxic text-ink",
    chip: "border-toxic/60 text-toxic",
    duo: { shadow: "var(--color-ink)", highlight: "var(--color-toxic)" },
    videoTone: "brightness-[1.15] contrast-[1.25]",
    frame: "bg-ink",
    frameShadow: "var(--color-cobalt)",
    tape: "toxic",
    sticker: "toxic",
    stickerShadow: "[--shadow-color:var(--color-cobalt)]",
    spray: "var(--color-cobalt-deep)",
    numberStroke: "var(--color-toxic)",
    labelTone: "toxic",
    motion: "glitch",
    tilt: -3,
    flip: true,
    tornSeed: 93,
    tornHeight: 54,
  },
};

/** Появления блоков внутри панели — у каждого стиля своя механика. */
type Frame = Record<string, number | string | number[]>;

export const APPEAR: Record<Motion, { initial: Frame; animate: Frame; transition: object }> = {
  punch: {
    initial: { opacity: 0, scale: 1.3, rotate: -6 },
    animate: { opacity: 1, scale: 1, rotate: 0 },
    transition: { type: "spring", stiffness: 420, damping: 16, mass: 0.8 },
  },
  sleek: {
    initial: { opacity: 0, x: 90, skewX: -10, ...blurFrom(8) },
    animate: { opacity: 1, x: 0, skewX: 0, ...blurTo() },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
  fluid: {
    initial: { opacity: 0, y: 50, ...blurFrom(12) },
    animate: { opacity: 1, y: 0, ...blurTo() },
    transition: { duration: 1.5, ease: [0.22, 1, 0.36, 1] },
  },
  glitch: {
    initial: { opacity: 0, x: -24, skewX: 18 },
    animate: { opacity: [0, 1, 0.3, 1, 0.6, 1], x: [-24, 10, -6, 3, 0, 0], skewX: [18, -8, 4, 0, 0, 0] },
    transition: { duration: 0.45, ease: "linear", times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
  },
};
