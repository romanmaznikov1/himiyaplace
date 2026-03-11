#!/bin/bash
# Batch optimize trainer videos using ffmpeg
# Requires: ffmpeg

set -e

VIDEOS_DIR="videos"
ORIGINALS_DIR="$VIDEOS_DIR/originals"

mkdir -p "$ORIGINALS_DIR"

echo "=== Optimizing trainer videos ==="

for video in "$VIDEOS_DIR"/*.mp4; do
  [ -f "$video" ] || continue
  basename=$(basename "$video")
  echo "Processing: $basename"

  # Backup original
  if [ ! -f "$ORIGINALS_DIR/$basename" ]; then
    cp "$video" "$ORIGINALS_DIR/$basename"
  fi

  # Optimize: 720px max width, H.264 CRF 28, AAC 128k, faststart
  ffmpeg -i "$ORIGINALS_DIR/$basename" \
    -vf "scale='min(720,iw)':-2" \
    -c:v libx264 -crf 28 -preset medium \
    -c:a aac -b:a 128k \
    -movflags +faststart \
    -y "$video"

  echo "  Done: $basename"
done

echo ""
echo "=== Results ==="
echo "Original sizes:"
du -sh "$ORIGINALS_DIR"/*.mp4 2>/dev/null || true
echo ""
echo "Optimized sizes:"
du -sh "$VIDEOS_DIR"/*.mp4 2>/dev/null || true

echo ""
echo "Video optimization complete!"
