import { MotionBlurTitle } from "@/components/ui/motion-blur-title";
import { Reveal } from "@/components/ui/reveal";
import { ScrambleText } from "@/components/ui/scramble-text";
import { SectionLabel } from "@/components/ui/section-label";
import { PinIcon, StickerButton } from "@/components/ui/sticker-button";
import { TornEdge } from "@/components/ui/torn-edge";
import { CONTACTS } from "@/lib/content";

import { AddressPoster } from "./location/AddressPoster";
import { NorthSticker, STUDIO_COORDS } from "./location/bits";
import { MapPoster } from "./location/MapPoster";
import { ScheduleBoard } from "./location/ScheduleBoard";
import { TodayTicket } from "./location/TodayTicket";

/**
 * 05 · Локация отвечает на «где и когда»: гигантский адрес-постер, тёмная карта в рваной рамке
 * с наклейкой «Мы здесь», кнопка маршрута, билет «Сегодня в зале» и недельное расписание студии «Север».
 * Телефон и Телеграм живут в «Контактах» — здесь их не дублируем.
 */
export default function Location() {
  return (
    <section
      id="location"
      className="relative isolate overflow-x-clip bg-ink pb-24 pt-20 text-paper md:pb-32 md:pt-28"
    >
      <TornEdge side="top" color="var(--color-ink)" seed={61} height={58} />

      {/* фон: полутоновые пятна */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="halftone halftone-fade absolute -right-[10%] top-[2%] h-[42rem] w-[60%] text-ink-600 opacity-70 [--dot:9px]" />
        <div className="halftone halftone-fade absolute -left-[15%] top-[48%] h-[36rem] w-[50%] text-ink-700 [--dot:7px]" />
      </div>

      <div className="relative z-[1] px-5 md:px-10 xl:px-16">
        <SectionLabel index="05" label="Локация" />

        <div className="mt-8 flex items-end justify-between gap-6 md:mt-12">
          <MotionBlurTitle
            text="Где мы"
            className="text-[clamp(64px,19vw,110px)] text-paper md:text-[clamp(96px,9vw,168px)]"
          />
          <div className="flex shrink-0 items-center gap-4 pb-[0.4em] md:gap-6">
            <div className="label hidden text-right leading-[1.8] text-mute md:block">
              Координаты
              <br />
              <ScrambleText
                text={`${STUDIO_COORDS.lat}° с. ш.`}
                className="text-toxic"
                duration={900}
              />
              <br />
              <ScrambleText
                text={`${STUDIO_COORDS.lon}° в. д.`}
                className="text-toxic"
                duration={1100}
              />
            </div>
            <Reveal kind="slap" delay={0.35}>
              <NorthSticker className="rotate-[10deg]" />
            </Reveal>
          </div>
        </div>

        <AddressPoster className="relative z-[3] mt-6 md:mt-4" />

        <div className="mt-8 grid gap-14 md:mt-10 lg:grid-cols-12 lg:items-start lg:gap-10">
          <div className="relative z-[2] lg:col-span-4">
            <Reveal as="div" kind="whip">
              <address className="not-italic">
                <p className="display flex flex-wrap items-center gap-x-3 text-[clamp(30px,8.6vw,40px)] leading-[0.95] text-paper lg:text-[clamp(30px,2.7vw,46px)]">
                  <span>{CONTACTS.city}</span>
                  <span aria-hidden className="text-toxic">
                    ✕
                  </span>
                  <span>{CONTACTS.studio}</span>
                </p>
                <ScrambleText
                  text={`${STUDIO_COORDS.lat}° с. ш. · ${STUDIO_COORDS.lon}° в. д.`}
                  className="label mt-3 text-toxic md:hidden"
                  duration={1100}
                />
              </address>
            </Reveal>

            <Reveal kind="rise" delay={0.05}>
              <p className="label mt-10 text-mute">Как добраться</p>
              <p className="mt-3 max-w-sm text-[17px] leading-relaxed text-paper/90">
                Построй маршрут в Яндекс Картах — он доведёт прямо до зала.
                Потерялся по дороге — напиши нам, подскажем.
              </p>
            </Reveal>

            <Reveal kind="slap" delay={0.1} className="mt-8 w-max">
              <StickerButton
                href={CONTACTS.mapsUrl}
                variant="toxic"
                size="lg"
                tilt={-3}
                icon={<PinIcon />}
              >
                Построить маршрут
              </StickerButton>
            </Reveal>

            {/* что идёт сегодня — мостик к расписанию ниже и опора левой колонки рядом с высокой картой */}
            <Reveal kind="rise" delay={0.12} className="mt-14 hidden lg:block">
              <TodayTicket />
            </Reveal>
          </div>

          <MapPoster className="lg:col-span-8 lg:-mt-6 xl:-mt-10 2xl:mt-2" />
        </div>

        <ScheduleBoard className="mt-24 md:mt-32" />
      </div>
    </section>
  );
}
