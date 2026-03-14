#!/usr/bin/env python3
"""
인스타그램 최초 1회 로그인 스크립트.
모바일 에뮬레이션(iPhone 12)으로 브라우저 실행 → 직접 로그인 → Enter → 세션 저장.

실행:
  python scripts/login_instagram.py
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from publishers._session import save_context, session_path

PLATFORM = "instagram"
LOGIN_URL = "https://www.instagram.com/accounts/login/"


async def main():
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("playwright 미설치: pip install playwright && playwright install chromium")
        return

    print("\n[인스타그램] 모바일 에뮬레이션 브라우저를 엽니다 (iPhone 12)...")
    print("브라우저에서 직접 로그인한 후 이 터미널로 돌아와 Enter를 누르세요.\n")

    async with async_playwright() as p:
        device = p.devices["iPhone 12"]
        browser = await p.chromium.launch(
            headless=False,
            args=["--start-maximized"],
        )
        ctx = await browser.new_context(
            **device,
            locale="ko-KR",
        )
        page = await ctx.new_page()

        await page.goto(LOGIN_URL)
        print(f"로그인 페이지 열림: {page.url}")

        input("로그인 완료 후 Enter 키를 누르세요...")

        await save_context(ctx, PLATFORM)
        await browser.close()

    print(f"\n세션 저장 완료: {session_path(PLATFORM)}")
    print("이제 post_instagram.py로 자동 발행이 가능합니다.\n")


if __name__ == "__main__":
    asyncio.run(main())
