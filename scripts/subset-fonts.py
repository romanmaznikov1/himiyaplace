#!/usr/bin/env python3
"""
Шрифты сайта → public/fonts/*.woff2 (стабильные имена: их можно preload-ить из index.html).

Зачем: fontsource-пакеты подключали все подмножества (latin-ext, greek, vietnamese, hebrew…),
и браузер на первом экране качал ~140 KB ради одного «₽» и греческих букв в ScrambleText,
а граффити-шрифты (~180 KB) — ради пары слов далеко внизу страницы.

  - Inter Tight / Sofia Sans Extra Condensed (переменные): копии подмножеств latin и cyrillic
    из fontsource; для Inter — крошечный файл только с «₽» (U+20BD) вместо 90-килобайтного latin-ext.
  - Граффити-шрифты урезаны до нужных символов:
      Rubik Glitch    — символы слоганов направлений из content.ts (слоган «Электро», DirectionPanel):
                        поменяли слоган — перезапустите скрипт;
      Rubik Wet Paint — только буквы слова «Химия» (сейчас — лишь витрина _Kit: в тренерах теперь flat_logo);
      Sedgwick Ave    — латиница a–z / A–Z и знаки (теги flow/vibe/crew/street/holla/trial/himiya).
    Нужен новый символ (другое слово тегом, другой слоган) — допишите его в TEXT ниже и перезапустите.
    Символа нет в файле — браузер возьмёт его из следующего шрифта в стеке (см. --font-* в index.css).

Запуск (нужны fontTools и brotli):
  python3 -m pip install fonttools brotli
  python3 scripts/subset-fonts.py
"""
from __future__ import annotations

import re
import shutil
from pathlib import Path

from fontTools import subset
from fontTools.merge import Merger
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
NM = ROOT / "node_modules"
OUT = ROOT / "public" / "fonts"

# знаки, которые встречаются рядом с кириллицей в граффити-строках
PUNCT = " .,!?:;-–—«»…'\"()"
CYRILLIC = "".join(chr(c) for c in range(0x0410, 0x0450)) + "Ёё"
LATIN = "".join(chr(c) for c in range(0x41, 0x5B)) + "".join(chr(c) for c in range(0x61, 0x7B))

def taglines() -> str:
    """Слоганы направлений из content.ts — Rubik Glitch рисует только их (у «Электро»), берём символы всех четырёх."""
    src = (ROOT / "src/lib/content.ts").read_text(encoding="utf-8")
    found = re.findall(r'tagline:\s*"([^"]+)"', src)
    if not found:
        raise SystemExit("не нашёл tagline в src/lib/content.ts")
    return "".join(found)


TEXT = {
    "glitch": taglines() + PUNCT,
    "wet-paint": "ХхИиМмЯя",
    "sedgwick": LATIN + PUNCT,
}


def options() -> subset.Options:
    o = subset.Options()
    o.flavor = "woff2"
    o.layout_features = ["*"]
    o.hinting = False
    o.desubroutinize = True
    o.name_IDs = ["*"]
    o.notdef_outline = True
    return o


def make_subset(src: Path, dst: Path, *, text: str | None = None, unicodes: list[int] | None = None) -> None:
    font = TTFont(src)
    s = subset.Subsetter(options())
    s.populate(text=text or "", unicodes=unicodes or [])
    s.subset(font)
    font.flavor = "woff2"
    font.save(dst)
    print(f"  {dst.name:40s} {dst.stat().st_size / 1024:6.1f} KB")


def merged_subset(srcs: list[Path], dst: Path, text: str) -> None:
    """Rubik Glitch разложен fontsource по файлам (кириллица отдельно, пробел и точка — в latin): склеиваем."""
    tmp = []
    for i, src in enumerate(srcs):
        font = TTFont(src)
        s = subset.Subsetter(options())
        s.populate(text=text)
        s.subset(font)
        font.flavor = None
        p = dst.with_suffix(f".part{i}.ttf")
        font.save(p)
        tmp.append(p)
    merged = Merger().merge([str(p) for p in tmp])
    merged.flavor = "woff2"
    merged.save(dst)
    for p in tmp:
        p.unlink()
    print(f"  {dst.name:40s} {dst.stat().st_size / 1024:6.1f} KB")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    inter = NM / "@fontsource-variable/inter-tight/files"
    sofia = NM / "@fontsource-variable/sofia-sans-extra-condensed/files"
    print("основные (копии подмножеств fontsource):")
    for src, name in [
        (inter / "inter-tight-latin-wght-normal.woff2", "inter-tight-latin.woff2"),
        (inter / "inter-tight-cyrillic-wght-normal.woff2", "inter-tight-cyrillic.woff2"),
        (sofia / "sofia-sans-extra-condensed-latin-wght-normal.woff2", "sofia-latin.woff2"),
        (sofia / "sofia-sans-extra-condensed-cyrillic-wght-normal.woff2", "sofia-cyrillic.woff2"),
    ]:
        shutil.copyfile(src, OUT / name)
        print(f"  {name:40s} {(OUT / name).stat().st_size / 1024:6.1f} KB")

    # у Sofia Sans знака рубля нет вовсе (latin-ext качался зря) — там «₽» берётся из следующего шрифта стека
    print("₽ (U+20BD) из latin-ext:")
    make_subset(inter / "inter-tight-latin-ext-wght-normal.woff2", OUT / "inter-tight-rub.woff2", unicodes=[0x20BD])

    print("граффити:")
    glitch = NM / "@fontsource/rubik-glitch/files"
    merged_subset(
        [glitch / "rubik-glitch-cyrillic-400-normal.woff2", glitch / "rubik-glitch-latin-400-normal.woff2"],
        OUT / "rubik-glitch.woff2",
        TEXT["glitch"],
    )
    make_subset(NM / "@fontsource/rubik-wet-paint/files/rubik-wet-paint-cyrillic-400-normal.woff2", OUT / "rubik-wet-paint.woff2", text=TEXT["wet-paint"])
    make_subset(NM / "@fontsource/sedgwick-ave-display/files/sedgwick-ave-display-latin-400-normal.woff2", OUT / "sedgwick-ave-display.woff2", text=TEXT["sedgwick"])


if __name__ == "__main__":
    main()
