"""
SNS 발행 큐 — SQLite 기반

테이블:
  posts:    mathhub.io 발행 후보 콘텐츠
  publishes: 플랫폼별 발행 이력 (중복 방지)
"""
from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from datetime import date
from pathlib import Path
from typing import Iterator

from config import DB_PATH


@contextmanager
def _conn() -> Iterator[sqlite3.Connection]:
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    try:
        yield con
        con.commit()
    finally:
        con.close()


def init_db() -> None:
    with _conn() as con:
        con.executescript("""
        CREATE TABLE IF NOT EXISTS posts (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            file_path   TEXT    NOT NULL UNIQUE,
            title       TEXT    NOT NULL,
            content_html TEXT   NOT NULL,
            content_text TEXT   NOT NULL,
            tags        TEXT    DEFAULT '',
            lang        TEXT    DEFAULT 'en',
            added_at    TEXT    DEFAULT (date('now')),
            status      TEXT    DEFAULT 'pending'
        );

        CREATE TABLE IF NOT EXISTS publishes (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id    INTEGER NOT NULL REFERENCES posts(id),
            platform   TEXT    NOT NULL,
            status     TEXT    NOT NULL,   -- success | failed
            url        TEXT    DEFAULT '',
            error      TEXT    DEFAULT '',
            published_at TEXT  DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_publishes_post_platform
            ON publishes(post_id, platform);
        """)


def add_post(
    file_path: str,
    title: str,
    content_html: str,
    content_text: str,
    tags: list[str],
    lang: str = "en",
) -> int | None:
    """새 포스트를 큐에 추가. 이미 존재하면 None 반환."""
    with _conn() as con:
        existing = con.execute(
            "SELECT id FROM posts WHERE file_path = ?", (file_path,)
        ).fetchone()
        if existing:
            return None
        cur = con.execute(
            "INSERT INTO posts (file_path, title, content_html, content_text, tags, lang) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (file_path, title, content_html, content_text, ",".join(tags), lang),
        )
        return cur.lastrowid


def pending_posts(limit: int = 10) -> list[sqlite3.Row]:
    """발행 대기 중인 포스트 목록."""
    with _conn() as con:
        return con.execute(
            "SELECT * FROM posts WHERE status = 'pending' ORDER BY id LIMIT ?",
            (limit,),
        ).fetchall()


def already_published(post_id: int, platform: str) -> bool:
    """해당 플랫폼에 이미 발행됐는지 확인."""
    with _conn() as con:
        row = con.execute(
            "SELECT id FROM publishes WHERE post_id = ? AND platform = ? AND status = 'success'",
            (post_id, platform),
        ).fetchone()
        return row is not None


def log_publish(
    post_id: int,
    platform: str,
    status: str,
    url: str = "",
    error: str = "",
) -> None:
    with _conn() as con:
        con.execute(
            "INSERT INTO publishes (post_id, platform, status, url, error) VALUES (?, ?, ?, ?, ?)",
            (post_id, platform, status, url, error),
        )
        # 모든 플랫폼 성공 시 포스트 상태 업데이트
        if status == "success":
            _maybe_mark_done(con, post_id)


def _maybe_mark_done(con: sqlite3.Connection, post_id: int) -> None:
    """모든 활성 플랫폼에 성공 발행됐으면 done으로 표시."""
    from config import PLATFORMS
    active = [p for p, enabled in PLATFORMS.items() if enabled]
    if not active:
        return
    rows = con.execute(
        "SELECT platform FROM publishes WHERE post_id = ? AND status = 'success'",
        (post_id,),
    ).fetchall()
    published_platforms = {r["platform"] for r in rows}
    if set(active).issubset(published_platforms):
        con.execute("UPDATE posts SET status = 'done' WHERE id = ?", (post_id,))


def posts_today() -> int:
    """오늘 성공 발행 수."""
    today = date.today().isoformat()
    with _conn() as con:
        row = con.execute(
            "SELECT COUNT(DISTINCT post_id) as n FROM publishes "
            "WHERE status = 'success' AND date(published_at) = ?",
            (today,),
        ).fetchone()
        return row["n"] if row else 0


def all_posts(status: str | None = None) -> list[sqlite3.Row]:
    """모든 포스트 조회 (상태 필터 옵션)."""
    with _conn() as con:
        if status:
            return con.execute(
                "SELECT * FROM posts WHERE status = ? ORDER BY id DESC", (status,)
            ).fetchall()
        return con.execute("SELECT * FROM posts ORDER BY id DESC").fetchall()
