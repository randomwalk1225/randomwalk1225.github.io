#!/usr/bin/env python3
"""
인스타그램 수학 문제 카드 자동 포스팅 CLI

사용법:
  # 샘플 카드 생성 후 Instagram에 포스팅
  python scripts/post_instagram.py --sample 0

  # 이미지 파일 직접 지정
  python scripts/post_instagram.py --image path/to/card.png --caption "오늘의 수학 문제"

  # 카드만 생성 (포스팅 없이 미리보기)
  python scripts/post_instagram.py --sample 0 --no-post

  # 전체 샘플 카드 생성 (5개)
  python scripts/post_instagram.py --generate-all
"""
import argparse
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


def generate_sample_card(index: int) -> str:
    """샘플 카드 생성 후 파일 경로 반환."""
    from card_generator.generator import generate_card, SAMPLE_CARDS

    if index >= len(SAMPLE_CARDS):
        raise ValueError(f"샘플 인덱스 범위 초과. 0~{len(SAMPLE_CARDS)-1} 사이 입력.")

    sample = SAMPLE_CARDS[index]
    output_path = f"storage/cards/sample_{index:02d}.png"
    log.info(f"카드 생성 중: {sample['badge']}")
    path = generate_card(
        question=sample["question"],
        answer=sample["answer"],
        hint=sample.get("hint", ""),
        badge=sample["badge"],
        output_path=output_path,
    )
    log.info(f"카드 생성 완료: {path}")
    return path


def post_card(image_path: str, caption: str, headless: bool = False) -> dict:
    """카드 이미지를 Instagram에 포스팅."""
    from publishers.instagram import post_image

    log.info(f"Instagram 포스팅 시작: {image_path}")
    result = post_image(image_path, caption, headless=headless)
    log.info(f"포스팅 완료: {result}")
    return result


def build_caption_for_sample(index: int) -> str:
    """샘플 카드에 맞는 캡션 생성."""
    from card_generator.generator import SAMPLE_CARDS

    sample = SAMPLE_CARDS[index]
    badge = sample["badge"]
    captions = {
        0: "오늘의 수학 문제 📐 극한값 계산! 풀어보셨나요?",
        1: "미분 문제 연습 ✏️ f'(1) = ? 먼저 풀어보세요!",
        2: "수열 기본기 🔢 등비수열 일반항으로 쉽게 풀어요.",
        3: "정적분 계산 📊 차근차근 계산해봐요!",
        4: "로그 공식 활용 🔑 밑 변환에 주목!",
    }
    caption = captions.get(index, f"오늘의 {badge} 문제! 함께 풀어봐요 ✨")
    return caption


def main():
    parser = argparse.ArgumentParser(description="Instagram 수학 문제 카드 자동 포스터")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--sample", type=int, metavar="N",
                       help="샘플 카드 번호 (0-4)")
    group.add_argument("--image", type=str,
                       help="포스팅할 이미지 파일 경로")
    group.add_argument("--generate-all", action="store_true",
                       help="전체 샘플 카드 5개 생성 (포스팅 없음)")

    parser.add_argument("--caption", type=str, default=None,
                        help="게시물 캡션 (--image 사용 시)")
    parser.add_argument("--no-post", action="store_true",
                        help="카드 생성만 하고 포스팅 안 함")
    parser.add_argument("--headless", action="store_true",
                        help="헤드리스 모드로 포스팅 (실험적)")

    args = parser.parse_args()

    if args.generate_all:
        from card_generator.generator import SAMPLE_CARDS
        log.info(f"전체 샘플 카드 {len(SAMPLE_CARDS)}개 생성 중...")
        for i in range(len(SAMPLE_CARDS)):
            path = generate_sample_card(i)
            print(f"  [{i}] {path}")
        log.info("완료.")
        return

    if args.sample is not None:
        # 샘플 카드 생성
        image_path = generate_sample_card(args.sample)
        caption = args.caption or build_caption_for_sample(args.sample)

        if args.no_post:
            print(f"\n카드 저장: {image_path}")
            print(f"캡션 미리보기:\n{caption}")
            return

        post_card(image_path, caption, headless=args.headless)

    elif args.image:
        if not Path(args.image).exists():
            print(f"오류: 이미지 파일 없음: {args.image}", file=sys.stderr)
            sys.exit(1)

        caption = args.caption or "오늘의 수학 문제 📐 MathHub와 함께 공부해요!"

        if args.no_post:
            print(f"\n이미지: {args.image}")
            print(f"캡션 미리보기:\n{caption}")
            return

        post_card(args.image, caption, headless=args.headless)


if __name__ == "__main__":
    main()
