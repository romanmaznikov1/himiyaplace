import { useCallback, useEffect, useRef, useState } from "react";

import { ArrowIcon } from "@/components/ui/sticker-button";
import { ImageTrail } from "@/components/ui/image-trail";
import { MotionBlurTitle } from "@/components/ui/motion-blur-title";
import { Reveal } from "@/components/ui/reveal";
import { SectionLabel } from "@/components/ui/section-label";
import { Spray } from "@/components/ui/spray";
import { Tape } from "@/components/ui/tape";
import { TornEdge } from "@/components/ui/torn-edge";
import { VelocityMarquee } from "@/components/ui/velocity-marquee";
import { COACHES, CONTACTS, MEDIA, TRIAL, type Coach } from "@/lib/content";
import { onReady } from "@/lib/ready";
import { rub } from "@/lib/utils";

import { CoachCard } from "./coaches/CoachCard";
import { CoachModal } from "./coaches/CoachModal";
import { TILES } from "./coaches/tiles";

const isCoachId = (v: unknown): v is Coach["id"] => typeof v === "string" && COACHES.some((c) => c.id === v);

/**
 * Модалка тренера — отдельный шаг истории: системный «Назад» (жест на Android, свайп от края на iOS)
 * закрывает её, а не уводит с сайта. Свой шаг помечаем ключом в history.state.
 */
const HISTORY_KEY = "himiyaCoach";
const historyState = (): Record<string, unknown> => {
  const s: unknown = window.history.state;
  return s && typeof s === "object" ? (s as Record<string, unknown>) : {};
};
const ownsHistoryEntry = () => isCoachId(historyState()[HISTORY_KEY]);
/** Адрес с ?coach=<id> (или без него); остальные параметры и #якорь — как были, без пересериализации. */
const coachUrl = (id: Coach["id"] | null) => {
  const { pathname, search, hash } = window.location;
  const params = search
    .replace(/^\?/, "")
    .split("&")
    .filter((p) => p && !/^coach(=|$)/.test(p));
  if (id) params.push(`coach=${id}`);
  return `${pathname}${params.length ? `?${params.join("&")}` : ""}${hash}`;
};

/** Сцены и команды из био тренеров (content.ts) — бегут лентой под коллажем. */
const STAGES = ["Fresh Up", "Project 818", "Volga Champ", "S1 Family", "Bust a Move", "HIMIYA", "S1Contest", "Dance Fest"];

/**
 * Тренеры — коллаж портретов как блок ABOUT US из референса: плитки «брошены на стол»,
 * граффити-тег «Химия» поверх мазка баллончика и «уличная философия».
 * Клик по карточке — модалка с интервью. ?coach=<id> открывает модалку после прелоадера (диплинк, скриншоты).
 */
export default function Coaches() {
  const [open, setOpenState] = useState<Coach["id"] | null>(null);
  // синхронная копия: повторное «Закрыть» во время анимации ухода не должно звать history.back() второй раз
  const openRef = useRef<Coach["id"] | null>(null);
  const setOpen = useCallback((id: Coach["id"] | null) => {
    openRef.current = id;
    setOpenState(id);
  }, []);
  const section = useRef<HTMLElement>(null);
  const fromLink = useRef(false);

  // диплинк открываем только после прелоадера: он держит свою блокировку скролла,
  // и модалка, открытая под ним, сохранила бы чужое overflow:hidden и вернула бы его при закрытии
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("coach");
    if (!isCoachId(id)) return;
    return onReady(() => {
      fromLink.current = true;
      setOpen(id);
    });
  }, [setOpen]);

  // «Назад» закрывает модалку, «Вперёд» снова открывает тренера со своего шага истории
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const s: unknown = e.state;
      const id = s && typeof s === "object" ? (s as Record<string, unknown>)[HISTORY_KEY] : null;
      if (isCoachId(id)) {
        fromLink.current = false;
        setOpen(id);
      } else if (openRef.current) {
        setOpen(null);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [setOpen]);

  // тап по карточке: модалка + свой шаг истории (?coach=<id> — ссылкой можно поделиться)
  const openCoach = useCallback(
    (id: Coach["id"]) => {
      if (openRef.current) return;
      setOpen(id);
      try {
        window.history.pushState({ ...historyState(), [HISTORY_KEY]: id }, "", coachUrl(id));
      } catch {
        /* sandbox / file:// — модалка работает и без шага истории */
      }
    },
    [setOpen],
  );

  // «предыдущий/следующий» внутри модалки — тот же шаг истории, меняется только адрес
  const change = useCallback(
    (id: Coach["id"]) => {
      setOpen(id);
      try {
        const state = ownsHistoryEntry() ? { ...historyState(), [HISTORY_KEY]: id } : window.history.state;
        window.history.replaceState(state, "", coachUrl(id));
      } catch {
        /* не страшно */
      }
    },
    [setOpen],
  );

  const close = useCallback(() => {
    if (!openRef.current) return;
    setOpen(null);
    if (fromLink.current) {
      fromLink.current = false;
      // пришли по ссылке на тренера — после закрытия человек оказывается у команды, а не в hero
      const r = section.current?.getBoundingClientRect();
      if (r && (r.top > window.innerHeight * 0.5 || r.bottom < 0)) {
        const top = r.top + window.scrollY;
        if (window.__lenis) window.__lenis.scrollTo(top, { immediate: true, force: true });
        else window.scrollTo({ top });
      }
    }
    try {
      // свой шаг истории — снимаем его (popstate придёт, когда модалка уже закрыта, и ничего не сделает);
      // диплинк — просто убираем ?coach из адреса, чтобы «Назад» не уводил с сайта лишний раз
      if (ownsHistoryEntry()) window.history.back();
      else if (new URLSearchParams(window.location.search).has("coach")) {
        window.history.replaceState(window.history.state, "", coachUrl(null));
      }
    } catch {
      /* старый браузер — не страшно */
    }
  }, [setOpen]);

  return (
    <section ref={section} id="coaches" className="relative isolate overflow-x-clip bg-ink pb-20 pt-24 md:pb-24 md:pt-32">
      <TornEdge side="top" color="var(--color-ink)" fiber="var(--color-paper)" seed={23} height={56} density={80} />

      {/* скотч сразу под рваной кромкой: кромка с волокном остаётся видна, лента заходит на неё одним концом */}
      <Tape
        text={["Тренеры «Химии»", "Чемпионы и призёры", `Пробное — ${rub(TRIAL.price)}`]}
        variant="cobalt"
        rotate={-2.2}
        speed={22}
        className="absolute -left-[5%] top-1 z-[6] w-[110%] md:top-3"
      />

      {/* фон: теги-призраки и полутон */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <span className="font-tag absolute -right-[6%] top-[4%] rotate-[-9deg] select-none text-[44vw] leading-none text-ink-800 lg:text-[30vw]">
          crew
        </span>
        <span className="font-tag absolute -left-[4%] bottom-[8%] rotate-[-6deg] select-none text-[38vw] leading-none text-ink-800/80 lg:text-[24vw]">
          street
        </span>
        <div className="halftone halftone-fade absolute -left-[15%] top-[30%] h-[70vw] w-[70vw] text-cobalt/25 [--dot:9px] lg:h-[50vw] lg:w-[50vw]" />
        <div className="absolute right-0 top-[45%] h-[60vw] w-[60vw] translate-x-1/3 rounded-full bg-cobalt-deep/25 blur-[120px]" />
      </div>

      <div className="relative px-5 md:px-10 xl:px-16">
        {/* шапка: за курсором летят полароиды тренеров (только мышь) */}
        <ImageTrail
          images={COACHES.map((c) => c.photo.webp560)}
          size={150}
          every={110}
          className="-mx-5 -mb-24 px-5 pb-24 md:-mx-10 md:px-10 xl:-mx-16 xl:px-16"
        >
          <SectionLabel index="02" label="Тренеры" bpm={95} />
          {/* заголовок меряется от ширины строки минус колонка-подпись (16rem + зазор 2.5rem + поля),
              ≈3.1em — ширина слова «Тренеры» в этом шрифте: на любом экране подпись не сжимается */}
          <div className="relative mt-6 flex flex-col gap-6 lg:mt-4 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
            <MotionBlurTitle
              as="h2"
              text="Тренеры"
              className="min-w-0 text-[clamp(84px,27vw,380px)] text-paper lg:text-[min(25vw,calc((100vw-24.5rem)/3.1))] xl:text-[min(25vw,calc((100vw-27.5rem)/3.1))]"
              edge={7}
            />
            <Reveal kind="rise" delay={0.15} className="max-w-[19rem] pb-[1.2vw] lg:w-[16rem] lg:max-w-none lg:shrink-0 lg:text-right">
              <p className="label text-toxic">Команда · {COACHES.length} тренеров</p>
              <p className="mt-3 text-[15px] leading-relaxed text-mute">
                Нажми на карточку — тренер сам расскажет о себе в коротком интервью.
              </p>
            </Reveal>
          </div>
        </ImageTrail>

        {/* коллаж */}
        <div className="relative mt-10 grid grid-cols-2 lg:mt-[-1vw] lg:flex lg:flex-wrap">
          {/* тег + уличная философия */}
          <div className="relative z-[1] col-span-2 mb-12 md:max-lg:grid md:max-lg:grid-cols-2 md:max-lg:items-center md:max-lg:gap-10 lg:mb-0 lg:w-[31%] lg:self-center lg:pr-[3.2%]">
            <Reveal
              kind="slap"
              className="relative mx-auto aspect-[5/2] w-[92%] max-w-[460px] lg:mx-0 lg:w-[112%] lg:max-w-none lg:-translate-x-[6%]"
            >
              {/* мазок баллончика под тегом — шире и круче наклонён, чем сам тег */}
              <Spray
                seed={2}
                color="var(--color-cobalt)"
                drips={9}
                dots={320}
                thickness={0.34}
                className="absolute -left-[12%] -top-[4%] h-[108%] w-[124%] rotate-[-11deg]"
              />
              {/* плоский логотип с подтёками; чернильная тень снизу — как была у граффити-тега */}
              <picture className="absolute inset-0 grid -translate-y-[6%] rotate-[-6deg] place-items-center">
                <source
                  type="image/webp"
                  srcSet={`${MEDIA.logoFlat.w640} 640w, ${MEDIA.logoFlat.w1280} 1280w`}
                  sizes="(min-width: 1024px) 26vw, min(74vw, 370px)"
                />
                <img
                  src={MEDIA.logoFlat.png}
                  width={1551}
                  height={845}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="h-auto w-[80%] drop-shadow-[0_5px_0_var(--color-ink)] lg:drop-shadow-[0_0.4vw_0_var(--color-ink)]"
                />
              </picture>
            </Reveal>

            <Reveal kind="rise" delay={0.1} className="mt-8 max-w-md md:max-lg:mt-0 lg:mt-10">
              <h3 className="display text-[clamp(44px,11vw,60px)] text-paper lg:text-[clamp(40px,3.6vw,62px)]">
                Уличная <span className="text-toxic">философия</span>
              </h3>
              <p className="mt-4 text-[15px] leading-relaxed text-paper/80 md:text-base">
                Школу основала Милена Горбик — многократная чемпионка России по HipHop. В команде — победители и
                призёры Fresh Up и Project 818, танцоры HIMIYA, S1 Family и Bust a Move.{" "}
                <span className="text-mute">И каждый продолжает учиться у топовых хореографов страны.</span>
              </p>
              <a
                href={CONTACTS.telegram.url}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="hover"
                className="group/cta relative mt-7 inline-flex items-center gap-3 text-paper before:absolute before:-inset-x-1 before:-inset-y-2.5"
              >
                <span className="display relative whitespace-nowrap text-[clamp(28px,8vw,34px)] leading-none lg:text-[clamp(26px,2.3vw,34px)]">
                  Записаться на пробное
                  <span className="absolute inset-x-0 -bottom-1.5 h-[3px] origin-left bg-toxic transition-transform duration-300 ease-[var(--ease-snap)] group-hover/cta:scale-x-110" />
                </span>
                <span className="grid size-6 shrink-0 place-items-center bg-toxic p-1 text-ink transition-transform duration-300 ease-[var(--ease-snap)] group-hover/cta:-rotate-12 group-hover/cta:translate-x-1.5 [&>svg]:size-full">
                  <ArrowIcon />
                </span>
              </a>
              <p className="label mt-4 text-mute">
                <span className="tabular-nums text-toxic">{rub(TRIAL.price)}</span> · {TRIAL.minutes} минут ·{" "}
                {CONTACTS.telegram.handle}
              </p>
            </Reveal>
          </div>

          {COACHES.map((c) => (
            <CoachCard key={c.id} coach={c} tile={TILES[c.id]} onOpen={openCoach} />
          ))}
        </div>
      </div>

      {/* сцены и команды тренеров бегут от скорости скролла (имена уже крупно на карточках) */}
      <div aria-hidden className="relative mt-12 md:mt-16 lg:mt-[4.5vw]">
        <p className="label px-5 text-mute md:px-10 xl:px-16">
          <span className="text-toxic">Сцены и команды</span> наших тренеров
        </p>
        <VelocityMarquee baseVelocity={-2.2} className="mt-2" itemClassName="display text-[clamp(64px,11vw,200px)] leading-[0.95]">
          {STAGES.map((s, k) => (
            <span key={s} className="inline-flex items-center">
              <span
                className={
                  k % 3 === 1
                    ? "text-transparent [-webkit-text-stroke:1.5px_var(--color-toxic)]"
                    : "text-transparent [-webkit-text-stroke:1.5px_rgb(234_244_255/0.3)]"
                }
              >
                {s}
              </span>
              <span className="mx-[0.3em] text-[0.36em] text-toxic">✕</span>
            </span>
          ))}
        </VelocityMarquee>
      </div>

      <CoachModal coachId={open} onClose={close} onChange={change} />
    </section>
  );
}
