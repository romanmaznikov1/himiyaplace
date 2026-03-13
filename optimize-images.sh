#!/bin/bash
# Batch optimize coach photos and logo using ImageMagick
# Requires: ImageMagick 7+ (magick command)

set -e

COACHES_DIR="images/coaches"
OPTIMIZED_DIR="$COACHES_DIR/optimized"
WEBP_DIR="$COACHES_DIR/webp"
ORIGINALS_DIR="$COACHES_DIR/originals"

mkdir -p "$OPTIMIZED_DIR" "$WEBP_DIR" "$ORIGINALS_DIR"

echo "=== Optimizing coach photos ==="

for img in "$COACHES_DIR"/*.jpg; do
  [ -f "$img" ] || continue
  basename=$(basename "$img" .jpg)
  echo "Processing: $basename"

  # Move original to originals/ (copy if not already there)
  if [ ! -f "$ORIGINALS_DIR/$basename.jpg" ]; then
    cp "$img" "$ORIGINALS_DIR/$basename.jpg"
  fi

  # 600px wide (2x retina) JPEG
  magick "$img" -resize 600x -quality 82 -strip "$OPTIMIZED_DIR/$basename.jpg"
  # 300px wide (1x) JPEG
  magick "$img" -resize 300x -quality 82 -strip "$OPTIMIZED_DIR/${basename}-300w.jpg"

  # 600px wide WebP
  magick "$img" -resize 600x -quality 80 -strip "$WEBP_DIR/$basename.webp"
  # 300px wide WebP
  magick "$img" -resize 300x -quality 80 -strip "$WEBP_DIR/${basename}-300w.webp"

  echo "  Done: $basename"
done

for img in "$COACHES_DIR"/*.png; do
  [ -f "$img" ] || continue
  basename=$(basename "$img" .png)
  echo "Processing: $basename"

  # Move original to originals/ (copy if not already there)
  if [ ! -f "$ORIGINALS_DIR/$basename.png" ]; then
    cp "$img" "$ORIGINALS_DIR/$basename.png"
  fi

  # 600px wide (2x retina) JPEG
  magick "$img" -resize 600x -quality 82 -strip "$OPTIMIZED_DIR/$basename.jpg"
  # 300px wide (1x) JPEG
  magick "$img" -resize 300x -quality 82 -strip "$OPTIMIZED_DIR/${basename}-300w.jpg"

  # 600px wide WebP
  magick "$img" -resize 600x -quality 80 -strip "$WEBP_DIR/$basename.webp"
  # 300px wide WebP
  magick "$img" -resize 300x -quality 80 -strip "$WEBP_DIR/${basename}-300w.webp"

  echo "  Done: $basename"
done

echo ""
echo "=== Optimizing logo ==="

LOGO="images/himiya-cyrillic.png"
LOGO_OPT_DIR="images/optimized"
LOGO_WEBP_DIR="images/webp"

mkdir -p "$LOGO_OPT_DIR" "$LOGO_WEBP_DIR"

# 900px wide PNG
magick "$LOGO" -resize 900x -strip "$LOGO_OPT_DIR/himiya-cyrillic.png"
# 480px wide PNG
magick "$LOGO" -resize 480x -strip "$LOGO_OPT_DIR/himiya-cyrillic-480w.png"

# WebP versions
magick "$LOGO" -resize 900x -quality 80 -strip "$LOGO_WEBP_DIR/himiya-cyrillic.webp"
magick "$LOGO" -resize 480x -quality 80 -strip "$LOGO_WEBP_DIR/himiya-cyrillic-480w.webp"

echo "  Done: logo"

echo ""
echo "=== Results ==="
echo "Coach originals:"
du -sh "$COACHES_DIR"/*.jpg 2>/dev/null || true
echo ""
echo "Optimized JPEG:"
du -sh "$OPTIMIZED_DIR"/*.jpg 2>/dev/null || true
echo ""
echo "WebP:"
du -sh "$WEBP_DIR"/*.webp 2>/dev/null || true
echo ""
echo "Logo optimized:"
du -sh "$LOGO_OPT_DIR"/himiya-cyrillic*.png 2>/dev/null || true
du -sh "$LOGO_WEBP_DIR"/himiya-cyrillic*.webp 2>/dev/null || true

echo ""
echo "Optimization complete!"
