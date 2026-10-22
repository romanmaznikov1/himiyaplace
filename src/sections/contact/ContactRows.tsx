import type { ReactNode } from "react";

import { Reveal } from "@/components/ui/reveal";
import {
  ArrowIcon,
  PhoneIcon,
  PinIcon,
  TelegramIcon,
} from "@/components/ui/sticker-button";
import { CONTACTS } from "@/lib/content";
import { cn } from "@/lib/utils";

import { jumpTo } from "./jump";

type Row = {
  id: "telegram" | "phone" | "address";
  label: string;
  hint: string;
  value: string;
  href: string;
  aria: string;
  icon: ReactNode;
  /** Компактная строка-ссылка внутри страницы (адрес → секция «Локация»). */
  compact?: boolean;
  /** Якорь внутри страницы вместо внешней ссылки. */
  jump?: string;
};

const ROWS: Row[] = [
  {
    id: "telegram",
    label: "Телеграм",
    hint: "Написать",
    value: CONTACTS.telegram.handle,
    href: CONTACTS.telegram.url,
    aria: `Написать в Телеграм: ${CONTACTS.telegram.handle}`,
    icon: <TelegramIcon />,
  },
  {
    id: "phone",
    label: "Телефон",
    hint: "Позвонить",
    value: CONTACTS.phone.display,
    href: CONTACTS.phone.tel,
    aria: `Позвонить: ${CONTACTS.phone.display}`,
    icon: <PhoneIcon />,
  },
  // «где» целиком живёт в «Локации» (карта, маршрут, расписание) — здесь только короткая ссылка туда
  {
    id: "address",
    label: "Адрес",
    hint: "К карте",
    value: CONTACTS.address,
    href: "#location",
    aria: `Адрес: ${CONTACTS.city}, ${CONTACTS.address}. Показать на карте`,
    icon: <PinIcon />,
    compact: true,
    jump: "location",
  },
];

/**
 * Список контактов: Телеграм и телефон — огромные строки во всю ширину с заливкой-«вытиранием»
 * при наведении, адрес — компактная строка-ссылка к карте (стрелка смотрит вверх, к «Локации»).
 */
export function ContactRows({ className }: { className?: string }) {
  return (
    <ul className={cn("border-t-2 border-ink", className)}>
      {ROWS.map((row, i) => (
        <Reveal as="li" key={row.id} kind="whip" delay={i * 0.08} amount={0.5}>
          <ContactRow row={row} index={i} />
        </Reveal>
      ))}
    </ul>
  );
}

const ease = "duration-[650ms] ease-out-expo";

function ContactRow({ row, index }: { row: Row; index: number }) {
  const external = row.href.startsWith("http");
  const ticker = Array.from({ length: 4 }, () => `${row.value} ✕ `).join("");
  const sm = row.compact;

  return (
    <a
      href={row.href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={row.jump ? (e) => jumpTo(e, row.jump!) : undefined}
      aria-label={row.aria}
      data-contact={row.id}
      data-cursor="hover"
      className="group/row relative -mx-5 block overflow-hidden border-b-2 border-ink px-5 outline-none md:-mx-10 md:px-10 xl:-mx-16 xl:px-16"
    >
      {/* заливка: въезжает слева, уезжает вправо */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 origin-right scale-x-0 bg-ink transition-transform",
          ease,
          "group-hover/row:origin-left group-hover/row:scale-x-100 group-focus-visible/row:origin-left group-focus-visible/row:scale-x-100",
        )}
      />
      {/* полоска-«скотч» на кромке заливки */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-1.5 origin-left scale-y-0 bg-cobalt transition-transform duration-300",
          "group-hover/row:scale-y-100 group-focus-visible/row:scale-y-100",
        )}
      />

      <span
        className={cn(
          // ≤359px: зазор до стрелки чуть меньше — номер телефона помещается в одну строку и на 320px
          "relative flex items-center gap-4 max-[359px]:gap-3 md:gap-8",
          sm ? "py-4 md:py-5" : "py-5 md:py-6 xl:py-7",
        )}
      >
        <span
          aria-hidden
          className="label hidden w-8 shrink-0 tabular-nums text-ink/55 transition-colors duration-300 group-hover/row:text-toxic/70 group-focus-visible/row:text-toxic/70 md:block"
        >
          0{index + 1}
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-10">
          {/* подпись + подсказка, которая на наведении сменяется бегущей строкой значения */}
          <span className="flex shrink-0 items-center gap-3 lg:block lg:w-[12.5rem] xl:w-[15rem]">
            <span
              aria-hidden
              className="grid size-5 place-items-center text-ink transition-colors duration-300 group-hover/row:text-toxic lg:hidden [&>svg]:size-full"
            >
              {row.icon}
            </span>
            <span
              className={cn(
                "display block text-[24px] leading-none transition-colors duration-300 group-hover/row:text-toxic group-focus-visible/row:text-toxic md:text-[28px]",
                sm
                  ? "lg:text-[clamp(26px,2vw,34px)]"
                  : "lg:text-[clamp(30px,2.7vw,46px)]",
              )}
            >
              {row.label}
            </span>
            <span
              aria-hidden
              className="relative block h-[1.1rem] overflow-hidden lg:mt-2.5 lg:w-full"
            >
              <span className="label flex h-full items-center gap-2 text-ink/60 transition-[translate,opacity] duration-300 group-hover/row:-translate-y-full group-hover/row:opacity-0 group-focus-visible/row:-translate-y-full group-focus-visible/row:opacity-0">
                <span className="hidden size-3.5 lg:grid [&>svg]:size-full">
                  {row.icon}
                </span>
                {row.hint}
              </span>
              <span className="absolute inset-0 hidden translate-y-full opacity-0 transition-[translate,opacity] duration-300 group-hover/row:translate-y-0 group-hover/row:opacity-100 group-focus-visible/row:translate-y-0 group-focus-visible/row:opacity-100 lg:block [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
                <span className="label flex h-full w-max animate-marquee items-center whitespace-pre text-toxic [--marquee-dur:7s] [animation-play-state:paused] group-hover/row:[animation-play-state:running] group-focus-visible/row:[animation-play-state:running]">
                  <span>{ticker}</span>
                  <span>{ticker}</span>
                </span>
              </span>
            </span>
          </span>

          <span
            className={cn(
              "display block leading-[0.86] tabular-nums transition-[color,translate]",
              ease,
              "group-hover/row:translate-x-2 group-hover/row:text-toxic group-focus-visible/row:text-toxic md:group-hover/row:translate-x-6 lg:whitespace-nowrap",
              // минимум clamp ниже прежнего — это меняет размер только на экранах уже ~350px;
              // ник и телефон никогда не переносятся посреди номера
              sm
                ? "text-[clamp(26px,8vw,40px)] md:text-[clamp(40px,5vw,56px)] lg:text-[clamp(36px,3.4vw,60px)]"
                : "whitespace-nowrap text-[clamp(34px,11.6vw,64px)] md:text-[clamp(64px,9vw,96px)] lg:text-[clamp(56px,6.5vw,124px)]",
              // ник набирают строчными — так он и читается, и запоминается
              row.id === "telegram" && "normal-case",
            )}
          >
            {row.value}
          </span>
        </span>

        {/* стрелка «выстреливает» вправо, на её место прилетает новая */}
        <span
          aria-hidden
          className={cn(
            "relative grid shrink-0 place-items-center overflow-hidden rounded-full border-2 border-ink transition-colors duration-300 group-hover/row:border-toxic group-hover/row:bg-toxic group-focus-visible/row:border-toxic group-focus-visible/row:bg-toxic",
            sm
              ? "size-11 md:size-[clamp(52px,4.4vw,68px)]"
              : "size-12 md:size-[clamp(64px,6vw,96px)]",
            // к «Локации» — она выше по странице, поэтому стрелка смотрит вверх
            sm && "-rotate-90",
          )}
        >
          <span
            className={cn(
              "block size-5 transition-transform md:size-[38%] [&>svg]:size-full",
              ease,
              "group-hover/row:translate-x-[220%] group-focus-visible/row:translate-x-[220%]",
            )}
          >
            <ArrowIcon />
          </span>
          <span
            className={cn(
              "absolute inset-0 m-auto block size-5 -translate-x-[220%] transition-transform md:size-[38%] [&>svg]:size-full",
              ease,
              "group-hover/row:translate-x-0 group-focus-visible/row:translate-x-0",
            )}
          >
            <ArrowIcon />
          </span>
        </span>
      </span>
    </a>
  );
}
