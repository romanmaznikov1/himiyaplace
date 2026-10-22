import { Chevrons } from "@/components/ui/chevrons";
import { Reveal } from "@/components/ui/reveal";
import { SectionLabel } from "@/components/ui/section-label";
import { Spray } from "@/components/ui/spray";
import { Tape } from "@/components/ui/tape";
import { TornEdge } from "@/components/ui/torn-edge";
import { VelocityMarquee } from "@/components/ui/velocity-marquee";
import { useMedia } from "@/hooks/useMedia";
import { HALLS } from "@/lib/content";
import { HallCard } from "./halls/HallCard";
import { HallSplit } from "./halls/HallSplit";
import { HallsTitle } from "./halls/HallsTitle";

const LEAD = "Большой и светлый — для больших групп и постановок, малый и уютный — для занятий в небольших группах.";
const FEATURES = Array.from(new Set(HALLS.flatMap((h) => h.features)));

/**
 * 04 · Залы — яркий синий «разрыв» посреди тёмной страницы.
 * Десктоп: два постера-панели, раскрываются по наведению/фокусу. Мобильный: две карточки стопкой.
 */
export default function Halls() {
  // Десктопные панели и мобильные карточки монтируем по брейкпоинту, а не прячем CSS-ом:
  // скрытый HallSplit на телефоне — это 180 узлов, два useScroll-параллакса и motion-состояния.
  const desktop = useMedia("(min-width: 1024px)");
  return (
    <section id="halls" className="relative isolate overflow-x-clip bg-cobalt-deep pb-20 text-paper md:pb-24">
      <TornEdge side="top" color="var(--color-cobalt-deep)" fiber="var(--color-ice)" height={60} seed={14} />

      {/* декор фона: полутон и мазок баллончика в тон ultra — за панелями, а не за заголовком */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="halftone halftone-fade absolute -right-[10%] -top-[4%] h-[42rem] w-[60%] text-cobalt opacity-80 [--dot:10px]" />
        <Spray
          seed={23}
          color="var(--color-ultra)"
          drips={9}
          className="absolute -right-[12%] top-[38%] aspect-[5/2] w-[110%] opacity-70 lg:top-[44%] lg:w-[64%]"
        />
        <div className="halftone halftone-fade absolute -left-[8%] bottom-[6%] h-[28rem] w-[46%] text-ultra opacity-90 [--dot:8px]" />
      </div>

      <div className="relative px-5 pt-24 md:px-10 md:pt-32 xl:px-16">
        <SectionLabel index="04" label="Залы" tone="toxic" bpm={110} />

        <HallsTitle halls={HALLS} className="mt-8 text-[47vw] md:mt-10 md:text-[25.5vw] 2xl:text-[460px]" />

        <div className="mt-16 grid gap-6 md:mt-[5.5vw] lg:grid-cols-12 lg:items-end lg:gap-10">
          <Reveal className="lg:col-span-6 xl:col-span-5" delay={0.15} amount={0.1}>
            <p className="max-w-md text-[17px] leading-relaxed text-paper/90 md:text-lg">{LEAD}</p>
          </Reveal>
          {desktop && (
            <p className="label flex items-center gap-3 text-toxic lg:col-span-6 lg:justify-self-end xl:col-span-7">
              Наведи на зал
              <Chevrons count={5} bpm={110} size="0.8rem" />
            </p>
          )}
        </div>

        {desktop ? (
          <div className="mt-24">
            <HallSplit halls={HALLS} />
          </div>
        ) : (
          <div className="mt-20 grid gap-24 md:grid-cols-2 md:gap-10">
            {HALLS.map((hall, i) => (
              <HallCard key={hall.id} hall={hall} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* две скрещённые ленты: бегущая от скорости скролла и тихая под ней */}
      <div aria-hidden className="relative mt-12 h-[clamp(150px,17vw,250px)] md:mt-16 lg:mt-4">
        <Tape
          text={FEATURES}
          variant="ink"
          rotate={6}
          reverse
          speed={28}
          className="absolute -inset-x-[5%] top-1/2 -translate-y-1/2"
          textClassName="text-[clamp(18px,2vw,30px)]"
        />
        <div className="absolute -inset-x-[5%] top-1/2 -translate-y-1/2 rotate-[-3deg] bg-toxic py-[0.5vw] text-ink shadow-[0_18px_40px_-12px_rgb(0_0_0/0.6)]">
          <VelocityMarquee baseVelocity={-2.5} itemClassName="display text-[clamp(56px,9vw,150px)] leading-[0.92]">
            Большой зал ✕ Малый зал ✕ Зеркала ✕ Свет ✕{" "}
          </VelocityMarquee>
        </div>
      </div>
    </section>
  );
}
