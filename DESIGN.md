# ХИМИЯ — дизайн-бриф и правила сборки

Одностраничный сайт школы танцев «Химия» (Ставрополь) на React. Задача дизайна —
**экспрессия, импульс, энергия, ритм и уличная атмосфера**.

## Концепция

«Химия» = химическая реакция + улица. Токсичный голубой — как светящийся реагент.
Визуальный язык — уличный постер, который клеят поверх другого постера:

- **рваная бумага** с белой волокнистой кромкой (`TornEdge`, `tornClipPath`) — все переходы между блоками;
- **скотч-ленты** с бегущим текстом поперёк фото и границ (`Tape`, лента по кривой — `MarqueeAlongSvgPath`);
- **баллончик**: мазки, брызги и подтёки (`Spray`) — перекличка со стекающим логотипом;
- **смазанные движением заголовки** (`MotionBlurTitle`) — края размыты, центр резкий, как в референсах;
- **наклейки**: повёрнутые кнопки с жёсткой тенью (`StickerButton`), бейджи, полароиды;
- **ритм**: шевроны »»»»»», пульсы и мигания в BPM направления (`Chevrons`, `animate-beat` + `--bpm`);
- полутон (`.halftone`), сигнальная штриховка (`.hazard`), сканлайны (`.scanlines`), зерно (глобально).

Бренд-шутка: направления — «элементы» периодической таблицы Химии (`Hp` хип-хоп, `Hh` хай хилс,
`Ct` контемп, `El` электро) с «атомным номером» 01–04.

### Что берём из референсов (файлы в корне проекта, только локально — в .gitignore)

- `040df8230501161.69d387b94d410.png` — страница тарифов: билеты с перфорацией и штрих-кодом,
  один билет выделен кислотным цветом и повёрнут; огромные заголовки с размытыми краями.
- `bfc4d2230501161.69d387b9506ae.png` — главная: блок ABOUT US (коллаж портретов на цветном фоне,
  граффити-тег, текст «Street philosophy»), ленты, сигнальные полосы, финальный CONTACT US.
- `e1457a230501161.69d387b94ded3.webp` — страница классов: карточки внахлёст с наклоном,
  мазки краски с подтёками, рваные/неровные переходы.

**Замена цветов референсов:** лаймовый → `toxic` (#1FF2FF), красный → `cobalt` (#0A57FF), чёрный → `ink`.

## Палитра (Tailwind-токены из `src/index.css`)

| токен | hex | роль |
|---|---|---|
| `ink` | #03060D | фон страницы. **Ровно цвет фона видео логотипа** — hero обязан быть этого цвета |
| `ink-900` / `ink-800` / `ink-700` / `ink-600` | #060B16 / #0A1222 / #111C33 / #1A2846 | поверхности, карточки, вторичные фоны |
| `line` | rgb(150 190 255 / .14) | тонкие линии и рамки |
| `toxic` | #1FF2FF | главный акцент: выделения, ленты, активные состояния, «популярный» билет |
| `toxic-soft` / `toxic-deep` | #8CF8FF / #00B8D4 | оттенки акцента |
| `sky` | #0FC3F8 | цвет самого логотипа |
| `ice` | #D6F6FF | светлые панели, волокно бумаги на синем |
| `cobalt` / `cobalt-deep` / `ultra` | #0A57FF / #0038C8 / #0B1F8F | кнопки, плашки, яркие синие секции (фон фото тренеров ≈ cobalt) |
| `paper` | #EAF4FF | основной светлый текст, волокно рваной бумаги |
| `mute` | #8EA3C4 | вторичный текст на тёмном |

Пропорция: ~65% тёмного (ink-семейство), ~25% синих, ~10% toxic. Toxic — не фон для длинного
текста, а вспышка. Текст на toxic и ice — `ink`; на cobalt и ink — `paper`.

## Типографика

- `display` (класс `.display`, `font-display`) — Sofia Sans Extra Condensed 900, капс, `leading-[0.84]`.
  Заголовки огромные: `text-[clamp(64px,14vw,240px)]` и больше. Кириллица полная.
- `font-sans` — Inter Tight (переменный) для текста 15–18px, `leading-relaxed`, и подписей (`.label`).
- `font-drip` — Rubik Wet Paint: граффити-подтёки. Редко, как тег/акцент (1–2 раза на страницу). Тег «Химия» в тренерах теперь — картинка flat_logo.
- `font-glitch` — Rubik Glitch: **только** в направлении «Электро».
- `font-tag` — Sedgwick Ave Display: граффити-тег, **только латиница** (`vibe`, `himiya`, `street`).
  Вместо тега `flow` в направлениях теперь наклейка flat_logo.
- Цифры цен и счётчиков — `tabular-nums`.
- Шрифты лежат в `public/fonts` урезанными (только latin + cyrillic, граффити — только нужные символы).
  Поменяли слоган «Электро», граффити-слово или добавили новый тег — перезапустите
  `python3 scripts/subset-fonts.py`, иначе недостающие буквы отрисуются запасным шрифтом.

## Движение

- Easing: `[0.16, 1, 0.3, 1]` (out-expo) для появлений, пружины `stiffness 380–420, damping 18–22`
  для «шлепков» наклеек. Длительности 0.5–0.9 с. Ничего вялого: резкий старт, мягкая посадка.
- Появления: `Reveal kind="rise" | "slap" | "whip"`, заголовки — `MotionBlurTitle` (сам анимируется).
- Импульс от скролла: `VelocityMarquee`, перекос по скорости в `MotionBlurTitle`, ленты по кривой.
- Ритм: у каждого направления свой BPM (`DIRECTIONS[i].bpm`) — пульсы через
  `className="animate-beat" style={{"--bpm": 95}}` (`--beat-scale` задаёт силу).
- Только `transform`/`opacity`/`filter` небольших элементов; никаких анимаций width/top на скролле.
  Большие `filter: blur()` не анимировать постоянно.
- **prefers-reduced-motion**: `MotionConfig reducedMotion="user"` уже стоит в App; для своих
  rAF/скролл-эффектов проверяйте `useReducedMotion()`.
- Плавный скролл — Lenis (уже подключён). Скролл к якорю — `scrollToId(id)` из `@/hooks/useLenis`.
  Остановить скролл (модалка, меню) — `window.__lenis?.stop()` / `.start()`.

## Сетка и отступы

- Поля: `px-5 md:px-10 xl:px-16`. Полноширинные постерные блоки — нормально; текстовые колонки ≤ `max-w-xl`.
- Секции: `py-24 md:py-32` (или полноэкранные `min-h-svh`).
- Mobile-first: всё должно хорошо выглядеть на 390px. Нет горизонтального скролла страницы
  (декор за краями — внутри `overflow-hidden`/`overflow-clip` контейнера секции).

## Контракт секций (важно: секции собираются параллельно)

Порядок и фоны (сверху вниз):

| # | id | файл | фон | переход сверху |
|---|---|---|---|---|
| 1 | `top` | `src/sections/Hero.tsx` | `ink` (#03060D, ровно) | — |
| 2 | `directions` | `src/sections/Directions.tsx` | интро `ink-800`, затем 4 панели: `toxic`, `cobalt`, `ice`, `ink-900` | рваный край `ink-800` с волокном, наезжает на hero |
| 3 | `coaches` | `src/sections/Coaches.tsx` | `ink` | рваный край `ink` с волокном поверх панели «Электро» |
| 4 | `prices` | `src/sections/Prices.tsx` | `ink-900` | на усмотрение: рваный край/лента/мазок |
| 5 | `halls` | `src/sections/Halls.tsx` | `cobalt-deep` | рваный край `cobalt-deep`, волокно `ice` |
| 6 | `location` | `src/sections/Location.tsx` | `ink` | рваный край `ink` с волокном |
| 7 | `contact` | `src/sections/Contact.tsx` | `toxic` | рваный край `toxic`, волокно `paper` |
| — | footer | `src/components/layout/Footer.tsx` | `ink` | рваный край `ink` с волокном |

Правила:

1. **Каждая секция сама рисует свой верхний переход** (`<TornEdge side="top" color="<свой фон>" />`),
   который вылезает вверх и перекрывает предыдущую. Нижних переходов не делаем.
2. Корень секции: `<section id="…" className="relative isolate …">`. `isolate` обязателен — более поздняя
   секция всегда рисуется поверх предыдущей. Глобальные z-index: Nav `z-[80]`, зерно `z-[90]`,
   модалки `z-[95]`, курсор `z-[100]`, прелоадер `z-[110]`. Внутри секции — свои z до 10.
3. **Наезд на hero:** Hero — `h-[145svh]` с внутренним `sticky top-0 h-svh`; последние 45svh — зона наезда.
   App сам оборачивает Directions в `-mt-[45svh]` (только на полной странице, в `?only=directions` — без сдвига),
   поэтому интро Directions с рваным краем наезжает на «приколотый» hero. В самой секции отступ не нужен.
4. Тексты — только из `src/lib/content.ts` (можно добавить короткие слоганы/подписи, но **не выдумывать
   факты**: цены, расписание, регалии, годы, количество учеников — только из content.ts).
5. Язык — русский. Латиница — только как граффити-акцент (`font-tag`) и названия стилей.
6. Заголовок `h1` — только в Hero. В секциях — `h2`/`h3`.
7. Внешние ссылки (Telegram, карты) — `StickerButton` сам ставит `target="_blank" rel="noopener noreferrer"`.

## Общие компоненты (`src/components/ui/*`) — не редактировать, только использовать

Живые примеры — `src/sections/_Kit.tsx` (открыть `http://localhost:5173/?only=kit`).

- `MotionBlurTitle({ text, as, className, blur: "edges"|"left"|"right"|"none", edge, velocitySkew, reveal, delay, accents })`
- `SectionLabel({ index: "02", label, tone, bpm })` — «[02] НАПРАВЛЕНИЯ ——— »»»»»»»»
- `TornEdge({ side, color, fiber, height, seed, density })`, `tornClipPath(seed, edges, depth)`
- `Tape({ text: string|string[], variant: "toxic"|"cobalt"|"ink"|"paper"|"hazard", rotate, speed, reverse })`
- `VelocityMarquee({ baseVelocity, itemClassName, skew })`
- `MarqueeAlongSvgPath` (21st.dev, адаптирован) — элементы бегут по SVG-пути; `renderPath` рисует саму ленту
- `StackingCards` + `StackingCardItem` (21st.dev, адаптирован) + `useStackingCardProgress()` → `{ index, local }`
- `Spray({ seed, color, drips, dots, thickness })` — держите пропорцию блока ≈ 5:2 (`aspect-[5/2]`)
- `LoopVideo({ src, webm, poster, eager, fallback })` — грузится у экрана, пауза вне экрана. Автозапуск запрещён
  (iOS в энергосбережении) — показывает `fallback` (анимированный AVIF), без него постер и старт с первого касания;
  кнопку ▶ поверх видео без `controls` прячет index.css. `Duotone({ shadow, highlight })`
- `StickerButton({ href, variant, tilt, size, icon })` + иконки `TelegramIcon`, `PhoneIcon`, `PinIcon`, `ArrowIcon`
- `Magnetic({ strength })`, `ScrambleText({ text })`, `Reveal({ kind, delay })`, `Chevrons({ count, bpm })`
- `ImageTrail({ images, every, life, size })` — шлейф фото за курсором
- утилиты: `cn`, `mulberry32`, `rub(6000) → "6 000 ₽"` из `@/lib/utils`; `onReady/markReady` из `@/lib/ready`

Добавлено после ревью:

- `Barcode({ seed, orientation, guards })` — детерминированный штрих-код (`@/components/ui/barcode`)
- `LoopVideo` принимает `paused` (секция накрыта следующей — IntersectionObserver этого не видит)
- `Tape` по умолчанию `aria-hidden`; смысловой текст — через `label`
- `MotionBlurTitle` принимает `id` (для `aria-labelledby`) и `smear="soft"` для тёмного текста на светлом фоне
- `StickerButton` принимает `shadow` (цвет жёсткой тени); наклон идёт через `--tilt`, на hover выпрямляется
- `scrollToId(id, { immediate, hash })` — пишет `#id` в адрес; при reduced-motion прыгает без анимации
- `@/lib/motion`: `EASE_OUT_EXPO`, `EASE_PUNCH`, `EASE_TEAR`, `SPRING_SLAP`, `SPRING_SOFT`, `prefersReducedMotion()`
- `@/lib/typograph`: `ty(text)` — неразрывные пробелы после предлогов и перед тире
- `@/hooks/useMedia(query)`, `useScrollVelocity`, `useScrollRestore` (восстановление скролла при ленивых секциях)
- при сборке `vite.config.ts → seoStatic` кладёт в `#root` статическую копию контента для поисковиков

Нужна своя деталь (например, билет с перфорацией) — создавайте рядом со своей секцией
(`src/sections/<name>/…`). Если в общем компоненте баг или нужна доработка — **не правьте его**,
опишите в итоговом отчёте.

## Медиа (`public/media`)

- `logo/khimiya-loop-dark.{webm,mp4,jpg}` — стекающий логотип, 1920×1080, 6 с, бесшовный, фон #03060D;
  логотип занимает ≈ 62% ширины кадра по центру. `logo/himiya-{900,320}.{webp,png}` — статичный логотип с прозрачностью.
- `logo/khimiya-loop-dark-720.avif` — та же петля анимированным AVIF (1280×720, 24 к/с, 156 KB) для hero, когда видео
  не запускается само. Пересобрать: `ffmpeg -i khimiya-loop-dark-720.mp4 -vf "fps=24,format=yuv420p" -c:v libsvtav1
  -crf 38 -preset 4 -color_primaries bt709 -color_trc bt709 -colorspace bt709 -loop 0 -f avif khimiya-loop-dark-720.avif`.
- `logo/flat-logo-{240,640,1280}.{webp,png}` — плоский логотип с подтёками (логотип в шапке телефона, наклейки
  в направлениях и тренерах, подпись в футере),
  `logo/cursor-x.webp` — его буква «Х» для курсора. Всё режется из `flat_logo.png` скриптом
  `python3 scripts/cut-flat-logo.py`; он же пишет `src/components/layout/cursor-x.ts` — точку клика «Х» и её контур
  в SVG (над кнопками и ссылками курсор вместо кольца обводит себя увеличенной «Х» тонкой линией).
- `directions/photos/{id}-{900,480}.webp` + `-900.jpg` — иллюстрации направлений 3:4 из `{id}.png` в корне
  (исходники не в git). «Электро» отзеркалена: иначе номер «04» в углу карточки закрывал руку.
- `directions/{hiphop,heels,contemp,electro}.{mp4,jpg}` — 9 с танцевальных петель 540×960, **чёрно-белые**
  (красить через `Duotone` или blend-режимы). Хип-хоп — Милена, хилс — Анна, контемп и электро — тренеры студии.
- `coaches/{milena,veronika,anna,liza,mikhail}-{1000,560}.webp` + `-1000.jpg` — портреты 4:5 на синем фоне.
- `coach-video/{id}.{mp4,jpg}` — интервью тренеров со звуком (540×960) для модалки.
- `halls/{bolshoi,malyi}-zal-{720w,1400w}.{webp,jpg}` — фото залов.
- `misc/crowd.{mp4,jpg}` — ч/б 10 с групповой тренировки 1280×720.

## Доступность и производительность

- Семантика, `alt` у фото, `aria-hidden` у декора, видимый фокус (уже глобально), клавиатура для всего
  интерактивного (модалки: Esc, фокус на кнопке закрытия, возврат фокуса).
- Картинки: `<picture>` с webp + jpg, `width/height`, `loading="lazy"` (кроме hero), `decoding="async"`.
- Видео — только через `LoopVideo` (ленивая загрузка, пауза вне экрана). Интервью в модалке — `preload="none"`.

## Проверка

Dev-сервер уже запущен на `http://localhost:5173` (не запускайте второй).

```bash
npx tsc 2>&1 | grep "src/sections/Hero"         # ошибки типов только своих файлов
node scripts/shot.mjs --only hero --mobile       # кадры .shots/hero/*.png (десктоп 1440×900 + мобильный 390×844)
node scripts/shot.mjs --only hero --scrolls 0,600,1200 --out .shots/hero-scroll
node scripts/shot.mjs --only coaches --hover "[data-coach='milena']"
```

Смотрите каждый кадр (Read на png) и доводите до уровня референсов: крупно, дерзко, ритмично, без
пустых мест и без наложений, которые мешают читать.

## Превью и выкладка

- Ветка `react` в `romanmaznikov1/himiyaplace` собирается на Vercel (`npm run build` → `dist`). Боевой himiyaplace.ru
  раздаёт GitHub Pages из ветки `blue` — превью его не трогает.
- `vercel.json` отдаёт `X-Robots-Tag: noindex, nofollow`: копия на `*.vercel.app` не попадает в поиск. Если боевой сайт
  когда-нибудь переедет на Vercel — этот заголовок убрать, иначе himiyaplace.ru выпадет из Яндекса и Google.
- Яндекс.Метрика включается только на himiyaplace.ru, превью статистику не портит.
