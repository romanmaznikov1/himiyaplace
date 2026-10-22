import type { CSSProperties } from "react";

import { Chevrons } from "@/components/ui/chevrons";
import { Magnetic } from "@/components/ui/magnetic";
import { MotionBlurTitle } from "@/components/ui/motion-blur-title";
import { Reveal } from "@/components/ui/reveal";
import { SectionLabel } from "@/components/ui/section-label";
import { Spray } from "@/components/ui/spray";
import { StickerButton, TelegramIcon } from "@/components/ui/sticker-button";
import { TornEdge } from "@/components/ui/torn-edge";
import { CONTACTS, MEDIA, TRIAL } from "@/lib/content";
import { rub } from "@/lib/utils";

import { ContactRows } from "./contact/ContactRows";
import { Polaroid } from "./contact/Polaroid";
import { ReplySticker } from "./contact/ReplySticker";
import { Ribbon } from "./contact/Ribbon";

/**
 * 06 · Контакты — яркий финал на toxic, отвечает на «как связаться». Огромное «Свяжись / с нами»
 * лесенкой поверх кобальтового мазка с подтёками, между строк — полароид с групповой тренировки
 * (не повтор карточек тренеров). Ниже — Телеграм и телефон строками во всю ширину, короткая ссылка
 * на адрес (к «Локации»), наклейка-кнопка пробного и единственная лента «ХИМИЯ ✕» над футером.
 */
export default function Contact() {
  return (
    <section
      id="contact"
      className="relative isolate overflow-x-clip bg-toxic pt-20 text-ink md:pt-28"
    >
      <TornEdge
        side="top"
        color="var(--color-toxic)"
        fiber="var(--color-paper)"
        seed={71}
        height={80}
        density={60}
      />

      {/* фон: полутон, призрачный тег */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="halftone halftone-fade absolute -right-[12%] -top-[4%] h-[44rem] w-[60%] text-ink/[0.16] [--dot:10px]" />
        <div className="halftone halftone-fade absolute -left-[18%] top-[46%] h-[40rem] w-[55%] text-cobalt/20 [--dot:8px]" />
        <span className="font-tag absolute -right-[4%] top-[34%] rotate-[-8deg] text-[42vw] leading-none text-toxic-deep/25 lg:text-[26vw]">
          holla
        </span>
      </div>

      <div className="relative px-5 md:px-10 xl:px-16">
        <SectionLabel index="06" label="Контакты" tone="ink" bpm={95} />

        {/* заголовок лесенкой + мазок + полароид */}
        <div className="relative mt-10 md:mt-12">
          <Spray
            seed={14}
            color="var(--color-cobalt)"
            drips={11}
            dots={380}
            thickness={0.42}
            className="absolute -left-[8%] top-[6%] -z-[1] aspect-[5/2] w-[116%] md:top-[4%]"
          />

          <h2 aria-label="Свяжись с нами" className="relative">
            <span aria-hidden className="block">
              <MotionBlurTitle
                as="span"
                text="Свяжись"
                blur="left"
                edge={12}
                smear="soft"
                className="block text-[clamp(84px,26vw,150px)] md:-ml-[0.04em] md:text-[clamp(150px,21.5vw,360px)]"
              />
              <MotionBlurTitle
                as="span"
                text="с нами"
                blur="right"
                edge={12}
                smear="soft"
                delay={0.12}
                className="-mt-[0.04em] block text-right text-[clamp(84px,26vw,150px)] md:text-[clamp(150px,21.5vw,360px)]"
              />
            </span>
          </h2>

          {/*
            Полароид и наклейка «10 мин» — по одному экземпляру на все ширины. На мобильном они стоят рядом
            под заголовком; с md обёртка становится display:contents, и оба позиционируются от блока
            заголовка: полароид между строк, наклейка в пустом углу у конца первой строки.
          */}
          <div className="relative z-[2] mt-5 flex items-end justify-between gap-4 md:contents">
            <div className="w-[54%] max-[359px]:w-[56%] md:absolute md:left-[3%] md:top-[46%] md:z-[2] md:w-[clamp(220px,19.5vw,320px)]">
              <Polaroid
                src={MEDIA.crowd.poster}
                alt="Групповая тренировка в школе танцев «Химия»"
                title="Приходи"
                caption="Групповая тренировка"
                position="50% 82%"
                zoom={1.3}
                rotate={-8}
                className="w-full"
              />
            </div>
            <Reveal
              kind="slap"
              delay={0.45}
              className="mb-6 w-[38%] max-w-[150px] md:absolute md:right-[1%] md:top-[-9%] md:z-[3] md:mb-0 md:w-[clamp(104px,13vw,210px)] md:max-w-none lg:top-[3%] xl:right-[3%]"
            >
              <ReplySticker className="w-full md:rotate-[9deg]" />
            </Reveal>
          </div>
        </div>

        {/* контакты */}
        <div className="relative z-[2] mt-14 md:mt-48 lg:mt-36 xl:mt-40">
          <div className="mb-5 flex items-center justify-between gap-4 md:mb-6">
            <p className="label text-ink">Пиши, звони, приходи</p>
            <Chevrons count={8} bpm={95} className="text-ink" size="0.95rem" />
          </div>
          <ContactRows />
        </div>

        {/* CTA: наклейка-кнопка пробного */}
        <div className="relative z-[2] mt-12 flex flex-col gap-10 md:mt-16 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <Reveal kind="slap" delay={0.1}>
            <Magnetic strength={0.25}>
              <StickerButton
                href={CONTACTS.telegram.url}
                variant="ink"
                size="lg"
                tilt={-3}
                icon={<TelegramIcon />}
                aria-label={`Записаться на пробное занятие за ${rub(TRIAL.price)} в Телеграм`}
                className="px-6 py-4 text-[0.9rem] focus-visible:outline-ink md:px-9 md:py-6 md:text-[1.05rem]"
                style={
                  { "--shadow-color": "var(--color-cobalt)" } as CSSProperties
                }
              >
                <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span>Записаться на пробное</span>
                  <span className="display whitespace-nowrap text-[2.1em] leading-[0.8] tracking-normal text-paper">
                    — {rub(TRIAL.price)}
                  </span>
                </span>
              </StickerButton>
            </Magnetic>
          </Reveal>

          {/* ритм между кнопкой и текстом */}
          <div
            aria-hidden
            className="hidden flex-1 items-center gap-4 text-ink lg:flex"
          >
            <span className="h-0.5 flex-1 bg-ink" />
            <Chevrons count={7} bpm={95} size="1.4rem" />
          </div>

          <Reveal
            kind="rise"
            delay={0.2}
            className="max-w-md lg:max-w-sm xl:max-w-md"
          >
            <p className="label flex items-center gap-2 text-ink">
              <span className="inline-block size-2 animate-pulse rounded-full bg-cobalt" />
              {CONTACTS.replyTime}
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/80 md:text-base">
              {TRIAL.text}
            </p>
          </Reveal>
        </div>
      </div>

      {/* изогнутая лента — уходит под рваный край футера */}
      <Ribbon className="relative z-[1] -mx-[25%] -mt-12 w-[150%] md:-mx-[6%] md:mt-0 md:w-[112%]" />
    </section>
  );
}
