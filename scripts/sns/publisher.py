"""
SNS 발행 어댑터 — 기존 marketing_bot publishers 래핑

biz_launch/marketing_bot/publishers/*.py 패턴을 참조하되,
세션 파일 경로는 marketing_bot/storage/ 를 그대로 사용.
"""
from __future__ import annotations

import sys
import os
from pathlib import Path

from config import MARKETING_BOT_DIR, TISTORY_BLOG_NAME, BLOGGER_BLOG_URL


def _inject_path() -> None:
    """marketing_bot 경로를 sys.path에 추가."""
    bot_str = str(MARKETING_BOT_DIR)
    if bot_str not in sys.path:
        sys.path.insert(0, bot_str)


def publish_naver(title: str, content_html: str) -> dict:
    """네이버 블로그에 글 발행. {'url': ...} 반환."""
    _inject_path()
    from publishers.naver import publish_post  # type: ignore
    return publish_post(title, content_html)


def publish_tistory(
    title: str,
    content_html: str,
    tags: list[str],
    category_id: str = "0",
) -> dict:
    """티스토리에 글 발행."""
    _inject_path()
    os.environ["TISTORY_BLOG_NAME"] = TISTORY_BLOG_NAME
    from publishers.tistory import publish_post  # type: ignore
    return publish_post(title, content_html, tags, category_id)


def publish_blogger(
    title: str,
    content_html: str,
    labels: list[str],
) -> dict:
    """Blogger에 글 발행."""
    _inject_path()
    os.environ["BLOGGER_BLOG_URL"] = BLOGGER_BLOG_URL
    from publishers.blogger import publish_post  # type: ignore
    return publish_post(title, content_html, labels)


def publish_instagram(image_path: str, caption: str) -> dict:
    """인스타그램에 이미지+캡션 발행."""
    _inject_path()
    from publishers.instagram import post_image  # type: ignore
    return post_image(image_path, caption)
