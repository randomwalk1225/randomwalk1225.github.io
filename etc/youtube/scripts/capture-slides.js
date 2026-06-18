#!/usr/bin/env node
/**
 * capture-slides.js
 * Renders each slide from a content JSON script using Playwright,
 * captures PNG frames (one per "tick" at ~24fps), writes them to output/frames/{id}/
 *
 * Usage:
 *   node scripts/capture-slides.js content/sat-math-001.json
 *
 * Output:
 *   output/frames/sat-math-001/frame-0001.png  ...  frame-NNNN.png
 *   output/frames/sat-math-001/manifest.json   (timing info for ffmpeg)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const FPS = 24;
const VIEWPORT_W = 1920;
const VIEWPORT_H = 1080;
const MATHJAX_TIMEOUT_MS = 8000; // wait for MathJax to render

async function main() {
  const scriptArg = process.argv[2];
  if (!scriptArg) {
    console.error('Usage: node scripts/capture-slides.js content/<id>.json');
    process.exit(1);
  }

  const scriptPath = path.resolve(__dirname, '..', scriptArg);
  if (!fs.existsSync(scriptPath)) {
    console.error(`Content script not found: ${scriptPath}`);
    process.exit(1);
  }

  const content = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
  const { id, slides } = content;

  const templatePath = path.resolve(__dirname, '..', 'templates', 'slide.html');
  const templateHtml = fs.readFileSync(templatePath, 'utf8');

  const outDir = path.resolve(__dirname, '..', 'output', 'frames', id);
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`\n📹 Capturing ${slides.length} slides for: ${id}`);
  console.log(`   Output: ${outDir}\n`);

  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] });
  const page = await browser.newPage();
  await page.setViewportSize({ width: VIEWPORT_W, height: VIEWPORT_H });

  let frameIndex = 1;
  const manifest = { id, fps: FPS, slides: [] };

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const duration = slide.duration || 8; // seconds
    const frameCount = Math.round(duration * FPS);

    console.log(`  Slide ${i + 1}/${slides.length}: type="${slide.type}" duration=${duration}s → ${frameCount} frames`);

    // Inject slide data into the template
    const injected = templateHtml.replace(
      'DATA_PLACEHOLDER',
      JSON.stringify(slides) // pass all slides; renderSlide(slide, i, total) called below
    );

    // Write injected HTML to a temp file so Playwright can navigate to it
    const tempHtml = path.resolve(outDir, `__slide_${i}.html`);
    fs.writeFileSync(tempHtml, injected, 'utf8');

    await page.goto(`file://${tempHtml}`, { waitUntil: 'domcontentloaded' });

    // Call renderSlide from the injected JS
    await page.evaluate(
      ({ slide, index, total }) => window.renderSlide(slide, index, total),
      { slide, index: i, total: slides.length }
    );

    // Wait for MathJax to finish rendering
    await waitForMathJax(page, MATHJAX_TIMEOUT_MS);

    // Give an extra moment for CSS transitions to settle
    await page.waitForTimeout(300);

    // Capture `frameCount` identical frames (still image held for duration)
    for (let f = 0; f < frameCount; f++) {
      const frameName = `frame-${String(frameIndex).padStart(5, '0')}.png`;
      await page.screenshot({ path: path.join(outDir, frameName), type: 'png' });
      frameIndex++;
    }

    // Clean up temp HTML
    fs.unlinkSync(tempHtml);

    manifest.slides.push({
      index: i,
      type: slide.type,
      duration,
      frameCount,
      startFrame: frameIndex - frameCount,
      endFrame: frameIndex - 1
    });
  }

  await browser.close();

  // Write manifest
  manifest.totalFrames = frameIndex - 1;
  manifest.totalDuration = slides.reduce((s, sl) => s + (sl.duration || 8), 0);
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`\n✅ Done! ${frameIndex - 1} frames captured in ${outDir}`);
  console.log(`   Total duration: ${manifest.totalDuration}s`);
  console.log(`\n   Next step: bash scripts/assemble.sh ${id}\n`);
}

async function waitForMathJax(page, timeoutMs) {
  try {
    await page.waitForFunction(
      () => {
        if (!window.MathJax || !window.MathJax.startup) return true; // no MathJax on page
        return window.MathJax.startup.promise !== undefined &&
               typeof window.MathJax.typesetPromise === 'function';
      },
      { timeout: 2000 }
    );
    await page.evaluate(() => {
      if (window.MathJax && window.MathJax.typesetPromise) {
        return window.MathJax.typesetPromise();
      }
    });
    await page.waitForTimeout(500); // allow SVG to paint
  } catch (_) {
    // MathJax timeout is non-fatal; continue
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
