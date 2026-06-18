"""
인스타그램 Playwright 자동 발행 모듈 (이미지 포스트)
모바일 에뮬레이션 사용 — Instagram 웹은 모바일에서만 이미지 업로드 가능

최초 1회 로그인:
  python scripts/login_instagram.py

이미지 파일 경로 → 인스타그램 업로드 → 캡션 + 해시태그 자동 입력 → 게시

수학 콘텐츠 기본 해시태그:
  #수능 #내신 #수학 #수학공부 #고등수학 #수능수학 #math #mathhub
"""
from __future__ import annotations

import asyncio
import logging
from pathlib import Path
from publishers._session import new_context, save_context, session_exists

log = logging.getLogger(__name__)

# 수능/내신 수학 기본 해시태그 세트
DEFAULT_HASHTAGS = [
    "#수능", "#내신", "#수학", "#수학공부", "#고등수학",
    "#수능수학", "#수학문제", "#수능준비", "#공부스타그램",
    "#math", "#mathhub", "#수학교재",
]


def build_caption(text: str, hashtags: list[str] | None = None) -> str:
    """캡션 + 해시태그 조합."""
    tags = hashtags if hashtags is not None else DEFAULT_HASHTAGS
    tag_line = " ".join(tags)
    return f"{text}\n\n{tag_line}"


def post_image(
    image_path: str,
    caption: str,
    hashtags: list[str] | None = None,
    headless: bool = False,
) -> dict:
    """인스타그램에 이미지 포스트.

    Args:
        image_path: 업로드할 이미지 파일 경로
        caption: 게시물 본문 (해시태그 제외)
        hashtags: 해시태그 리스트 (None이면 기본값 사용)
        headless: 헤드리스 모드 (파일 업로드 시 False 권장)

    Returns:
        {"status": "ok"} 또는 {"status": "error", "message": "..."}
    """
    return asyncio.run(_post_async(image_path, caption, hashtags, headless))


async def _post_async(
    image_path: str,
    caption: str,
    hashtags: list[str] | None,
    headless: bool,
) -> dict:
    if not session_exists("instagram"):
        raise RuntimeError(
            "인스타그램 세션 없음. python scripts/login_instagram.py 실행."
        )

    full_caption = build_caption(caption, hashtags)
    img = Path(image_path).resolve()
    if not img.exists():
        raise FileNotFoundError(f"이미지 파일 없음: {img}")

    from playwright.async_api import async_playwright

    async with async_playwright() as p:
        # Instagram 이미지 업로드는 모바일 에뮬레이션 필요
        browser, ctx = await new_context(p, "instagram", headless=headless, mobile=True)
        page = await ctx.new_page()

        try:
            log.info("Instagram 홈 로딩...")
            await page.goto("https://www.instagram.com/", wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(2000)

            # 로그인 확인 — 로그인 페이지로 리다이렉트됐으면 에러
            if "accounts/login" in page.url:
                raise RuntimeError("세션 만료. python scripts/login_instagram.py 재실행 필요.")

            # 모바일: 하단 + 버튼 (새 게시물)
            log.info("새 게시물 버튼 클릭...")
            create_selectors = [
                "svg[aria-label='새 게시물']",
                "svg[aria-label='New post']",
                "[aria-label='새 게시물']",
                "[aria-label='New post']",
                "a[href='/create/style/']",
            ]
            clicked = False
            for sel in create_selectors:
                btn = page.locator(sel).first
                if await btn.count() > 0 and await btn.is_visible():
                    await btn.click()
                    clicked = True
                    break

            if not clicked:
                # 모바일 하단 바의 + 아이콘 (XPath 폴백)
                plus_btn = page.locator("xpath=//span[@class and contains(@class,'coreSpriteNewPost')]").first
                if await plus_btn.count() > 0:
                    await plus_btn.click()
                    clicked = True

            if not clicked:
                await page.screenshot(path="storage/instagram_debug.png")
                raise RuntimeError("새 게시물 버튼을 찾지 못했습니다. storage/instagram_debug.png 확인.")

            await page.wait_for_timeout(1500)

            # 파일 선택 — input[type=file] 또는 "갤러리에서 선택" 버튼
            log.info("이미지 파일 선택...")
            file_input = page.locator("input[type='file']").first
            if await file_input.count() > 0:
                await file_input.set_input_files(str(img))
            else:
                # 파일 선택 대화상자를 통한 업로드
                async with page.expect_file_chooser(timeout=5000) as fc_info:
                    select_btn = page.locator(
                        "button:has-text('컴퓨터에서 선택'), button:has-text('Select from computer')"
                    ).first
                    await select_btn.click()
                file_chooser = await fc_info.value
                await file_chooser.set_files(str(img))

            await page.wait_for_timeout(2500)

            # 자르기 → 다음 (최대 3단계)
            log.info("단계 진행 (자르기/필터/캡션)...")
            for step in range(3):
                next_btn = page.locator(
                    "button:has-text('다음'), button:has-text('Next')"
                ).last
                if await next_btn.count() > 0 and await next_btn.is_visible():
                    await next_btn.click()
                    await page.wait_for_timeout(1500)
                else:
                    break

            # 캡션 입력
            log.info("캡션 입력...")
            caption_area = page.locator(
                "div[role='textbox'][aria-label*='캡션'], "
                "div[role='textbox'][aria-label*='caption'], "
                "div[role='textbox'][aria-label*='Caption'], "
                "textarea[aria-label*='캡션']"
            ).first
            await caption_area.wait_for(timeout=5000)
            await caption_area.click()
            await caption_area.fill(full_caption)
            await page.wait_for_timeout(800)

            # 공유 버튼
            log.info("공유 버튼 클릭...")
            share_btn = page.locator(
                "button:has-text('공유'), button:has-text('Share')"
            ).last
            await share_btn.wait_for(timeout=5000)
            await share_btn.click()

            # 게시 완료 대기
            await page.wait_for_timeout(4000)
            log.info("게시 완료.")

            await save_context(ctx, "instagram")

        except Exception as e:
            # 디버그 스크린샷
            try:
                await page.screenshot(path="storage/instagram_error.png")
                log.error("오류 스크린샷 저장: storage/instagram_error.png")
            except Exception:
                pass
            raise e
        finally:
            await browser.close()

    return {"status": "ok", "caption_length": len(full_caption)}
