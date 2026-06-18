"""
수학 문제 카드 이미지 생성기

Playwright를 사용해 HTML 템플릿을 1080×1080 PNG로 렌더링.
MathJax로 수식 렌더링 → 인스타그램용 정사각형 이미지 출력.

사용:
    from card_generator.generator import generate_card

    path = generate_card(
        question=r"다음 극한값을 구하시오: $\\lim_{x \\to 2} \\frac{x^2-4}{x-2}$",
        answer="$4$",
        hint="분자를 인수분해하면 $(x-2)(x+2)$이므로 극한값은 $2+2=4$",
        badge="수능 수학 II",
        output_path="storage/cards/card_001.png",
    )
"""
from __future__ import annotations

import asyncio
import json
import re
from pathlib import Path

TEMPLATE_PATH = Path(__file__).parent / "templates" / "math_card.html"
DEFAULT_OUTPUT_DIR = Path(__file__).parent.parent / "storage" / "cards"


def generate_card(
    question: str,
    answer: str,
    hint: str = "",
    badge: str = "수능 수학",
    output_path: str | None = None,
) -> str:
    """수학 문제 카드 PNG 생성.

    Args:
        question: 문제 내용 (LaTeX 수식 포함 가능, $...$)
        answer: 정답 (LaTeX 수식 포함 가능)
        hint: 풀이 힌트 (선택)
        badge: 상단 배지 텍스트
        output_path: 저장 경로 (None이면 자동 생성)

    Returns:
        생성된 PNG 파일의 절대 경로 문자열
    """
    return asyncio.run(_generate_async(question, answer, hint, badge, output_path))


async def _generate_async(
    question: str,
    answer: str,
    hint: str,
    badge: str,
    output_path: str | None,
) -> str:
    from playwright.async_api import async_playwright

    # 출력 경로 결정
    if output_path is None:
        DEFAULT_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        idx = len(list(DEFAULT_OUTPUT_DIR.glob("*.png"))) + 1
        out = DEFAULT_OUTPUT_DIR / f"card_{idx:03d}.png"
    else:
        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)

    # 템플릿 HTML 로드 및 데이터 주입
    template = TEMPLATE_PATH.read_text(encoding="utf-8")
    card_data = {
        "badge": badge,
        "question": question,
        "answer": answer,
        "hint": hint,
    }
    data_json = json.dumps(card_data, ensure_ascii=False)
    html = template.replace("CARD_DATA_PLACEHOLDER", data_json)

    # 임시 HTML 파일 저장
    tmp_html = out.with_suffix(".tmp.html")
    tmp_html.write_text(html, encoding="utf-8")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1080, "height": 1080})

        await page.goto(f"file://{tmp_html.resolve()}")

        # MathJax 렌더링 완료 대기 (최대 10초)
        try:
            await page.wait_for_function(
                "() => window.MathJax && window.MathJax.typesetPromise && "
                "document.querySelectorAll('mjx-container').length > 0",
                timeout=10000,
            )
            await page.wait_for_timeout(800)  # 추가 렌더링 여유
        except Exception:
            await page.wait_for_timeout(2000)  # MathJax 없으면 그냥 2초 대기

        await page.screenshot(path=str(out), type="png", full_page=False)
        await browser.close()

    # 임시 파일 정리
    tmp_html.unlink(missing_ok=True)

    return str(out.resolve())


# 샘플 카드 목록 — 수능/내신 수학 주요 유형
SAMPLE_CARDS = [
    {
        "badge": "수능 수학 II — 극한",
        "question": r"다음 극한값을 구하시오.<br>$$\lim_{x \to 2} \frac{x^2 - 4}{x - 2}$$",
        "answer": r"$$4$$",
        "hint": r"분자를 인수분해: $(x-2)(x+2)$ → 약분 후 $x \to 2$",
    },
    {
        "badge": "수능 수학 II — 미분",
        "question": r"$f(x) = x^3 - 3x^2 + 2$일 때, $f'(1)$의 값을 구하시오.",
        "answer": r"$$f'(1) = -3$$",
        "hint": r"$f'(x) = 3x^2 - 6x$, 대입하면 $f'(1) = 3 - 6 = -3$",
    },
    {
        "badge": "수능 수학 I — 수열",
        "question": r"등비수열 $\{a_n\}$의 첫째항이 $2$, 공비가 $3$일 때,<br>$a_5$의 값을 구하시오.",
        "answer": r"$$a_5 = 162$$",
        "hint": r"$a_n = 2 \cdot 3^{n-1}$, $a_5 = 2 \cdot 3^4 = 2 \cdot 81 = 162$",
    },
    {
        "badge": "수능 수학 II — 적분",
        "question": r"$$\int_0^2 (3x^2 - 2x + 1)\,dx$$를 구하시오.",
        "answer": r"$$6$$",
        "hint": r"$\bigl[x^3 - x^2 + x\bigr]_0^2 = (8 - 4 + 2) - 0 = 6$",
    },
    {
        "badge": "수능 수학 I — 로그",
        "question": r"$\log_2 8 + \log_4 16$의 값을 구하시오.",
        "answer": r"$$5$$",
        "hint": r"$\log_2 8 = 3$, $\log_4 16 = \log_4 4^2 = 2$, 합 $= 5$",
    },
]
