# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 명령어

```bash
npm run dev      # 개발 서버 (Turbopack, http://localhost:3000)
npm run build    # 프로덕션 빌드 (Turbopack) — 현재 버그로 실패한다, 아래 참고
npx next build   # 프로덕션 빌드 (webpack) — 빌드 확인은 이 명령으로 한다
npm run start    # 빌드 결과 실행
npm run lint     # ESLint (flat config, next/core-web-vitals + next/typescript)
npx tsc --noEmit # 타입 체크 (별도 스크립트 없음)
```

테스트 프레임워크는 아직 설치되어 있지 않다. 테스트가 필요해지면 사용자에게 도입 여부를 먼저 확인할 것.

shadcn/ui 컴포넌트는 직접 작성하지 말고 CLI 로 추가한다: `npx shadcn@latest add <name>` (shadcn CLI 3.x, `radix-nova` 프리셋 / `src/components/ui/` 에 생성).

## 프로젝트 상태

Next.js 스타터킷에서 데모 코드를 걷어낸 **초기 상태**다. 홈(`/`)에 정적 placeholder 뼈대만 있고, 핵심 기능(Notion 연동, 프로젝트 상세, 이력서 PDF, SEO)은 **미구현**이다.

작업 전 반드시 읽어야 하는 문서:
- [docs/PRD.md](docs/PRD.md) — 요구사항, 노션 DB 스키마 ↔ TypeScript 타입 매핑, API 설계, 에러 코드
- [docs/ROADMAP.md](docs/ROADMAP.md) — Phase 1~5 작업 순서와 완료 기준

새 기능을 만들 때는 PRD 에 이미 정의된 타입/필드명/파일 경로(`src/lib/notion/`, `src/types/portfolio.ts`, `/api/resume/pdf`)를 그대로 따른다. 임의로 다른 이름을 만들지 않는다.

## 아키텍처

**Notion 이 콘텐츠의 Source of Truth**이고, 이 앱은 읽기 전용 렌더러다.

```
Notion DB (프로필/경력/프로젝트)
   ↓ @notionhq/client, 서버 사이드에서만 호출
Server Component + ISR (revalidate 기본 1시간)
   ↓ 캐시된 정적 페이지
방문자 (로그인 없음)
```

이 구조에서 파생되는 규칙:

- **방문 요청마다 Notion API 를 호출하지 않는다.** 데이터 조회는 Server Component 에서 `revalidate` 를 건 fetch/ISR 로만 한다. 목록 조회용 공개 API 라우트를 새로 만들지 않는다 — 클라이언트가 fetch 할 필요가 없다.
- **`NOTION_API_KEY` 등 노션 환경변수에는 절대 `NEXT_PUBLIC_` 접두사를 붙이지 않는다.** (`NOTION_API_KEY`, `NOTION_PROFILE_DB_ID`, `NOTION_CAREER_DB_ID`, `NOTION_PROJECTS_DB_ID`)
- **노션 응답은 방어적으로 파싱한다.** 노션 스키마는 언제든 바뀔 수 있으므로 속성 접근은 `props["필드명"]?.type === "..."` 로 타입을 확인한 뒤 기본값(`""` / `null` / `[]`)으로 폴백한다. PRD 의 `mapNotionPageToCareer` 예시가 표준 패턴이다.
- **비공개 항목은 조회 단계에서 제외한다.** `공개여부`(status) 필터를 쿼리에 항상 포함하고, 렌더 단계에서 숨기는 방식으로 처리하지 않는다.
- Supabase 클라이언트(`src/lib/supabase/`)는 스타터킷 잔재로 **MVP 범위에서는 사용하지 않는다.** 캐싱은 ISR 로 충분하다는 것이 PRD 의 결정이다.

**내부 API 라우트는 모두 `ApiResponse<T>`([src/types/index.ts](src/types/index.ts))를 반환**하고, `apiSuccess()` / `apiError(code, message)` 헬퍼를 사용한다. 에러 코드는 PRD 의 표(`PROJECT_NOT_FOUND`, `NOTION_API_ERROR`, `PDF_GENERATION_FAILED`)를 따른다. 단 `/api/resume/pdf` 성공 응답만 예외로 PDF 바이너리 스트림이다.

**테마**: `next-themes` + Tailwind CSS v4. tailwind config 파일이 없고 모든 토큰은 [src/app/globals.css](src/app/globals.css) 의 CSS 변수(`@theme inline`)로 정의된다. 색상은 하드코딩하지 말고 `bg-background` / `text-muted-foreground` 같은 시맨틱 토큰을 쓴다 — 그래야 다크모드가 자동으로 따라온다.

## 코드 컨벤션

- 파일명 kebab-case, 컴포넌트명 PascalCase, 들여쓰기 2칸
- `any` 금지 (`strict: true`)
- import 는 `@/*` 별칭 사용 (`@/components`, `@/lib`, `@/types`)
- 모든 화면 반응형 필수 — 모바일에서 프로젝트 그리드 1열, 경력 타임라인 세로형
- 주석/문서는 한국어

## 작업 완료 체크리스트

코드를 수정했으면 **아래 3개를 순서대로 전부 통과한 뒤에** 작업 완료를 보고한다. 통과 여부를 확인하지 않고 "완료"라고 말하지 않는다.

```bash
npm run lint      # 1. 린트 체크
npx tsc --noEmit  # 2. 타입 체크
npx next build    # 3. 빌드 체크 — npm run build 가 아니다 (아래 참고)
```

> **빌드 체크는 `npm run build` 가 아니라 `npx next build` 로 돌린다.**
> `npm run build` 는 `next build --turbopack` 인데, Next.js 15.5.21 의 Turbopack 프로덕션 빌드에는 정적 페이지 생성까지 성공한 뒤 `.next/server/pages-manifest.json` 을 찾지 못해 실패하는 버그가 있다(파일은 실제로 존재한다. `.next` 삭제 후에도 재현). webpack 빌드(`npx next build`)는 정상 통과한다.
> `package.json` 의 `build` 스크립트는 Turbopack 을 그대로 유지하기로 했으므로(개발 속도 이점 유지), 체크 명령만 다르게 쓴다. Next.js 업그레이드로 버그가 해소되면 이 예외를 제거하고 `npm run build` 로 되돌린다.

- **앞 단계가 실패하면 고친 뒤 다시 처음부터** 돌린다. 실패한 채로 다음 단계로 넘어가지 않는다.
- 문서/주석만 고친 경우(`.md` 등)는 생략해도 된다. 그 외 `src/` 변경은 예외 없이 3개 모두 돌린다.
- 에러를 **주석 처리·`eslint-disable`·`any`·`@ts-ignore` 로 덮어서 통과시키지 않는다.** 원인을 고친다. 정말 불가피하면 사용자에게 먼저 확인한다.
- 실패가 남아 있으면 **숨기지 말고 명령어 출력 그대로 보고**한다. 내 변경과 무관한 기존 실패라면 그 사실을 함께 밝힌다.
- 커밋은 이 체크리스트를 통과한 뒤에 한다.

## Git

- 커밋 메시지는 **무조건 한글**로 작성
- **push 금지** — 커밋까지만 하고 push 는 사용자가 직접 실행한다
- 커밋 메시지에 `Co-Authored-By: Claude` / `🤖 Generated with Claude Code` 등 Claude 관련 문구를 넣지 않는다

## 이 저장소의 커스텀 에이전트

`.claude/agents/` 에 정의되어 있다. 해당 작업에서는 우선 사용을 고려한다.

- `notion-api-expert` — 노션 DB 스키마 설계, Notion API 연동 코드, 속성 타입 ↔ TypeScript 매핑, rate limit / 에러 처리
- `code-improver` — 읽기 전용 코드 리뷰 (파일 수정 없이 제안만)
- `project-initializer` — 스타터킷 잔재 정리, 미사용 의존성/예제 코드 제거
