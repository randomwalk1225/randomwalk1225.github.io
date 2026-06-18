# Videos Ready for Upload

**Last updated:** 2026-03-15
**Batch:** #1 — SAT Math Daily + AP Calculus Concepts

All videos below are fully produced (1920×1080 MP4 + 1280×720 thumbnail).
Upload manually to [YouTube Studio](https://studio.youtube.com).

---

## Upload Checklist

### ✅ Batch 1 — Ready Now

| # | File | Title | Duration | Playlist | Status |
|---|------|-------|----------|----------|--------|
| 1 | `output/videos/sat-math-001.mp4` | SAT Math: Linear Equations — Solve for x | 0:58 | SAT Math Daily | ⬜ Not uploaded |
| 2 | `output/videos/sat-math-002.mp4` | SAT Math: Systems of Equations — Elimination Method | 1:14 | SAT Math Daily | ⬜ Not uploaded |
| 3 | `output/videos/ap-calc-001.mp4` | AP Calculus: Power Rule — Differentiate in Seconds | 1:05 | AP Calculus Concepts | ⬜ Not uploaded |

### Thumbnails
- `thumbnails/sat-math-001.png`
- `thumbnails/sat-math-002.png`
- `thumbnails/ap-calc-001.png`

---

## Upload Steps (per video)

1. Go to [studio.youtube.com](https://studio.youtube.com) → **Create → Upload videos**
2. Select the `.mp4` file from `etc/youtube/output/videos/`
3. **Title** — copy from content JSON (`"title"` field), or see table above
4. **Description** — copy from `content/<id>.json` → `"description"` field (includes hashtags + timestamps)
5. **Thumbnail** — upload the matching `.png` from `etc/youtube/thumbnails/`
6. **Not for kids** → check this
7. **Playlist** → create or select the playlist (e.g. "SAT Math Daily")
8. **Tags** — copy from content JSON `"tags"` array
9. **Visibility** → Public (or Schedule for best time: weekdays 7–9am, or 4–6pm ET)
10. Publish ✓

---

## SEO Notes

- **Best upload times:** Tue–Thu, 7am–9am ET or 4–6pm ET
- **Titles are optimized** for SAT/AP search intent — don't shorten them
- **Descriptions** include timestamps, hashtags, and links to mathhub.io — keep as-is
- **Playlists** — create "SAT Math Daily" and "AP Calculus Concepts" playlists on first upload

---

## To Produce More Videos

```bash
cd etc/youtube

# Add a new content script to content/
# Then run:
node scripts/make-video.js content/<new-id>.json

# Output:
#   output/videos/<new-id>.mp4
#   thumbnails/<new-id>.png
```

Content script format: see `content/sat-math-001.json` as template.

---

## Future Content Queue (next batch)

| ID | Topic | Series |
|----|-------|--------|
| sat-math-003 | Percent word problems | SAT Math Daily |
| sat-math-004 | Quadratic equations | SAT Math Daily |
| sat-math-005 | Data & statistics (scatter plot) | SAT Math Daily |
| ap-calc-002 | Chain Rule | AP Calculus Concepts |
| ap-calc-003 | Related Rates intro | AP Calculus Concepts |
| ap-stat-001 | Normal distribution & z-scores | AP Statistics Concepts |
