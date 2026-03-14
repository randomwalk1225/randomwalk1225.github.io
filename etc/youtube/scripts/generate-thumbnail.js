#!/usr/bin/env node
/**
 * generate-thumbnail.js
 * Renders the thumbnail HTML template with content-script data using Playwright,
 * captures a 1280×720 PNG — ready for YouTube upload.
 *
 * Usage:
 *   node scripts/generate-thumbnail.js content/sat-math-001.json
 *
 * Output:
 *   thumbnails/sat-math-001.png
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const THUMB_W = 1280;
const THUMB_H = 720;
const MATHJAX_TIMEOUT_MS = 8000;

async function main() {
  const scriptArg = process.argv[2];
  if (!scriptArg) {
    console.error('Usage: node scripts/generate-thumbnail.js content/<id>.json');
    process.exit(1);
  }

  const scriptPath = path.resolve(__dirname, '..', scriptArg);
  if (!fs.existsSync(scriptPath)) {
    console.error(`Content script not found: ${scriptPath}`);
    process.exit(1);
  }

  const content = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
  const { id, thumbnail } = content;

  if (!thumbnail) {
    console.error('No thumbnail data in content script. Add a "thumbnail" key.');
    process.exit(1);
  }

  const templatePath = path.resolve(__dirname, '..', 'templates', 'thumbnail.html');
  const templateHtml = fs.readFileSync(templatePath, 'utf8');

  // Inject thumbnail data into the template
  const injected = templateHtml.replace(
    'THUMBNAIL_PLACEHOLDER',
    JSON.stringify(thumbnail)
  );

  const thumbDir = path.resolve(__dirname, '..', 'thumbnails');
  fs.mkdirSync(thumbDir, { recursive: true });

  const outPath = path.join(thumbDir, `${id}.png`);
  const tempHtml = path.join(thumbDir, `__thumb_${id}.html`);
  fs.writeFileSync(tempHtml, injected, 'utf8');

  console.log(`\n🖼  Generating thumbnail for: ${id}`);

  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] });
  const page = await browser.newPage();
  await page.setViewportSize({ width: THUMB_W, height: THUMB_H });

  await page.goto(`file://${tempHtml}`, { waitUntil: 'domcontentloaded' });

  // Wait for MathJax
  try {
    await page.waitForFunction(
      () => window.MathJax && window.MathJax.typesetPromise,
      { timeout: 3000 }
    );
    await page.evaluate(() => window.MathJax.typesetPromise());
    await page.waitForTimeout(600);
  } catch (_) { /* MathJax optional */ }

  await page.screenshot({ path: outPath, type: 'png' });

  await browser.close();
  fs.unlinkSync(tempHtml);

  const size = (fs.statSync(outPath).size / 1024).toFixed(0);
  console.log(`✅ Thumbnail saved: ${outPath} (${size} KB)`);
  console.log(`   Dimensions: ${THUMB_W}×${THUMB_H}\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
