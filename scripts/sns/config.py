"""
SNS 자동 발행 파이프라인 설정
mathhub.io → Naver, Tistory, Blogger, Instagram 자동 크로스포스팅
"""
import os
from pathlib import Path

# ── 경로 ──────────────────────────────────────────────────────────
REPO_DIR = Path(__file__).parent.parent.parent  # gitblog1104/
MARKETING_BOT_DIR = Path(os.getenv(
    "MARKETING_BOT_DIR",
    "/Users/rando/Repos/myclass/biz_launch/marketing_bot"
))
DB_PATH = REPO_DIR / "scripts" / "sns" / "queue.db"
LOG_DIR = REPO_DIR / "scripts" / "sns" / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

# ── 플랫폼 활성화 ─────────────────────────────────────────────────
PLATFORMS = {
    "naver":     os.getenv("SNS_NAVER",     "false").lower() == "true",
    "tistory":   os.getenv("SNS_TISTORY",   "false").lower() == "true",
    "blogger":   os.getenv("SNS_BLOGGER",   "false").lower() == "true",
    "instagram": os.getenv("SNS_INSTAGRAM", "false").lower() == "true",
}

# ── 플랫폼 설정 ───────────────────────────────────────────────────
TISTORY_BLOG_NAME = os.getenv("TISTORY_BLOG_NAME", "")
BLOGGER_BLOG_URL  = os.getenv("BLOGGER_BLOG_URL",  "")

# ── 스케줄 / 속도 제한 ────────────────────────────────────────────
# 플랫폼 간 딜레이(초) — 스팸 방지
INTER_PLATFORM_DELAY = int(os.getenv("SNS_DELAY_SEC", "60"))
# 포스팅 주기: 하루 최대 발행 수
MAX_POSTS_PER_DAY = int(os.getenv("SNS_MAX_POSTS_DAY", "3"))

# ── 콘텐츠 필터 ───────────────────────────────────────────────────
# 크로스포스팅 대상 경로 패턴 (blog/*, us/blog/*, kr/blog/*)
CONTENT_PATHS = [
    "blog/*.html",
    "us/blog/*.html",
    "kr/blog/*.html",
]
# 발행에서 제외할 파일
EXCLUDE_FILES = {"index.html"}

# ── 브랜드 ────────────────────────────────────────────────────────
SITE_URL = "https://mathhub.io"
BRAND_NAME = "MathHub"
CTA_TEXT = "더 많은 수학 자료: mathhub.io"
