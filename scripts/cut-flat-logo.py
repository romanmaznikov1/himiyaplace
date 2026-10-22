#!/usr/bin/env python3
"""
flat_logo.png (голубой логотип на чёрном, без альфы) → public/media/logo:

  - flat-logo-{240,640,1280}.{webp,png} — логотип на прозрачном фоне (тег «Химия» в тренерах, подпись в футере);
  - cursor-x.webp / cursor-x.png       — буква «Х» из логотипа для курсора: с чернильной обводкой
                                          и жёсткой тенью, чтобы читалась и на светлых панелях.
    Точку клика (пересечение штрихов) скрипт печатает в долях — она прописана в Cursor.tsx (HOT).

Альфа — по яркости: фон чёрный (шум ≤ 8), заливки логотипа — синий канал ≈ 240–255;
полупрозрачные края «размножаем» обратно на долю покрытия, чтобы не было тёмной каймы.
Логотип почти плоский (3 цвета + сглаживание): палитра 64 цвета, webp без потерь — в 3–5 раз легче.

Запуск (нужны Pillow, numpy, scipy и cwebp):
  python3 scripts/cut-flat-logo.py
"""
from __future__ import annotations

import subprocess
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public/media/logo"
INK = (3, 6, 13)

src = np.asarray(Image.open(ROOT / "flat_logo.png").convert("RGB")).astype(np.float64)
mx = src.max(axis=2)
alpha = np.clip((mx - 10) / (236 - 10), 0, 1)
rgb = np.clip(src / np.clip(mx / 236, 1e-4, 1)[..., None], 0, 255)
rgba = np.dstack([rgb, alpha * 255]).round().astype(np.uint8)

# рамка букв и отдельные фигуры: 1 — «Х», остальные — «ими» и «я»
ys, xs = np.where(mx > 60)
x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
labels, _ = ndimage.label(mx > 25)


def write(img: Image.Image, stem: str) -> None:
    """Палитра 64 цвета → png (запасной) и webp без потерь."""
    q = img.quantize(colors=64, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    png = OUT / f"{stem}.png"
    q.save(png, optimize=True)
    subprocess.run(["cwebp", "-quiet", "-lossless", "-z", "9", str(png), "-o", str(OUT / f"{stem}.webp")], check=True)
    print(f"{stem}: {img.width}×{img.height}  png {png.stat().st_size // 1024} KB, webp {(OUT / f'{stem}.webp').stat().st_size // 1024} KB")


# логотип целиком, поле 24 px — под тень и наклон
pad = 24
logo = Image.fromarray(rgba[y0 - pad : y1 + pad, x0 - pad : x1 + pad], "RGBA")
for w in (240, 640, 1280):
    write(logo.resize((w, round(logo.height * w / logo.width)), Image.LANCZOS), f"flat-logo-{w}")

# «Х» для курсора: только её фигура, обводка цвета ink и тень со сдвигом вправо-вниз
xmask = labels == labels[np.where(labels > 0)[0][0], np.where(labels > 0)[1][0]]
xs_, ys_ = np.where(xmask.T)
bx0, bx1, by0, by1 = xs_.min(), xs_.max() + 1, ys_.min(), ys_.max() + 1
H = 132  # 3× от 44 px на экране
scale = H / (by1 - by0)
stroke = round(3.4 / scale)  # ≈ 1.1 px обводки на экране
shadow = round(5.5 / scale)  # ≈ 1.8 px тени
m = stroke + shadow + 4
letter = np.zeros((by1 - by0 + 2 * m, bx1 - bx0 + 2 * m, 4), np.uint8)
crop = rgba[by0:by1, bx0:bx1].copy()
crop[..., 3] = (crop[..., 3] * ndimage.binary_dilation(xmask[by0:by1, bx0:bx1], iterations=3)).astype(np.uint8)
letter[m : m + crop.shape[0], m : m + crop.shape[1]] = crop

a = letter[..., 3].astype(np.float64) / 255
disk = np.hypot(*np.mgrid[-stroke : stroke + 1, -stroke : stroke + 1]) <= stroke
outline = ndimage.grey_dilation(a, footprint=disk)
outline = np.maximum(outline, ndimage.shift(outline, (shadow, shadow), order=0))
under = np.dstack([np.broadcast_to(INK, a.shape + (3,)), outline * 255])
over = letter.astype(np.float64)
oa = over[..., 3:] / 255
comp_a = oa + (under[..., 3:] / 255) * (1 - oa)
comp_rgb = (over[..., :3] * oa + under[..., :3] * (under[..., 3:] / 255) * (1 - oa)) / np.maximum(comp_a, 1e-6)
cur = Image.fromarray(np.dstack([comp_rgb, comp_a * 255]).round().astype(np.uint8), "RGBA")
cur = cur.resize((round(cur.width * scale), round(cur.height * scale)), Image.LANCZOS)
write(cur, "cursor-x")

# точка клика — середина строк, где штрихи «Х» сливаются в один отрезок (пересечение)
rows = []
for yy in range(int(xmask[by0:by1].shape[0] * 0.2), int(xmask[by0:by1].shape[0] * 0.7)):
    row = xmask[by0 + yy, bx0:bx1]
    runs = np.diff(np.concatenate([[0], row.astype(int), [0]]))
    starts, ends = np.where(runs == 1)[0], np.where(runs == -1)[0]
    if len(starts) == 1:
        rows.append((yy, (starts[0] + ends[0]) / 2))
cy = np.mean([r[0] for r in rows]) + m
cx = np.mean([r[1] for r in rows]) + m
full_w, full_h = letter.shape[1], letter.shape[0]
print(f"cursor-x: {cur.width}×{cur.height}  hotspot {cx / full_w:.3f} {cy / full_h:.3f}")
