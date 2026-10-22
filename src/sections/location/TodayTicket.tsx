import { useState } from "react";

import { cn } from "@/lib/utils";

import { Barcode, classes, DAYS, jumpTo, todayIndex } from "./bits";

/**
 * Билет «Сегодня в зале»: что идёт сегодня в студии — первые занятия дня из расписания,
 * перфорация и штрих-код как у билетов в референсе. Клик — к недельному расписанию ниже.
 */
export function TodayTicket({
  className,
  max = 3,
}: {
  className?: string;
  max?: number;
}) {
  const [today] = useState(todayIndex);
  const day = DAYS[today];
  const shown = day.slots.slice(0, max);
  const rest = day.slots.length - shown.length;

  return (
    <a
      href="#schedule"
      onClick={(e) => jumpTo(e, "schedule")}
      data-cursor="hover"
      aria-label={`Сегодня, ${day.day.toLowerCase()}: ${classes(day.slots.length)}. Открыть расписание на неделю`}
      className={cn(
        "group/ticket relative block max-w-sm -rotate-[1.5deg] bg-ink-800 text-paper ring-1 ring-inset ring-paper/15",
        "shadow-[8px_8px_0_0_var(--color-cobalt)] transition-[translate,box-shadow,rotate] duration-300 ease-out-expo",
        "hover:rotate-0 hover:shadow-[4px_4px_0_0_var(--color-cobalt)] hover:translate-x-1 hover:translate-y-1",
        "focus-visible:rotate-0",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
        <span className="label flex items-center gap-2 text-toxic">
          <span
            aria-hidden
            className="size-1.5 animate-pulse rounded-full bg-toxic"
          />
          Сегодня · {day.day}
        </span>
        <span className="label tabular-nums text-mute">
          {classes(day.slots.length)}
        </span>
      </div>

      <ul className="space-y-2.5 px-5 pb-5">
        {shown.map((s, i) => (
          <li key={i} className="flex items-baseline gap-4">
            <time className="display w-[2.75em] shrink-0 text-[30px] leading-none tabular-nums text-toxic">
              {s.time}
            </time>
            <span className="min-w-0 text-[15px] font-semibold leading-tight">
              {s.title}
              {s.note && (
                <span className="font-normal text-mute"> · {s.note}</span>
              )}
            </span>
          </li>
        ))}
        {rest > 0 && (
          <li className="label pl-[99px] text-mute">и ещё {classes(rest)}</li>
        )}
      </ul>

      {/* линия отрыва: пунктир + вырезы по краям */}
      <div
        aria-hidden
        className="relative h-0 border-t-2 border-dashed border-paper/20"
      >
        <span className="absolute -left-2.5 -top-2.5 size-5 rounded-full bg-ink" />
        <span className="absolute -right-2.5 -top-2.5 size-5 rounded-full bg-ink" />
      </div>

      <div className="flex items-center justify-between gap-4 px-5 py-3.5">
        <span className="label flex items-center gap-2 text-paper transition-colors group-hover/ticket:text-toxic">
          Вся неделя
          <span
            aria-hidden
            className="inline-block transition-transform duration-300 ease-out-expo group-hover/ticket:translate-y-1"
          >
            ↓
          </span>
        </span>
        <Barcode
          seed={today + 21}
          bars={22}
          className="h-6 w-20 text-paper/35"
        />
      </div>
    </a>
  );
}
