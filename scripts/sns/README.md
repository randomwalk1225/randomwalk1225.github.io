# SNS 자동 발행 파이프라인

mathhub.io 콘텐츠를 Naver, Tistory, Blogger, Instagram에 자동 크로스포스팅합니다.

## 구조

```
scripts/sns/
├── config.py       — 환경변수 설정, 경로, 플랫폼 활성화
├── extractor.py    — mathhub.io HTML → 콘텐츠 추출
├── formatter.py    — 플랫폼별 콘텐츠 포맷
├── publisher.py    — marketing_bot publishers 래핑
├── queue.py        — SQLite 발행 큐 (중복 방지)
├── pipeline.py     — 메인 오케스트레이터
├── scheduler.py    — 스케줄 기반 자동 실행
├── images/         — 인스타그램용 기본 이미지 (default.jpg)
├── logs/           — 파이프라인 로그
└── queue.db        — SQLite 큐 데이터베이스 (자동 생성)
```

## 사전 조건

### 1. 세션 초기화 (최초 1회)

marketing_bot 디렉토리에서:

```bash
cd /Users/rando/Repos/myclass/biz_launch/marketing_bot

# 각 플랫폼 로그인 (브라우저 팝업 → 직접 로그인)
python scripts/login_naver.py
python scripts/login_tistory.py
python scripts/login_blogger.py
python scripts/login_instagram.py
```

세션은 `marketing_bot/storage/{platform}_session.json`에 저장됩니다.

### 2. 환경변수 설정

```bash
# 플랫폼 활성화 (true/false)
export SNS_NAVER=true
export SNS_TISTORY=true
export SNS_BLOGGER=true
export SNS_INSTAGRAM=false   # 이미지 준비 필요

# 플랫폼 설정
export TISTORY_BLOG_NAME=your-blog-name  # 예: math-academy
export BLOGGER_BLOG_URL=https://your-blog.blogspot.com

# 선택적
export MARKETING_BOT_DIR=/Users/rando/Repos/myclass/biz_launch/marketing_bot
export SNS_DELAY_SEC=60       # 플랫폼 간 딜레이 (초)
export SNS_MAX_POSTS_DAY=3    # 하루 최대 발행 수
```

### 3. Playwright 설치 확인

```bash
cd /Users/rando/Repos/myclass/biz_launch/marketing_bot
pip install -r requirements.txt
playwright install chromium
```

## 사용법

```bash
cd /Users/rando/Repos/gitblog1104/scripts/sns

# 새 콘텐츠 스캔 → 큐 추가
python pipeline.py scan

# 큐에서 발행 (실제 실행)
python pipeline.py run

# 시뮬레이션 (발행 없이 확인)
python pipeline.py run --dry-run

# 큐 현황 확인
python pipeline.py status
```

## 크론 설정

```cron
# 화, 목 08:00 — 블로그 발행 (Naver, Tistory, Blogger)
0 8 * * 2,4  cd /Users/rando/Repos/gitblog1104/scripts/sns && python pipeline.py scan && python pipeline.py run

# 월, 수, 금 09:00 — 인스타그램 발행
0 9 * * 1,3,5  cd /Users/rando/Repos/gitblog1104/scripts/sns && python pipeline.py run
```

## 인스타그램 이미지

인스타그램은 이미지가 필요합니다. 두 가지 방법:

1. **기본 이미지**: `scripts/sns/images/default.jpg` 배치
2. **자동 생성**: marketing_bot의 `media/image_gen.py` 연동 (PIL 필요)

## 발행 대상

`config.py`의 `CONTENT_PATHS`에 정의된 경로:
- `blog/*.html` — US 교과서/블로그 포스트
- `us/blog/*.html` — US 블로그
- `kr/blog/*.html` — 한국어 블로그

`index.html`은 자동 제외됩니다.

## 아키텍처

```
mathhub.io HTML 파일
    ↓ extractor.py (제목, 본문, 태그 추출)
    ↓ queue.py (SQLite 큐, 중복 방지)
    ↓ formatter.py (플랫폼별 포맷 변환)
    ↓ publisher.py (marketing_bot publishers 호출)
    → Naver Blog (Playwright)
    → Tistory (Playwright)
    → Blogger (Playwright)
    → Instagram (Playwright + 이미지)
```
