# Plan: MathHub.io 사이트 구조 대대적 개편

> 심층 분석 기반 — 사용자 경험, 네비게이션 일관성, AdSense 최적화, 트래픽 유입 극대화

## 1. 전체 사이트 현황 진단

### 1.1 사이트 규모

| 항목 | 수량 |
|------|------|
| HTML 페이지 | 170+ |
| PDF 파일 | 4,281개 |
| 블로그 글 (실제) | 57개 (KR 32, US 7, UK 5, CA 3, IB 5, 글로벌 4, posts 1) |
| 교재 챕터 | 60개 (`/blog/` 내 textbook 파일) |
| 국가/지역 | 5개 (KR, US, UK, CA, IB) |
| 월간 AdSense 코드 | 전 페이지 설치됨 (`ca-pub-7322143430416257`) |

### 1.2 발견된 문제 — 15개

#### A. 콘텐츠 정체성 혼란 (치명적)

| # | 문제 | 현재 | 영향 |
|---|------|------|------|
| P1 | `/blog/`이 교재 허브 역할 | 60개 textbook + 4개 blog 혼재 | 사용자가 Blog 기대했는데 교과서 나옴 |
| P2 | "Study Guides & Tips" → `/blog` | 라벨과 내용 불일치 | 클릭 후 혼란, 이탈률 증가 |
| P3 | `/blog/index.html`의 Schema.org가 `@type: Blog` | 교재인데 Blog로 선언 | Google 크롤러 혼란, SEO 페널티 위험 |
| P4 | IB textbook이 `/blog/ib-aa-*-textbook.html`에 위치 | `/ib/` 아래가 아님 | URL 구조 비논리적 |

#### B. 네비게이션 비일관성

| # | 문제 | 현재 | 영향 |
|---|------|------|------|
| P5 | 메인 nav에 "Question Bank" → 단일 Railway 링크 | 4개국 구분 없음 | 외부 앱으로 이탈, 트래픽 유실 |
| P6 | `/kr/blog/` 에 index.html 없음 | 32개 글이 있지만 허브 페이지 없음 | 한국 블로그 직접 접근 불가 |
| P7 | Footer 구조 국가별 제각각 | UK=class, CA=inline, IB=다른 구조 | 유지보수 어렵고 브랜드 일관성 없음 |
| P8 | Exam 카드 레이아웃 불일치 | UK=세로형, CA=가로형 | 같은 사이트인데 다른 느낌 |

#### C. 사용자 경험 (UX)

| # | 문제 | 현재 | 영향 |
|---|------|------|------|
| P9 | "Support on Ko-fi" 메인 CTA | 영어권 아닌 사용자에게 의미 불명 | 불필요한 이질감 |
| P10 | 한국어 과외 상담이 글로벌 메인에 | "📐 수학 과외 무료 상담" | 글로벌 사용자 혼란 |
| P11 | Footer 너무 작음 | 0.9em, opacity 0.6 | 사실상 보이지 않음 |
| P12 | Newsletter EmailJS 키 미설정 | `YOUR_PUBLIC_KEY` placeholder | 구독 기능 작동 안 함 |

#### D. 광고/수익 최적화

| # | 문제 | 현재 | 영향 |
|---|------|------|------|
| P13 | Ad 컨테이너 없음 | AdSense 스크립트만 로드, 배치 없음 | 광고 수익 $0 |
| P14 | 페이지 체류시간 짧은 구조 | 메인→국가 카드 클릭→끝 | 세션당 페이지뷰 낮음 |
| P15 | Schema.org BlogPosting 없음 | 블로그 글에 구조화 데이터 미적용 | 검색 리치 스니펫 안 나옴 |

### 1.3 현재 네비게이션 맵 (AS-IS)

```
mathhub.io (index.html)
├── 🇰🇷 Korea Card → /kr/
│   ├── Blog (탭) — 글 목록 (index.html 내 인라인)
│   ├── 시험 기출 → /kr/exams/
│   ├── 교재 답지 → /kr/answers/
│   ├── 문제집 → /kr/books/
│   └── /kr/blog/ — 32개 글 (index.html ❌ 없음)
├── 🇺🇸 USA Card → /us/
│   ├── Online Textbooks (아코디언) → /blog/*-textbook.html ❌ 혼란
│   ├── Exam Cards → /us/sat/, /us/psat/, /us/ap-*/, /us/competitions/
│   └── /us/blog/ — 7개 글 (index.html ✅)
├── 🇬🇧 UK Card → /uk/
│   ├── Online Textbooks (아코디언) → 내부 콘텐츠
│   ├── Exam Cards → /uk/a-level/, /uk/igcse/, /uk/tmua/, /uk/mat/
│   └── /uk/blog/ — 5개 글 (index.html ✅)
├── 🇨🇦 Canada Card → /ca/
│   ├── Online Textbooks (아코디언) → /ca/textbook/*
│   ├── CEMC Competitions → /ca/competitions/
│   └── /ca/blog/ — 3개 글 (index.html ✅)
├── 🌍 IB → /ib/
│   └── /ib/blog/ — 5개 글 (index.html ✅)
│
├── "Study Guides & Tips" → /blog ❌ 실제론 textbook 60개
├── "Online Question Bank" → Railway 외부앱 ❌ 트래픽 유실
├── "Support on Ko-fi" → 외부 ❌ 맥락 없음
├── "수학 과외 무료 상담" → /contact.html ❌ 글로벌 메인에 한국어
│
└── Footer (0.9em, opacity 0.6) ❌ 안 보임
    ├── About → /about.html
    ├── 수학 과외 상담 → /contact.html
    ├── Privacy Policy → /privacy.html
    └── Blog → /blog/
```

## 2. 개편 목표

### 2.1 핵심 원칙

1. **"1클릭 = 1명확한 결과"** — 모든 링크가 기대한 콘텐츠로 연결
2. **4개국 일관된 구조** — 같은 패턴, 같은 네비게이션, 같은 Footer
3. **광고 수익 극대화** — 페이지 체류시간↑, 세션당 PV↑, 적절한 ad slot 배치
4. **SEO 트래픽 유입** — 올바른 Schema.org, 내부링크 강화, 리치 스니펫

### 2.2 목표 메트릭

| 지표 | 현재 (추정) | 목표 |
|------|------------|------|
| 세션당 페이지뷰 | 1.5 | 3.0+ |
| 평균 체류시간 | 30초 | 2분+ |
| AdSense 승인 | 미승인 | 승인 |
| 내부 링크 밀도 | 낮음 | 페이지당 10+ 내부링크 |
| 이탈률 | 70%+ | 50% 이하 |

## 3. 변경 후 네비게이션 맵 (TO-BE)

```
mathhub.io (index.html) — 글로벌 허브 (영어)
│
├── Global Nav Bar (모든 페이지 공통)
│   ├── MathHub 로고 → /
│   ├── Textbooks → /textbooks/ (허브)
│   ├── Past Papers → /papers/ (허브)  ← "Question Bank" 대체
│   ├── Blog → /blog/ (허브)
│   └── 🇰🇷 | 🇺🇸 | 🇬🇧 | 🇨🇦 | IB (국가 스위처)
│
├── Hero Section
│   └── "Math Resources for Every Student"
│
├── Country Cards (5개)
│   ├── 🇰🇷 Korea → /kr/
│   ├── 🇺🇸 USA → /us/
│   ├── 🇬🇧 UK → /uk/
│   ├── 🇨🇦 Canada → /ca/
│   └── 🌍 IB → /ib/
│
├── "Free Online Textbooks" Section
│   ├── 🇺🇸 Pre-Algebra, Algebra 2, Precalculus, AP Calculus → /us/ 내 링크
│   ├── 🇬🇧 IGCSE, A-Level, Further Maths → /uk/ 내 링크
│   ├── 🇨🇦 Ontario, Québec → /ca/textbook/
│   └── 🌍 IB Math AA, AI → /ib/ 내 링크
│
├── "Past Papers & Exams" Section
│   ├── 🇰🇷 수능, 모의고사, KMO → /kr/exams/
│   ├── 🇺🇸 SAT, PSAT, AP, AMC → /us/ 하위
│   ├── 🇬🇧 A-Level, IGCSE, TMUA, MAT → /uk/ 하위
│   └── 🇨🇦 CEMC Competitions → /ca/competitions/
│
├── "Latest from the Blog" Section
│   ├── 최신 글 3-4개 카드 (전 국가 혼합)
│   └── "View All Posts →" → /blog/
│
├── Ad Slot (자연스러운 위치)
│
└── Footer (3컬럼, 큰 글씨, 모든 페이지 공통)
    ├── Resources: Textbooks | Past Papers | Blog
    ├── Countries: Korea | USA | UK | Canada | IB
    ├── Company: About | Contact | Privacy | Support Us
    └── © 2026 MathHub Global
```

### 3.1 허브 페이지 구조

#### `/blog/index.html` — Blog 허브 (전면 개편)

```
현재: 60개 textbook 링크 나열 (Blog라고 주장)
변경: 4개국 + IB 블로그 글 종합 허브

구조:
├── Hero: "MathHub Blog"
├── 최신 글 (전 국가, 최신 5개)
├── 🇰🇷 Korean Blog → /kr/blog/ (32개)
├── 🇺🇸 US Blog → /us/blog/ (7개)
├── 🇬🇧 UK Blog → /uk/blog/ (5개)
├── 🇨🇦 Canada Blog → /ca/blog/ (3개)
├── 🌍 IB Blog → /ib/blog/ (5개)
├── Ad Slot
└── Footer
```

- `/blog/` 내 60개 textbook HTML은 **파일 그대로 유지** (URL 깨짐 방지)
- 하지만 Blog index에서 textbook 링크 완전 제거
- Schema.org `@type: Blog` → `@type: CollectionPage` 변경

#### `/kr/blog/index.html` — 신규 생성

```
현재: 없음 (32개 글이 허브 없이 방치)
변경: 한국어 블로그 허브 페이지 신규 생성

구조:
├── Hero: "MathHub 수학 블로그"
├── 카테고리 필터 (중학수학, 미적분, 정수론, 수능전략...)
├── 글 카드 그리드 (32개)
├── Ad Slot
└── Footer
```

### 3.2 Global Nav Bar 통일

**현재 문제:** 각 국가 페이지마다 nav 구조가 다름

| 페이지 | Nav 구조 |
|--------|---------|
| 메인 | Country cards만 (nav bar 없음) |
| /kr/ | MathHub + KR\|US\|UK\|CA\|IB + 무료 상담 |
| /us/ | MathHub + KR\|US\|UK\|CA\|IB + Free Consult |
| /uk/ | MathHub + KR\|US\|UK\|CA\|IB + Question Bank |
| /ca/ | MathHub + KR\|US\|UK\|CA\|IB + Question Bank |

**통일안:**

```html
<nav class="global-nav">
  <a href="/" class="brand">MathHub</a>
  <div class="nav-links">
    <a href="/blog/">Blog</a>
    <a href="/#textbooks">Textbooks</a>
    <a href="/#papers">Past Papers</a>
  </div>
  <div class="country-switcher">
    🇰🇷 | 🇺🇸 | 🇬🇧 | 🇨🇦 | IB
  </div>
</nav>
```

- 모든 페이지에 동일한 nav
- CTA 버튼은 제거 (과외 상담은 /kr/ 내부로)

### 3.3 Footer 통일 (전 페이지 공통 컴포넌트)

```
┌──────────────────────────────────────────────────────────────┐
│                                                                │
│  MathHub Global                                                │
│  Free math resources for students worldwide                    │
│                                                                │
│  Resources          Countries          Company                 │
│  ──────────         ──────────         ──────────              │
│  Online Textbooks   🇰🇷 Korea          About Us               │
│  Past Papers        🇺🇸 USA            Contact                │
│  Blog               🇬🇧 UK             Privacy Policy         │
│  Question Bank      🇨🇦 Canada         Terms of Use           │
│                     🌍 IB                                      │
│                                                                │
│  ─────────────────────────────────────────────────────         │
│  © 2026 MathHub Global. All rights reserved.                  │
│  Made with ♥ for math students everywhere                     │
│                                                                │
└──────────────────────────────────────────────────────────────┘

font-size: 1em | padding: 60px 20px | background: #0f0f1a | color: rgba(255,255,255,0.85)
```

## 4. AdSense 최적화 전략

### 4.1 승인 요건 충족

| 요건 | 현재 상태 | 필요 조치 |
|------|----------|----------|
| Privacy Policy | ✅ `/privacy.html` 존재 | 없음 |
| About Page | ✅ `/about.html` 존재 | 없음 |
| Contact | ✅ `/contact.html` 존재 | 없음 |
| 충분한 원본 콘텐츠 | ✅ 57개 블로그 + 60개 교재 | 없음 |
| 명확한 네비게이션 | ❌ 혼란스러운 구조 | **이번 개편으로 해결** |
| 적절한 Ad 배치 | ❌ 스크립트만 있고 배치 없음 | Ad slot 추가 |

### 4.2 Ad Slot 배치 전략

```
교재 페이지 (체류시간 긺 — 가장 수익성 높음):
├── 챕터 상단 (리더보드 728x90)
├── 목차 아래 (인피드)
├── 본문 중간 (인아티클) ← AdSense 자동 배치 권장
└── 하단 (리더보드)

Blog 페이지:
├── 글 상단 (리더보드)
├── 본문 중간 (인아티클)
└── 관련 글 섹션 위 (디스플레이)

기출문제 페이지:
├── 다운로드 테이블 위 (리더보드)
└── 시험 간 (인피드)

허브/인덱스 페이지:
├── 카드 그리드 사이 (인피드)
└── Footer 위 (디스플레이)
```

### 4.3 페이지뷰 증가 전략

| 전략 | 구현 방법 |
|------|----------|
| **내부링크 강화** | 모든 교재 챕터 하단에 "다음 챕터" + "관련 기출" 링크 |
| **관련 글 추천** | 블로그 하단에 "You might also like" 카드 3개 |
| **Breadcrumb** | 모든 페이지에 breadcrumb (사용자 탐색 + SEO) |
| **사이드바 활용** | 교재 페이지에 목차 사이드바 (다른 챕터 클릭 유도) |
| **국가 간 크로스링크** | UK A-Level 페이지에 "비슷한 US AP 콘텐츠" 추천 |

## 5. SEO 개선 사항

### 5.1 Schema.org 수정

| 페이지 유형 | 현재 | 변경 |
|------------|------|------|
| `/blog/index.html` | `@type: Blog` ❌ | `@type: CollectionPage` |
| `/blog/*-textbook.html` | 없음 | `@type: Course` + `hasPart` |
| `/kr/blog/*.html` | 없음 | `@type: BlogPosting` |
| `/us/blog/*.html` | 없음 | `@type: BlogPosting` |
| 기출 페이지 | `CollectionPage` ✅ | 유지 |

### 5.2 내부링크 구조

```
현재 내부링크 밀도:
- 메인 → 국가 (4개) + blog(1) + 외부(2) = 7개 ❌ 낮음

목표:
- 메인 → 국가(5) + textbook허브(1) + 기출허브(1) + blog(1) + 국가별 인기콘텐츠(8) = 16개
- 교재 페이지 → 이전/다음 챕터(2) + 관련 기출(2) + 관련 블로그(2) + breadcrumb(3) = 9개
- 블로그 → 관련 글(3) + 관련 교재(2) + breadcrumb(3) = 8개
```

## 6. 작업 목록 (우선순위 순)

### Phase 1: 메인 페이지 개편 (index.html)

| # | 작업 | 상세 |
|---|------|------|
| T1 | Hero 섹션 개편 | 영문 중심, 부제 변경 |
| T2 | Global Nav Bar 추가 | Textbooks, Past Papers, Blog 링크 |
| T3 | CTA 섹션 전면 재구성 | 3개 허브 섹션 (Textbooks, Past Papers, Blog) |
| T4 | "수학 과외 상담" 제거 | /kr/ 페이지로 이동 |
| T5 | "Ko-fi" 메인 CTA에서 제거 | Footer의 Company 컬럼으로 이동 |
| T6 | Footer 3컬럼 확대 | font-size 1em, padding 60px |
| T7 | Ad slot 1개 추가 | Country cards와 Textbooks 섹션 사이 |

### Phase 2: Blog 구조 정리

| # | 작업 | 상세 |
|---|------|------|
| T8 | `/blog/index.html` 전면 개편 | textbook 링크 제거, 4개국 Blog 허브로 |
| T9 | `/kr/blog/index.html` 신규 생성 | 32개 글의 허브 페이지 |
| T10 | Schema.org 수정 | Blog → CollectionPage (blog/index.html) |
| T11 | 각 블로그 글에 BlogPosting schema 추가 | 리치 스니펫 |

### Phase 3: 네비게이션 일관성

| # | 작업 | 상세 |
|---|------|------|
| T12 | Global Nav 전 페이지 통일 | 공통 nav HTML 패턴 적용 |
| T13 | Footer 전 페이지 통일 | 공통 3컬럼 footer 적용 |
| T14 | Breadcrumb 추가 | 모든 하위 페이지에 breadcrumb |

### Phase 4: 광고/수익 최적화

| # | 작업 | 상세 |
|---|------|------|
| T15 | 교재 페이지에 Ad slot 배치 | 인아티클 자동 배치 |
| T16 | 블로그 페이지에 Ad slot 배치 | 상단 + 중간 |
| T17 | "관련 글" 컴포넌트 추가 | 체류시간, PV 증가 |
| T18 | "다음 챕터" 네비게이션 | 교재 페이지 하단 |

## 7. 건드리지 않는 것

| 항목 | 이유 |
|------|------|
| `/blog/*.html` textbook 파일 | URL 깨짐 방지 (SEO) |
| `/kr/`, `/us/`, `/uk/`, `/ca/` 각국 index.html | Phase 3에서 nav/footer만 수정 |
| pyquiz 코드 | Board 지시 — 수정 금지 |
| PDF 파일 | 변경 불필요 |
| 기출문제 페이지 내부 구조 | 이미 잘 되어 있음 |

## 8. 리스크 및 대응

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| `/blog/` textbook URL 깨짐 | 낮음 | 높음 | 파일 이동하지 않음, index만 변경 |
| AdSense 재심사 지연 | 중간 | 중간 | 구조 개편 후 재신청 |
| Nav 변경 시 기존 스타일 깨짐 | 중간 | 중간 | 페이지별 테스트 |
| 검색 순위 일시 하락 | 낮음 | 중간 | 301 redirect 없이 내부링크만 변경 |

## 9. 성공 기준

- [ ] "Blog" 클릭 → 실제 블로그 글 목록 (4개국 + IB)
- [ ] "Textbooks" 클릭 → 교재 페이지 (국가별 분류)
- [ ] "Past Papers" 클릭 → 기출문제 페이지 (국가별 분류)
- [ ] Footer 3컬럼, font-size ≥ 1em, 모든 페이지 동일
- [ ] Global Nav 모든 페이지 동일
- [ ] `/kr/blog/index.html` 존재하고 32개 글 접근 가능
- [ ] 메인 페이지에 한국어 전용 콘텐츠 없음
- [ ] "Ko-fi" 메인 CTA에서 제거
- [ ] Ad slot 최소 1개 이상 배치 (교재/블로그)
- [ ] 기존 URL 깨지지 않음 (sitemap 내 모든 URL 유효)
- [ ] Schema.org 타입 정확함 (Blog ≠ Textbook)
