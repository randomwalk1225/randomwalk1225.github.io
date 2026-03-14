"""
SNS 자동 발행 파이프라인 — 메인 오케스트레이터

흐름:
  1. scan() — 새 mathhub.io HTML 파일 스캔 → 큐 추가
  2. run()  — 큐에서 pending 포스트 → 플랫폼별 발행
  3. 안티스팸 딜레이 적용

사용:
  python pipeline.py scan           # 새 콘텐츠 큐에 추가
  python pipeline.py run            # 큐에서 발행 실행
  python pipeline.py status         # 큐 현황 출력
  python pipeline.py run --dry-run  # 실제 발행 없이 시뮬레이션
"""
from __future__ import annotations

import glob
import logging
import sys
import time
from pathlib import Path

from config import (
    REPO_DIR,
    CONTENT_PATHS,
    EXCLUDE_FILES,
    PLATFORMS,
    INTER_PLATFORM_DELAY,
    MAX_POSTS_PER_DAY,
)
import queue as q
from extractor import extract
from formatter import for_naver, for_tistory, for_blogger, for_instagram

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(REPO_DIR / "scripts" / "sns" / "logs" / "pipeline.log"),
    ],
)
log = logging.getLogger("sns-pipeline")


# ── Scan ──────────────────────────────────────────────────────────

def scan() -> int:
    """새 HTML 파일 스캔 → 큐 추가. 추가된 파일 수 반환."""
    q.init_db()
    added = 0

    for pattern in CONTENT_PATHS:
        files = glob.glob(str(REPO_DIR / pattern))
        for fpath in sorted(files):
            p = Path(fpath)
            if p.name in EXCLUDE_FILES:
                continue

            rel = str(p.relative_to(REPO_DIR))
            data = extract(p)
            if not data:
                continue

            post_id = q.add_post(
                file_path=rel,
                title=data["title"],
                content_html=data["content_html"],
                content_text=data["content_text"],
                tags=data["tags"],
                lang=data["lang"],
            )
            if post_id:
                log.info(f"큐 추가: [{post_id}] {rel} — {data['title'][:60]}")
                added += 1

    log.info(f"스캔 완료: {added}개 추가됨")
    return added


# ── Run ───────────────────────────────────────────────────────────

def run(dry_run: bool = False, limit: int = MAX_POSTS_PER_DAY) -> None:
    """큐에서 pending 포스트 발행."""
    q.init_db()

    today_count = q.posts_today()
    if today_count >= MAX_POSTS_PER_DAY:
        log.info(f"오늘 발행 한도({MAX_POSTS_PER_DAY})에 도달. 종료.")
        return

    remaining = max(0, limit - today_count)
    posts = q.pending_posts(limit=remaining)

    if not posts:
        log.info("발행 대기 포스트 없음.")
        return

    active_platforms = [p for p, enabled in PLATFORMS.items() if enabled]
    if not active_platforms:
        log.warning("활성화된 플랫폼 없음. 환경변수 SNS_NAVER/SNS_TISTORY/SNS_BLOGGER/SNS_INSTAGRAM 확인.")

    for post in posts:
        log.info(f"\n{'='*60}\n발행: [{post['id']}] {post['title']}")
        _publish_post(post, active_platforms, dry_run)

        if not dry_run:
            time.sleep(INTER_PLATFORM_DELAY)


def _publish_post(post, platforms: list[str], dry_run: bool) -> None:
    post_id = post["id"]
    title = post["title"]
    content_html = post["content_html"]
    content_text = post["content_text"]
    tags = post["tags"].split(",") if post["tags"] else []
    lang = post["lang"]

    for platform in platforms:
        if q.already_published(post_id, platform):
            log.info(f"  [{platform}] 이미 발행됨. 건너뜀.")
            continue

        log.info(f"  [{platform}] 발행 중...")

        if dry_run:
            log.info(f"  [{platform}] [DRY-RUN] 발행 시뮬레이션 완료")
            continue

        try:
            url = _do_publish(platform, title, content_html, content_text, tags, lang)
            q.log_publish(post_id, platform, "success", url)
            log.info(f"  [{platform}] 성공: {url}")
        except Exception as e:
            q.log_publish(post_id, platform, "failed", error=str(e))
            log.error(f"  [{platform}] 실패: {e}")

        time.sleep(10)  # 플랫폼 내 딜레이


def _do_publish(
    platform: str,
    title: str,
    content_html: str,
    content_text: str,
    tags: list[str],
    lang: str,
) -> str:
    """플랫폼별 발행 실행. 발행 URL 반환."""
    import publisher

    if platform == "naver":
        fmt_title, fmt_html = for_naver(title, content_html, tags, lang)
        result = publisher.publish_naver(fmt_title, fmt_html)
        return result.get("url", "")

    if platform == "tistory":
        fmt_title, fmt_html, fmt_tags = for_tistory(title, content_html, tags, lang)
        result = publisher.publish_tistory(fmt_title, fmt_html, fmt_tags)
        return result.get("url", "")

    if platform == "blogger":
        fmt_title, fmt_html, labels = for_blogger(title, content_html, tags, lang)
        result = publisher.publish_blogger(fmt_title, fmt_html, labels)
        return result.get("url", "")

    if platform == "instagram":
        caption = for_instagram(title, content_text, tags, lang)
        # 인스타그램은 이미지 필요 — 없으면 건너뜀
        image_path = _find_or_generate_image(title, tags)
        if not image_path:
            raise RuntimeError("인스타그램 이미지 없음. 이미지 파일을 scripts/sns/images/ 에 추가하거나 marketing_bot 이미지 생성 연동 필요.")
        result = publisher.publish_instagram(image_path, caption)
        return result.get("url", result.get("status", ""))

    raise ValueError(f"알 수 없는 플랫폼: {platform}")


def _find_or_generate_image(title: str, tags: list[str]) -> str | None:
    """
    인스타그램용 이미지 탐색.
    1. scripts/sns/images/default.jpg 사용
    2. 없으면 marketing_bot의 이미지 생성 시도
    """
    images_dir = REPO_DIR / "scripts" / "sns" / "images"
    images_dir.mkdir(exist_ok=True)

    default = images_dir / "default.jpg"
    if default.exists():
        return str(default)

    # marketing_bot 이미지 생성 시도
    try:
        sys.path.insert(0, str(REPO_DIR))
        from config import MARKETING_BOT_DIR
        sys.path.insert(0, str(MARKETING_BOT_DIR))
        from media.image_gen import generate_tip_card  # type: ignore
        tips = [title] + tags[:3]
        path = generate_tip_card(title, tips)
        return path
    except Exception:
        return None


# ── Status ────────────────────────────────────────────────────────

def status() -> None:
    """큐 현황 출력."""
    q.init_db()
    posts = q.all_posts()
    pending = [p for p in posts if p["status"] == "pending"]
    done = [p for p in posts if p["status"] == "done"]
    today = q.posts_today()

    print(f"\n{'='*50}")
    print(f"SNS 파이프라인 현황")
    print(f"{'='*50}")
    print(f"전체: {len(posts)}개 | 대기: {len(pending)}개 | 완료: {len(done)}개")
    print(f"오늘 발행: {today}/{MAX_POSTS_PER_DAY}개")
    print(f"\n활성 플랫폼: {[p for p, e in PLATFORMS.items() if e] or '없음'}")

    if pending:
        print(f"\n대기 중 포스트:")
        for p in pending[:10]:
            print(f"  [{p['id']}] {p['title'][:60]} ({p['lang']}) — {p['file_path']}")


# ── Entry Point ───────────────────────────────────────────────────

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    dry = "--dry-run" in sys.argv

    if cmd == "scan":
        scan()
    elif cmd == "run":
        run(dry_run=dry)
    elif cmd == "status":
        status()
    else:
        print(f"사용법: python pipeline.py [scan|run|status] [--dry-run]")
        sys.exit(1)
