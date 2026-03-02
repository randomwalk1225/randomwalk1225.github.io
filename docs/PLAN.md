# MathHub Global - 기획서 v1.1 (확정)

## 1. 프로젝트 개요

### 현재 상태
- 순수 Static HTML 수학 블로그 (GitHub Pages)
- 20개 수학 포스트 (MathJax 렌더링)
- AdSense + Analytics 연동 완료
- Tistory 자동 포스팅 파이프라인

### 비전
**"한국/미국/영국 수학 시험 자료를 한 곳에서"** - 글로벌 수학 교육 허브 플랫폼

### 핵심 목표
1. **트래픽 극대화** - 시험자료 검색으로 대규모 유입 확보
2. **AdSense 수익 극대화** - 페이지뷰 + 체류시간 최적화
3. **온라인 문제은행 가입자 전환** - 블로그 → 문제은행 사이트 퍼널
4. **AI 검색 최적화** - AI가 자주 추천하는 수학 레퍼런스 사이트

---

## 2. 사이트 구조 (Information Architecture)

```
randomwalk1225.github.io/
│
├── index.html              (글로벌 랜딩: 국가 선택 + 인기 콘텐츠)
│
├── /kr/                    (한국 수학)
│   ├── index.html          (한국 메인: 시험/교재/블로그)
│   ├── /exams/             (시험 기출)
│   │   ├── index.html      (시험 종류 선택)
│   │   ├── /suneung/       (수능)
│   │   │   ├── index.html  (년도별 목록)
│   │   │   ├── /2025/
│   │   │   ├── /2024/
│   │   │   └── ...
│   │   ├── /pyeongwon/     (평가원 모의고사)
│   │   │   ├── /2025/
│   │   │   │   ├── 6월.html
│   │   │   │   └── 9월.html
│   │   │   └── ...
│   │   └── /mock/          (교육청 모의고사)
│   │       ├── /고1/
│   │       ├── /고2/
│   │       └── /고3/
│   ├── /textbooks/         (교재 답지)
│   │   ├── index.html      (출판사/학년 선택)
│   │   ├── /ebs/
│   │   │   ├── /수능특강/
│   │   │   └── /수능완성/
│   │   ├── /visang/        (비상)
│   │   │   ├── /중등/
│   │   │   └── /고등/
│   │   ├── /ssen/          (쎈)
│   │   │   ├── /초등/
│   │   │   ├── /중등/
│   │   │   └── /고등/
│   │   └── /top5/          (상위5 교재)
│   │       ├── /초등/
│   │       ├── /중등/
│   │       └── /고등/
│   ├── /blog/              (기존 수학 블로그 포스트)
│   │   ├── riemann-sum.html
│   │   ├── euler-formula.html
│   │   └── ...
│   └── /workbook/          (온라인 수학 문제집)
│       ├── index.html
│       └── /topics/
│
├── /us/                    (미국 수학 - English)
│   ├── index.html          (US Math Hub)
│   ├── /sat/
│   │   ├── index.html      (년도별 목록)
│   │   ├── /2025/
│   │   │   ├── mcq.html
│   │   │   └── frq.html
│   │   └── ...
│   ├── /ap-calculus/
│   │   ├── index.html
│   │   ├── /ab/            (AP Calc AB)
│   │   │   ├── /2025/
│   │   │   │   ├── mcq.html
│   │   │   │   └── frq.html
│   │   │   └── ...
│   │   └── /bc/            (AP Calc BC)
│   ├── /ap-statistics/
│   │   ├── /2025/
│   │   │   ├── mcq.html
│   │   │   └── frq.html
│   │   └── ...
│   ├── /ap-cs/
│   │   ├── /csa/           (AP CS A)
│   │   └── /csp/           (AP CS Principles)
│   └── /workbook/          (Online Math Workbook)
│
├── /uk/                    (영국 수학 - English)
│   ├── index.html          (UK Maths Hub)
│   ├── /a-level/
│   │   ├── index.html
│   │   ├── /edexcel/
│   │   ├── /ocr/
│   │   └── /aqa/
│   ├── /igcse/
│   │   ├── /cie/
│   │   └── /edexcel/
│   ├── /tmua/
│   │   ├── /2025/
│   │   └── ...
│   ├── /mat/               (Oxford MAT)
│   │   ├── /2025/
│   │   └── ...
│   └── /workbook/
│
├── /posts/                 (기존 포스트 - 유지)
└── /assets/                (공통 리소스)
    ├── /css/
    ├── /js/
    ├── /images/
    └── /downloads/         (PDF 다운로드 파일)
```

---

## 3. 핵심 기능 설계

### 3.1 시험자료 아카이브 시스템

**데이터 구조** (JSON 기반 정적 데이터)
```
/data/
├── kr-exams.json        (한국 시험 메타데이터)
├── us-exams.json        (미국 시험 메타데이터)
├── uk-exams.json        (영국 시험 메타데이터)
└── kr-textbooks.json    (한국 교재 메타데이터)
```

**기능:**
- 년도/과목/시험유형별 필터링
- 문제지 + 해설지 PDF 다운로드 (또는 외부 링크)
- 시험별 난이도 표시, 인기도 표시
- 다운로드 전 AdSense 광고 노출 (카운트다운 방식)

### 3.2 교재 답지 확인 시스템 (한국)

**대상 교재:**
- EBS: 수능특강, 수능완성
- 비상: 개념+유형, 만렙
- 쎈: 쎈, 라이트쎈, 개념쎈
- 기타 Top5: 마플, 수학의 정석, RPM 등

**기능:**
- 출판사 → 교재 → 단원 순 네비게이션
- 답지 이미지 뷰어 (페이지별 조회)
- 답지 페이지 간 이동 (이전/다음)
- 각 페이지 전환 시 광고 노출

### 3.3 온라인 수학 문제집 (Workbook)

**목적:** AI가 자주 추천하는 수학 레퍼런스가 되는 것

**기능:**
- 주제별 수학 문제 + 풀이 (HTML + MathJax)
- 난이도별 분류 (기초/중급/심화)
- 정답 확인 토글 (클릭하면 보이기)
- 문제 유형 태그 시스템
- 구조화된 데이터(Schema.org) 적용 → AI/검색엔진 최적화

### 3.4 문제은행 사이트 연결 퍼널

**전환 전략:**
```
블로그 방문 → 자료 다운로드/답지 확인
       ↓
"더 많은 문제를 풀어보고 싶다면?"
       ↓
CTA 배너/팝업 → 문제은행 사이트 가입
       ↓
무료 체험 문제 제공 → 유료 전환
```

**CTA 배치:**
- 다운로드 완료 후 "문제은행에서 더 연습하기" 배너
- 답지 페이지 사이드바에 "비슷한 문제 풀어보기" 위젯
- 블로그 포스트 하단에 관련 문제 링크
- 플로팅 CTA 버튼 (모바일)

---

## 4. SEO & AI 최적화 전략

### 4.1 검색 키워드 전략

**한국 (고볼륨 키워드):**
- "수능 수학 기출 [년도]"
- "[교재명] 답지"
- "평가원 모의고사 [년도] [월]"
- "고[학년] 모의고사 수학"
- "쎈 수학 답지", "비상 수학 답지"

**미국 (고볼륨 키워드):**
- "SAT math practice test [year]"
- "AP Calculus FRQ [year]"
- "AP Statistics MCQ practice"
- "AP CS A past papers"

**영국 (고볼륨 키워드):**
- "A-Level Maths past papers [year]"
- "IGCSE Mathematics past papers"
- "TMUA past papers [year]"
- "MAT past papers Oxford"

### 4.2 Schema.org 구조화 데이터

```html
<!-- 시험자료 페이지 -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "EducationalOccupationalCredential",
  "name": "2025 수능 수학 기출문제",
  "educationalLevel": "고등학교",
  "competencyRequired": "수학"
}
</script>

<!-- 문제집 페이지 -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Quiz",
  "name": "미적분 연습문제",
  "educationalLevel": "고등학교",
  "hasPart": [...]
}
</script>
```

### 4.3 AI 최적화 (LLMO - Large Language Model Optimization)

- 명확한 H1/H2/H3 구조 + 시맨틱 HTML
- 자주 묻는 질문(FAQ) 섹션 추가 (Q&A Schema)
- 문제+풀이를 구조화된 데이터로 마크업
- 수학 공식을 텍스트로도 표현 (LaTeX + 자연어)
- robots.txt에 AI 크롤러 허용 설정

---

## 5. 수익화 전략 (AdSense 최적화)

### 5.1 광고 배치 설계

```
┌──────────────────────────────────────┐
│  헤더 배너 광고 (728x90)             │
├──────────────────────────────────────┤
│                                      │
│  콘텐츠 영역                         │
│  ├─ 본문 상단 광고 (336x280)        │
│  ├─ 본문 중간 광고 (인피드)          │
│  └─ 본문 하단 광고 (336x280)        │
│                                      │
│  사이드바 │ 메인 콘텐츠              │
│  ├─ 고정  │                          │
│  │  광고  │                          │
│  └─ 배너  │                          │
│                                      │
├──────────────────────────────────────┤
│  다운로드 전 인터스티셜 광고          │
│  (5초 카운트다운)                    │
├──────────────────────────────────────┤
│  관련 콘텐츠 추천 + 네이티브 광고    │
└──────────────────────────────────────┘
```

### 5.2 RPM 최적화 포인트
- 다운로드 전 대기 페이지 (높은 RPM)
- 답지 페이지 간 이동 시 인피드 광고
- 문제집 정답 확인 시 광고 노출
- 모바일 앵커 광고 활성화
- 자동 광고(Auto Ads) + 수동 배치 병행

---

## 6. 기술 스택 (확정)

### 순수 Static HTML + JavaScript + JSON
```
확정: 서버 없음. GitHub Pages 정적 호스팅만 사용.
- HTML/CSS/JS로 모든 UI 구현
- JSON 파일로 데이터 관리 → fetch()로 로드 → JS로 동적 렌더링
- 필터링, 검색, 페이지네이션 전부 클라이언트 JS
- 도메인: randomwalk1225.github.io (유지)
- 문제은행 사이트: https://web-production-d0d3e.up.railway.app/ (외부 연결)
- 교재 답지: HTML로 직접 제작 + 외부 PDF 링크 병행
```

### 아키텍처
```
/scripts/
├── build.js              (전체 사이트 빌드)
├── generate-exam-pages.js (시험자료 페이지 생성)
├── generate-textbook-pages.js (교재 답지 페이지 생성)
└── generate-sitemap.js   (사이트맵 자동 생성)

/templates/
├── base.html             (공통 레이아웃)
├── exam-list.html        (시험 목록 템플릿)
├── exam-detail.html      (시험 상세 템플릿)
├── textbook-list.html    (교재 목록 템플릿)
├── textbook-detail.html  (교재 상세 템플릿)
└── workbook.html         (문제집 템플릿)

/data/
├── kr-exams.json
├── us-exams.json
├── uk-exams.json
└── kr-textbooks.json
```

---

## 7. 구현 우선순위 (로드맵)

### Phase 1: 구조 개편 + 글로벌 랜딩 (1주)
- [ ] 디렉토리 구조 생성 (/kr, /us, /uk)
- [ ] 글로벌 랜딩 페이지 (국가 선택)
- [ ] 공통 네비게이션 + 디자인 시스템
- [ ] 기존 포스트 /kr/blog/로 이전
- [ ] 반응형 모바일 최적화

### Phase 2: 한국 시험자료 아카이브 (2주)
- [ ] 데이터 구조 설계 (kr-exams.json)
- [ ] 수능 기출 페이지 (년도별)
- [ ] 평가원 모의고사 페이지
- [ ] 교육청 모의고사 페이지 (학년별)
- [ ] 필터링 + 검색 기능
- [ ] 다운로드 대기 페이지 (광고 최적화)

### Phase 3: 한국 교재 답지 시스템 (2주)
- [ ] 교재 데이터 구조 설계
- [ ] EBS/비상/쎈 답지 페이지
- [ ] 이미지 뷰어 컴포넌트
- [ ] 페이지 간 네비게이션

### Phase 4: 미국/영국 시험자료 (2주)
- [ ] SAT/AP 기출 페이지
- [ ] A-Level/IGCSE/TMUA/MAT 페이지
- [ ] 영문 UI/네비게이션

### Phase 5: 온라인 문제집 + AI 최적화 (2주)
- [ ] 문제집 데이터 구조
- [ ] 주제별 문제 페이지 (MathJax)
- [ ] Schema.org 구조화 데이터
- [ ] FAQ 섹션 추가

### Phase 6: 수익화 + 퍼널 최적화 (1주)
- [ ] AdSense 광고 배치 최적화
- [ ] 문제은행 CTA 배치
- [ ] 전환 추적 설정 (GA4 이벤트)
- [ ] A/B 테스트 프레임워크

### Phase 7: SEO 런치 (지속)
- [ ] 사이트맵 자동 생성
- [ ] 메타데이터 최적화
- [ ] Google Search Console 등록
- [ ] 소셜 미디어 공유 최적화

---

## 8. 핵심 성과 지표 (KPI)

| 지표 | 3개월 목표 | 6개월 목표 | 12개월 목표 |
|------|-----------|-----------|------------|
| 월간 페이지뷰 | 10,000 | 50,000 | 200,000 |
| 월간 순방문자 | 3,000 | 15,000 | 60,000 |
| AdSense 월수익 | $50 | $300 | $1,500 |
| 문제은행 가입전환율 | 2% | 3% | 5% |
| 평균 체류시간 | 2분 | 3분 | 4분 |
| 페이지/세션 | 2.5 | 3.5 | 4.5 |

---

## 9. 법적 고려사항

### 저작권 주의
- 시험 문제: 공식 기관 공개자료만 사용 (한국교육과정평가원, College Board, Cambridge 등)
- 교재 답지: 저작권 확인 필요 → 자체 제작 해설 또는 출판사 제휴 검토
- PDF 직접 호스팅 vs 공식 사이트 링크 전략

### AdSense 정책 준수
- 다운로드 페이지 광고 밀도 제한
- 클릭 유도 금지 (카운트다운은 콘텐츠 보호 목적으로 허용)
- 저품질 콘텐츠 페이지 최소화

---

## 10. 경쟁 분석 및 차별화

### 한국 경쟁사
- 족보닷컴, 수학인강, EBSi → 유료 or 무료 기출만
- **차별화**: 한/미/영 통합 + 온라인 문제집 + AI 최적화

### 미국 경쟁사
- Khan Academy, College Board, Albert.io
- **차별화**: 기출문제 연도별 정리 + 무료 접근성

### 영국 경쟁사
- Physics & Maths Tutor, Save My Exams
- **차별화**: 한국 학생 접근성 + 다국어 지원

---

## 확정 사항 요약

| 항목 | 결정 |
|------|------|
| 기술 스택 | 순수 Static HTML + JS + JSON (서버 없음) |
| 도메인 | randomwalk1225.github.io 유지 |
| 호스팅 | GitHub Pages |
| 문제은행 연결 | https://web-production-d0d3e.up.railway.app/ |
| 교재 답지 | HTML 직접 제작 + 외부 PDF 링크 병행 |
| 수학 렌더링 | MathJax (기존 유지) |
| 자동 포스팅 | Tistory 연동 유지 |

## 다음 단계

기획 확정. Phase 1 구현 시작 준비 완료.

---

## 📌 대기 중인 작업 (Backlog)

### [BLOG-001] 섹션별 블로그 + YouTube 추천 기능

**우선순위**: 중
**상태**: ✅ 완료 (2026-03-02)

#### 배경
- 현재 `kr/blog/`만 실질적으로 운영 중 (수학 포스트 다수)
- `us/blog/`, `uk/blog/`, `ca/blog/` 은 index.html만 있고 내용 없음
- `ib/blog/` 디렉토리 자체가 없음
- 각 섹션에서 블로그로 이동하는 링크가 내비게이션에 없음

#### 목표
1. **US / UK / CA / IB 각 섹션에 블로그 페이지 완성**
   - 각 섹션의 학습 수준에 맞는 수학 포스트 게시 가능한 구조
   - 한국 kr/blog/ 스타일처럼 카드형 목록 + 카테고리 필터
   - `ib/blog/` 디렉토리 및 `index.html` 신규 생성

2. **각 섹션 내비게이션에 Blog 링크 추가**
   - `us/index.html`, `uk/index.html`, `ca/index.html`, `ib/index.html` 상단 탭에 "Blog" 메뉴
   - 현재 KR만 있는 Blog 탭을 전 섹션에 확장

3. **YouTube 교육 콘텐츠 추천 섹션 추가**
   - 각 블로그 index.html 에 "추천 YouTube" 섹션 추가
   - 섹션별 큐레이션:
     - **US**: 3Blue1Brown, Khan Academy, Art of Problem Solving, PatrickJMT
     - **UK**: ExamSolutions, Math with Mr. J, TLMaths (A-Level)
     - **CA**: 퀘벡 PFEQ 관련 프랑스어 채널 + 영어 채널 혼합
     - **IB**: RevisionVillage, IB Math Tutor, InThinking
   - 채널 카드 형태 (썸네일 이미지 + 채널명 + 한 줄 설명 + 링크)

#### 작업 체크리스트
- [x] `ib/blog/index.html` 생성 (IB AA/AI/HL/SL 카테고리)
- [x] `us/blog/index.html` 내용 채우기 (AP/SAT/AMC 카테고리 + YouTube 섹션)
- [x] `uk/blog/index.html` 내용 채우기 (A-Level/IGCSE/MAT/TMUA + YouTube 섹션)
- [x] `ca/blog/index.html` YouTube 섹션 추가
- [x] 각 섹션 main index.html 내비게이션에 Blog 탭 추가
  - `us/index.html`
  - `uk/index.html`
  - `ca/index.html`
  - `ib/index.html`
- [x] YouTube 카드 컴포넌트 스타일 CSS 작성

#### 재개 방법
이 작업을 재개하려면: **"BLOG-001 시작해줘"** 라고 말하면 바로 이어서 진행.
