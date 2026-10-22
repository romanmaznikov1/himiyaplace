/**
 * Весь контент сайта в одном месте. Секции берут данные отсюда — тексты не дублируем в разметке.
 * Источник: текущий himiyaplace.ru (index.html, октябрь 2026).
 *
 * Тексты абзацев прогнаны через типограф ty(): неразрывные пробелы после предлогов и перед тире
 * уже стоят. Адрес, имена и заголовки — без типографа (их режут по пробелу).
 */
import { ty } from "./typograph";

export const CONTACTS = {
  telegram: { handle: "@himiyaadmin", url: "https://t.me/himiyaadmin" },
  phone: { display: "+7 962 433 35 74", tel: "tel:+79624333574" },
  city: "Ставрополь",
  studio: "Студия «Север»",
  address: "просп. Кулакова, 29Д",
  mapsUrl: "https://yandex.ru/maps/?text=%D0%BF%D1%80%D0%BE%D1%81%D0%BF.+%D0%9A%D1%83%D0%BB%D0%B0%D0%BA%D0%BE%D0%B2%D0%B0+29%D0%94+%D0%A1%D1%82%D0%B0%D0%B2%D1%80%D0%BE%D0%BF%D0%BE%D0%BB%D1%8C",
  /** Виджет конструктора Яндекс Карт с метками студии (тот же, что на текущем сайте). */
  mapWidget:
    "https://yandex.ru/map-widget/v1/?um=constructor%3A20a66477c8418cd985f0350f06b8b81d73f60102b87ac2939c13364458663458&source=constructor",
  replyTime: "ответим за 10 минут",
} as const;

export const NAV = [
  { id: "directions", label: "Направления" },
  { id: "coaches", label: "Тренеры" },
  { id: "prices", label: "Цены" },
  { id: "halls", label: "Залы" },
  { id: "location", label: "Локация" },
  { id: "contact", label: "Контакты" },
] as const;

/** Блог живёт отдельными статическими страницами в /blog/ (как на текущем сайте) — ссылки на него нужны со страницы. */
export const BLOG = {
  url: "/blog/",
  label: "Блог",
  posts: [
    { url: "/blog/probnoe-zanyatie/", title: "Пробное занятие за 350 ₽: как проходит первый урок в «Химии»" },
    { url: "/blog/kakoy-tanec-vybrat/", title: "Какой танец выбрать новичку" },
    { url: "/blog/ceny-na-tancy-stavropol/", title: "Сколько стоят танцы в Ставрополе: цены на абонементы" },
    { url: "/blog/s-kakogo-vozrasta-tancy/", title: "С какого возраста отдавать ребёнка на танцы" },
  ],
} as const;

export const TRIAL = {
  price: 350,
  minutes: 60,
  text: ty("60 минут в группе, знакомство с тренером и подбор направления. Покупать абонемент после пробного не обязательно."),
} as const;

export type Direction = {
  id: "hiphop" | "heels" | "contemp" | "electro";
  /** «Элемент» периодической таблицы Химии — фирменная шутка бренда. */
  symbol: string;
  number: string;
  title: string;
  latin: string;
  bpm: number;
  tagline: string;
  description: string;
  styles: string[];
  schedule: { day: string; time: string; note?: string }[];
  video: string;
  poster: string;
  /** Постер-иллюстрация направления 3:4 (1086×1448 исходник). */
  photo: { webp900: string; webp480: string; jpg: string };
};

const dirPhoto = (id: string) => ({
  webp900: `/media/directions/photos/${id}-900.webp`,
  webp480: `/media/directions/photos/${id}-480.webp`,
  jpg: `/media/directions/photos/${id}-900.jpg`,
});

export const DIRECTIONS: Direction[] = [
  {
    id: "hiphop",
    symbol: "Hp",
    number: "01",
    title: "Хип-хоп",
    latin: "hip-hop",
    bpm: 95,
    tagline: "Грув. Бит. Свобода.",
    description:
      ty("База уличного танца: качаем грув, слышим бит и танцуем по-своему. От первых шагов до баттлов и сцены — с нуля и для продвинутых."),
    styles: ["HipHop", "HipHop хорео", "Женственный HipHop", "HipHop дети"],
    schedule: [
      { day: "Пн", time: "18:00", note: "Михаил" },
      { day: "Пн", time: "19:00", note: "женственный" },
      { day: "Пн", time: "19:00", note: "Лиза" },
      { day: "Вт", time: "18:00", note: "дети" },
      { day: "Ср", time: "18:00", note: "Михаил" },
      { day: "Чт", time: "18:00", note: "дети" },
      { day: "Пт", time: "19:00", note: "женственный" },
      { day: "Пт", time: "19:00", note: "Лиза" },
    ],
    video: "/media/directions/hiphop.mp4",
    poster: "/media/directions/hiphop.jpg",
    photo: dirPhoto("hiphop"),
  },
  {
    id: "heels",
    symbol: "Hh",
    number: "02",
    title: "Хай хилс",
    latin: "high heels",
    bpm: 100,
    tagline: "Каблуки. Линии. Характер.",
    description:
      ty("Пластика, баланс и подача на каблуках. Раскрываем женственность и уверенность — в зале и на сцене."),
    styles: ["High Heels", "Пластика", "Подача"],
    schedule: [
      { day: "Вт", time: "20:00" },
      { day: "Чт", time: "20:00" },
    ],
    video: "/media/directions/heels.mp4",
    poster: "/media/directions/heels.jpg",
    photo: dirPhoto("heels"),
  },
  {
    id: "contemp",
    symbol: "Ct",
    number: "03",
    title: "Контемп",
    latin: "contemporary",
    bpm: 72,
    tagline: "Эмоция через движение.",
    description:
      ty("Работа с весом тела, дыханием и полом. Контроль, пластика и свобода — танец, в котором можно прожить эмоцию."),
    styles: ["Contemporary", "Модерн", "Партер"],
    schedule: [
      { day: "Пн", time: "20:00" },
      { day: "Чт", time: "20:00" },
    ],
    video: "/media/directions/contemp.mp4",
    poster: "/media/directions/contemp.jpg",
    photo: dirPhoto("contemp"),
  },
  {
    id: "electro",
    symbol: "El",
    number: "04",
    title: "Электро",
    latin: "electro",
    bpm: 128,
    tagline: "Скорость. Акценты. Драйв.",
    description:
      ty("Быстрые руки, чёткие акценты и энергия баттлов. Электро — это скорость, точность и чистый драйв клубной сцены."),
    styles: ["Electro Dance", "Хендс", "Баттлы"],
    schedule: [{ day: "Вс", time: "19:00" }],
    video: "/media/directions/electro.mp4",
    poster: "/media/directions/electro.jpg",
    photo: dirPhoto("electro"),
  },
];

export type Coach = {
  id: "milena" | "veronika" | "anna" | "liza" | "mikhail";
  name: string;
  firstName: string;
  role: string;
  short: string;
  bio: string;
  photo: { webp1000: string; webp720: string; webp560: string; jpg: string };
  video: string;
  videoPoster: string;
};

const photo = (id: string) => ({
  webp1000: `/media/coaches/${id}-1000.webp`,
  webp720: `/media/coaches/${id}-720.webp`,
  webp560: `/media/coaches/${id}-560.webp`,
  jpg: `/media/coaches/${id}-1000.jpg`,
});

export const COACHES: Coach[] = [
  {
    id: "milena",
    name: "Милена Горбик",
    firstName: "Милена",
    role: "Основатель школы · HipHop",
    short: ty("17 лет в танцах, 7 лет тренер. Многократная чемпионка России по HipHop."),
    bio: ty("17 лет в танцах, 7 лет — тренер. Многократная чемпионка России по HipHop. Ученики — чемпионы многих краевых и российских соревнований. Постоянно развивается, танцует в шоукейсе Кирилла Зуба. Занималась в команде Вики Галактион, индивидуально обучалась у Макса Тхая, Вики Галактион, Германа Дизайнера, Кати Реймерс."),
    photo: photo("milena"),
    video: "/media/coach-video/milena.mp4",
    videoPoster: "/media/coach-video/milena.jpg",
  },
  {
    id: "veronika",
    name: "Вероника Лихоман",
    firstName: "Вероника",
    role: "Женственный HipHop · HipHop дети",
    short: ty("Победитель Fresh Up, призёр Project 818. Больше 50 мастер-классов у топовых хореографов."),
    bio: ty("Победитель Fresh Up, призёр Всероссийских соревнований Project 818. Посетила более 50 мастер-классов у топовых хореографов: Дрон, Зуб, Вика Галактион, Апилат, Егор Гуфранов, Арискин, Ваня Кашпур, Даша Ролик, Макс Тхай, Кирилл Захаров, Шпиль и многие другие. Вероника заряжает энергией и влюбляет в танцы с первого занятия!"),
    photo: photo("veronika"),
    video: "/media/coach-video/veronika.mp4",
    videoPoster: "/media/coach-video/veronika.jpg",
  },
  {
    id: "anna",
    name: "Анна Маширова",
    firstName: "Анна",
    role: "High Heels",
    short: ty("Призёр международных и краевых соревнований, участник крупных фестивалей."),
    bio: ty("Призёр международных и краевых соревнований, участник крупных международных фестивалей. Постоянно совершенствуется на классах топовых хореографов страны — Юли Акуниной, Даши Зарубкиной, Оли Рудак и многих других. Если хочется раскрыть свой женский потенциал — тебе просто необходимо познакомиться с Аней."),
    photo: photo("anna"),
    video: "/media/coach-video/anna.mp4",
    videoPoster: "/media/coach-video/anna.jpg",
  },
  {
    id: "liza",
    name: "Лиза Строганова",
    firstName: "Лиза",
    role: "HipHop",
    short: ty("2 место на Fresh Up с командой HIMIYA, призёр проекта «Барахолка»."),
    bio: ty("2 место на Fresh Up с командой HIMIYA, призёр танцевального проекта «Барахолка» и участник многих всероссийских и краевых соревнований (Project 818, S1Contest, Dance Fest). Постоянно развивается на мастер-классах: Rubina, Макс Тхай, Егор Гуфранов, Лёша Голубев, Вова Ключ и многие другие. Лиза — наш бриллиант, её занятия точно нужно попробовать."),
    photo: photo("liza"),
    video: "/media/coach-video/liza.mp4",
    videoPoster: "/media/coach-video/liza.jpg",
  },
  {
    id: "mikhail",
    name: "Михаил Степаненко",
    firstName: "Михаил",
    role: "HipHop хорео",
    short: ty("Участник команды Bust a Move, 7 место на Volga Champ с S1 Family."),
    bio: ty("Участник команды Bust a Move, 7 место на Volga Champ с командой S1 Family, победитель многих чемпионатов юга России и всей страны. Постоянно развивается у топовых хореографов: Кирилл Зуб, Вика Галактион, Diana Matos, Dron, Саша и Алина Бариловы, Яна Дон, Егор Гуфранов, Аня Тарасенко, Серёжа Арискин и другие. Михаил сносит харизмой и будто вшивает в тебя свои знания!"),
    photo: photo("mikhail"),
    video: "/media/coach-video/mikhail.mp4",
    videoPoster: "/media/coach-video/mikhail.jpg",
  },
];

export type Price = {
  id: string;
  count: number;
  unit: string;
  rhythm: string;
  total: number;
  perClass: number;
  saving: string;
  badge?: string;
  featured?: boolean;
};

export const SINGLE_CLASS = 650;

export const PRICES: Price[] = [
  { id: "p4", count: 4, unit: "занятия", rhythm: "1 раз в неделю", total: 2400, perClass: 600, saving: "−8%" },
  {
    id: "p8",
    count: 8,
    unit: "занятий",
    rhythm: "2 раза в неделю",
    total: 3800,
    perClass: 475,
    saving: "−27%",
    badge: "Популярный",
    featured: true,
  },
  { id: "p12", count: 12, unit: "занятий", rhythm: "3 раза в неделю", total: 4800, perClass: 400, saving: "−38%" },
  {
    id: "p16",
    count: 16,
    unit: "занятий",
    rhythm: "4 раза в неделю",
    total: 6000,
    perClass: 375,
    saving: "−42%",
    badge: "Выгоднее всего",
  },
];

export const PRICE_NOTES = {
  allDirections: ty("Один абонемент — на все направления: совмещай хип-хоп, хай хилс, контемп и электро."),
  single: ty(`Разовое занятие без абонемента — ${SINGLE_CLASS} ₽. Скидки на абонементах — по сравнению с ним.`),
} as const;

export type Hall = {
  id: "big" | "small";
  tag: string;
  title: string;
  description: string;
  features: string[];
  image: { webp720: string; webp1000: string; webp1400: string; jpg720: string; jpg1400: string; width: number; height: number };
  alt: string;
};

export const HALLS: Hall[] = [
  {
    id: "big",
    tag: "Большой зал",
    title: "Простор для всей команды",
    description: ty("Много воздуха и света: места хватает и большой группе, и постановке целиком."),
    features: ["Зеркала", "Кондиционеры", "Яркий свет"],
    image: {
      webp720: "/media/halls/bolshoi-zal-720w.webp",
      webp1000: "/media/halls/bolshoi-zal-1000w.webp",
      webp1400: "/media/halls/bolshoi-zal-1400w.webp",
      jpg720: "/media/halls/bolshoi-zal-720w.jpg",
      jpg1400: "/media/halls/bolshoi-zal-1400w.jpg",
      width: 1400,
      height: 1050,
    },
    alt: "Большой зал школы танцев «Химия»: светлые стены, зеркала и много света",
  },
  {
    id: "small",
    tag: "Малый зал",
    title: "Уютный и камерный",
    description: ty("Тёмные стены, мягкая подсветка и зеркала вдоль всей стены — для занятий небольшой группой."),
    features: ["Зеркала во всю стену", "Подсветка", "Кондиционер"],
    image: {
      webp720: "/media/halls/malyi-zal-720w.webp",
      webp1000: "/media/halls/malyi-zal-1000w.webp",
      webp1400: "/media/halls/malyi-zal-1400w.webp",
      jpg720: "/media/halls/malyi-zal-720w.jpg",
      jpg1400: "/media/halls/malyi-zal-1400w.jpg",
      width: 1400,
      height: 788,
    },
    alt: "Малый зал школы танцев «Химия»: тёмные стены, зеркальная стена во всю длину и подсветка",
  },
];

/** Полное недельное расписание студии «Север» — для блока локации. */
export const WEEK = [
  { day: "Понедельник", short: "Пн", items: ["18:00 HipHop (Михаил)", "19:00 Женственный HipHop", "19:00 HipHop (Лиза)", "20:00 Контемп", "20:00 All Styles"] },
  { day: "Вторник", short: "Вт", items: ["18:00 HipHop дети", "18:30 Второй состав", "20:00 High Heels"] },
  { day: "Среда", short: "Ср", items: ["18:00 HipHop (Михаил)", "19:00 Первый состав"] },
  { day: "Четверг", short: "Чт", items: ["18:00 HipHop дети", "18:30 Второй состав", "20:00 Контемп", "20:00 High Heels"] },
  { day: "Пятница", short: "Пт", items: ["19:00 Женственный HipHop", "19:00 HipHop (Лиза)", "20:00 All Styles"] },
  { day: "Суббота", short: "Сб", items: ["15:00 Первый состав"] },
  { day: "Воскресенье", short: "Вс", items: ["19:00 Электро"] },
] as const;

export const MEDIA = {
  logoLoop: {
    webm: "/media/logo/khimiya-loop-dark.webm",
    mp4: "/media/logo/khimiya-loop-dark.mp4",
    /** Фон видео #03060D = токен ink: страница должна быть ровно этого цвета, чтобы края не читались.
     *  webp (≈40 KB против 98 KB jpg); тот же кадр preload-ится в index.html — пути менять вместе. */
    poster: "/media/logo/khimiya-loop-dark.webp",
    /** Телефоны — (max-width: 767px), (max-height: 500px): 1280×720 (webm 276 KB / mp4 318 KB, постер 23 KB)
     *  вместо 1080p — кадр там ≈ 550–600 CSS px, на глаз разницы нет, а байт и декода вдвое меньше. */
    phone: {
      webm: "/media/logo/khimiya-loop-dark-720.webm",
      mp4: "/media/logo/khimiya-loop-dark-720.mp4",
      poster: "/media/logo/khimiya-loop-dark-720.webp",
    },
  },
  logoStatic: {
    webp: "/media/logo/himiya-900.webp",
    png: "/media/logo/himiya-900.png",
    small: "/media/logo/himiya-320.webp",
    smallPng: "/media/logo/himiya-320.png",
    /** оригинальный размер 1760×1038 — для огромного логотипа в футере */
    large: "/media/logo/himiya-1760.webp",
  },
  /** Плоский логотип с подтёками на прозрачном фоне (1551×845): тег «Химия» в тренерах и подпись в футере.
   *  Из flat_logo.png — `python3 scripts/cut-flat-logo.py`; там же «Х» для курсора. */
  logoFlat: {
    w240: "/media/logo/flat-logo-240.webp",
    w640: "/media/logo/flat-logo-640.webp",
    w1280: "/media/logo/flat-logo-1280.webp",
    png: "/media/logo/flat-logo-640.png",
    smallPng: "/media/logo/flat-logo-240.png",
  },
  /** «Х» из того же логотипа — курсор (83×151 = 3× от 27.5×50 px), обводка и тень вшиты в картинку */
  cursorX: "/media/logo/cursor-x.webp",
  crowd: { poster: "/media/misc/crowd.jpg" },
} as const;
