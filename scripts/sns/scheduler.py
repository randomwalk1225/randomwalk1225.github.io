"""
SNS 발행 스케줄러

콘텐츠 캘린더에 따라 자동 발행:
  - Naver/Tistory/Blogger: 주 2회 (화, 목)
  - Instagram: 주 3회 (월, 수, 금)

실행:
  python scheduler.py          # 크론 대신 무한 루프로 실행
  python scheduler.py --once   # 현재 시각 체크 후 종료

크론 설정 예:
  0 8 * * 2,4  cd /path/to/gitblog1104/scripts/sns && python pipeline.py run
  0 9 * * 1,3,5 cd /path/to/gitblog1104/scripts/sns && python pipeline.py run
"""
from __future__ import annotations

import sys
import time
import logging
from datetime import datetime

log = logging.getLogger("sns-scheduler")


SCHEDULE = {
    "blog_platforms": {  # naver, tistory, blogger
        "weekdays": {1, 3},  # 화=1, 목=3 (월=0 기준)
        "hour": 8,
    },
    "instagram": {
        "weekdays": {0, 2, 4},  # 월=0, 수=2, 금=4
        "hour": 9,
    },
}


def should_run_now(platform_group: str) -> bool:
    now = datetime.now()
    cfg = SCHEDULE.get(platform_group, {})
    return (
        now.weekday() in cfg.get("weekdays", set())
        and now.hour == cfg.get("hour", -1)
        and now.minute < 10  # 10분 윈도우
    )


def tick() -> None:
    """한 사이클 체크 및 실행."""
    from pipeline import run, scan

    if should_run_now("blog_platforms") or should_run_now("instagram"):
        log.info("스케줄 트리거 — 스캔 후 발행")
        scan()
        run()
    else:
        log.debug(f"대기 중 ({datetime.now().strftime('%a %H:%M')})")


def main() -> None:
    once = "--once" in sys.argv
    log.info("SNS 스케줄러 시작")

    if once:
        tick()
        return

    while True:
        try:
            tick()
        except Exception as e:
            log.error(f"오류: {e}")
        time.sleep(60)  # 1분마다 체크


if __name__ == "__main__":
    main()
