#!/usr/bin/env node
/*
 * Сборка блога из content/blog/*.md.
 *
 *   node tools/build-blog.mjs        — страницы блога, блок «Полезное» на главной, sitemap.xml
 *   node tools/build-blog.mjs --og   — то же + картинки для превью ссылок (нужен Google Chrome)
 *
 * Папка blog/ генерируется целиком — руками её не правим, правим .md.
 * Расписание берётся из index.html, цены — из PRICES ниже: одно место правки на весь сайт
 * (раздел «Цены» на главной тоже собирается отсюда).
 */
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync, existsSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://himiyaplace.ru";
const CONTENT_DIR = join(ROOT, "content/blog");
const OUT_DIR = join(ROOT, "blog");
const OG_DIR = join(ROOT, "images/blog");
const DEFAULT_OG = "/images/og-cover.jpg";
const TELEGRAM = "https://t.me/himiyaadmin";
const PHONE = { href: "tel:+79624333574", label: "+7 962 433 35 74" };

const PRICES = [
  { lessons: 4, total: 2400 },
  { lessons: 8, total: 3800 },
  { lessons: 12, total: 4800 },
  { lessons: 16, total: 6000 },
];
const TRIAL_PRICE = 350;
const SINGLE_PRICE = 650; // разовое занятие без абонемента

const CATEGORIES = {
  choice: "Выбор направления",
  start: "Если только начинаете",
  kids: "Детям и подросткам",
  studio: "Цены, расписание, студия",
  benefit: "Польза и результат",
  prep: "Подготовка к занятиям",
};

// Фото — те же файлы, что в карточках тренеров на главной.
const AUTHORS = {
  milena: {
    name: "Милена Горбик",
    role: "Основатель школы «Химия»",
    bio: "17 лет в танцах, 7 лет — тренер. Многократная чемпионка России по HipHop, её ученики — чемпионы краевых и российских соревнований.",
    photo: "Горбик Милена",
  },
  misha: {
    name: "Михаил Степаненко",
    role: "Тренер HipHop хорео",
    bio: "Участник команды Bust a move, победитель чемпионатов юга России. Выступал на Volga Champ с командой S1 family.",
    photo: "Михаил Степаненко",
  },
  anna: {
    name: "Анна Маширова",
    role: "Тренер High Heels и Lady Mix",
    bio: "Призёр международных и краевых соревнований, участник крупных международных фестивалей.",
    photo: "Маширова Анна",
  },
  veronika: {
    name: "Вероника Лихоман",
    role: "Тренер Женственного HipHop и HipHop дети",
    bio: "Победитель Fresh Up, призёр всероссийских соревнований Project 818.",
    photo: "Лихоман Вероника",
  },
  liza: {
    name: "Елизавета Строганова",
    role: "Тренер HipHop",
    bio: "2 место на Fresh Up с командой HIMIYA, призёр танцевального проекта «Барахолка».",
    photo: "Елизавета Строганова",
  },
};

const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const DAYS_DATIVE = {
  Понедельник: "понедельникам",
  Вторник: "вторникам",
  Среда: "средам",
  Четверг: "четвергам",
  Пятница: "пятницам",
  Суббота: "субботам",
  Воскресенье: "воскресеньям",
};

const errors = [];
const warnings = [];

/* ---------- Утилиты ---------- */

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rub = (n) => n.toLocaleString("ru-RU").replace(/\s/g, " ") + " ₽";
const formatDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
const joinRu = (items) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} и ${items.at(-1)}`);
const photoUrl = (name, size = "-300w") => encodeURI(`/images/coaches/webp/${name}${size}.webp`);
const postUrl = (post) => `/blog/${post.slug}/`;
const jsonLd = (data) => `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`;

/* ---------- Расписание из index.html ---------- */

const indexPath = join(ROOT, "index.html");
const indexHtml = readFileSync(indexPath, "utf8");

// Сколько направлений в карточках на главной — эта цифра звучит в разделе «Цены» и в статьях
const directionsCount = indexHtml.split('<div class="direction">').length - 1;

const schedule = (() => {
  const section = indexHtml.split('class="schedule-grid"')[1]?.split('class="schedule-cta"')[0];
  if (!section) throw new Error("В index.html не найдено расписание (.schedule-grid)");
  return section
    .split('class="schedule-day">')
    .slice(1)
    .map((chunk) => ({
      day: chunk.slice(0, chunk.indexOf("<")).trim(),
      items: [...chunk.matchAll(/schedule-time">([^<]+)<\/span><span class="schedule-name">([^<]+)</g)].map((m) => ({
        time: m[1].trim(),
        name: m[2].trim(),
      })),
    }));
})();

// «по понедельникам и средам в 18:00 и по пятницам в 19:00»
const scheduleText = (namesArg, file) => {
  const names = namesArg.split("|").map((s) => s.trim());
  const byTime = new Map();
  for (const { day, items } of schedule) {
    for (const { time, name } of items) {
      if (!names.includes(name)) continue;
      if (!byTime.has(time)) byTime.set(time, []);
      if (!byTime.get(time).includes(day)) byTime.get(time).push(day);
    }
  }
  if (!byTime.size) {
    errors.push(`${file}: в расписании нет занятий «${names.join(" | ")}» — обновите статью или index.html`);
    return "";
  }
  const phrases = [...byTime.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, days]) => `по ${joinRu(days.map((d) => DAYS_DATIVE[d] || d.toLowerCase()))} в ${time}`);
  return joinRu(phrases);
};

const scheduleWeekHtml = () =>
  `<div class="post-schedule">\n${schedule
    .map(
      ({ day, items }) =>
        `  <div class="post-schedule-day"><div class="post-schedule-name">${esc(day)}</div><ul>${items
          .map((i) => `<li><span>${esc(i.time)}</span> ${esc(i.name)}</li>`)
          .join("")}</ul></div>`
    )
    .join("\n")}\n</div>\n<p class="post-note">Расписание подтягивается с <a href="/#schedule">главной страницы</a> и всегда совпадает с ним.</p>`;

const pricesHtml = () =>
  `<div class="post-table-wrap"><table class="post-prices">
  <thead><tr><th>Вариант</th><th>Стоимость</th><th>За занятие</th></tr></thead>
  <tbody>
${PRICES.map(
  (p) => `    <tr><td>${p.lessons} занятий</td><td>${rub(p.total)}</td><td>${rub(Math.round(p.total / p.lessons))}</td></tr>`
)
  .join("\n")
  .replace(">4 занятий<", ">4 занятия<")}
    <tr><td>Разовое занятие</td><td>${rub(SINGLE_PRICE)}</td><td>${rub(SINGLE_PRICE)}</td></tr>
    <tr class="post-prices-trial"><td>Пробное занятие</td><td>${rub(TRIAL_PRICE)}</td><td>1 занятие, 60 мин</td></tr>
  </tbody>
</table></div>`;

/* ---------- Markdown (ровно то подмножество, что нужно статьям) ---------- */

const inline = (text, file) => {
  let out = text.replace(/\{\{schedule:([^}]+)\}\}/g, (_, names) => scheduleText(names, file));
  out = esc(out);
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const external = /^https?:\/\//.test(href);
    return `<a href="${href}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${label}</a>`;
  });
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, "$1<em>$2</em>");
  // Неразрывные пробелы: «2 400 ₽» не разрывается на две строки.
  out = out.replace(/(\d) (?=\d{3}\b)/g, "$1 ").replace(/ ₽/g, " ₽");
  return out;
};

const markdown = (src, file) =>
  src
    .trim()
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n");
      if (block.trim() === "{{prices}}") return pricesHtml();
      if (block.trim() === "{{schedule-week}}") return scheduleWeekHtml();
      if (block.startsWith("### ")) return `<h3>${inline(block.slice(4), file)}</h3>`;
      if (block.startsWith("## ")) return `<h2>${inline(block.slice(3), file)}</h2>`;
      if (lines.every((l) => l.startsWith("- ")))
        return `<ul>\n${lines.map((l) => `  <li>${inline(l.slice(2), file)}</li>`).join("\n")}\n</ul>`;
      if (lines.every((l) => /^\d+\. /.test(l)))
        return `<ol>\n${lines.map((l) => `  <li>${inline(l.replace(/^\d+\. /, ""), file)}</li>`).join("\n")}\n</ol>`;
      if (lines.every((l) => l.startsWith(">"))) {
        const body = lines.map((l) => l.replace(/^>\s?/, ""));
        const cite = body.at(-1).startsWith("— ") ? body.pop().slice(2) : "";
        return `<blockquote class="post-quote">\n  <p>«${inline(body.join(" "), file)}»</p>${
          cite ? `\n  <cite>${inline(cite, file)}</cite>` : ""
        }\n</blockquote>`;
      }
      return `<p>${inline(lines.join(" "), file)}</p>`;
    })
    .join("\n\n");

/* ---------- Чтение статей ---------- */

const posts = readdirSync(CONTENT_DIR)
  .filter((f) => f.endsWith(".md"))
  .sort()
  .map((file) => {
    const raw = readFileSync(join(CONTENT_DIR, file), "utf8");
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) throw new Error(`${file}: нет блока --- с метаданными`);
    const meta = Object.fromEntries(
      match[1].split("\n").map((line) => {
        const i = line.indexOf(":");
        return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
      })
    );
    return {
      file,
      ...meta,
      related: (meta.related || "").split(",").map((s) => s.trim()).filter(Boolean),
      featured: meta.featured ? Number(meta.featured) : 0,
      body: match[2],
      words: match[2].replace(/\{\{[^}]+\}\}/g, "").split(/\s+/).filter(Boolean).length,
    };
  });

const bySlug = new Map(posts.map((p) => [p.slug, p]));

for (const p of posts) {
  for (const key of ["slug", "title", "seo_title", "description", "category", "author", "date", "cta"]) {
    if (!p[key]) errors.push(`${p.file}: не заполнено поле ${key}`);
  }
  if (!CATEGORIES[p.category]) errors.push(`${p.file}: неизвестная рубрика ${p.category}`);
  if (!AUTHORS[p.author]) errors.push(`${p.file}: неизвестный автор ${p.author}`);
  if (p.description.length > 160) warnings.push(`${p.file}: description ${p.description.length} символов (лучше ≤ 160)`);
  if (`${p.seo_title} | Химия`.length > 65) warnings.push(`${p.file}: title ${p.seo_title.length + 8} символов (лучше ≤ 65)`);
  for (const r of p.related) if (!bySlug.has(r)) errors.push(`${p.file}: related — нет статьи ${r}`);
  for (const [, slug] of p.body.matchAll(/\]\(\/blog\/([^/)]+)\/\)/g)) {
    if (!bySlug.has(slug)) errors.push(`${p.file}: ссылка на несуществующую статью /blog/${slug}/`);
  }
  for (const [m, n] of `${p.title} ${p.seo_title} ${p.description} ${p.body}`.matchAll(/(\d+) (?:направлени|стил)/g)) {
    if (+n !== directionsCount) errors.push(`${p.file}: «${m}…», а на главной ${directionsCount} направлений`);
  }
  p.html = markdown(p.body, p.file);
  p.minutes = Math.max(2, Math.round(p.words / 170));
  p.ogImage = existsSync(join(OG_DIR, `${p.slug}.jpg`)) ? `/images/blog/${p.slug}.jpg` : DEFAULT_OG;
}
if (new Set(posts.map((p) => p.slug)).size !== posts.length) errors.push("Есть статьи с одинаковым slug");

/* ---------- Общие куски страницы ---------- */

const METRIKA = `  <!-- Yandex.Metrika counter -->
  <script type="text/javascript">
    (function(m,e,t,r,i,k,a){
        m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=112752949', 'ym');

    ym(112752949, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
  </script>
  <noscript><div><img src="https://mc.yandex.ru/watch/112752949" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
  <!-- /Yandex.Metrika counter -->`;

const PUBLISHER = {
  "@type": "Organization",
  "@id": `${SITE}/#school`,
  name: "Химия — школа танцев",
  url: `${SITE}/`,
  logo: { "@type": "ImageObject", url: `${SITE}/icons/icon-512.png` },
};

const breadcrumbs = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, url], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${SITE}${url}` })),
});

const page = ({ title, description, path, ogType = "website", ogImage = DEFAULT_OG, schema = [], body, extraHead = "" }) => `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0a1929" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${SITE}${path}" />

  <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48" />
  <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
  <link rel="icon" type="image/png" sizes="120x120" href="/icons/icon-120.png" />
  <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
  <link rel="manifest" href="/site.webmanifest" />

  <meta property="og:type" content="${ogType}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${SITE}${path}" />
  <meta property="og:site_name" content="Химия — школа танцев" />
  <meta property="og:locale" content="ru_RU" />
  <meta property="og:image" content="${SITE}${ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${SITE}${ogImage}" />
${extraHead}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&family=Unbounded:wght@400;500;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css" />

${schema.map(jsonLd).join("\n")}
</head>
<body class="blog-page">
${METRIKA}

  <div class="bg-orbit"></div>
  <div class="noise"></div>

  <header class="blog-top">
    <nav class="nav">
      <a class="logo" href="/">Химия</a>
      <button class="mobile-menu-toggle" id="mobile-menu-toggle" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="nav-links">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <div class="nav-links" id="nav-links">
        <a href="/#directions">Направления</a>
        <a href="/#trainers">Тренеры</a>
        <a href="/#schedule">Расписание</a>
        <a href="/#prices">Цены</a>
        <a href="/blog/"${path === "/blog/" ? ' aria-current="page"' : ""}>Блог</a>
        <a href="/#contacts">Контакты</a>
      </div>
    </nav>
  </header>

${body}

  <footer class="footer">
    <div>
      <a class="logo" href="/">Химия</a>
      <p>Химия — школа танцев в Ставрополе: техника, уверенность и сцена в поддерживающей атмосфере.</p>
    </div>
    <div class="footer-actions">
      <a class="pill" href="${TELEGRAM}" target="_blank" rel="noopener noreferrer">Пробное занятие</a>
      <a class="pill" href="/#schedule">Расписание</a>
      <a class="pill" href="/#prices">Цены</a>
      <a class="pill" href="/blog/">Блог</a>
      <a class="pill" href="/#contacts">Контакты</a>
    </div>
  </footer>

  <script src="/script.js"></script>
</body>
</html>
`;

const postCard = (p, extraClass = "") => `<a class="post-card${extraClass}" href="${postUrl(p)}">
          <span class="post-card-cat">${esc(CATEGORIES[p.category])}</span>
          <span class="post-card-title">${esc(p.title)}</span>
          <span class="post-card-desc">${esc(p.description)}</span>
          <span class="post-card-meta">${p.minutes} мин чтения <span aria-hidden="true">→</span></span>
        </a>`;

/* ---------- Страница статьи ---------- */

const articlePage = (p) => {
  const a = AUTHORS[p.author];
  const url = `${SITE}${postUrl(p)}`;
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      image: `${SITE}${p.ogImage}`,
      datePublished: p.date,
      dateModified: p.updated || p.date,
      inLanguage: "ru",
      articleSection: CATEGORIES[p.category],
      wordCount: p.words,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      author: {
        "@type": "Person",
        name: a.name,
        jobTitle: a.role,
        image: `${SITE}${photoUrl(a.photo, "")}`,
        url: `${SITE}/#trainers`,
        worksFor: { "@id": `${SITE}/#school` },
      },
      publisher: PUBLISHER,
    },
    breadcrumbs([["Главная", "/"], ["Блог", "/blog/"], [p.title, postUrl(p)]]),
  ];

  const related = p.related.map((slug) => bySlug.get(slug)).filter(Boolean);

  const body = `  <main class="post">
    <nav class="crumbs" aria-label="Навигационная цепочка">
      <a href="/">Главная</a><span aria-hidden="true">/</span><a href="/blog/">Блог</a><span aria-hidden="true">/</span><a href="/blog/#${p.category}">${esc(CATEGORIES[p.category])}</a>
    </nav>

    <article class="post-article">
      <header class="post-head">
        <h1>${esc(p.title)}</h1>
        <div class="post-meta">
          <img src="${photoUrl(a.photo)}" alt="" width="40" height="40" class="post-meta-photo" />
          <span><strong>${esc(a.name)}</strong><br />${esc(a.role)}</span>
        </div>
        <p class="post-meta-line"><time datetime="${p.date}">${formatDate(p.date)}</time> · ${p.minutes} мин чтения</p>
      </header>

      <div class="post-body">
${p.html
  .split("\n")
  .map((l) => (l ? `        ${l}` : l))
  .join("\n")}
      </div>

      <aside class="post-cta" aria-label="Запись на пробное занятие">
        <p class="post-cta-kicker">Пробное занятие — ${rub(TRIAL_PRICE)}</p>
        <p class="post-cta-text">${inline(p.cta, p.file)}</p>
        <div class="post-cta-actions">
          <a class="btn primary" href="${TELEGRAM}" target="_blank" rel="noopener noreferrer">Записаться в Telegram</a>
          <a class="btn ghost" href="${PHONE.href}">${PHONE.label}</a>
        </div>
        <p class="post-cta-note">Отвечаем за 10 минут · просп. Кулакова, 29Д</p>
      </aside>

      <section class="post-author" aria-label="Об авторе">
        <img src="${photoUrl(a.photo)}" alt="${esc(a.name)}" width="96" height="96" loading="lazy" />
        <div>
          <p class="post-author-label">Автор</p>
          <p class="post-author-name">${esc(a.name)}</p>
          <p class="post-author-role">${esc(a.role)}</p>
          <p class="post-author-bio">${esc(a.bio)} <a href="/#trainers">Все тренеры</a></p>
        </div>
      </section>
    </article>

    <section class="post-related" aria-labelledby="related-title">
      <h2 id="related-title">Читайте также</h2>
      <div class="post-grid">
        ${related.map((r) => postCard(r)).join("\n        ")}
      </div>
    </section>
  </main>`;

  return page({
    title: `${p.seo_title} | Химия`,
    description: p.description,
    path: postUrl(p),
    ogType: "article",
    ogImage: p.ogImage,
    schema,
    body,
    extraHead: `  <meta property="article:published_time" content="${p.date}" />
  <meta property="article:modified_time" content="${p.updated || p.date}" />
  <meta property="article:section" content="${esc(CATEGORIES[p.category])}" />`,
  });
};

/* ---------- Главная блога ---------- */

const hubPage = () => {
  const title = "Блог школы танцев «Химия» — советы новичкам и родителям";
  const description =
    "Статьи школы танцев «Химия» в Ставрополе: как выбрать направление, что надеть на первое занятие, цены, расписание и советы родителям.";
  const groups = Object.entries(CATEGORIES)
    .map(([key, label]) => [key, label, posts.filter((p) => p.category === key)])
    .filter(([, , list]) => list.length);

  const body = `  <main class="blog-hub">
    <nav class="crumbs" aria-label="Навигационная цепочка">
      <a href="/">Главная</a><span aria-hidden="true">/</span><span aria-current="page">Блог</span>
    </nav>
    <header class="blog-hub-head">
      <h1>Блог школы танцев «Химия»</h1>
      <p>Честно о танцах для тех, кто только собирается начать: как выбрать направление, чего ждать от первого занятия, сколько это стоит и как помочь ребёнку найти свой стиль.</p>
      <div class="blog-chips">
        ${groups.map(([key, label]) => `<a href="#${key}">${esc(label)}</a>`).join("\n        ")}
      </div>
    </header>
${groups
  .map(
    ([key, label, list]) => `
    <section class="blog-group" id="${key}" aria-labelledby="${key}-title">
      <h2 id="${key}-title">${esc(label)}</h2>
      <div class="post-grid">
        ${list.map((p) => postCard(p)).join("\n        ")}
      </div>
    </section>`
  )
  .join("\n")}

    <aside class="post-cta blog-hub-cta" aria-label="Запись на пробное занятие">
      <p class="post-cta-kicker">Пробное занятие — ${rub(TRIAL_PRICE)}</p>
      <p class="post-cta-text">Лучше один раз попробовать, чем прочитать 25 статей. Тренер подберёт направление и группу по уровню.</p>
      <div class="post-cta-actions">
        <a class="btn primary" href="${TELEGRAM}" target="_blank" rel="noopener noreferrer">Записаться в Telegram</a>
        <a class="btn ghost" href="${PHONE.href}">${PHONE.label}</a>
      </div>
    </aside>
  </main>`;

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Блог школы танцев «Химия»",
      url: `${SITE}/blog/`,
      inLanguage: "ru",
      publisher: PUBLISHER,
      blogPost: posts.map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        url: `${SITE}${postUrl(p)}`,
        datePublished: p.date,
      })),
    },
    breadcrumbs([["Главная", "/"], ["Блог", "/blog/"]]),
  ];

  return page({ title, description, path: "/blog/", schema, body });
};

/* ---------- Сгенерированные блоки главной ---------- */

// Меняет содержимое между <!-- name:start --> и <!-- name:end -->, сами маркеры остаются
const replaceBlock = (html, name, content) => {
  const start = `<!-- ${name}:start -->`;
  const end = `<!-- ${name}:end -->`;
  if (!html.includes(start) || !html.includes(end)) {
    errors.push(`В index.html нет маркеров ${start} … ${end}`);
    return html;
  }
  return html.replace(new RegExp(`${start}[\\s\\S]*?${end}`), () => `${start}\n    ${content}\n    ${end}`);
};

// Выделенная карточка одна — иначе акцент теряется; у второй только плашка
const PRICE_BADGES = { 8: { label: "Популярный", accent: true }, 16: { label: "Выгоднее всего" } };

const pricesSection = () => {
  // Скидка на карточках считается от разового занятия
  const cards = PRICES.map((p) => {
    const per = Math.round(p.total / p.lessons);
    const saving = Math.round((1 - per / SINGLE_PRICE) * 100);
    const badge = PRICE_BADGES[p.lessons];
    const perWeek = p.lessons / 4;
    return [
      `<article class="price-card${badge?.accent ? " price-card--accent" : ""} reveal">`,
      badge && `  <span class="price-badge">${badge.label}</span>`,
      `  <p class="price-count"><span class="price-num">${p.lessons}</span> ${p.lessons === 4 ? "занятия" : "занятий"}</p>`,
      `  <p class="price-rhythm">${perWeek} ${perWeek >= 2 && perWeek <= 4 ? "раза" : "раз"} в неделю</p>`,
      `  <p class="price-total">${rub(p.total)}</p>`,
      `  <p class="price-per">${rub(per)} за занятие${saving > 0 ? ` <span class="price-saving">−${saving}%</span>` : ""}</p>`,
      `</article>`,
    ]
      .filter(Boolean)
      .join("\n        ");
  }).join("\n        ");

  const schema = {
    "@context": "https://schema.org",
    "@type": "DanceSchool",
    "@id": `${SITE}/#school`,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Абонементы на занятия танцами",
      itemListElement: [
        { lessons: 1, total: TRIAL_PRICE, name: "Пробное занятие" },
        { lessons: 1, total: SINGLE_PRICE, name: "Разовое занятие" },
        ...PRICES.map((p) => ({ ...p, name: `Абонемент на ${p.lessons} ${p.lessons === 4 ? "занятия" : "занятий"}` })),
      ].map((p) => ({
        "@type": "Offer",
        name: p.name,
        price: p.total,
        priceCurrency: "RUB",
        url: `${SITE}/#prices`,
      })),
    },
  };

  return `<section class="prices" id="prices" aria-labelledby="prices-title">
      <div class="section-head reveal">
        <h2 id="prices-title">Цены</h2>
        <a class="pill" href="/blog/ceny-na-tancy-stavropol/">Как выбрать абонемент</a>
      </div>
      <p class="prices-lead reveal">Один абонемент — на все ${directionsCount} направлений: можно совмещать HipHop, High Heels, Contemporary и любые другие классы</p>
      <div class="price-grid">
        ${cards}
      </div>
      <p class="price-single reveal">Разовое занятие без абонемента — <strong>${rub(SINGLE_PRICE)}</strong>. Скидки на карточках указаны по сравнению с ним.</p>
      <div class="price-trial reveal">
        <div>
          <p class="price-trial-title">Пробное занятие — ${rub(TRIAL_PRICE)}</p>
          <p class="price-trial-text">60 минут в группе, знакомство с тренером и подбор направления. Покупать абонемент после пробного не обязательно.</p>
        </div>
        <a class="btn primary" href="${TELEGRAM}" target="_blank" rel="noopener noreferrer">Записаться в Telegram</a>
      </div>
      <script type="application/ld+json">
${JSON.stringify(schema, null, 2).replace(/^/gm, "      ")}
      </script>
    </section>`;
};

/* ---------- Блок «Полезное» на главной ---------- */

const updateIndex = () => {
  const featured = posts.filter((p) => p.featured).sort((a, b) => a.featured - b.featured);
  const teaser = `<section class="blog-teaser" id="blog" aria-labelledby="blog-teaser-title">
      <div class="section-head reveal">
        <h2 id="blog-teaser-title">Полезное перед первым занятием</h2>
        <a class="pill" href="/blog/">Все статьи</a>
      </div>
      <div class="post-grid">
        ${featured.map((p) => postCard(p, " reveal")).join("\n        ")}
      </div>
    </section>`;
  let next = replaceBlock(indexHtml, "blog:featured", teaser);
  next = replaceBlock(next, "prices", pricesSection());
  if (next !== indexHtml) writeFileSync(indexPath, next);
};

/* ---------- sitemap.xml ---------- */

const sitemap = () => {
  const latest = posts.map((p) => p.updated || p.date).sort().at(-1);
  const urls = [
    ["/", latest], // блок «Полезное» на главной меняется вместе с блогом
    ["/blog/", latest],
    ...posts.map((p) => [postUrl(p), p.updated || p.date]),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ([path, lastmod]) => `  <url>
    <loc>${SITE}${path}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>
`;
};

/* ---------- Картинки для превью ссылок (--og) ---------- */

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const ogTemplate = (p) => `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700&family=Unbounded:wght@500;700&display=block" rel="stylesheet">
<style>
  *{margin:0;box-sizing:border-box}
  body{width:1200px;height:630px;overflow:hidden;font-family:Manrope,sans-serif;color:#f0f7ff;
    background:radial-gradient(700px 500px at 0% 0%,rgba(100,181,246,.35),transparent),
               radial-gradient(700px 500px at 100% 100%,rgba(33,150,243,.35),transparent),#0a1929;
    padding:64px 72px;display:flex;flex-direction:column;justify-content:space-between}
  .top{display:flex;justify-content:space-between;align-items:center}
  .logo{font-family:Unbounded,sans-serif;font-weight:700;font-size:40px;text-shadow:0 0 24px rgba(100,181,246,.6),0 0 42px rgba(33,150,243,.4)}
  .cat{font-size:24px;font-weight:700;color:#90caf9;border:2px solid rgba(144,202,249,.5);border-radius:999px;padding:10px 24px}
  h1{font-family:Unbounded,sans-serif;font-weight:700;letter-spacing:-.02em;line-height:1.18;font-size:${p.title.length > 70 ? 50 : 58}px;max-width:1040px}
  .bottom{display:flex;justify-content:space-between;align-items:center;font-size:26px;color:rgba(240,247,255,.75)}
  .trial{color:#fff;font-weight:700;background:linear-gradient(135deg,#64b5f6,#2196f3);border-radius:999px;padding:14px 30px;box-shadow:0 0 24px rgba(100,181,246,.6)}
</style></head><body>
  <div class="top"><div class="logo">Химия</div><div class="cat">${esc(CATEGORIES[p.category])}</div></div>
  <h1>${esc(p.title)}</h1>
  <div class="bottom"><span>Школа танцев · Ставрополь · himiyaplace.ru</span><span class="trial">Пробное — 350 ₽</span></div>
</body></html>`;

const buildOgImages = () => {
  if (!existsSync(CHROME)) {
    errors.push("--og: не найден Google Chrome");
    return;
  }
  mkdirSync(OG_DIR, { recursive: true });
  const tmp = mkdtempSync(join(tmpdir(), "himiya-og-"));
  for (const p of posts) {
    const html = join(tmp, `${p.slug}.html`);
    const png = join(tmp, `${p.slug}.png`);
    writeFileSync(html, ogTemplate(p));
    execFileSync(CHROME, [
      "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
      "--window-size=1200,630", "--virtual-time-budget=8000", `--screenshot=${png}`, `file://${html}`,
    ], { stdio: "ignore" });
    execFileSync("magick", [png, "-strip", "-quality", "82", join(OG_DIR, `${p.slug}.jpg`)]);
    p.ogImage = `/images/blog/${p.slug}.jpg`;
  }
  rmSync(tmp, { recursive: true, force: true });
  console.log(`OG-картинки: ${posts.length} шт. в images/blog/`);
};

/* ---------- Сборка ---------- */

if (process.argv.includes("--og")) buildOgImages();

if (errors.length) {
  console.error("Сборка остановлена:\n  " + errors.join("\n  "));
  process.exit(1);
}

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "index.html"), hubPage());
for (const p of posts) {
  mkdirSync(join(OUT_DIR, p.slug), { recursive: true });
  writeFileSync(join(OUT_DIR, p.slug, "index.html"), articlePage(p));
}
updateIndex();
writeFileSync(join(ROOT, "sitemap.xml"), sitemap());

if (errors.length) {
  console.error("Ошибки:\n  " + errors.join("\n  "));
  process.exit(1);
}
if (warnings.length) console.warn("Предупреждения:\n  " + warnings.join("\n  "));
console.log(`Готово: ${posts.length} статей → blog/, sitemap.xml, блок «Полезное» на главной.`);
