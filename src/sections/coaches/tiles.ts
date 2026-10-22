import type { Coach } from "@/lib/content";

/**
 * Раскладка коллажа. Мобильный: сетка 2 колонки, основатель на всю ширину.
 * Десктоп (lg): два ряда flex-wrap как в референсе ABOUT US —
 * [тег + философия] [Милена, крупнее] [Вероника] / [Анна] [Лиза] [Михаил].
 * Портреты стоят встык и чуть внахлёст (без просветов), соседи сдвинуты по вертикали «лесенкой»,
 * а наклоны чередуются — коллаж читается одним листом, а не сеткой карточек.
 */
export type Tile = {
  /** Наклон «лёгшей на стол» карточки, градусы. */
  rot: number;
  /** С какого наклона карточка «прилетает». */
  throwRot: number;
  /** Сид рваной кромки фото. */
  seed: number;
  edges: { top?: boolean; right?: boolean; bottom?: boolean; left?: boolean };
  /** Базовый z внутри коллажа. */
  z: number;
  /** Порядок в ряду — для задержки «броска». */
  order: number;
  feature?: boolean;
  className: string;
};

export const TILES: Record<Coach["id"], Tile> = {
  milena: {
    rot: -1.6,
    throwRot: -14,
    seed: 3,
    edges: { top: true },
    z: 6,
    order: 0,
    feature: true,
    className: "col-span-2 lg:w-[38%] lg:self-end",
  },
  // поверх Милены: её правый край — только фон фото, а имя Вероники слева остаётся открытым
  veronika: {
    rot: 2.2,
    throwRot: 13,
    seed: 7,
    edges: { right: true },
    z: 7,
    order: 1,
    className: "mt-3 lg:mt-0 lg:-ml-[1.4%] lg:mb-[0.6%] lg:w-[32.2%] lg:self-end",
  },
  anna: {
    rot: -1.8,
    throwRot: -11,
    seed: 11,
    edges: { left: true },
    z: 2,
    order: 0,
    className: "mt-5 lg:ml-[1.2%] lg:mt-[2.4%] lg:w-[33%] lg:self-start",
  },
  // верх подсовываем под низ Милены (там у Лизы только фон над головой)
  liza: {
    rot: 1.4,
    throwRot: 12,
    seed: 5,
    edges: { bottom: true },
    z: 4,
    order: 1,
    className: "-mt-1 lg:-ml-[1.6%] lg:-mt-[3.4%] lg:w-[34%] lg:self-start",
  },
  // поверх Лизы (её правый край — фон), под Вероникой (у Михаила сверху — фон над головой)
  mikhail: {
    rot: -2,
    throwRot: 12,
    seed: 9,
    edges: { bottom: true, right: true },
    z: 5,
    order: 2,
    className: "-mt-1 lg:-ml-[1.4%] lg:-mt-[2%] lg:w-[33.4%] lg:self-start",
  },
};
