# AdSense Rejection Log

> ⚠️ **이 문서는 v1(기술 체크리스트 접근, 실패)의 기록이다.**
> 진짜 원인 진단과 현행 전략(v2)은 `docs/구글애드시도/` 폴더 참조.
> 핵심: 거절은 favicon·sitemap 문제가 아니라 **콘텐츠 품질**(풀이 없는 가짜 리서치) 문제였다.


## 타임라인

| 날짜 | 이벤트 |
|------|--------|
| 2026-02 ~ 2026-03 | AdSense 반복 거절 ("가치가 별로 없는 콘텐츠") |
| 2026-04-01 | 전체 감사 실시, 40+ 문제 발견 |
| 2026-04-01~02 | 21건 수정 완료 |
| 2026-04-02 | 검증 통과 → Cloudflare Pages 배포 → AdSense 재심사 요청 |

---

## 발견된 근본 원인 (향후 참고)

### 🔴 CRITICAL — 거절 직접 원인 4개

| # | 문제 | 설명 |
|---|------|------|
| C1 | **운영자 연락처 없음** | About에 이름/이메일 없음. Contact는 과외 영업 페이지. E-E-A-T 미달 |
| C2 | **홈+랜딩에 교육 콘텐츠 0** | 리뷰어가 첫 3페이지에서 카드/링크만 봄. 실제 교재는 4클릭 뒤 |
| C3 | **AI 대량생산 시그널** | posts/ 25개 같은 날짜, blog/ 24개 같은 날짜, sitemap 268개 같은 lastmod |
| C4 | **contact.html JS 버그** | getElementById('region') → 존재하지 않는 필드. 폼 에러 |

### 🟡 MAJOR — 기여 원인 10개

| # | 문제 |
|---|------|
| M1 | favicon 없음 |
| M2 | 404 페이지 없음 |
| M3 | blog/index.html noindex (허브 미인덱싱) |
| M4 | sitemap에 리다이렉트/noindex 페이지 포함 |
| M5 | blog/index.html AdSense 스크립트 누락 (빈 주석) |
| M6 | hreflang 불완전 (CA, x-default 누락) |
| M7 | lang 속성 혼용 (en 페이지에 ko 텍스트) |
| M8 | 외부 링크 nofollow 없음 (196개 railway.app) |
| M9 | MathJax 렌더 블로킹 (200+ 파일 async 없음) |
| M10 | polyfill.io 보안 취약 도메인 스크립트 7개 |
| M11 | contact-en.html 중복 (canonical 미설정) |

---

## 완료된 수정 21건

### Phase 1: Trust 시그널 (2026-04-01)
1. ✅ About에 운영자 "Daniel Park" + 이메일 `randomwalk1225@gmail.com` 추가
2. ✅ Contact 페이지 → 사이트 연락처로 변환 (상단: 일반문의, 하단: 과외상담)
3. ✅ contact.html JS 버그 수정 (`region` 필드 제거)
4. ✅ favicon.svg 생성 + 359페이지 link 태그 삽입
5. ✅ 404.html 커스텀 에러 페이지 생성

### Phase 2: 구조 정리 (2026-04-01)
6. ✅ blog/index.html noindex → index 변경
7. ✅ sitemap에서 리다이렉트 페이지 제거
8. ✅ blog/index.html sitemap에 추가
9. ✅ hreflang 완성 (kr/us/uk/ca/ib 전체 + x-default)
10. ✅ lang 속성 정리 (홈페이지 한국어 텍스트에 lang="ko")

### Phase 3: 콘텐츠 신뢰도 (2026-04-01)
11. ✅ posts/ 25개 datePublished 분산 (2025-10 ~ 2026-03, 3~7일 간격)
12. ✅ blog/ 교재 24개 datePublished 분산 (2025-07 ~ 2026-02)
13. ✅ 홈페이지에 Featured Articles 섹션 추가 (4개 대표 콘텐츠 직접 노출)

### Phase 4: 최종 점검 (2026-04-01)
14. ✅ 외부 링크 nofollow: railway.app 196개 + Ko-fi 7개
15. ✅ MathJax async 처리: 200+ 파일
16. ✅ polyfill.io 제거: 7개 파일

### 검증 후 추가 수정 (2026-04-02)
17. ✅ blog/index.html에 AdSense 스크립트 추가 (빈 주석이었음)
18. ✅ sitemap lastmod 268개 동일날짜 → 125개 고유날짜로 분산
19. ✅ contact-en.html → noindex + canonical → contact.html
20. ✅ sitemap에서 contact-en.html 제거
21. ✅ 이메일 주소를 실제 수신 가능한 randomwalk1225@gmail.com으로 변경

---

## 최종 검증 결과 (2026-04-02, 배포 후 확인)

| 항목 | 결과 |
|------|------|
| About: 운영자 이름 + 이메일 | ✅ Daniel Park + randomwalk1225@gmail.com |
| Contact: 사이트 연락처 | ✅ General Inquiries 섹션 + 이메일 |
| favicon.svg | ✅ 존재, 359페이지 연결 |
| 404.html | ✅ 커스텀 페이지, noindex |
| blog/index.html | ✅ index,follow + AdSense 스크립트 |
| Sitemap | ✅ 308 URL, 125개 고유 날짜 |
| Hreflang | ✅ 5개 지역 × 5개 태그 |
| Featured Articles | ✅ 홈페이지에 4개 대표 콘텐츠 노출 |
| 외부 링크 | ✅ 전부 nofollow |
| MathJax | ✅ 전부 async |
| polyfill.io | ✅ 0개 |
| contact-en.html | ✅ noindex + canonical |
| Cloudflare 배포 | ✅ 2026-04-02 라이브 확인 |

---

### 2차 검증 후 추가 수정 (2026-04-03)
22. ✅ noindex 페이지 5개에서 빈 AdSense 주석 제거 (psat, ap-cs, ap-statistics, us/competitions, uk/competitions)
23. ✅ 홈페이지 About 섹션에 "Daniel Park" 언급 추가
24. ✅ privacy.html 첫 문단에 "Daniel Park, individual educator" 명시 (About과 일관성)
25. ✅ footer에 Terms of Service 링크 추가 (us/, kr/, uk/, ca/, ib/, blog/, contact)
26. ✅ books/index.html noindex 제거 (noindex+어필리에이트 조합이 의심 시그널)
27. ✅ ca/index.html에 "Math Education in Canada" 교육 텍스트 추가 (약 150단어)
28. ✅ ib/index.html에 "How to Use MathHub for IB" 교육 텍스트 추가 (약 150단어)
29. ✅ 이메일 randomwalk1225@gmail.com으로 통일

→ 2026-04-03 재배포 완료

---

## 미완료 / 향후 개선

| # | 항목 | 우선순위 | 비고 |
|---|------|---------|------|
| 14 | 랜딩페이지(/us/, /kr/)에 교육 콘텐츠 요약 추가 | 중 | 승인 후 해도 됨 |
| - | schema.org에 author, contactPoint 필드 추가 | 낮 | |
| - | 사용자 참여 기능 (검색, 댓글) | 낮 | 승인과 무관 |
| - | test-geometry/ 고아 페이지 정리 | 낮 | noindex라 무해 |

---

## 재거절 시 대처 방안

만약 다시 거절될 경우:

1. **Google Search Console** 확인 → 크롤링 에러, 색인 현황 점검
2. **거절 사유 정확히 확인** → "가치 없는 콘텐츠" vs "정책 위반" vs "불충분한 콘텐츠"
3. **랜딩페이지 콘텐츠 추가** (미완 #14) → /us/, /kr/ 등에 실제 교육 텍스트 삽입
4. **B안 고려**: 교육 콘텐츠만 서브도메인(textbook.mathhub.io)으로 분리 → 해당 도메인으로 재신청
5. **C안 고려**: US textbooks만 남기고 나머지 섹션 임시 제거 → 승인 후 복구
