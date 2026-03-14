#!/usr/bin/env node
/**
 * save-youtube-session.js
 * Opens a Chromium browser for manual YouTube login, then saves the
 * authenticated session to .youtube-session/ for use by upload-youtube.js.
 *
 * Run ONCE (or whenever your session expires):
 *   node scripts/save-youtube-session.js
 *
 * The session directory is gitignored — never commit it.
 */

const { chromium } = require('playwright');
const path = require('path');

const SESSION_DIR = path.resolve(__dirname, '..', '.youtube-session');

async function main() {
  console.log('\n🔐 YouTube Session Login\n');
  console.log('A browser window will open. Please:');
  console.log('  1. Sign in to your YouTube/Google account');
  console.log('  2. Navigate to https://studio.youtube.com to confirm login');
  console.log('  3. Press ENTER in this terminal when done\n');

  const browser = await chromium.launchPersistentContext(SESSION_DIR, {
    headless: false,
    viewport: { width: 1280, height: 800 },
    args: ['--disable-blink-features=AutomationControlled'],
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });

  const page = await browser.newPage();
  await page.goto('https://accounts.google.com/signin');

  // Wait for user to complete login manually
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
    process.stdout.write('Press ENTER after signing in to YouTube Studio... ');
  });

  // Verify we're logged in by checking YouTube Studio
  try {
    await page.goto('https://studio.youtube.com', { timeout: 15000 });
    const url = page.url();
    if (url.includes('studio.youtube.com')) {
      console.log('\n✅ Session saved! Logged in to YouTube Studio.');
    } else {
      console.log('\n⚠️  Warning: Could not verify YouTube Studio login. Session saved anyway.');
    }
  } catch (e) {
    console.log('\n⚠️  Could not verify Studio login, but session state is saved.');
  }

  await browser.close();
  console.log(`   Session: ${SESSION_DIR}`);
  console.log('\n   You can now run: node scripts/upload-youtube.js ...\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
