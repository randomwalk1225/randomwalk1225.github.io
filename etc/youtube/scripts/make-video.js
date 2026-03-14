#!/usr/bin/env node
/**
 * make-video.js
 * Runs the full pipeline for a content script:
 *   1. capture-slides.js  (Playwright → PNG frames)
 *   2. assemble.sh        (ffmpeg → MP4)
 *   3. generate-thumbnail.js (Playwright → thumbnail PNG)
 *
 * Does NOT upload — upload is a separate manual step.
 *
 * Usage:
 *   node scripts/make-video.js content/sat-math-001.json
 *   node scripts/make-video.js content/sat-math-001.json --upload
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function run(cmd) {
  console.log(`\n$ ${cmd}\n`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

async function main() {
  const contentArg = process.argv[2];
  const shouldUpload = process.argv.includes('--upload');

  if (!contentArg) {
    console.error('Usage: node scripts/make-video.js content/<id>.json [--upload]');
    process.exit(1);
  }

  const contentPath = path.resolve(ROOT, contentArg);
  if (!fs.existsSync(contentPath)) {
    console.error(`Content file not found: ${contentPath}`);
    process.exit(1);
  }

  const { id } = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

  const start = Date.now();
  console.log(`\n🚀 Making video: ${id}\n${'─'.repeat(50)}`);

  // 1. Capture slides
  run(`node scripts/capture-slides.js ${contentArg}`);

  // 2. Assemble video
  run(`bash scripts/assemble.sh ${id}`);

  // 3. Generate thumbnail
  run(`node scripts/generate-thumbnail.js ${contentArg}`);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`✅ Video ready in ${elapsed}s`);
  console.log(`   Video:     output/videos/${id}.mp4`);
  console.log(`   Thumbnail: thumbnails/${id}.png`);

  if (shouldUpload) {
    console.log('\n📤 Starting upload...');
    run(`node scripts/upload-youtube.js ${contentArg}`);
  } else {
    console.log(`\n   To upload:`);
    console.log(`   node scripts/upload-youtube.js ${contentArg}`);
    console.log(`   (run node scripts/save-youtube-session.js first if not done)\n`);
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
