#!/usr/bin/env node
/**
 * Скриншоты страницы в headless Chrome (системный Google Chrome + puppeteer-core).
 *
 *   node scripts/shot.mjs --only hero                 # секция hero, десктоп 1440×900, кадры по высоте экрана
 *   node scripts/shot.mjs --only directions --mobile  # плюс мобильный 390×844
 *   node scripts/shot.mjs --scrolls 0,900,2400        # конкретные позиции скролла (px)
 *   node scripts/shot.mjs --full                      # вся страница одной картинкой (обзор)
 *   node scripts/shot.mjs --only coaches --hover "[data-coach='milena']"
 *
 * Опции: --port 5173  --out .shots/<only|page>  --w 1440 --h 900  --mw 390 --mh 844 (мобильный вьюпорт)
 *        --wait 1400  --max 12 (кадров на вьюпорт)
 * Кадры: <out>/<desktop|mobile>-<NN>-y<scroll>.png, ошибки консоли — <out>/console.txt (и в stdout).
 */
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = args[i + 1];
  return v === undefined || v.startsWith("--") ? true : v;
};

const port = opt("port", "5173");
const only = opt("only", null);
const extra = opt("query", "");
const url =
  opt("url", null) ||
  `http://localhost:${port}/?${only ? `only=${only}&` : ""}nopreload${extra ? `&${extra}` : ""}`;
const out = path.resolve(opt("out", `.shots/${only || "page"}`));
const W = Number(opt("w", 1440));
const H = Number(opt("h", 900));
const wait = Number(opt("wait", 1400));
const max = Number(opt("max", 12));
const scrolls = opt("scrolls", null);
const full = opt("full", false);
const mobile = opt("mobile", false);
const mobileOnly = opt("mobile-only", false);
const hover = opt("hover", null);

fs.mkdirSync(out, { recursive: true });
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--autoplay-policy=no-user-gesture-required", "--hide-scrollbars", "--force-color-profile=srgb"],
});

const logs = [];
const viewports = [];
if (!mobileOnly) viewports.push({ name: "desktop", width: W, height: H, deviceScaleFactor: 1 });
if (mobile || mobileOnly)
  viewports.push({ name: "mobile", width: Number(opt("mw", 390)), height: Number(opt("mh", 844)), deviceScaleFactor: 2, isMobile: true, hasTouch: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (const vp of viewports) {
  const page = await browser.newPage();
  await page.setViewport(vp);
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") logs.push(`[${vp.name}] ${m.type()}: ${m.text()}`);
  });
  page.on("pageerror", (e) => logs.push(`[${vp.name}] pageerror: ${e.message}`));
  await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await sleep(wait);

  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const ys = scrolls
    ? String(scrolls).split(",").map(Number)
    : Array.from({ length: Math.min(max, Math.ceil(total / vp.height)) }, (_, i) => i * vp.height);

  if (full) {
    // для обзора: прокручиваем всё, чтобы сработали whileInView, затем снимаем целиком
    for (let y = 0; y < total; y += vp.height) {
      await page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true, force: true }) : window.scrollTo(0, yy)), y);
      await sleep(250);
    }
    await page.evaluate(() => (window.__lenis ? window.__lenis.scrollTo(0, { immediate: true, force: true }) : window.scrollTo(0, 0)));
    await sleep(600);
    const file = path.join(out, `${vp.name}-full.png`);
    await page.screenshot({ path: file, fullPage: true, captureBeyondViewport: true });
    console.log(file);
  }

  let n = 0;
  for (const y of ys) {
    await page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true, force: true }) : window.scrollTo(0, yy)), y);
    await sleep(wait);
    if (hover) {
      const el = await page.$(hover);
      if (el) {
        await el.hover();
        await sleep(700);
      }
    }
    const file = path.join(out, `${vp.name}-${String(n++).padStart(2, "0")}-y${y}.png`);
    await page.screenshot({ path: file });
    console.log(file);
  }
  await page.close();
}

await browser.close();
fs.writeFileSync(path.join(out, "console.txt"), logs.join("\n") + "\n");
if (logs.length) {
  console.log("--- console errors/warnings ---");
  console.log(logs.slice(0, 40).join("\n"));
} else console.log("console: clean");
