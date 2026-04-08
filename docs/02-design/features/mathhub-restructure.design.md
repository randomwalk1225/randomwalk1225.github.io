# Design: MathHub.io 사이트 구조 개편

> Plan 문서 참조: `docs/01-plan/features/mathhub-restructure.plan.md`

## 1. 디자인 시스템 (기존 유지 + 확장)

### 1.1 색상 (기존 common.css 유지)

```
Primary:   #667eea (보라/파랑 — 브랜드 컬러)
NavBg:     #1a1a2e (다크 네이비)
MainBg:    #0f0f1a (메인 페이지 다크)
SubBg:     #f5f5f5 (서브 페이지 라이트)
Text:      #333 (서브), #fff (메인)
Muted:     #64748b, #94a3b8
Accent:    #667eea (hover, active)

국가별 강조색 (기존 유지):
  KR: #667eea (보라)
  US: #1e3a5f (네이비), #2563eb (블루)
  UK: #1a2744 (다크블루), #c8102e (레드)
  CA: #b91c1c (레드)
  IB: #0f6b5b (틸)
```

### 1.2 타이포그래피

```
Font: 'Noto Sans KR', Arial, sans-serif (변경 없음)
Nav:     0.9em
Body:    1em, line-height 1.8
H1:      3em → 2.8em (메인), 2.2em (서브)
H2:      1.5em
H3:      1.3em
Footer:  1em (현재 0.85em → 확대)
Caption: 0.85em
```

### 1.3 간격/레이아웃

```
max-width: 1200px (신규 섹션), 1000px (기존 country cards), 900px (콘텐츠)
gap: 24px (카드 그리드)
border-radius: 16px (카드), 12px (버튼/태그), 8px (입력)
```

## 2. Global Nav Bar 개편

### 2.1 현재 vs 변경

**현재 (common.css):**
```
MathHub | KR US UK CA IB | [Question Bank] (CTA)
```

**변경:**
```
MathHub | KR US UK CA IB | Textbooks  Past Papers  Blog
```

### 2.2 common.css 변경사항

```css
/* 기존 .nav-cta 스타일 유지하되, Question Bank 텍스트 → 제거 */
/* 새 링크 3개 추가: Textbooks, Past Papers, Blog */

/* 추가: nav 구분선 */
.nav-divider {
    width: 1px;
    height: 20px;
    background: rgba(255,255,255,0.15);
    margin: 0 4px;
}
```

### 2.3 HTML 구조 (모든 페이지 공통)

```html
<nav class="global-nav">
    <a href="/" class="nav-brand">MathHub</a>
    <div class="nav-links">
        <a href="/kr/">KR</a>
        <a href="/us/">US</a>
        <a href="/uk/">UK</a>
        <a href="/ca/">CA</a>
        <a href="/ib/">IB</a>
        <span class="nav-divider"></span>
        <a href="/#textbooks">Textbooks</a>
        <a href="/#papers">Past Papers</a>
        <a href="/blog/">Blog</a>
    </div>
</nav>
```

### 2.4 메인 페이지(index.html)에도 nav 추가

현재 메인 페이지에는 nav bar가 없음. 추가한다.
- 배경: `#0f0f1a` (메인 bg와 일체감)
- 스타일: common.css의 `.global-nav` 그대로 사용

## 3. 메인 페이지 (index.html) 전면 개편

### 3.1 섹션 순서

```
1. Global Nav (신규)
2. Hero (수정)
3. Stats (수정)
4. Country Cards (유지)
5. Free Online Textbooks (신규 — "Study Guides" 대체)
6. Past Papers & Exams (신규 — "Question Bank" 대체)
7. Latest from the Blog (신규 — 실제 블로그 글)
8. Footer (전면 개편)
```

### 3.2 Hero 섹션 수정

```html
<!-- 현재 -->
<div class="hero">
    <h1>MathHub Global</h1>
    <p>Exam past papers, answer keys & online workbooks for students worldwide</p>
</div>

<!-- 변경 -->
<div class="hero">
    <h1>MathHub Global</h1>
    <p>Free math textbooks, past papers & study guides for students in Korea, USA, UK & Canada</p>
</div>
```

- `lang="ko"` → `lang="en"` 변경

### 3.3 Stats 수정

```html
<!-- 현재 -->
<div class="stat-num">4</div><div class="stat-label">Countries</div>
<div class="stat-num">20+</div><div class="stat-label">Articles</div>

<!-- 변경 -->
<div class="stat-num">5</div><div class="stat-label">Regions</div>
<div class="stat-num">4,200+</div><div class="stat-label">Past Papers</div>
<div class="stat-num">60+</div><div class="stat-label">Textbook Chapters</div>
<div class="stat-num">50+</div><div class="stat-label">Blog Posts</div>
```

### 3.4 삭제할 섹션

```html
<!-- 1. 한국어 과외 상담 — 삭제 (글로벌 메인에서) -->
<div class="cta-section">
    <h3>📐 수학 과외 무료 상담</h3>
    ...
</div>

<!-- 2. Study Guides & Tips — 삭제 (Textbooks 섹션으로 대체) -->
<div class="cta-section">
    <h3>Study Guides & Tips</h3>
    ...
</div>

<!-- 3. Question Bank — 삭제 (Past Papers 섹션으로 대체) -->
<div class="cta-section">
    <h3>Want more practice?</h3>
    ...
</div>

<!-- 4. Ko-fi Support — 삭제 (Footer로 이동) -->
<div style="text-align:center; ...">
    <a href="https://ko-fi.com/mathhubglobal" ...>☕ Support on Ko-fi</a>
</div>
```

### 3.5 "Free Online Textbooks" 섹션 (신규)

```html
<section id="textbooks" class="hub-section">
    <h2 class="hub-title">Free Online Textbooks</h2>
    <p class="hub-subtitle">Interactive math textbooks with Desmos visualizations</p>
    <div class="hub-grid">
        <a href="/us/" class="hub-card">
            <span class="hub-flag">🇺🇸</span>
            <h3>USA</h3>
            <ul>
                <li>Pre-Algebra (8 chapters)</li>
                <li>Algebra 2 (10 chapters)</li>
                <li>Precalculus (10 chapters)</li>
                <li>AP Calculus AB/BC (11 chapters)</li>
            </ul>
        </a>
        <a href="/uk/" class="hub-card">
            <span class="hub-flag">🇬🇧</span>
            <h3>UK</h3>
            <ul>
                <li>IGCSE Mathematics (9 chapters)</li>
                <li>A-Level Mathematics (12 chapters)</li>
                <li>A-Level Further Maths (12 chapters)</li>
            </ul>
        </a>
        <a href="/ca/textbook/" class="hub-card">
            <span class="hub-flag">🇨🇦</span>
            <h3>Canada</h3>
            <ul>
                <li>Ontario Curriculum (6 courses)</li>
                <li>Québec — Secondaire (11 chapters)</li>
            </ul>
        </a>
        <a href="/ib/" class="hub-card">
            <span class="hub-flag">🌍</span>
            <h3>IB</h3>
            <ul>
                <li>Math AA SL/HL (9 chapters)</li>
                <li>Math AI SL/HL (7 chapters)</li>
            </ul>
        </a>
    </div>
</section>
```

**CSS:**
```css
.hub-section {
    max-width: 1100px;
    margin: 60px auto;
    padding: 0 20px;
}
.hub-title {
    text-align: center;
    font-size: 1.8em;
    color: #fff;
    margin-bottom: 8px;
}
.hub-subtitle {
    text-align: center;
    color: rgba(255,255,255,0.5);
    font-size: 1em;
    margin-bottom: 32px;
}
.hub-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
}
.hub-card {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 14px;
    padding: 24px;
    text-decoration: none;
    color: #fff;
    transition: all 0.3s;
}
.hub-card:hover {
    background: rgba(255,255,255,0.1);
    border-color: rgba(102,126,234,0.4);
    transform: translateY(-4px);
}
.hub-flag { font-size: 2em; display: block; margin-bottom: 8px; }
.hub-card h3 { font-size: 1.2em; margin-bottom: 12px; }
.hub-card ul { list-style: none; }
.hub-card li {
    padding: 5px 0;
    color: rgba(255,255,255,0.7);
    font-size: 0.9em;
    border-bottom: 1px solid rgba(255,255,255,0.05);
}
.hub-card li::before { content: '→ '; color: #667eea; }
```

### 3.6 "Past Papers & Exams" 섹션 (신규)

```html
<section id="papers" class="hub-section">
    <h2 class="hub-title">Past Papers & Exams</h2>
    <p class="hub-subtitle">4,200+ official exam papers with answer keys — free PDF download</p>
    <div class="hub-grid">
        <a href="/kr/exams/" class="hub-card">
            <span class="hub-flag">🇰🇷</span>
            <h3>Korea</h3>
            <ul>
                <li>수능 (CSAT) 기출문제</li>
                <li>평가원 모의고사</li>
                <li>교육청 모의고사</li>
                <li>KMO (올림피아드)</li>
            </ul>
            <span class="hub-count">512 papers</span>
        </a>
        <a href="/us/sat/" class="hub-card">
            <span class="hub-flag">🇺🇸</span>
            <h3>USA</h3>
            <ul>
                <li>SAT Released Tests</li>
                <li>PSAT / NMSQT</li>
                <li>AP Calculus & Statistics</li>
                <li>AMC / AIME / USAMO</li>
            </ul>
            <span class="hub-count">69 papers</span>
        </a>
        <a href="/uk/a-level/" class="hub-card">
            <span class="hub-flag">🇬🇧</span>
            <h3>UK</h3>
            <ul>
                <li>A-Level Maths, Physics, Chemistry</li>
                <li>IGCSE Mathematics</li>
                <li>TMUA (Cambridge)</li>
                <li>MAT (Oxford)</li>
            </ul>
            <span class="hub-count">3,600+ papers</span>
        </a>
        <a href="/ca/" class="hub-card">
            <span class="hub-flag">🇨🇦</span>
            <h3>Canada</h3>
            <ul>
                <li>Gauss (Grades 7–8)</li>
                <li>Pascal / Cayley / Fermat</li>
                <li>Euclid (Grade 12)</li>
            </ul>
            <span class="hub-count">CEMC Archive</span>
        </a>
    </div>
</section>
```

**추가 CSS:**
```css
.hub-count {
    display: inline-block;
    margin-top: 12px;
    font-size: 0.8em;
    color: #667eea;
    font-weight: 600;
    background: rgba(102,126,234,0.1);
    padding: 3px 10px;
    border-radius: 12px;
}
```

### 3.7 "Latest from the Blog" 섹션 (신규)

```html
<section class="hub-section">
    <h2 class="hub-title">Latest from the Blog</h2>
    <p class="hub-subtitle">Study tips, exam strategies, and math insights</p>
    <div class="blog-preview-grid">
        <!-- 최신 글 4개 하드코딩 (각국 1개씩) -->
        <a href="/us/blog/ap-calculus-ab-exam-tips.html" class="blog-preview-card">
            <span class="bp-region">🇺🇸 US</span>
            <h3>AP Calculus AB 2026: How to Score a 5</h3>
            <p>Master the exam with proven strategies for FRQ and MCQ sections.</p>
        </a>
        <a href="/uk/blog/a-level-maths-revision-guide.html" class="blog-preview-card">
            <span class="bp-region">🇬🇧 UK</span>
            <h3>A-Level Maths Revision Guide</h3>
            <p>Essential revision strategies for Pure, Statistics, and Mechanics.</p>
        </a>
        <a href="/kr/blog/csat-math-format-history.html" class="blog-preview-card">
            <span class="bp-region">🇰🇷 KR</span>
            <h3>수능 수학 출제 형식 변천사</h3>
            <p>2005년부터 2028년까지 수능 수학 영역 변화 분석</p>
        </a>
        <a href="/ca/blog/canadian-math-competitions.html" class="blog-preview-card">
            <span class="bp-region">🇨🇦 CA</span>
            <h3>Canadian Math Competitions Guide</h3>
            <p>Complete guide to CEMC competitions from Gauss to Euclid.</p>
        </a>
    </div>
    <div style="text-align:center; margin-top:24px;">
        <a href="/blog/" class="cta-main-btn">View All Blog Posts →</a>
    </div>
</section>
```

**CSS:**
```css
.blog-preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
}
.blog-preview-card {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 14px;
    padding: 24px;
    text-decoration: none;
    color: #fff;
    transition: all 0.3s;
}
.blog-preview-card:hover {
    background: rgba(255,255,255,0.1);
    transform: translateY(-4px);
}
.bp-region {
    font-size: 0.8em;
    color: #667eea;
    font-weight: 600;
    letter-spacing: 0.05em;
}
.blog-preview-card h3 {
    font-size: 1.1em;
    margin: 8px 0;
    line-height: 1.4;
}
.blog-preview-card p {
    color: rgba(255,255,255,0.6);
    font-size: 0.9em;
    line-height: 1.5;
    margin: 0;
}
```

## 4. Footer 전면 개편 (전 페이지 공통)

### 4.1 HTML 구조

```html
<footer class="site-footer">
    <div class="footer-grid">
        <div class="footer-col">
            <h4>Resources</h4>
            <ul>
                <li><a href="/#textbooks">Online Textbooks</a></li>
                <li><a href="/#papers">Past Papers</a></li>
                <li><a href="/blog/">Blog</a></li>
            </ul>
        </div>
        <div class="footer-col">
            <h4>Countries</h4>
            <ul>
                <li><a href="/kr/">🇰🇷 Korea</a></li>
                <li><a href="/us/">🇺🇸 USA</a></li>
                <li><a href="/uk/">🇬🇧 UK</a></li>
                <li><a href="/ca/">🇨🇦 Canada</a></li>
                <li><a href="/ib/">🌍 IB</a></li>
            </ul>
        </div>
        <div class="footer-col">
            <h4>Company</h4>
            <ul>
                <li><a href="/about.html">About Us</a></li>
                <li><a href="/contact.html">Contact</a></li>
                <li><a href="/privacy.html">Privacy Policy</a></li>
                <li><a href="https://ko-fi.com/mathhubglobal" target="_blank" rel="noopener">Support Us ☕</a></li>
            </ul>
        </div>
    </div>
    <div class="footer-bottom">
        <p>&copy; 2026 MathHub Global. All rights reserved.</p>
    </div>
</footer>
```

### 4.2 CSS (common.css에 추가)

```css
/* ===== Site Footer (v2) ===== */
.site-footer {
    background: #0f0f1a;
    border-top: 1px solid rgba(255,255,255,0.08);
    padding: 60px 20px 30px;
    margin-top: 60px;
}
.footer-grid {
    max-width: 900px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 40px;
}
.footer-col h4 {
    color: rgba(255,255,255,0.9);
    font-size: 1em;
    font-weight: 700;
    margin-bottom: 16px;
    letter-spacing: 0.03em;
}
.footer-col ul {
    list-style: none;
    margin: 0;
    padding: 0;
}
.footer-col li {
    margin-bottom: 10px;
}
.footer-col a {
    color: rgba(255,255,255,0.6);
    text-decoration: none;
    font-size: 0.95em;
    transition: color 0.2s;
}
.footer-col a:hover {
    color: #667eea;
}
.footer-bottom {
    max-width: 900px;
    margin: 40px auto 0;
    padding-top: 20px;
    border-top: 1px solid rgba(255,255,255,0.08);
    text-align: center;
}
.footer-bottom p {
    color: rgba(255,255,255,0.4);
    font-size: 0.9em;
    margin: 0;
}

/* 라이트 배경 페이지용 */
body:not(.dark-page) .site-footer {
    background: #1a1a2e;
}

@media (max-width: 768px) {
    .footer-grid {
        grid-template-columns: 1fr;
        gap: 30px;
        text-align: center;
    }
}
```

### 4.3 기존 Footer와의 관계

- `index.html`의 인라인 `.footer` → `.site-footer`로 교체
- `common.css`의 `.footer` 클래스 → 유지 (기존 서브페이지 호환), 신규 페이지는 `.site-footer` 사용
- 점진적으로 전 페이지 `.site-footer` 적용

## 5. `/blog/index.html` 개편 — Blog 허브

### 5.1 현재 → 변경

**현재:** textbook 60개 링크 나열 (AP Calculus 11챕터, Precalculus 10챕터...)
**변경:** 5개 지역 블로그 허브

### 5.2 HTML 구조

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>MathHub Blog - Math Study Tips & Exam Strategies</title>
    <meta name="description" content="Math education blog: SAT tips, A-Level revision, AP exam strategies, and more across Korea, USA, UK & Canada.">
    <!-- Schema.org: CollectionPage (NOT Blog) -->
</head>
<body>
    <nav class="global-nav">...</nav>

    <div class="blog-hero">
        <h1>MathHub Blog</h1>
        <p>Study tips, exam strategies, and math insights from around the world</p>
    </div>

    <div class="blog-hub-content">
        <!-- 최신 글 5개 (전 지역 혼합) -->
        <section class="blog-hub-section">
            <h2>Latest Posts</h2>
            <div class="posts-grid">
                <!-- 최신 글 카드 5개 -->
            </div>
        </section>

        <!-- 지역별 섹션 -->
        <section class="blog-hub-section">
            <h2>🇰🇷 Korea <span class="post-count">32 posts</span></h2>
            <div class="posts-grid">
                <!-- 한국 최신 3개 카드 -->
            </div>
            <a href="/kr/blog/" class="view-all-link">View all Korean posts →</a>
        </section>

        <section class="blog-hub-section">
            <h2>🇺🇸 USA <span class="post-count">7 posts</span></h2>
            <div class="posts-grid">
                <!-- US 최신 3개 카드 -->
            </div>
            <a href="/us/blog/" class="view-all-link">View all US posts →</a>
        </section>

        <section class="blog-hub-section">
            <h2>🇬🇧 UK <span class="post-count">5 posts</span></h2>
            <div class="posts-grid"><!-- UK 최신 3개 --></div>
            <a href="/uk/blog/" class="view-all-link">View all UK posts →</a>
        </section>

        <section class="blog-hub-section">
            <h2>🇨🇦 Canada <span class="post-count">3 posts</span></h2>
            <div class="posts-grid"><!-- CA 최신 3개 --></div>
            <a href="/ca/blog/" class="view-all-link">View all Canada posts →</a>
        </section>

        <section class="blog-hub-section">
            <h2>🌍 IB <span class="post-count">5 posts</span></h2>
            <div class="posts-grid"><!-- IB 최신 3개 --></div>
            <a href="/ib/blog/" class="view-all-link">View all IB posts →</a>
        </section>
    </div>

    <footer class="site-footer">...</footer>
</body>
```

### 5.3 CSS (blog/index.html 내 `<style>`)

```css
.blog-hub-content {
    max-width: 1000px;
    margin: 0 auto;
    padding: 40px 20px;
}
.blog-hub-section {
    margin-bottom: 48px;
}
.blog-hub-section h2 {
    font-size: 1.4em;
    color: #1e3a5f;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 10px;
    margin-bottom: 20px;
}
.post-count {
    font-size: 0.6em;
    color: #94a3b8;
    font-weight: 400;
    margin-left: 8px;
}
.view-all-link {
    display: inline-block;
    margin-top: 16px;
    color: #667eea;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.95em;
}
.view-all-link:hover { text-decoration: underline; }
```

### 5.4 기존 textbook 링크 처리

- `/blog/index.html`에서 textbook 링크 **전부 제거**
- `/blog/*-textbook.html` 파일은 **그대로 유지** (URL 깨짐 방지)
- 이 textbook 파일들은 각국 index의 아코디언에서 계속 연결됨

### 5.5 Schema.org 변경

```json
// 현재 (잘못됨)
{ "@type": "Blog" }

// 변경
{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "MathHub Blog",
    "description": "Math education blog hub — study tips and exam strategies across 5 regions",
    "url": "https://mathhub.io/blog/",
    "publisher": { "@type": "Organization", "name": "MathHub Global" }
}
```

## 6. `/kr/blog/index.html` 신규 생성

### 6.1 HTML 구조

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <title>MathHub 수학 블로그 - 수능, 수학 개념, 문제 풀이</title>
    <meta name="description" content="수능 수학 전략, 중학 수학 개념 정리, 정수론, 미적분 심화 — MathHub 한국 수학 블로그">
    <link rel="stylesheet" href="../../assets/css/common.css">
</head>
<body>
    <nav class="global-nav">
        <a href="/" class="nav-brand">MathHub</a>
        <div class="nav-links">
            <a href="/kr/" class="active">KR</a>
            <a href="/us/">US</a>
            <a href="/uk/">UK</a>
            <a href="/ca/">CA</a>
            <a href="/ib/">IB</a>
            <span class="nav-divider"></span>
            <a href="/#textbooks">Textbooks</a>
            <a href="/#papers">Past Papers</a>
            <a href="/blog/">Blog</a>
        </div>
    </nav>

    <div class="blog-hero" style="background: linear-gradient(135deg, #667eea, #764ba2);">
        <h1>MathHub 수학 블로그</h1>
        <p>수능 전략, 수학 개념 정리, 문제 풀이 해설</p>
    </div>

    <!-- 카테고리 필터 -->
    <div class="filter-bar">
        <button class="filter-btn active" data-cat="all">전체 (32)</button>
        <button class="filter-btn" data-cat="middle">중학수학</button>
        <button class="filter-btn" data-cat="calculus">미적분</button>
        <button class="filter-btn" data-cat="number-theory">정수론</button>
        <button class="filter-btn" data-cat="sat">수능/SAT</button>
        <button class="filter-btn" data-cat="advanced">심화</button>
    </div>

    <div class="blog-content">
        <div class="posts-grid">
            <!-- 32개 글 카드 (data-cat 속성으로 필터링) -->
            <a href="/kr/blog/middle2-rational-numbers.html" class="post-card" data-cat="middle">
                <div class="post-card-header" style="background:#667eea;">
                    <span class="post-badge">중2 수학</span>
                    <h2>유리수와 소수 — 중2 수학 완전 정리</h2>
                    <span class="post-date">2025-11-15</span>
                </div>
                <div class="post-card-body">
                    <p class="post-desc">유리수와 소수의 관계, 순환소수 판별법을 체계적으로 정리합니다.</p>
                    <div class="post-tags">
                        <span class="tag">중2</span>
                        <span class="tag">유리수</span>
                    </div>
                </div>
            </a>
            <!-- ... 나머지 31개 카드 ... -->
        </div>
    </div>

    <footer class="site-footer">...</footer>

    <script>
    // 카테고리 필터 JS
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const cat = btn.dataset.cat;
            document.querySelectorAll('.post-card').forEach(card => {
                card.style.display = (cat === 'all' || card.dataset.cat === cat) ? '' : 'none';
            });
        });
    });
    </script>
</body>
```

### 6.2 필터 CSS

```css
.filter-bar {
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px 20px 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
.filter-btn {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 6px 16px;
    font-size: 0.88em;
    cursor: pointer;
    transition: all 0.2s;
    color: #475569;
}
.filter-btn:hover { border-color: #667eea; color: #667eea; }
.filter-btn.active {
    background: #667eea;
    color: #fff;
    border-color: #667eea;
}
```

## 7. 구현 순서

### Phase 1: 메인 페이지 (index.html) — 1개 파일

1. `lang="ko"` → `lang="en"` 변경
2. Global Nav 추가 (common.css nav 구조)
3. Hero 텍스트 변경
4. Stats 숫자 업데이트
5. Country Cards 유지 (IB 카드 추가 고려)
6. 한국어 과외 상담 섹션 삭제
7. "Study Guides & Tips" 섹션 → "Free Online Textbooks" 섹션으로 교체
8. "Question Bank" 섹션 → "Past Papers & Exams" 섹션으로 교체
9. "Blog" 프리뷰 섹션 신규 추가
10. Ko-fi 독립 섹션 삭제
11. Footer → `.site-footer` 3컬럼으로 교체
12. Schema.org 업데이트

### Phase 2: Blog 구조 (2개 파일)

1. `/blog/index.html` 전면 개편 — Blog 허브
2. `/kr/blog/index.html` 신규 생성 — 한국 블로그 허브

### Phase 3: common.css 업데이트 (1개 파일)

1. `.nav-divider` 추가
2. `.site-footer` 추가
3. 기존 `.footer` 유지 (하위 호환)

### Phase 4: 전 페이지 Nav/Footer 통일 (점진적)

1. 각국 index.html의 nav → 통일 패턴 적용
2. 각국 index.html의 footer → `.site-footer` 적용
3. 각국 blog/index.html의 footer → `.site-footer` 적용

## 8. 파일 변경 목록

| 파일 | 변경 유형 | Phase |
|------|----------|-------|
| `index.html` | 전면 개편 | 1 |
| `assets/css/common.css` | 스타일 추가 | 3 |
| `blog/index.html` | 전면 개편 | 2 |
| `kr/blog/index.html` | 신규 생성 | 2 |
| `kr/index.html` | nav/footer 통일 | 4 |
| `us/index.html` | nav/footer 통일 | 4 |
| `uk/index.html` | nav/footer 통일 | 4 |
| `ca/index.html` | nav/footer 통일 | 4 |
| `ib/index.html` | nav/footer 통일 | 4 |
| `us/blog/index.html` | nav/footer 통일 | 4 |
| `uk/blog/index.html` | nav/footer 통일 | 4 |
| `ca/blog/index.html` | nav/footer 통일 | 4 |
| `ib/blog/index.html` | nav/footer 통일 | 4 |

## 9. 건드리지 않는 것

| 항목 | 이유 |
|------|------|
| `/blog/*-textbook.html` (60개) | URL 깨짐 방지 |
| `/kr/exams/`, `/us/sat/`, `/uk/a-level/` 등 기출 페이지 | 이미 잘 구성됨 |
| pyquiz 코드 | Board 지시 수정 금지 |
| PDF 파일 | 변경 불필요 |
| 각국 blog 개별 글 (.html) | 내용 변경 불필요 |
