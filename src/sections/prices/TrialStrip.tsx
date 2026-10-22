import { motion } from "motion/react";

import { PhoneIcon, StickerButton, TelegramIcon } from "@/components/ui/sticker-button";
import { Tape } from "@/components/ui/tape";
import { CONTACTS, SINGLE_CLASS, TRIAL } from "@/lib/content";
import { rub } from "@/lib/utils";
import { Stamp } from "./Stamp";
import { tornPolygon } from "./torn";

const CLIP = tornPolygon(23, { x: 7, y: 16 });

/**
 * Пробное занятие — широкая наклейка-баннер: кобальт с рваными краями, токсичная жёсткая тень,
 * поперёк — лента скотча с бегущим текстом, на краю — крутящаяся печать «60 минут».
 */
export function TrialStrip() {
  return (
    <div className="relative mt-28 md:mt-40">
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 1.1, rotate: -5, y: 40 }}
        whileInView={{ opacity: 1, scale: 1, rotate: -1.2, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ default: { type: "spring", stiffness: 260, damping: 20, mass: 0.9 }, opacity: { duration: 0.25 } }}
      >
        {/* жёсткая тень-смещение того же рваного силуэта */}
        <div aria-hidden className="absolute inset-0 translate-x-2.5 translate-y-3 bg-toxic md:translate-x-4 md:translate-y-4" style={{ clipPath: CLIP }} />

        <div className="relative overflow-hidden bg-cobalt text-paper" style={{ clipPath: CLIP }}>
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <span className="halftone halftone-fade absolute -right-[10%] -top-[30%] h-[160%] w-[60%] text-ultra [--dot:9px]" />
            <span className="font-tag absolute -bottom-[0.3em] -right-[0.1em] -rotate-6 select-none whitespace-nowrap text-[46vw] leading-none text-paper/[0.07] md:text-[22vw] lg:left-[30%] lg:right-auto">
              trial
            </span>
          </div>

          <div className="relative grid gap-8 px-6 pb-14 pt-16 md:px-12 md:pb-16 md:pt-20 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-end lg:gap-16 xl:px-16">
            <div>
              {/* toxic на кобальте мелким текстом — 3.98:1; на чернильной плашке-наклейке — 14.7:1 */}
              <p className="label flex w-fit items-center gap-2 bg-ink px-2.5 py-1.5 text-toxic shadow-[3px_3px_0_0_var(--color-ultra)]">
                <span className="inline-block size-2 animate-beat rounded-full bg-toxic [--beat-scale:1.6] [--bpm:95]" />
                Первый шаг · {TRIAL.minutes} минут
              </p>
              <h3 className="display mt-4">
                <span className="block text-[21vw] leading-[0.8] md:text-[13vw] lg:text-[9.2vw]">Пробное</span>
                <span className="mt-[0.06em] block text-[25vw] leading-[0.8] text-toxic tabular-nums md:text-[16vw] lg:text-[11.4vw]">
                  {rub(TRIAL.price)}
                </span>
              </h3>
            </div>

            <div className="max-w-md lg:justify-self-end lg:pb-3">
              <p className="text-[17px] leading-relaxed text-paper/90 md:text-lg">{TRIAL.text}</p>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-4">
                <StickerButton href={CONTACTS.telegram.url} variant="toxic" size="lg" tilt={-2} icon={<TelegramIcon />}>
                  Записаться
                </StickerButton>
                <StickerButton
                  href={CONTACTS.phone.tel}
                  variant="paper"
                  size="lg"
                  tilt={1.5}
                  icon={<PhoneIcon />}
                  aria-label={`Позвонить: ${CONTACTS.phone.display}`}
                  className="whitespace-nowrap tabular-nums [--shadow-color:var(--color-ink)] max-[359px]:px-5 max-[359px]:tracking-[0.04em]"
                >
                  {CONTACTS.phone.display}
                </StickerButton>
              </div>
            </div>
          </div>
        </div>

        <Stamp
          ring={`Пробное · ${TRIAL.minutes} минут · Без обязательств · `}
          value={String(TRIAL.minutes)}
          caption="минут"
          className="absolute -bottom-14 right-3 z-[2] w-28 rotate-12 text-[15px] md:-bottom-16 md:right-10 md:w-36 md:text-[18px] lg:left-[38%] lg:right-auto lg:w-40 lg:text-[20px]"
        />
      </motion.div>

      <Tape
        text={["Пробное", rub(TRIAL.price), `${TRIAL.minutes} минут`, "Без обязательств"]}
        variant="ink"
        rotate={2.4}
        speed={22}
        reverse
        className="absolute -left-[6%] -top-5 z-[3] w-[112%] md:-top-6"
      />

      <p className="mt-20 flex max-w-2xl items-start gap-3 text-sm leading-relaxed text-mute md:mt-24 md:text-[15px]">
        <span aria-hidden className="display mt-[-0.1em] text-2xl leading-none text-toxic">
          *
        </span>
        {/* одна терминология на всю секцию: «абонемент», не «билет» */}
        Разовое занятие без абонемента — {rub(SINGLE_CLASS)}. Скидки в абонементах считаются от этой цены.
      </p>
    </div>
  );
}
