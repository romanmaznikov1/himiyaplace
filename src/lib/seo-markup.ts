/**
 * Статическая HTML-копия контента для поисковиков и браузеров без JS (Яндекс индексирует
 * в первую очередь исходный HTML). Собирается из content.ts при `vite build` и вставляется
 * в <div id="root"> (см. vite.config.ts → seoStatic). При включённом JS копия визуально скрыта
 * (класс .js на <html>, index.css), а createRoot заменяет её приложением при монтировании.
 *
 * Только факты из content.ts — тот же текст, что видит человек на странице.
 */
import { ty } from "./typograph";
import { BLOG, COACHES, CONTACTS, DIRECTIONS, HALLS, NAV, PRICE_NOTES, PRICES, SINGLE_CLASS, TRIAL, WEEK } from "./content";

const esc = (s: string | number) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const rub = (n: number) => `${n.toLocaleString("ru-RU").replace(/\s/g, "\u00A0")}\u00A0₽`;
const ext = (href: string, text: string) => `<a href="${esc(href)}" rel="noopener noreferrer">${esc(text)}</a>`;

export function seoMarkup(): string {
  const nav = NAV.map((n) => `<li><a href="#${n.id}">${esc(n.label)}</a></li>`).join("");

  const directions = DIRECTIONS.map(
    (d) => `<article>
<h3>${esc(d.title)} <small>(${esc(d.latin)})</small></h3>
<p><strong>${esc(d.tagline)}</strong> ${esc(d.description)}</p>
<p>Стили: ${d.styles.map(esc).join(", ")}.</p>
<p>Расписание (${esc(CONTACTS.studio)}): ${d.schedule.map((s) => `${esc(s.day)} ${esc(s.time)}${s.note ? ` (${esc(s.note)})` : ""}`).join(", ")}.</p>
</article>`,
  ).join("\n");

  const coaches = COACHES.map(
    (c) => `<article>
<h3>${esc(c.name)}</h3>
<p><em>${esc(c.role)}</em></p>
<p>${esc(c.bio)}</p>
</article>`,
  ).join("\n");

  const prices = PRICES.map(
    (p) =>
      `<li>${p.count} ${esc(p.unit)} (${esc(p.rhythm)}) — ${rub(p.total)}, ${rub(p.perClass)} за занятие${p.badge ? `, ${esc(p.badge.toLowerCase())}` : ""}</li>`,
  ).join("");

  const halls = HALLS.map(
    (h) => `<article>
<h3>${esc(h.tag)}: ${esc(h.title)}</h3>
<p>${esc(h.description)}</p>
<p>${h.features.map(esc).join(", ")}.</p>
</article>`,
  ).join("\n");

  const week = WEEK.map((d) => `<li><strong>${esc(d.day)}:</strong> ${d.items.map(esc).join(", ")}</li>`).join("");
  const blog = BLOG.posts.map((p) => `<li><a href="${esc(p.url)}">${esc(p.title)}</a></li>`).join("");

  return `<div id="seo-static">
<header>
<p><a href="#top"><strong>Химия</strong></a> — школа танцев, ${esc(CONTACTS.city)}</p>
<nav aria-label="Разделы"><ul>${nav}<li><a href="${BLOG.url}">${BLOG.label}</a></li></ul></nav>
</header>
<main>
<section id="top">
<h1>${ty("Химия — школа танцев в Ставрополе")}</h1>
<p>${DIRECTIONS.map((d) => esc(d.title)).join(", ")}. Пробное занятие — ${rub(TRIAL.price)}, ${TRIAL.minutes}&nbsp;минут.</p>
<p>${ext(CONTACTS.telegram.url, `Записаться в Telegram ${CONTACTS.telegram.handle}`)} · <a href="${CONTACTS.phone.tel}">${esc(CONTACTS.phone.display)}</a></p>
</section>
<section id="directions">
<h2>Направления школы танцев</h2>
<p>${esc(PRICE_NOTES.allDirections)}</p>
${directions}
</section>
<section id="coaches">
<h2>Тренеры школы танцев «Химия»</h2>
${coaches}
</section>
<section id="prices">
<h2>Цены на танцы в Ставрополе: абонементы</h2>
<p><strong>Пробное занятие — ${rub(TRIAL.price)}.</strong> ${esc(TRIAL.text)}</p>
<ul>${prices}</ul>
<p>${esc(PRICE_NOTES.allDirections)} Разовое занятие — ${rub(SINGLE_CLASS)}.</p>
</section>
<section id="halls">
<h2>Два зала студии</h2>
${halls}
</section>
<section id="location">
<h2>Где мы: адрес и расписание</h2>
<address>${esc(CONTACTS.studio)}, ${esc(CONTACTS.address)}, ${esc(CONTACTS.city)}</address>
<p>${ext(CONTACTS.mapsUrl, "Открыть в Яндекс Картах")}</p>
<h3>Расписание на неделю</h3>
<ul>${week}</ul>
</section>
<section id="contact">
<h2>Контакты</h2>
<p>Telegram: ${ext(CONTACTS.telegram.url, CONTACTS.telegram.handle)} — ${esc(CONTACTS.replyTime)}.</p>
<p>Телефон: <a href="${CONTACTS.phone.tel}">${esc(CONTACTS.phone.display)}</a></p>
</section>
</main>
<footer>
<h2>Блог</h2>
<ul>${blog}</ul>
<p><a href="${BLOG.url}">Все статьи</a></p>
</footer>
</div>`;
}
