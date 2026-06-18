# YouTube Content Pipeline

Automated math video creation for MathHub.io YouTube channel.

## Overview

Creates short-form (2–5 min) math problem walkthrough videos for SAT, AP Calculus, AP Statistics, and TMUA content.

## Pipeline Steps

```
content/*.json  →  [capture.js]  →  output/frames/  →  [assemble.sh]  →  output/videos/  →  [upload.js]  →  YouTube
                                                                       ↓
                                                              thumbnails/*.png
```

1. **Content scripts** (`content/`) — JSON problem scripts with slides and narration text
2. **Capture** (`scripts/capture-slides.js`) — Playwright renders HTML slides → PNG frames
3. **Assemble** (`scripts/assemble.sh`) — FFmpeg stitches frames → MP4 with captions
4. **Thumbnail** (`scripts/generate-thumbnail.js`) — Playwright renders thumbnail HTML → 1280×720 PNG
5. **Upload** (`scripts/upload-youtube.js`) — Playwright automates YouTube Studio upload

## Quick Start

```bash
# Install deps
cd etc/youtube
npm install

# Generate a video from a content script
node scripts/capture-slides.js content/sat-math-001.json
bash scripts/assemble.sh sat-math-001

# Generate thumbnail
node scripts/generate-thumbnail.js content/sat-math-001.json

# Upload (requires YouTube login session - see CREDENTIALS.md)
node scripts/upload-youtube.js content/sat-math-001.json output/videos/sat-math-001.mp4 thumbnails/sat-math-001.png
```

## Content Script Format

See `content/sat-math-001.json` for a complete example.

```json
{
  "id": "sat-math-001",
  "series": "SAT Math Daily",
  "title": "SAT Math: Solving Linear Equations (Official Practice)",
  "description": "Step-by-step walkthrough of a real SAT linear equation problem...",
  "tags": ["SAT math", "linear equations", "SAT prep", "College Board"],
  "category": "Education",
  "slides": [
    {
      "type": "intro",
      "duration": 4,
      "title": "SAT Math Daily",
      "subtitle": "Problem #1: Linear Equations"
    },
    {
      "type": "problem",
      "duration": 12,
      "text": "If 3x + 7 = 22, what is the value of x?",
      "note": "Take a moment to try this yourself!"
    },
    ...
  ]
}
```

## Slide Types

- `intro` — Branded opener with series name and problem title
- `problem` — Problem statement with optional figure
- `step` — Solution step with equation/working shown
- `answer` — Final answer reveal with highlight
- `outro` — Subscribe/like call to action

## Video Specs

- Resolution: 1920×1080 (Full HD)
- Frame rate: 24fps
- Duration: 2–5 minutes
- Thumbnail: 1280×720

## YouTube SEO Template

See `content/sat-math-001.json` for title/description/tag patterns optimized for SAT search traffic.

## Credentials

YouTube upload requires a saved Playwright browser session. Run:

```bash
node scripts/save-youtube-session.js
```

This opens a browser for manual login, then saves the session to `.youtube-session/` (gitignored).
