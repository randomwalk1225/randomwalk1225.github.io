#!/usr/bin/env bash
# assemble.sh — stitches Playwright-captured PNG frames into an MP4 video
#
# Usage:
#   bash scripts/assemble.sh <video-id>
#
# Example:
#   bash scripts/assemble.sh sat-math-001
#
# Requires: ffmpeg
# Input:  output/frames/<id>/frame-NNNNN.png  (from capture-slides.js)
# Output: output/videos/<id>.mp4

set -euo pipefail

VIDEO_ID="${1:-}"
if [ -z "$VIDEO_ID" ]; then
  echo "Usage: bash scripts/assemble.sh <video-id>"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

FRAMES_DIR="$ROOT_DIR/output/frames/$VIDEO_ID"
VIDEOS_DIR="$ROOT_DIR/output/videos"
OUTPUT_FILE="$VIDEOS_DIR/$VIDEO_ID.mp4"

if [ ! -d "$FRAMES_DIR" ]; then
  echo "❌ Frames directory not found: $FRAMES_DIR"
  echo "   Run: node scripts/capture-slides.js content/$VIDEO_ID.json first"
  exit 1
fi

mkdir -p "$VIDEOS_DIR"

FRAME_COUNT=$(ls "$FRAMES_DIR"/frame-*.png 2>/dev/null | wc -l | tr -d ' ')
if [ "$FRAME_COUNT" -eq 0 ]; then
  echo "❌ No frames found in $FRAMES_DIR"
  exit 1
fi

echo ""
echo "🎬 Assembling video: $VIDEO_ID"
echo "   Frames: $FRAME_COUNT"
echo "   Input:  $FRAMES_DIR"
echo "   Output: $OUTPUT_FILE"
echo ""

# ─── Step 1: Stitch frames into video ───────────────────────────────────────
#
# -framerate 24        → input frame rate (matches capture-slides.js FPS=24)
# -i frame-%05d.png    → sequential PNG frames
# -c:v libx264         → H.264 codec (YouTube preferred)
# -pix_fmt yuv420p     → compatibility with all players/YouTube
# -crf 18              → visually lossless quality (18=high, 28=low)
# -preset slow         → better compression at the cost of encode time
# -vf scale=1920:1080  → ensure exact 1080p
# -movflags +faststart → metadata at start of file (better streaming)

ffmpeg -y \
  -framerate 24 \
  -i "$FRAMES_DIR/frame-%05d.png" \
  -c:v libx264 \
  -pix_fmt yuv420p \
  -crf 18 \
  -preset slow \
  -vf "scale=1920:1080:flags=lanczos" \
  -movflags +faststart \
  "$OUTPUT_FILE"

# ─── Step 2: Show result ─────────────────────────────────────────────────────
SIZE=$(du -sh "$OUTPUT_FILE" | cut -f1)
DURATION_SEC=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$OUTPUT_FILE" 2>/dev/null | xargs printf "%.1f")

echo ""
echo "✅ Video assembled!"
echo "   File:     $OUTPUT_FILE"
echo "   Size:     $SIZE"
echo "   Duration: ${DURATION_SEC}s"
echo ""
echo "   Next steps:"
echo "   1. node scripts/generate-thumbnail.js content/$VIDEO_ID.json"
echo "   2. node scripts/upload-youtube.js content/$VIDEO_ID.json \\"
echo "         output/videos/$VIDEO_ID.mp4 thumbnails/$VIDEO_ID.png"
echo ""
