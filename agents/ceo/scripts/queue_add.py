#!/usr/bin/env python3
"""
큐에 발행 항목 추가 CLI

사용 예:
    # 인스타그램에 이미지 포스트 추가 (즉시 발행)
    python scripts/queue_add.py --platform instagram \
        --image storage/cards/card.png \
        --caption "오늘의 수학 문제 — 극한"

    # 1시간 후 발행 예약
    python scripts/queue_add.py --platform instagram \
        --image storage/cards/card.png \
        --caption "미분 개념 정리" \
        --delay 3600

    # 큐 상태 확인
    python scripts/queue_add.py --status

    # 실패 항목 재시도
    python scripts/queue_add.py --retry-failed

    # 이력 출력
    python scripts/queue_add.py --history
"""
import argparse
import sys
from pathlib import Path

# 프로젝트 루트를 sys.path에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

from publishers.queue import QueueManager


def cmd_add(args: argparse.Namespace) -> None:
    mgr = QueueManager()
    item_id = mgr.add(
        platform=args.platform,
        caption=args.caption,
        image_path=args.image,
        delay_seconds=args.delay or 0,
    )
    print(f"✅ 큐 추가 완료")
    print(f"   ID       : {item_id}")
    print(f"   플랫폼   : {args.platform}")
    print(f"   딜레이   : {args.delay or 0}초")
    print(f"   대기 중  : {len(mgr.pending())}개")


def cmd_status(mgr: QueueManager) -> None:
    pending = mgr.pending()
    failed = mgr.failed()
    print(f"📋 큐 상태")
    print(f"   대기(pending) : {len(pending)}개")
    print(f"   실패(failed)  : {len(failed)}개")

    if pending:
        print("\n  [대기 중]")
        for item in pending:
            print(f"   • [{item['platform']:10s}] {item['id'][:8]} | "
                  f"attempt={item['attempts']}/{item['max_attempts']} | "
                  f"sched={item['scheduled_at'][:19]} | "
                  f"{item['caption'][:30]!r}")

    if failed:
        print("\n  [실패]")
        for item in failed:
            print(f"   • [{item['platform']:10s}] {item['id'][:8]} | "
                  f"error={item.get('last_error', '')[:60]}")


def cmd_history(mgr: QueueManager, limit: int = 20) -> None:
    items = mgr.history(limit=limit)
    print(f"📜 발행 이력 (최근 {limit}개)")
    if not items:
        print("   (없음)")
        return
    for h in items:
        icon = "✅" if h["status"] == "ok" else "❌"
        print(f"  {icon} [{h['platform']:10s}] {h['published_at'][:19]} | "
              f"{h['caption_preview']!r}")
        if h.get("error"):
            print(f"      오류: {h['error'][:80]}")


def main() -> None:
    parser = argparse.ArgumentParser(description="콘텐츠 발행 큐 관리")
    sub = parser.add_subparsers(dest="cmd")

    # add 서브커맨드
    add_p = sub.add_parser("add", help="큐에 항목 추가")
    add_p.add_argument("--platform", required=True,
                       choices=["instagram", "naver", "tistory", "blogger"],
                       help="발행 플랫폼")
    add_p.add_argument("--caption", required=True, help="게시물 본문")
    add_p.add_argument("--image", help="이미지 파일 경로 (Instagram 필수)")
    add_p.add_argument("--delay", type=int, default=0,
                       help="지금으로부터 발행 대기 시간(초, 기본 0=즉시)")

    # status 서브커맨드
    sub.add_parser("status", help="큐 상태 출력")

    # history 서브커맨드
    hist_p = sub.add_parser("history", help="발행 이력 출력")
    hist_p.add_argument("--limit", type=int, default=20, help="출력할 최대 항목 수")

    # retry-failed 서브커맨드
    sub.add_parser("retry-failed", help="실패 항목을 pending으로 되돌림")

    # clear-failed 서브커맨드
    sub.add_parser("clear-failed", help="실패 항목 삭제")

    # 레거시 플래그 지원 (--status, --history, --retry-failed)
    parser.add_argument("--platform", choices=["instagram", "naver", "tistory", "blogger"])
    parser.add_argument("--caption")
    parser.add_argument("--image")
    parser.add_argument("--delay", type=int, default=0)
    parser.add_argument("--status", action="store_true")
    parser.add_argument("--history", action="store_true")
    parser.add_argument("--retry-failed", action="store_true")

    args = parser.parse_args()
    mgr = QueueManager()

    # 서브커맨드 처리
    if args.cmd == "add":
        cmd_add(args)
    elif args.cmd == "status" or args.status:
        cmd_status(mgr)
    elif args.cmd == "history" or args.history:
        limit = getattr(args, "limit", 20)
        cmd_history(mgr, limit=limit)
    elif args.cmd == "retry-failed" or args.retry_failed:
        n = mgr.retry_failed()
        print(f"♻️  {n}개 항목을 pending으로 복원했습니다.")
    elif args.cmd == "clear-failed":
        n = mgr.clear_failed()
        print(f"🗑️  {n}개 실패 항목을 삭제했습니다.")
    elif args.platform and args.caption:
        cmd_add(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
