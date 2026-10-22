import { useEffect, useState } from "react";

/**
 * Активная секция — та, что пересекает тонкую полосу посередине экрана.
 * Секции монтируются лениво (и пересоздаются при HMR), поэтому элементы ищем заново
 * при каждом изменении DOM — с троттлингом через rAF.
 */
export function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const hits = new Map<string, boolean>();
    const bound = new Map<string, Element>();

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) hits.set(e.target.id, e.isIntersecting);
        let next: string | null = null;
        for (const id of ids) if (hits.get(id)) next = id;
        setActive(next);
      },
      { rootMargin: "-46% 0px -52% 0px", threshold: 0 },
    );

    const attach = () => {
      for (const id of ids) {
        const el = document.getElementById(id);
        const prev = bound.get(id);
        if (el === prev) continue;
        if (prev) io.unobserve(prev);
        if (el) {
          io.observe(el);
          bound.set(id, el);
        } else {
          bound.delete(id);
          hits.delete(id);
        }
      }
    };

    attach();
    let raf = 0;
    const mo = new MutationObserver(() => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        attach();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      io.disconnect();
    };
  }, [ids]);

  return active;
}
