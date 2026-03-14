"""
플랫폼별 콘텐츠 포맷터

각 플랫폼의 요구사항에 맞게 콘텐츠를 변환:
  - Naver Blog:  HTML (단순화) + SEO 블록
  - Tistory:     HTML + 해시태그
  - Blogger:     HTML + 라벨
  - Instagram:   평문 캡션 (이미지는 별도 생성)
"""
from __future__ import annotations

import re
from config import SITE_URL, BRAND_NAME, CTA_TEXT


def for_naver(title: str, content_html: str, tags: list[str], lang: str = "en") -> tuple[str, str]:
    """(title, html) for Naver Blog."""
    cta = _cta_block("naver", lang)
    seo_tags = " ".join(f"#{t}" for t in tags[:10])
    html = f"""
{_simplify_html(content_html)}

{cta}

<p>{seo_tags}</p>
""".strip()
    return title, html


def for_tistory(
    title: str,
    content_html: str,
    tags: list[str],
    lang: str = "en",
) -> tuple[str, str, list[str]]:
    """(title, html, tags) for Tistory."""
    cta = _cta_block("tistory", lang)
    html = f"""
{_simplify_html(content_html)}

{cta}
""".strip()
    return title, html, tags[:10]


def for_blogger(
    title: str,
    content_html: str,
    tags: list[str],
    lang: str = "en",
) -> tuple[str, str, list[str]]:
    """(title, html, labels) for Blogger."""
    cta = _cta_block("blogger", lang)
    html = f"""
{_simplify_html(content_html)}

{cta}
""".strip()
    labels = tags[:5]
    return title, html, labels


def for_instagram(
    title: str,
    content_text: str,
    tags: list[str],
    lang: str = "en",
) -> str:
    """Instagram 캡션 (평문 텍스트)."""
    # 본문 첫 2문단 (최대 300자)
    paragraphs = [p.strip() for p in content_text.split("\n\n") if p.strip()]
    preview = "\n\n".join(paragraphs[:2])[:300]

    hashtags = " ".join(f"#{_clean_tag(t)}" for t in tags[:20])

    if lang == "ko":
        cta = f"더 많은 수학 자료 → {SITE_URL}"
        caption = f"{title}\n\n{preview}\n\n{cta}\n\n{hashtags}"
    else:
        cta = f"More math resources → {SITE_URL}"
        caption = f"{title}\n\n{preview}\n\n{cta}\n\n{hashtags}"

    return caption[:2200]  # Instagram 캡션 최대 2200자


# ── 내부 헬퍼 ─────────────────────────────────────────────────────

def _simplify_html(html: str) -> str:
    """플랫폼 이식성을 위해 HTML 단순화."""
    # class/id 속성 제거 (Naver/Tistory 에디터 호환)
    html = re.sub(r'\s+(?:class|id)="[^"]*"', "", html)
    # Desmos/iframe 제거 (외부 임베드 불가)
    html = re.sub(r"<iframe[^>]*>.*?</iframe>", "", html, flags=re.I | re.DOTALL)
    html = re.sub(r'<div[^>]*(?:desmos|calculator)[^>]*>.*?</div>', "", html, flags=re.I | re.DOTALL)
    # script/style 제거
    html = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", html, flags=re.I | re.DOTALL)
    return html.strip()


def _cta_block(platform: str, lang: str) -> str:
    """플랫폼별 CTA 블록."""
    if lang == "ko":
        return (
            f'<div style="background:#f0f4ff;border-left:4px solid #4f46e5;padding:16px;margin:24px 0">'
            f'<p>📐 더 많은 수학 자료, 문제, 교재:</p>'
            f'<p><a href="{SITE_URL}">{SITE_URL}</a></p>'
            f'</div>'
        )
    return (
        f'<div style="background:#f0f4ff;border-left:4px solid #4f46e5;padding:16px;margin:24px 0">'
        f'<p>📐 More math resources, practice problems, and textbooks:</p>'
        f'<p><a href="{SITE_URL}">{SITE_URL}</a></p>'
        f'</div>'
    )


def _clean_tag(tag: str) -> str:
    """태그 → 해시태그 안전 문자열."""
    return re.sub(r"[^\w가-힣]", "", tag)
