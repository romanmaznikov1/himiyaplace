import StackingCards, { StackingCardItem } from "@/components/ui/stacking-cards";
import { DIRECTIONS } from "@/lib/content";

import { DirectionPanel } from "./directions/DirectionPanel";
import { Intro } from "./directions/Intro";
import { useStackGeometry } from "./directions/useStackGeometry";
import "./directions/directions.css";

/**
 * «Направления»: интро наезжает рваным краем на приколотый hero, дальше четыре полноэкранные панели
 * стопкой (StackingCards) — каждая следующая с рваным верхом накрывает предыдущую,
 * а накрытая чуть уменьшается, темнеет и «отклеивается».
 */
const COUNT = DIRECTIONS.length + 1;

/** Масштаб карточки стопки меняется каждый кадр скролла — свой слой, чтобы композитор не перерастрировал панель. */
const ITEM_INNER = "will-change-transform";

export default function Directions() {
  const g = useStackGeometry(COUNT);

  return (
    <section id="directions" className="relative isolate overflow-x-clip bg-ink">
      <div ref={g.wrapRef}>
        <StackingCards totalCards={COUNT} scaleMultiplier={0.035}>
          <StackingCardItem index={0} topPosition="0px" className="h-auto" innerClassName={ITEM_INNER} style={{ top: g.stickyTop[0] }}>
            <Intro cover={g.cover[0]} panelRef={g.itemRefs[0]} onJump={(i) => g.scrollToItem(i + 1)} />
          </StackingCardItem>
          {DIRECTIONS.map((d, i) => (
            <StackingCardItem
              key={d.id}
              index={i + 1}
              topPosition="0px"
              className="h-auto"
              innerClassName={ITEM_INNER}
              style={{ top: g.stickyTop[i + 1] }}
            >
              <DirectionPanel
                d={d}
                index={i}
                enter={g.enter[i + 1]}
                cover={g.cover[i + 1]}
                panelRef={g.itemRefs[i + 1]}
              />
            </StackingCardItem>
          ))}
        </StackingCards>
      </div>
    </section>
  );
}
