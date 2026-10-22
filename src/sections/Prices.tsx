import { SectionLabel } from "@/components/ui/section-label";
import { Tape } from "@/components/ui/tape";
import { TornEdge } from "@/components/ui/torn-edge";
import { PRICES, TRIAL } from "@/lib/content";
import { cn, rub } from "@/lib/utils";
import { PriceHeader } from "./prices/PriceHeader";
import { Ticket } from "./prices/Ticket";
import { TrialStrip } from "./prices/TrialStrip";
import { tornPolygon } from "./prices/torn";

const SEAM = tornPolygon(61, { x: 0, y: 26, stepsX: 90 });
const SEAM_RIM = tornPolygon(64, { x: 0, y: 18, stepsX: 90 });

/** Фон-стена: один бледный граффити-тег за билетами и полутон — фактура без шума. */
function Wall() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="font-tag absolute -left-[8vw] top-[34%] rotate-[7deg] whitespace-nowrap text-[52vw] leading-none text-paper/[0.035] md:text-[30vw]">
        vibe
      </span>
      <span className="halftone halftone-fade absolute -right-[16%] top-[30%] aspect-square w-[70vw] text-cobalt/25 [--dot:10px] md:w-[46vw]" />
    </div>
  );
}

/**
 * Второй лист под рваным краем: обрывок кобальтового постера с волокном ice торчит из-под
 * тёмного края — стык с «Тренерами» читается как слои бумаги, а не тонкая линия на чёрном.
 */
function SeamSheet() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -left-[3%] -top-[64px] z-[1] h-[64px] w-[106%] rotate-[-1.6deg] md:-top-[104px] md:h-[104px] md:rotate-[-1.2deg]"
    >
      <div className="absolute inset-0 bg-ice" style={{ clipPath: SEAM_RIM }} />
      <div className="absolute inset-[4px] bg-cobalt" style={{ clipPath: SEAM }}>
        <span className="halftone absolute inset-0 text-ultra/70 [--dot:8px]" />
      </div>
    </div>
  );
}

export default function Prices() {
  return (
    <section id="prices" aria-label="Цены" className="relative isolate overflow-x-clip bg-ink-900 pb-32 pt-28 md:pb-44 md:pt-36">
      {/* на узком экране рвань мельче — иначе 56px на 390px превращаются в «пики» */}
      <SeamSheet />
      <TornEdge side="top" color="var(--color-ink-900)" seed={47} height={30} density={44} className="md:hidden" />
      <TornEdge side="top" color="var(--color-ink-900)" seed={47} height={56} className="hidden md:block" />
      {/* лента поперёк стыка с предыдущей секцией */}
      <Tape
        text={["Цены", "Абонементы", "Один абонемент — все направления", `Пробное ${rub(TRIAL.price)}`]}
        rotate={-2.2}
        speed={30}
        className="absolute -left-[4%] -top-6 z-[5] w-[108%] md:-top-9"
      />
      <Wall />

      <div className="relative z-[1] px-5 md:px-10 xl:px-16">
        <SectionLabel index="03" label="Цены" />

        <PriceHeader />

        <ul role="list" className="mt-20 grid gap-9 md:mt-28 md:gap-12 xl:grid-cols-2 xl:gap-x-10 xl:gap-y-14">
          {PRICES.map((p, i) => (
            <Ticket
              key={p.id}
              price={p}
              index={i}
              className={cn("w-full lg:max-w-[42rem] xl:max-w-none", i % 2 === 1 && "lg:ml-auto xl:ml-0 xl:mt-20")}
            />
          ))}
        </ul>

        <TrialStrip />
      </div>
    </section>
  );
}
