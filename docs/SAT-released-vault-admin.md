# SAT Released Tests (QAS) — 비공개 처리 기록

> 실제 출제됐던 SAT(QAS)는 저작권 자료. **공개 git repo에서 제거**하고 로컬에만 보관한다.

## 왜 게이트 방식을 폐기했나 (2026-06-12)

처음엔 Cloudflare Pages Function 비밀번호 게이트(`/qas`, vault.html)를 만들었으나, 확인 결과 **이 repo가 3곳에서 서빙**되고 그중 2곳은 게이트가 불가능했다:

| 노출 위치 | 게이트 가능? |
|---|---|
| mathhub.io (Cloudflare Pages) | ✅ Functions 실행됨 |
| randomwalk1225.github.io (GitHub Pages) | ❌ 정적 호스팅, Functions 불가 |
| raw.githubusercontent.com (repo가 **public**) | ❌ repo 자체에서 직접 다운로드 |

→ 저작권 파일이 public repo에 있는 한 게이트는 무의미. **repo에서 빼는 것이 유일한 근본책.**

## 실제 조치 (사용자 선택: repo 제거 + 로컬 보관)

1. ✅ QAS PDF 30개(paper+answers, ~169MB)를 repo 밖으로 **이동**:
   `us/sat/papers/*qas*.pdf` → `/Users/rando/Repos/_sat-qas-private/`
   (git 추적 + wrangler 배포 디렉터리 양쪽에서 빠지도록 물리적으로 이동)
2. ✅ 게이트/금고 제거: `functions/` 전체, `us/sat/papers/vault.html` 삭제.
3. ✅ SAT index의 Released 탭, `us/index.html`의 QAS 직접링크는 이미 제거됨(이전 작업).
4. ✅ robots.txt 정리.
5. ⚠️ 분석 페이지 20개의 `<iframe src="../papers/*-qas.pdf">`는 이제 404(빈 화면). noindex 고아 페이지라 노출 아님. 차후 폐기 예정.

→ 관리자는 `/Users/rando/Repos/_sat-qas-private/`의 로컬 파일로 열람. 웹 접근(/qas) 없음.

## 아직 남은 누수 — 반드시 후속 조치 필요

repo의 **git 히스토리**와 **public 상태**가 그대로면 과거 커밋에서 여전히 받아진다:

- `raw.githubusercontent.com/.../<옛커밋>/us/sat/papers/2023-03-sat-qas.pdf` → 과거 커밋 경로로 접근 가능.
- HEAD에서 제거해도 히스토리에 남음.

**권장 후속 조치 (사용자 결정/실행):**
- **(가장 간단·강력) GitHub repo를 Private로 전환** → raw 및 github.io 공개 접근 즉시 차단. mathhub.io는 wrangler 직접배포라 영향 없음(아래 배포 메모 참조).
- 또는 git 히스토리에서 QAS 파일 완전 제거(`git filter-repo`/BFG) 후 force-push — 파괴적, 신중히.
- github.io(오래된 미러)가 더 이상 필요 없으면 GitHub Pages 자체를 비활성화.

## 배포 메모 (mathhub.io = Cloudflare Pages, 프로젝트 `gitblog1104`)

- mathhub.io 콘텐츠가 github.io보다 최신인 점으로 보아, mathhub.io는 **wrangler 직접 업로드**로 배포되는 것으로 보인다(git 연동 아님).
- 배포 명령(인증 후): `npx wrangler pages deploy . --project-name gitblog1104`
  - ⚠️ 현재 디렉터리를 업로드하므로, QAS PDF가 repo 밖으로 이미 빠진 상태에서 실행해야 mathhub.io에도 안 올라간다. (완료됨)
- wrangler 인증 필요: 비대화형 환경에서 실패 → 사용자가 `npx wrangler login`(브라우저) 또는 `CLOUDFLARE_API_TOKEN` 설정 후 실행.

## 추가 검토 권장

- repo에 PDF가 총 4,000+개. SAT QAS 외에도 타기관 저작권 기출(AP/A-Level 등)이 public repo에 있을 수 있음 → 별도 점검 권장.
