#!/usr/bin/env python3
"""
큐 처리기 — 예정된 발행 항목을 순서대로 실행

사용 예:
    # 발행 가능한 항목 모두 처리
    python scripts/queue_run.py

    # 실제 발행 없이 처리 대상 확인
    python scripts/queue_run.py --dry-run

    # 특정 플랫폼만 처리
    python scripts/queue_run.py --platform instagram

    # 단일 항목만 처리 (ID 지정)
    python scripts/queue_run.py --id <item-id>

    # 루프 모드: 60초마다 자동 처리
    python scripts/queue_run.py --loop --interval 60
"""
import argparse
import logging
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from publishers.queue import QueueManager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


def run_once(
    mgr: QueueManager,
    dry_run: bool = False,
    platform_filter: str | None = None,
    item_id: str | None = None,
) -> list[dict]:
    """한 번 실행 사이클."""
    if item_id:
        # 특정 항목만 처리
        target = next((p for p in mgr.pending() if p["id"].startswith(item_id)), None)
        if not target:
            print(f"❌ 항목을 찾을 수 없습니다: {item_id}")
            return []
        due = [target]
    else:
        due = mgr.due_items()
        if platform_filter:
            due = [d for d in due if d["platform"] == platform_filter]

    if not due:
        print("📭 처리할 항목 없음.")
        return []

    print(f"📤 처리 대상: {len(due)}개{'  [DRY RUN]' if dry_run else ''}")
    for item in due:
        print(f"   • [{item['platform']:10s}] {item['id'][:8]} | {item['caption'][:40]!r}")

    if dry_run:
        return [{"id": d["id"], "platform": d["platform"], "status": "dry_run"} for d in due]

    results = mgr.run_due()

    ok = sum(1 for r in results if r["status"] == "ok")
    err = sum(1 for r in results if r["status"] == "error")
    print(f"\n✅ 성공: {ok}개  ❌ 실패: {err}개")
    for r in results:
        icon = "✅" if r["status"] == "ok" else "❌"
        msg = f"  {icon} [{r['platform']:10s}] {r['id'][:8]}"
        if r.get("error"):
            msg += f" — {r['error'][:60]}"
        print(msg)

    return results


def main() -> None:
    parser = argparse.ArgumentParser(description="발행 큐 처리기")
    parser.add_argument("--dry-run", action="store_true",
                        help="실제 발행 없이 처리 대상 확인")
    parser.add_argument("--platform", choices=["instagram", "naver", "tistory", "blogger"],
                        help="특정 플랫폼만 처리")
    parser.add_argument("--id", dest="item_id", help="특정 항목 ID (접두사 매칭)")
    parser.add_argument("--loop", action="store_true",
                        help="루프 모드: 주기적으로 자동 처리")
    parser.add_argument("--interval", type=int, default=60,
                        help="루프 모드 실행 간격 (초, 기본 60)")
    args = parser.parse_args()

    mgr = QueueManager()

    if args.loop:
        print(f"🔄 루프 모드 시작 (간격 {args.interval}초). Ctrl+C로 종료.")
        cycle = 0
        while True:
            cycle += 1
            print(f"\n─── 사이클 #{cycle} ─────────────────────")
            mgr = QueueManager()  # 매 사이클 파일에서 새로 로드
            run_once(mgr, dry_run=args.dry_run, platform_filter=args.platform,
                     item_id=args.item_id)

            # 실패 항목 요약
            failed = mgr.failed()
            if failed:
                print(f"⚠️  누적 실패: {len(failed)}개 (--retry-failed로 재시도)")

            try:
                time.sleep(args.interval)
            except KeyboardInterrupt:
                print("\n루프 종료.")
                break
    else:
        run_once(mgr, dry_run=args.dry_run, platform_filter=args.platform,
                 item_id=args.item_id)


if __name__ == "__main__":
    main()
