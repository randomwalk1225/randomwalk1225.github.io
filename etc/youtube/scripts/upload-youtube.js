#!/usr/bin/env node
/**
 * upload-youtube.js
 * Automates YouTube Studio video upload using Playwright with a saved session.
 *
 * Prerequisites:
 *   1. node scripts/save-youtube-session.js   (one-time login)
 *   2. node scripts/capture-slides.js content/<id>.json
 *   3. bash scripts/assemble.sh <id>
 *   4. node scripts/generate-thumbnail.js content/<id>.json
 *
 * Usage:
 *   node scripts/upload-youtube.js content/<id>.json
 *
 * The script reads title, description, tags, category from the content JSON.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SESSION_DIR = path.resolve(__dirname, '..', '.youtube-session');
const STUDIO_URL = 'https://studio.youtube.com';

async function main() {
  const contentArg = process.argv[2];
  if (!contentArg) {
    console.error('Usage: node scripts/upload-youtube.js content/<id>.json');
    process.exit(1);
  }

  if (!fs.existsSync(SESSION_DIR)) {
    console.error('❌ No saved session found. Run first:');
    console.error('   node scripts/save-youtube-session.js');
    process.exit(1);
  }

  const contentPath = path.resolve(__dirname, '..', contentArg);
  const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
  const { id, title, description, tags, category } = content;

  const videoPath = path.resolve(__dirname, '..', 'output', 'videos', `${id}.mp4`);
  const thumbPath = path.resolve(__dirname, '..', 'thumbnails', `${id}.png`);

  if (!fs.existsSync(videoPath)) {
    console.error(`❌ Video file not found: ${videoPath}`);
    console.error(`   Run: bash scripts/assemble.sh ${id}`);
    process.exit(1);
  }

  console.log(`\n📤 Uploading to YouTube Studio`);
  console.log(`   Video: ${videoPath}`);
  console.log(`   Title: ${title}`);
  console.log(`   Tags:  ${(tags || []).slice(0, 4).join(', ')}...\n`);

  const browser = await chromium.launchPersistentContext(SESSION_DIR, {
    headless: false, // set true for production automation after validation
    viewport: { width: 1280, height: 900 },
    args: ['--disable-blink-features=AutomationControlled'],
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });

  const page = await browser.newPage();

  try {
    // ── Step 1: Navigate to YouTube Studio ─────────────────────────────────
    await page.goto(STUDIO_URL, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('  ✓ Opened YouTube Studio');

    // ── Step 2: Click Create / Upload ──────────────────────────────────────
    const createBtn = page.locator('#create-icon, button[aria-label*="Create"], ytcp-button[id="create-icon"]').first();
    await createBtn.click({ timeout: 15000 });
    await page.waitForTimeout(800);

    const uploadOption = page.locator('tp-yt-paper-item:has-text("Upload videos"), ytcp-ve:has-text("Upload")').first();
    await uploadOption.click({ timeout: 10000 });
    console.log('  ✓ Clicked Upload videos');

    // ── Step 3: Select video file ───────────────────────────────────────────
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(videoPath);
    console.log('  ✓ File selected, uploading...');

    // Wait for upload dialog to appear with title field
    await page.waitForSelector('ytcp-video-metadata-editor, #basics', { timeout: 20000 });
    await page.waitForTimeout(2000);

    // ── Step 4: Fill in title ───────────────────────────────────────────────
    const titleField = page.locator('#basics #title-textarea #input, ytcp-social-suggestions-textbox[label="Title"] #input').first();
    await titleField.click({ timeout: 10000 });
    await page.keyboard.selectAll();
    await page.keyboard.type(title);
    console.log('  ✓ Title filled');

    // ── Step 5: Fill in description ─────────────────────────────────────────
    const descField = page.locator('#basics #description-textarea #input, ytcp-social-suggestions-textbox[label="Description"] #input').first();
    await descField.click({ timeout: 10000 });
    await page.keyboard.selectAll();
    await page.keyboard.type(description);
    console.log('  ✓ Description filled');

    // ── Step 6: Upload thumbnail ────────────────────────────────────────────
    if (fs.existsSync(thumbPath)) {
      const thumbInput = page.locator('input[accept*="image"]').first();
      if (await thumbInput.isVisible({ timeout: 5000 })) {
        await thumbInput.setInputFiles(thumbPath);
        console.log('  ✓ Thumbnail uploaded');
      } else {
        // Sometimes the thumbnail upload button needs a click first
        const thumbBtn = page.locator('button:has-text("Upload thumbnail"), ytcp-button:has-text("Upload thumbnail")').first();
        if (await thumbBtn.isVisible({ timeout: 3000 })) {
          await thumbBtn.click();
          const thumbInput2 = page.locator('input[accept*="image"]').first();
          await thumbInput2.setInputFiles(thumbPath);
          console.log('  ✓ Thumbnail uploaded');
        } else {
          console.log('  ⚠ Thumbnail upload field not found — skipping');
        }
      }
    } else {
      console.log(`  ⚠ Thumbnail not found at ${thumbPath} — skipping`);
    }

    // ── Step 7: Set "Not for kids" ──────────────────────────────────────────
    const notForKids = page.locator('tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]').first();
    if (await notForKids.isVisible({ timeout: 5000 })) {
      await notForKids.click();
      console.log('  ✓ "Not for kids" selected');
    }

    // ── Step 8: Click Next through visibility screens ─────────────────────
    for (let i = 0; i < 3; i++) {
      const nextBtn = page.locator('ytcp-button#next-button, button#next-button').first();
      if (await nextBtn.isVisible({ timeout: 8000 })) {
        await nextBtn.click();
        await page.waitForTimeout(1500);
        console.log(`  ✓ Next (${i + 1}/3)`);
      }
    }

    // ── Step 9: Set visibility to Public ───────────────────────────────────
    const publicRadio = page.locator('tp-yt-paper-radio-button[name="PUBLIC"]').first();
    if (await publicRadio.isVisible({ timeout: 8000 })) {
      await publicRadio.click();
      console.log('  ✓ Visibility set to Public');
    }

    // ── Step 10: Publish ────────────────────────────────────────────────────
    const publishBtn = page.locator('ytcp-button#done-button, button#done-button, ytcp-button:has-text("Publish")').first();
    await publishBtn.waitFor({ timeout: 15000 });

    // Wait for upload to complete first (progress bar should be gone)
    await page.waitForFunction(
      () => {
        const progress = document.querySelector('ytcp-video-upload-progress');
        return !progress || progress.getAttribute('upload-state') !== 'uploading';
      },
      { timeout: 600000, polling: 3000 } // up to 10 min for upload
    );

    await publishBtn.click();
    console.log('  ✓ Published!');

    await page.waitForTimeout(3000);

    // Try to capture the video URL from the success dialog
    const videoLink = page.locator('a[href*="youtube.com/watch"], a[href*="youtu.be"]').first();
    if (await videoLink.isVisible({ timeout: 8000 })) {
      const href = await videoLink.getAttribute('href');
      console.log(`\n🎉 Upload complete!`);
      console.log(`   YouTube URL: ${href}`);
    } else {
      console.log(`\n🎉 Upload complete! Check YouTube Studio for the link.`);
    }

  } catch (err) {
    console.error('\n❌ Upload failed:', err.message);
    // Take a debug screenshot
    const debugPath = path.resolve(__dirname, '..', 'output', `upload-error-${Date.now()}.png`);
    await page.screenshot({ path: debugPath });
    console.error(`   Debug screenshot: ${debugPath}`);
    await browser.close();
    process.exit(1);
  }

  await browser.close();
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
