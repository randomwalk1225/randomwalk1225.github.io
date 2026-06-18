"""
세션 관리 헬퍼 — 모든 퍼블리셔가 공유하는 Playwright 세션 유틸리티

사용법:
  from publishers._session import load_context, save_context

세션 파일 위치: storage/{platform}_session.json
최초 로그인: python scripts/login_{platform}.py
"""
from __future__ import annotations

from pathlib import Path

STORAGE_DIR = Path(__file__).parent.parent / "storage"
STORAGE_DIR.mkdir(exist_ok=True)


def session_path(platform: str) -> Path:
    return STORAGE_DIR / f"{platform}_session.json"


def session_exists(platform: str) -> bool:
    return session_path(platform).exists()


async def new_context(playwright, platform: str, headless: bool = True, mobile: bool = False):
    """세션 파일이 있으면 로드, 없으면 새 컨텍스트 반환.

    Args:
        playwright: Playwright 인스턴스
        platform: 플랫폼 이름 (instagram, naver 등)
        headless: 헤드리스 모드 여부
        mobile: 모바일 에뮬레이션 여부 (Instagram 업로드에 필요)
    """
    browser = await playwright.chromium.launch(
        headless=headless,
        args=["--no-sandbox", "--disable-dev-shm-usage"],
    )

    if mobile:
        # Instagram 이미지 업로드는 모바일 에뮬레이션 필요
        device = playwright.devices["iPhone 12"]
        ctx_kwargs = {
            **device,
            "locale": "ko-KR",
        }
    else:
        ctx_kwargs = {
            "viewport": {"width": 1280, "height": 900},
            "locale": "ko-KR",
        }

    if session_exists(platform):
        ctx = await browser.new_context(
            **ctx_kwargs,
            storage_state=str(session_path(platform)),
        )
    else:
        ctx = await browser.new_context(**ctx_kwargs)

    return browser, ctx


async def save_context(ctx, platform: str) -> None:
    """현재 세션 저장."""
    await ctx.storage_state(path=str(session_path(platform)))
