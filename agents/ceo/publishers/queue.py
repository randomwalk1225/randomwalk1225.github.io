"""
콘텐츠 스케줄링 큐 — 멀티 플랫폼 시간차 발행 시스템

기능:
- 플랫폼별 anti-spam 최소 딜레이 강제 (인스타그램 1시간, 네이버/티스토리 30분 등)
- JSON 기반 큐/이력 영속성 (storage/queue.json, storage/history.json)
- 실패 시 최대 3회 재시도 (지수 백오프)
- 발행 이력 추적 (플랫폼별 마지막 발행 시간 포함)

사용 예:
    from publishers.queue import QueueManager

    mgr = QueueManager()
    mgr.add(platform="instagram", image_path="cards/card.png", caption="오늘의 수학 문제")
    mgr.run_due()
"""
from __future__ import annotations

import json
import logging
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

log = logging.getLogger(__name__)

STORAGE_DIR = Path(__file__).parent.parent / "storage"
STORAGE_DIR.mkdir(exist_ok=True)

QUEUE_PATH = STORAGE_DIR / "queue.json"
HISTORY_PATH = STORAGE_DIR / "history.json"

# 플랫폼별 최소 발행 간격 (초)
ANTI_SPAM_DELAY: dict[str, int] = {
    "instagram": 3600,   # 1시간
    "naver": 1800,        # 30분
    "tistory": 1800,      # 30분
    "blogger": 900,       # 15분
}

DEFAULT_MAX_ATTEMPTS = 3
# 재시도 백오프 (초): attempt 0→즉시, 1→5분, 2→15분
RETRY_BACKOFF: list[int] = [0, 300, 900]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ts(iso: str) -> float:
    """ISO 문자열 → POSIX timestamp."""
    return datetime.fromisoformat(iso).timestamp()


class QueueManager:
    """멀티 플랫폼 콘텐츠 스케줄링 큐.

    queue.json 구조:
        {"pending": [...], "failed": [...]}

    각 항목:
        {
            "id": str,
            "platform": str,
            "image_path": str | null,
            "caption": str,
            "hashtags": list[str] | null,
            "scheduled_at": ISO str,    # 발행 예정 시각 (UTC)
            "attempts": int,
            "max_attempts": int,
            "created_at": ISO str,
            "last_error": str | null
        }

    history.json 구조:
        {"items": [...], "last_published": {"platform": ISO str, ...}}
    """

    def __init__(self) -> None:
        self._queue = self._load_queue()
        self._history = self._load_history()

    # ─── 영속성 ──────────────────────────────────────────────

    def _load_queue(self) -> dict[str, list]:
        if QUEUE_PATH.exists():
            try:
                return json.loads(QUEUE_PATH.read_text())
            except (json.JSONDecodeError, KeyError):
                log.warning("queue.json 파싱 실패, 초기화합니다.")
        return {"pending": [], "failed": []}

    def _save_queue(self) -> None:
        QUEUE_PATH.write_text(json.dumps(self._queue, indent=2, ensure_ascii=False))

    def _load_history(self) -> dict[str, Any]:
        if HISTORY_PATH.exists():
            try:
                return json.loads(HISTORY_PATH.read_text())
            except (json.JSONDecodeError, KeyError):
                log.warning("history.json 파싱 실패, 초기화합니다.")
        return {"items": [], "last_published": {}}

    def _save_history(self) -> None:
        HISTORY_PATH.write_text(json.dumps(self._history, indent=2, ensure_ascii=False))

    # ─── 큐 조작 ─────────────────────────────────────────────

    def add(
        self,
        platform: str,
        caption: str,
        image_path: str | None = None,
        hashtags: list[str] | None = None,
        scheduled_at: datetime | None = None,
        delay_seconds: int = 0,
    ) -> str:
        """큐에 항목 추가. 발행 예정 시각을 반환한다.

        Args:
            platform: 플랫폼 이름 (instagram, naver, tistory, blogger)
            caption: 게시물 본문
            image_path: 이미지 파일 경로 (이미지 포스트)
            hashtags: 해시태그 리스트 (None이면 퍼블리셔 기본값 사용)
            scheduled_at: 발행 예정 시각 (None이면 지금+delay_seconds)
            delay_seconds: scheduled_at이 None일 때 지금으로부터 대기 시간

        Returns:
            추가된 항목의 ID
        """
        if scheduled_at is None:
            sched_ts = time.time() + delay_seconds
            sched_iso = datetime.fromtimestamp(sched_ts, tz=timezone.utc).isoformat()
        else:
            sched_iso = scheduled_at.astimezone(timezone.utc).isoformat()

        item: dict[str, Any] = {
            "id": str(uuid.uuid4()),
            "platform": platform,
            "image_path": image_path,
            "caption": caption,
            "hashtags": hashtags,
            "scheduled_at": sched_iso,
            "attempts": 0,
            "max_attempts": DEFAULT_MAX_ATTEMPTS,
            "created_at": _now(),
            "last_error": None,
        }
        self._queue["pending"].append(item)
        self._save_queue()
        log.info("큐 추가: [%s] %s @ %s", platform, item["id"][:8], sched_iso)
        return item["id"]

    def pending(self) -> list[dict]:
        """현재 대기 중인 모든 항목."""
        return list(self._queue["pending"])

    def failed(self) -> list[dict]:
        """재시도 한도 초과로 실패한 항목."""
        return list(self._queue["failed"])

    def history(self, limit: int = 50) -> list[dict]:
        """최근 발행 이력 (최신순)."""
        return list(reversed(self._history["items"]))[:limit]

    def last_published(self, platform: str) -> float | None:
        """플랫폼별 마지막 성공 발행 POSIX timestamp."""
        iso = self._history["last_published"].get(platform)
        return _ts(iso) if iso else None

    def clear_failed(self) -> int:
        """실패 목록을 비우고 삭제된 항목 수를 반환."""
        n = len(self._queue["failed"])
        self._queue["failed"] = []
        self._save_queue()
        return n

    def retry_failed(self) -> int:
        """실패 항목을 pending으로 되돌리고 attempts 리셋. 복원된 수 반환."""
        items = self._queue["failed"]
        for item in items:
            item["attempts"] = 0
            item["last_error"] = None
        self._queue["pending"].extend(items)
        self._queue["failed"] = []
        self._save_queue()
        return len(items)

    # ─── 실행 ─────────────────────────────────────────────────

    def due_items(self) -> list[dict]:
        """지금 발행 가능한 항목 목록.

        - scheduled_at 이 현재 시각 이후인 항목 제외
        - 플랫폼 anti-spam 딜레이 미충족 항목 제외
        - 재시도 백오프 미충족 항목 제외
        """
        now = time.time()
        due = []
        for item in self._queue["pending"]:
            # 예약 시각 미도달
            if _ts(item["scheduled_at"]) > now:
                continue

            platform = item["platform"]

            # anti-spam: 마지막 발행 이후 최소 딜레이
            min_delay = ANTI_SPAM_DELAY.get(platform, 0)
            last = self.last_published(platform)
            if last is not None and (now - last) < min_delay:
                wait = int(min_delay - (now - last))
                log.debug("anti-spam 대기 중: %s, %ds 남음", platform, wait)
                continue

            # 재시도 백오프
            attempt = item["attempts"]
            if attempt > 0:
                backoff = RETRY_BACKOFF[min(attempt - 1, len(RETRY_BACKOFF) - 1)]
                # last_error_at 기록이 없으면 scheduled_at 기준
                base_ts = _ts(item.get("last_error_at") or item["scheduled_at"])
                if (now - base_ts) < backoff:
                    log.debug("재시도 백오프 중: %s attempt=%d", item["id"][:8], attempt)
                    continue

            due.append(item)
        return due

    def run_due(self, dry_run: bool = False) -> list[dict]:
        """발행 가능한 항목을 순서대로 실행.

        Args:
            dry_run: True이면 실제 발행 없이 어떤 항목을 처리할지만 반환

        Returns:
            처리 결과 목록: [{"id": ..., "status": "ok"|"error", ...}, ...]
        """
        due = self.due_items()
        if not due:
            log.info("발행 대기 항목 없음.")
            return []

        results = []
        for item in due:
            if dry_run:
                results.append({"id": item["id"], "status": "dry_run", "platform": item["platform"]})
                continue

            result = self._publish(item)
            results.append(result)

            # anti-spam: 플랫폼 간 짧은 슬립 (같은 플랫폼 연속 발행 방지)
            if result["status"] == "ok" and len(due) > 1:
                time.sleep(2)

        return results

    def _publish(self, item: dict) -> dict:
        """단일 항목 발행 시도. 내부 큐/이력 상태 업데이트."""
        platform = item["platform"]
        item_id = item["id"]
        log.info("발행 시도: [%s] %s (attempt %d)", platform, item_id[:8], item["attempts"] + 1)

        try:
            self._dispatch(item)
            status = "ok"
            error = None
        except Exception as exc:
            status = "error"
            error = str(exc)
            log.error("발행 실패: [%s] %s — %s", platform, item_id[:8], error)

        now_iso = _now()
        item["attempts"] += 1

        # 이력 기록
        history_entry: dict[str, Any] = {
            "id": item_id,
            "platform": platform,
            "published_at": now_iso,
            "status": status,
            "error": error,
            "caption_preview": item["caption"][:60],
        }
        self._history["items"].append(history_entry)

        if status == "ok":
            # 성공: pending에서 제거, last_published 갱신
            self._queue["pending"] = [p for p in self._queue["pending"] if p["id"] != item_id]
            self._history["last_published"][platform] = now_iso
        else:
            # 실패: attempts 갱신, 한도 초과 시 failed로 이동
            item["last_error"] = error
            item["last_error_at"] = now_iso
            # pending 목록 내 업데이트
            for i, p in enumerate(self._queue["pending"]):
                if p["id"] == item_id:
                    self._queue["pending"][i] = item
                    break
            if item["attempts"] >= item["max_attempts"]:
                log.warning("최대 재시도 초과, failed로 이동: %s", item_id[:8])
                self._queue["pending"] = [p for p in self._queue["pending"] if p["id"] != item_id]
                self._queue["failed"].append(item)

        self._save_queue()
        self._save_history()

        return {"id": item_id, "platform": platform, "status": status, "error": error}

    def _dispatch(self, item: dict) -> None:
        """플랫폼별 퍼블리셔 호출."""
        platform = item["platform"]

        if platform == "instagram":
            from publishers.instagram import post_image
            if not item.get("image_path"):
                raise ValueError("Instagram 발행에는 image_path 필요")
            result = post_image(
                image_path=item["image_path"],
                caption=item["caption"],
                hashtags=item.get("hashtags"),
            )
            if result.get("status") != "ok":
                raise RuntimeError(result.get("message", "Instagram 발행 실패"))

        elif platform in ("naver", "tistory", "blogger"):
            # TODO: 해당 퍼블리셔 구현 후 연결
            raise NotImplementedError(f"{platform} 퍼블리셔 미구현")

        else:
            raise ValueError(f"알 수 없는 플랫폼: {platform}")
