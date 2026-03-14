"""
mathhub.io HTML 파일에서 콘텐츠 추출

지원 형식:
  - blog/*.html  (블로그 포스트 — article 태그 또는 .container div)
  - us/blog/*.html, kr/blog/*.html (동일 구조)

반환: {"title", "content_html", "content_text", "tags", "lang"}
"""
from __future__ import annotations

import re
import sys
from pathlib import Path


def extract(file_path: Path) -> dict | None:
    """
    HTML 파일에서 발행용 콘텐츠를 추출.
    파싱 실패 또는 콘텐츠 부족 시 None 반환.
    """
    try:
        html = file_path.read_text(encoding="utf-8")
    except Exception as e:
        print(f"[extractor] 읽기 실패 {file_path}: {e}")
        return None

    # 언어 감지
    lang = _detect_lang(html, file_path)

    # 제목 추출
    title = _extract_title(html)
    if not title:
        return None

    # 본문 추출
    content_html = _extract_body(html)
    if not content_html or len(content_html) < 200:
        return None

    content_text = _html_to_text(content_html)

    # 태그/키워드 추출
    tags = _extract_tags(html, lang)

    return {
        "title": title,
        "content_html": content_html,
        "content_text": content_text,
        "tags": tags,
        "lang": lang,
    }


def _detect_lang(html: str, path: Path) -> str:
    """경로 또는 html lang 속성으로 언어 감지."""
    if "/kr/" in str(path) or "lang=\"ko\"" in html:
        return "ko"
    return "en"


def _extract_title(html: str) -> str:
    """<title> 또는 <h1> 태그에서 제목 추출."""
    # <title>
    m = re.search(r"<title[^>]*>([^<]+)</title>", html, re.I)
    if m:
        raw = m.group(1).strip()
        # " | MathHub" 또는 " - MathHub" 제거
        title = re.sub(r"\s*[|\-]\s*MathHub.*$", "", raw, flags=re.I).strip()
        if title:
            return title
    # <h1>
    m = re.search(r"<h1[^>]*>([^<]+)</h1>", html, re.I)
    if m:
        return m.group(1).strip()
    return ""


def _extract_body(html: str) -> str:
    """
    본문 HTML 추출 우선순위:
    1. <article> 태그
    2. <main> 태그
    3. class="container" 또는 class="content" div
    4. <body> 전체 (폴백)
    """
    for pattern in [
        r"<article[^>]*>(.*?)</article>",
        r"<main[^>]*>(.*?)</main>",
        r'<div[^>]*class="[^"]*(?:container|content|post-body)[^"]*"[^>]*>(.*?)</div>',
    ]:
        m = re.search(pattern, html, re.I | re.DOTALL)
        if m:
            body = m.group(1).strip()
            # 헤더/푸터/nav/script/style 제거
            body = re.sub(r"<(script|style|nav|footer|header)[^>]*>.*?</\1>", "", body, flags=re.I | re.DOTALL)
            body = _clean_html(body)
            if len(body) > 200:
                return body

    # 폴백: body 태그
    m = re.search(r"<body[^>]*>(.*?)</body>", html, re.I | re.DOTALL)
    if m:
        body = m.group(1)
        body = re.sub(r"<(script|style|nav|footer|header)[^>]*>.*?</\1>", "", body, flags=re.I | re.DOTALL)
        body = _clean_html(body)
        return body[:8000]  # 너무 길면 자름

    return ""


def _clean_html(html: str) -> str:
    """불필요한 속성/태그 제거 후 정리."""
    # data-, onclick, style 속성 제거 (보안 + 가독성)
    html = re.sub(r'\s+(?:data-\w+|onclick|onload|style)="[^"]*"', "", html)
    # 빈 줄 압축
    html = re.sub(r"\n{3,}", "\n\n", html)
    return html.strip()


def _html_to_text(html: str) -> str:
    """HTML → 평문 변환 (SNS 미리보기 / 인스타그램 캡션용)."""
    # 태그 제거
    text = re.sub(r"<[^>]+>", " ", html)
    # 연속 공백 정리
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{2,}", "\n\n", text)
    # HTML 엔티티 디코드
    text = text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
    text = text.replace("&nbsp;", " ").replace("&#39;", "'").replace("&quot;", '"')
    return text.strip()


def _extract_tags(html: str, lang: str) -> list[str]:
    """
    meta keywords / og:description / 파일 경로 힌트에서 태그 추출.
    """
    tags: list[str] = []

    # meta keywords
    m = re.search(r'<meta[^>]+name="keywords"[^>]+content="([^"]+)"', html, re.I)
    if m:
        for kw in m.group(1).split(","):
            kw = kw.strip()
            if kw:
                tags.append(kw)

    # 없으면 og:description 에서 단어 추출
    if not tags:
        m = re.search(r'<meta[^>]+(?:name="description"|property="og:description")[^>]+content="([^"]+)"', html, re.I)
        if m:
            words = m.group(1).split()[:8]
            tags = [w.strip(".,!?") for w in words if len(w) > 3]

    # 기본 태그 (언어별)
    base = ["math", "mathhub", "education"]
    if lang == "ko":
        base = ["수학", "mathhub", "교육", "수학공부"]

    # 중복 제거
    seen = set()
    result: list[str] = []
    for t in base + tags:
        low = t.lower()
        if low not in seen:
            seen.add(low)
            result.append(t)

    return result[:15]
