// Витрина общих компонентов (?only=kit). Не входит в страницу — справочник для сборки секций.
import MarqueeAlongSvgPath from "@/components/ui/marquee-along-svg-path";
import StackingCards, { StackingCardItem } from "@/components/ui/stacking-cards";
import { Chevrons } from "@/components/ui/chevrons";
import { LoopVideo, Duotone } from "@/components/ui/loop-video";
import { MotionBlurTitle } from "@/components/ui/motion-blur-title";
import { Reveal } from "@/components/ui/reveal";
import { SectionLabel } from "@/components/ui/section-label";
import { Spray } from "@/components/ui/spray";
import { StickerButton, TelegramIcon } from "@/components/ui/sticker-button";
import { Tape } from "@/components/ui/tape";
import { TornEdge, tornClipPath } from "@/components/ui/torn-edge";
import { VelocityMarquee } from "@/components/ui/velocity-marquee";

const WAVE = "M-40 160 C 220 40, 420 300, 720 150 S 1200 40, 1480 170";

export default function Kit() {
  return (
    <div className="pb-[40vh]">
      <section className="relative px-6 py-24 md:px-12">
        <SectionLabel index="00" label="Kit / общие компоненты" />
        <MotionBlurTitle text="Purchase ticket" as="h1" className="mt-6 text-center text-[16vw] md:text-[9vw]" />
        <MotionBlurTitle text="Тренеры" className="mt-6 text-[20vw] text-toxic md:text-[11vw]" blur="left" />
        <div className="mt-10 flex flex-wrap items-center gap-6">
          <StickerButton href="https://t.me/himiyaadmin" icon={<TelegramIcon />}>
            Записаться
          </StickerButton>
          <StickerButton href="#" variant="toxic" tilt={3}>
            Пробное 350 ₽
          </StickerButton>
          <StickerButton href="#" variant="outline" tilt={0}>
            Подробнее
          </StickerButton>
          <Chevrons className="text-toxic" size="1.4rem" />
          <span className="font-drip text-5xl text-sky">Химия</span>
          <span className="font-glitch text-5xl text-toxic">Электро</span>
          <span className="font-tag text-5xl text-toxic">flow</span>
        </div>
      </section>

      <section className="relative bg-toxic px-6 py-24 text-ink md:px-12">
        <TornEdge side="top" color="var(--color-toxic)" seed={3} height={56} />
        <Spray seed={4} color="var(--color-cobalt)" className="absolute inset-x-0 top-10 aspect-[5/2] w-full opacity-90" />
        <div className="relative">
          <MotionBlurTitle text="Хип-хоп" className="text-[22vw] md:text-[14vw]" />
          <p className="max-w-md text-lg">TornEdge сверху + Spray на фоне. Цвет края = цвет секции.</p>
        </div>
        <Tape text={["ХИМИЯ", "DANCE", "СТАВРОПОЛЬ"]} rotate={-5} className="absolute -left-[5%] bottom-16 w-[110%]" variant="ink" />
      </section>

      <section className="relative bg-cobalt px-6 py-24 md:px-12">
        <TornEdge side="top" color="var(--color-cobalt)" seed={9} height={44} fiber="var(--color-ice)" />
        <VelocityMarquee baseVelocity={-4} itemClassName="display text-[14vw] text-paper">
          Хип-хоп ✕ Хай хилс ✕ Контемп ✕ Электро ✕
        </VelocityMarquee>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Duotone className="aspect-[9/16]" highlight="var(--color-toxic)" shadow="var(--color-ink)">
            <LoopVideo src="/media/directions/hiphop.mp4" poster="/media/directions/hiphop.jpg" />
          </Duotone>
          <Duotone className="aspect-[9/16]" highlight="var(--color-ice)" shadow="var(--color-ultra)">
            <LoopVideo src="/media/directions/heels.mp4" poster="/media/directions/heels.jpg" />
          </Duotone>
          <div className="aspect-[9/16] overflow-hidden bg-ink" style={{ clipPath: tornClipPath(5, { top: true, bottom: true, left: true, right: true }, 2) }}>
            <img src="/media/coaches/milena-560.webp" alt="" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="relative h-[34vw] min-h-60 overflow-hidden bg-ink">
        <MarqueeAlongSvgPath
          path={WAVE}
          viewBox="0 0 1440 320"
          baseVelocity={6}
          useScrollVelocity
          scrollAwareDirection
          repeat={3}
          className="absolute inset-0"
          renderPath={(d) => (
            <>
              <path d={d} stroke="var(--color-ink)" strokeWidth={78} fill="none" />
              <path d={d} stroke="var(--color-toxic)" strokeWidth={62} fill="none" />
            </>
          )}
        >
          {["ХИМИЯ", "✕", "DANCE", "✕"].map((w, i) => (
            <span key={i} className="display block whitespace-nowrap px-3 text-[46px] leading-none text-ink">
              {w}
            </span>
          ))}
        </MarqueeAlongSvgPath>
      </section>

      <StackingCards totalCards={3} scaleMultiplier={0.04} className="relative">
        {["var(--color-toxic)", "var(--color-cobalt)", "var(--color-ice)"].map((c, i) => (
          <StackingCardItem key={i} index={i} topPosition="0px" className="h-svh">
            <div className="relative h-full" style={{ background: c }}>
              {i > 0 && <TornEdge side="top" color={c} seed={20 + i} height={50} />}
              <Reveal kind="slap" className="grid h-full place-items-center">
                <span className="display text-[20vw] text-ink">0{i + 1}</span>
              </Reveal>
            </div>
          </StackingCardItem>
        ))}
      </StackingCards>
    </div>
  );
}
