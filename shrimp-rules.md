# Development Guidelines (career-web)

> **이 문서는 AI Agent 전용 작업 규칙이다.** 일반 개발 튜토리얼이 아니다.
> 이 저장소에서 코드를 작성·수정하기 전에 반드시 이 문서의 규칙을 따른다.
> 이 문서와 `CLAUDE.md` 또는 사용자의 직접 지시가 충돌하면 **`CLAUDE.md`와 사용자 지시가 우선**한다.

---

## 1. 프로젝트 개요

- **목적**: 노션(Notion) DB에 입력된 프로필·경력·프로젝트를 공개 포트폴리오 웹사이트로 렌더링하고, 이력서 PDF를 다운로드하게 한다.
- **스택**: Next.js 15 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind CSS v4 · shadcn/ui(`radix-nova`) · `next-themes`
- **핵심 전제**: **Notion이 Source of Truth이고, 이 앱은 읽기 전용 렌더러다.** 앱에서 노션 데이터를 생성·수정·삭제하는 코드를 작성하지 않는다.
- **현재 상태**: 스타터킷 뼈대만 존재. Notion 연동·프로젝트 상세·이력서 PDF·SEO는 **전부 미구현**이다.

---

## 2. 프로젝트 아키텍처

### 2.1 현재 존재하는 경로 (수정 대상)

| 경로 | 역할 | 규칙 |
|---|---|---|
| `src/app/layout.tsx` | 루트 레이아웃, 폰트, `ThemeProvider`, `Toaster` | 전역 메타데이터 template 유지 |
| `src/app/page.tsx` | 홈 — 현재 placeholder | 노션 데이터로 교체 대상 |
| `src/app/globals.css` | Tailwind v4 토큰 전체 (`@theme inline`) | **tailwind.config 파일은 만들지 않는다** |
| `src/components/layout/` | `site-header.tsx`, `site-footer.tsx`, `theme-toggle.tsx` | 레이아웃 전용 컴포넌트만 배치 |
| `src/components/providers/` | `theme-provider.tsx` | 전역 Provider만 배치 |
| `src/components/ui/` | shadcn/ui 생성물 9개 | **직접 수정·직접 생성 금지** (§7.1) |
| `src/lib/utils.ts` | `cn()` | 클래스 병합은 항상 `cn()` 사용 |
| `src/lib/supabase/` | 스타터킷 잔재 | **MVP에서 import 금지** (§8.2) |
| `src/types/index.ts` | `ApiResponse<T>`, `apiSuccess`, `apiError` | API 라우트는 항상 여기서 import |
| `docs/PRD.md` | 요구사항·노션 스키마·API·에러코드 | 스펙 변경 시 **함께 수정** |
| `docs/ROADMAP.md` | Phase 1~5 · 완료 기준 체크박스 | Phase 완료 시 **체크박스 갱신** |

### 2.2 앞으로 생성해야 하는 경로 (이름을 임의로 바꾸지 않는다)

| 경로 | 역할 | Phase |
|---|---|---|
| `src/types/portfolio.ts` | `Profile`, `Career`, `Project`, `PublishStatus` | 2 |
| `src/lib/notion/client.ts` | `@notionhq/client` 인스턴스 (서버 전용) | 1~2 |
| `src/lib/notion/constants.ts` | 노션 속성명·status 옵션 값 상수 | 2 |
| `src/lib/notion/queries.ts` | `fetchProfile()`, `fetchCareers()`, `fetchProjects()`, `fetchProjectById()` | 2 |
| `src/lib/notion/mappers.ts` | `mapNotionPageToProfile / Career / Project` | 2 |
| `src/app/projects/[id]/page.tsx` | 프로젝트 상세 | 3 |
| `src/app/api/resume/pdf/route.ts` | 이력서 PDF 스트림 | 3 |
| `src/app/api/revalidate/route.ts` | 운영자용 즉시 재생성 (P1) | 4 |
| `src/app/sitemap.ts`, `src/app/robots.ts` | SEO | 4 |
| `src/app/opengraph-image.tsx` | 홈 OG 이미지 (`next/og`) | 4 |
| `src/app/projects/[id]/opengraph-image.tsx` | 프로젝트 OG 이미지 | 4 |
| `src/lib/site.ts` | 사이트 절대 URL 확정 (`getSiteUrl` / `absoluteUrl`) | 4 |
| `src/lib/seo.ts` | `SITE_NAME`, `INDEXABLE_ROBOTS`, `buildMetaDescription`, `buildSocialMetadata` | 4 |
| `src/lib/og/` | OG 카드 레이아웃 · 폰트 로더 · 원격 이미지 → data URI | 4 |
| `src/components/portfolio/` | 도메인 컴포넌트 (프로젝트 카드, 경력 타임라인 등) | 2~3 |

- **금지**: `pages/` 디렉터리 생성, `src/app/api/projects/`·`src/app/api/careers/` 같은 **목록 조회용 공개 API 라우트 생성** (§5.3)

---

## 3. 코드 표준

- 파일명 **kebab-case** (`site-header.tsx`, `mappers.ts`), 컴포넌트명 **PascalCase**, 들여쓰기 **2칸**
- import는 항상 `@/*` 별칭. ❌ `import { cn } from "../../lib/utils"` → ✅ `import { cn } from "@/lib/utils"`
- **`any` 금지** (`strict: true`). 노션 응답 타입은 `@notionhq/client` **루트**에서 import 한다 (`PageObjectResponse`, `QueryDataSourceResponse`, `RichTextItemResponse` 등). `build/src/api-endpoints` 깊은 경로를 쓰지 않는다. `as any`로 회피하지 않는다.
- 주석·문서·커밋 메시지는 **한국어**. 변수명/함수명은 영어.
- 파일 상단에는 그 파일의 역할을 설명하는 한국어 블록 주석을 둔다 (기존 `src/lib/supabase/server.ts`, `src/app/page.tsx` 형식 준수).

---

## 4. Notion 연동 구현 표준 ★ 가장 중요

### 4.1 속성 키는 한글 리터럴, 내부 타입 키는 영문

노션 DB의 속성명은 **한글**(`"회사명"`, `"사용 기술"`, `"공개여부"`, `"정렬 순서"`)이고, TypeScript 타입 필드는 **영문**(`company`, `skills`, `order`)이다. 이 두 계층을 섞지 않는다.

- 한글 속성명은 **매퍼 파일(`src/lib/notion/mappers.ts`) 안에서만** 등장하게 한다.
- 컴포넌트·페이지에서 노션 원본 속성명을 직접 참조하지 않는다.

### 4.2 방어적 파싱은 선택이 아니라 의무 (FR-7)

모든 속성 접근은 **`?.type` 확인 → 값 추출 → 기본값 폴백** 순서를 지킨다.

❌ **금지 — 노션 스키마가 바뀌면 즉시 런타임 크래시**
```typescript
const company = page.properties["회사명"].title[0].plain_text;
const skills = page.properties["사용 기술"].multi_select.map((o) => o.name);
```

✅ **필수 — `docs/PRD.md`의 `mapNotionPageToCareer`가 표준 패턴**
```typescript
const companyProp = props["회사명"];
const company = companyProp?.type === "title" ? extractPlainText(companyProp.title) : "";

const skillsProp = props["사용 기술"];
const skills =
  skillsProp?.type === "multi_select"
    ? skillsProp.multi_select.map((option) => option.name)
    : [];
```

### 4.3 값 없음 폴백 규칙 (타입별로 고정)

| TypeScript 타입 | 폴백 값 | 예 |
|---|---|---|
| 필수 문자열 (`string`) | `""` | `company`, `role`, `title`, `summary` |
| 선택 문자열 (`string \| null`) | `null` | `bio`, `description`, `link`, `thumbnailUrl` |
| 배열 (`string[]`) | `[]` | `skills` |
| 숫자 (`number \| null`) | `null` | `order` |

- `Career.endDate`가 `null`이면 **"재직중"** 으로 렌더링한다.
- 폴백 대신 `throw`하지 않는다. 필드 하나가 비어도 페이지 전체가 죽어서는 안 된다.

### 4.4 비공개 항목은 조회 단계에서 제외 (FR-6)

- `dataSources.query`의 `filter`에 `공개여부` 조건을 **항상** 포함한다. (`databases.query`는 SDK 5.x 에서 제거됐다 — §4.7)
- ❌ 전체를 조회한 뒤 `.filter()`나 JSX 조건부 렌더링으로 숨기는 방식 금지.
- `공개여부` status 옵션 이름은 **`draft` / `published`** 로 고정한다 (`PublishStatus` 타입과 동일).
- 이 문자열을 쿼리 필터와 `parseStatus`에 각각 하드코딩하지 않는다. **`src/lib/notion/constants.ts`에 상수로 한 번만 정의**하고 양쪽에서 참조한다.
- 노션 DB의 상태 옵션 이름이 이 값과 다르면 필터가 **에러 없이 0건**을 반환한다. 조회 결과가 비면 이 값부터 대조한다.

### 4.5 클라이언트 노출 금지

- 노션 환경변수에 **절대 `NEXT_PUBLIC_` 접두사를 붙이지 않는다**: `NOTION_API_KEY`, `NOTION_PROFILE_DB_ID`, `NOTION_CAREER_DB_ID`, `NOTION_PROJECTS_DB_ID`
- `src/lib/notion/*`는 **Server Component / Route Handler에서만** import한다. `"use client"` 파일에서 import 금지.
- 환경변수 미설정 시에는 원인이 드러나는 한국어 에러를 던진다 (`src/lib/supabase/server.ts:22-26` 형식 참고).

### 4.5-1 "첫 번째 행" 을 그대로 믿지 않는다

PROFILE 은 1행짜리 설정 테이블처럼 쓰지만, **정렬을 지정하지 않은 조회의 순서는 보장되지 않는다.**
노션에서 빈 행이 실수로 추가되는 일은 흔하고, 그 빈 행이 먼저 나올 수 있다.
실제로 빈 행 하나 때문에 이름·소개·연락처가 전부 사라진 적이 있다(2026-07-30).

- ❌ `page_size: 1` 로 받아 `results[0]` 을 그대로 쓰기. 그 1행이 빈 행이면 복구할 방법이 없다.
- ✅ 여유 있게 받아(`page_size: 10`) **내용이 있는 행**만 후보로 삼고, 그 중 공개 상태인 행을 우선한다.
- 후보가 2개 이상이면 `console.warn` 으로 남긴다. 사용자가 중복을 알아챌 수 있어야 한다.

### 4.6 그 밖의 노션 규칙

- 노션 파일(이미지) URL은 **1시간 만료 서명 URL이다.** 썸네일/아바타 URL을 DB나 상수로 영구 저장하지 않고, 재생성 시점마다 새로 받아 쓴다. `og:image` 에 직접 넣지도 않는다 — §6-1 참고.
- 노션 이미지는 **반드시 `next/image`로 렌더링**한다 (`<img>` 금지). 단 OG 이미지 생성 코드(`src/lib/og/**`)는 브라우저로 가지 않으므로 예외다 — §6-1 참고. 원본이 1MB를 넘고, 서버가 한 번 받아 캐시하므로 방문자마다 만료 URL을 직접 때리지 않게 된다. 새 호스트가 필요하면 `next.config.ts`의 `images.remotePatterns`에 추가한다 — 등록되지 않은 호스트는 400으로 차단된다.
- `next/image`에 `fill`을 쓰지 않는다. position 래퍼 div가 필요해지고, 그러면 `Card`의 `has-[>img:first-child]:pt-0` / `*:[img:first-child]:rounded-t-xl` 선택자가 첫 자식이 img가 아니게 되어 깨진다. width/height + `aspect-*`/`object-cover`로 처리한다.
- 429 재시도는 `src/lib/notion/client.ts`의 `new Client({ retry: { maxRetries: 3 } })`가 담당한다 (FR-11). 각 쿼리 함수에 재시도 루프를 손으로 만들지 않는다.
- 모든 노션 호출은 `try/catch`로 감싼다. 사용자에게는 일반화된 메시지, 서버 로그에는 상세 원인.

### 4.7 SDK 5.x — 데이터 소스 단위 조회

`@notionhq/client` 5.x 에서 **`databases.query`가 제거**됐다. 조회는 DB가 아니라 데이터 소스 단위다.

- ❌ `notion.databases.query({ database_id })` — 이 메서드는 존재하지 않는다
- ✅ `notion.dataSources.query({ data_source_id })`
- `data_source_id`는 **환경변수로 받지 않는다.** `src/lib/notion/client.ts`의 `getDataSourceId(target)`이 DB ID로부터 해석하고 모듈 스코프에 캐시한다. 새 조회 함수를 쓸 때도 이 함수를 거친다.
- 페이지네이션은 직접 `start_cursor` 루프를 돌리지 말고 SDK의 `collectPaginatedAPI(notion.dataSources.query, params)`를 쓴다.
- 조회 결과에는 부분 응답이 섞일 수 있다. `isFullPage()`로 거른 뒤 매퍼에 넘긴다.

---

## 5. 라우팅 · 데이터 조회 표준

### 5.1 조회는 Server Component에서만

```
페이지(Server Component) → src/lib/notion/queries.ts → Notion API
```

- 페이지 파일에 `"use client"`를 붙이지 않는다. 인터랙션이 필요한 부분만 별도 클라이언트 컴포넌트로 분리해 children으로 넣는다.
- ❌ 클라이언트에서 `fetch("/api/projects")` 하는 패턴 금지.

### 5.2 ISR

- 데이터 조회 경로에는 `revalidate`를 건다. **기본값 3600초(1시간)**.
- ❌ `export const revalidate = REVALIDATE_SECONDS` — **상수 import 금지.** Next가 이 값을 정적 분석하므로 `Invalid segment configuration export detected`로 빌드가 깨진다.
- ✅ `export const revalidate = 3600` — 리터럴로 쓰고 주석으로 의미를 남긴다. 주기를 바꿀 때는 `src/app/page.tsx`와 `src/app/projects/[id]/page.tsx`를 **함께** 고친다.
- ❌ `export const dynamic = "force-dynamic"` 또는 `cache: "no-store"`를 공개 페이지에 사용 금지. 방문 요청마다 Notion API를 호출하게 되어 FR-9 위반이다.

### 5.3 API 라우트는 두 개만

허용: `/api/resume/pdf`(P0), `/api/revalidate`(P1).
그 외 **목록/상세 조회용 공개 API 라우트를 새로 만들지 않는다.**

### 5.4 404 처리

- `/projects/[id]`에서 대상이 없거나 비공개면 `notFound()`를 호출한다. 빈 화면이나 "데이터 없음" 문구로 대체하지 않는다.

---

## 6. API 라우트 표준

- 모든 내부 API 라우트는 `src/types/index.ts`의 `apiSuccess()` / `apiError(code, message)`로 응답한다. 응답 객체를 직접 리터럴로 만들지 않는다.
- **유일한 예외**: `/api/resume/pdf`의 **성공** 응답은 `application/pdf` 바이너리 스트림. 실패 시에는 `apiError`를 반환한다.
- 에러 코드는 아래 표만 사용하고, 새 코드가 필요하면 `docs/PRD.md`의 에러 코드 표에 먼저 추가한다.

| code | 상황 | HTTP |
|---|---|---|
| `PROJECT_NOT_FOUND` | 존재하지 않거나 비공개 프로젝트 | 404 |
| `NOTION_API_ERROR` | Notion 호출 실패(재시도 소진) | 502 |
| `PDF_GENERATION_FAILED` | PDF 생성 오류 | 500 |
| `INVALID_REQUEST` | 본문이 JSON 이 아니거나 `path` 가 허용 목록 밖 | 400 |
| `UNAUTHORIZED` | `/api/revalidate` 시크릿 불일치·누락 | 401 |
| `REVALIDATE_NOT_CONFIGURED` | `REVALIDATE_SECRET` 미설정 | 503 |
| `REVALIDATE_FAILED` | `revalidatePath` 실행 오류 | 500 |

**시크릿을 검증하는 라우트 규칙**

- ❌ `provided === expected` — 앞에서부터 비교하다 멈춰서 응답 시간으로 한 글자씩 추측당한다.
- ✅ 양쪽을 `sha256` 해시한 뒤 `timingSafeEqual` 로 비교한다. 길이가 달라도 성립한다.
- 시크릿 환경변수가 **없으면 열지 말고 막는다**(503). 미설정 상태로 배포돼 누구나
  호출할 수 있게 되는 사고를 막기 위함이다.
- 경로·대상은 화이트리스트로 제한한다. 사용자가 준 문자열을 `revalidatePath` 에 그대로 넘기지 않는다.
- `export const dynamic = "force-dynamic"` 을 건다. 캐시되면 두 번째 호출부터 실제로 실행되지 않는다.

---

## 6-1. SEO · 메타데이터 표준 (FR-10)

### 메타데이터 병합은 얕다 — 레이아웃 값이 상속될 거라 기대하지 않는다

페이지가 `openGraph` 를 지정하는 순간 레이아웃의 `openGraph`(`type`/`locale`/`siteName`)는
**상속되지 않고 통째로 대체**된다. `twitter` 도 마찬가지라 `card` 가 기본값 `summary` 로
되돌아가 큰 이미지 미리보기가 사라진다.

- ✅ `src/lib/seo.ts` 의 `buildSocialMetadata()` 로 공통 필드를 매번 함께 채운다.
- ❌ 페이지에서 `openGraph: { title, description }` 만 적기.

### `robots` 는 전역(레이아웃)에 걸지 않는다

전역에 걸면 Next 가 404 에 자체적으로 넣는 `noindex` 와 겹쳐 모순된 robots 메타태그가
두 개 나간다. 색인 대상 페이지에서 `INDEXABLE_ROBOTS` 를 쓴다.

### 절대 URL 은 `src/lib/site.ts` 로만 만든다

- OG·canonical·sitemap·robots 는 절대 URL 이 필요하다. `getSiteUrl()` / `absoluteUrl()` 을 쓴다.
- 도메인을 하드코딩하지 않는다. `SITE_URL` → `VERCEL_PROJECT_PRODUCTION_URL` → `VERCEL_URL` → localhost 순 폴백이다.
- `SITE_URL` 에 `NEXT_PUBLIC_` 을 붙이지 않는다. 서버에서만 쓴다.

### OG 이미지는 `next/og` 로 생성한다

- ❌ 노션 파일 URL 을 `og:image` 에 직접 넣기. 서명 URL 이 **1시간 뒤 만료**되어, 나중에
  받아가는 크롤러에게 403 이 된다.
- ✅ `opengraph-image.tsx` 파일 컨벤션으로 생성한다. 생성 시점에 이미지를 한 번 받아 PNG 로
  구워두므로 만료와 무관해진다.
- `generateMetadata` 에서 `openGraph.images` 를 **지정하지 않는다.** 지정하면 파일 컨벤션으로
  생성한 이미지가 대체된다.
- 동적 세그먼트의 이미지 라우트에는 **`generateStaticParams` 를 따로 export** 한다. 페이지에만
  있으면 이미지 라우트는 동적(ƒ)으로 남아 `revalidate` 가 적용되지 않고, 크롤러 요청마다
  노션 조회 + satori 렌더가 통째로 다시 돈다.
- 한글 폰트를 넘기지 않으면 제목이 빈 사각형(tofu)이 된다. `loadOgFonts()` 를 쓰고,
  `next.config.ts` 의 `outputFileTracingIncludes` 에 해당 라우트를 등록한다.
  **등록하지 않으면 로컬은 통과하고 배포 후에만 깨진다.**
- satori 는 CSS 를 전부 지원하지 않는다. flexbox 만 쓰고, 자식이 둘 이상인 요소에
  `display: "flex"` 를 명시한다. Tailwind 클래스와 CSS 변수는 동작하지 않는다.
- **satori 에서 이미지를 그리는 방법은 `<img>` 뿐이다.** `background-image` 에 data URI 를
  주면 **에러 없이 빈 영역**만 남는다(실측). `next/image` 도 쓸 수 없다.
  → `src/lib/og/**` 에 한해 `@next/next/no-img-element` 를 끈 예외가 `eslint.config.mjs` 에 있다.
  이 예외를 다른 디렉터리로 넓히지 않는다.

### `generateMetadata` 와 페이지가 같은 데이터를 쓰면 조회를 공유한다

둘은 각각 실행되므로 그냥 두면 요청당 노션 호출이 2배가 된다.
`src/lib/notion/queries.ts` 의 조회 함수는 React `cache()` 로 감싸져 있다. 새 조회 함수를
추가할 때도 `cache()` 로 감싼다.

---

## 7. UI · 스타일 표준

### 7.1 shadcn/ui

- 새 UI 프리미티브는 **반드시 CLI로 추가**: `npx shadcn@latest add <name>`
- ❌ `src/components/ui/` 아래 파일을 직접 새로 작성하거나 임의로 편집하지 않는다. (프리셋: `radix-nova`, `rsc: true`)
- 이미 설치됨: `avatar`, `badge`, `button`, `card`, `dropdown-menu`, `separator`, `skeleton`, `sonner`, `tooltip`
- 도메인 컴포넌트(프로젝트 카드, 경력 타임라인 등)는 `src/components/portfolio/`에 만들고, 내부에서 `ui/` 프리미티브를 조합한다.

### 7.2 색상 · 토큰

- ❌ `text-[#111]`, `bg-white`, `text-gray-500` 같은 하드코딩 금지.
- ✅ `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-card` 등 시맨틱 토큰만 사용한다. 그래야 다크모드가 자동으로 따라온다.
- 새 색상 토큰이 필요하면 `src/app/globals.css`의 `:root`·`.dark`·`@theme inline` **세 곳을 모두** 수정한다.

### 7.3 반응형 (필수)

- 모든 화면은 반응형으로 만든다. 최소 검증 폭 **375px**.
- 프로젝트 그리드: 모바일 1열 → `sm:grid-cols-2` → `lg:grid-cols-3`
- 경력 타임라인: 모바일 세로형
- 컨테이너 패턴은 기존 코드를 따른다: `mx-auto max-w-6xl px-4 sm:px-6`

---

## 8. 라이브러리 사용 표준

### 8.1 도입해야 할 의존성 (아직 미설치)

| 패키지 | 용도 | 규칙 |
|---|---|---|
| `@notionhq/client` | Notion API | 서버 전용. 대체 라이브러리 임의 선택 금지 |
| `@react-pdf/renderer` | 이력서 PDF | `puppeteer` / `jspdf` 사용 금지 (PRD 비교표에서 탈락) |

- PDF에는 **한글 폰트를 반드시 `Font.register`로 임베드**한다 (`src/lib/pdf/fonts.ts`). 폰트 없이 구현하면 한글이 깨진다.
- **PDF에 넣는 모든 사용자 텍스트는 `sanitizeForPdf()`(또는 `sanitizeProfile`/`sanitizeCareers`)를 거친다.** 임베드 폰트는 한국어 서브셋이라 `→ ← ※ ①` 같은 기호가 **두부(□)가 아니라 다른 글자로 조용히 치환**된다. 정제를 건너뛰면 이력서 내용이 망가진 채 배포된다.
- PDF 템플릿은 `src/lib/pdf/`에 둔다. `@react-pdf/renderer`의 `View`/`Text`는 DOM 컴포넌트가 아니고 Tailwind 클래스가 통하지 않으므로 `src/components/`에 섞지 않는다.
- 폰트 파일을 교체하면 `sanitize.ts`가 참조하는 경로와 `next.config.ts`의 `outputFileTracingIncludes`를 함께 확인한다.

### 8.2 MVP에서 사용하지 않는 기존 의존성

`@supabase/ssr`, `@supabase/supabase-js`, `react-hook-form`, `@hookform/resolvers`, `zod`, `zustand`

- 새 코드에서 이들을 import하지 않는다. 캐싱은 ISR로 충분하다는 것이 PRD의 결정이다.
- 이들 패키지나 `src/lib/supabase/`를 **삭제하는 작업은 `project-initializer` 에이전트를 통해** 진행하고, 임의로 지우지 않는다.

### 8.3 아이콘

- 아이콘은 `lucide-react`만 사용한다 (`components.json`의 `iconLibrary`).

---

## 9. 워크플로 표준

### 9.1 작업 시작 전 필독

1. `docs/PRD.md` — 타입/필드명/경로/에러코드의 근거
2. `docs/ROADMAP.md` — 현재 Phase와 완료 기준
3. `CLAUDE.md` — 저장소 규칙

### 9.2 구현 순서 (Phase는 앞 단계 산출물에 의존한다)

```
Phase 1 환경(Notion 연동 검증, 라우트 뼈대)
  → Phase 2 공통 모듈(types/portfolio.ts → notion/mappers.ts → notion/queries.ts → 공통 컴포넌트)
  → Phase 3 핵심(홈 · 프로젝트 상세 · 이력서 PDF · ISR)
  → Phase 4 부가(SEO · 정렬 · 429 재시도)
  → Phase 5 최적화·배포
```

- **타입 → 매퍼 → 쿼리 → 컴포넌트 → 페이지** 순서로 만든다. 페이지부터 만들고 타입을 나중에 맞추지 않는다.

### 9.3 변경 후 검증 (매번)

```bash
npx tsc --noEmit   # 타입 체크
npm run lint       # ESLint
npm run build      # 빌드 확인 (라우트/ISR 변경 시 필수)
```

- 테스트 프레임워크는 **미설치**다. 테스트 파일을 임의로 추가하거나 vitest/jest를 임의로 설치하지 말고, 필요하면 사용자에게 먼저 확인한다.

### 9.4 Git

- 커밋 메시지는 **무조건 한글**.
- **`git push` 금지** — 커밋까지만 하고 push는 사용자가 직접 실행한다.
- 커밋 메시지에 `Co-Authored-By: Claude`, `🤖 Generated with Claude Code` 등 Claude 관련 문구를 넣지 않는다.
- `.env.local`을 커밋하지 않는다.

---

## 10. 핵심 파일 상호작용 표준 (동시 수정 필수)

한쪽만 고치고 끝내면 안 된다. 아래 트리거가 발생하면 **오른쪽 파일을 같은 작업 안에서 전부** 갱신한다.

| 트리거 | 동시에 수정해야 하는 파일 |
|---|---|
| `src/types/portfolio.ts`의 인터페이스 필드 추가/변경 | `src/lib/notion/mappers.ts` + `docs/PRD.md`(데이터 모델 TypeScript 블록) + 해당 필드를 쓰는 모든 페이지/컴포넌트 |
| 노션 DB에 속성 추가/이름 변경 | `docs/PRD.md`(노션 DB 필드 스키마 표) + `src/types/portfolio.ts` + `src/lib/notion/mappers.ts` + (필터·정렬에 쓰이면) `src/lib/notion/queries.ts` |
| 환경변수 추가 | `.env.example` + `docs/PRD.md`(사전 준비 사항) + `CLAUDE.md`(아키텍처 절) |
| 새 API 라우트 추가 | `src/types/index.ts`의 `ApiResponse` 사용 + `docs/PRD.md` API 설계 표 + 에러 코드 표 |
| 새 페이지 라우트 추가 | 해당 페이지의 `generateMetadata` + `src/app/sitemap.ts` |
| 새 색상/반경 토큰 추가 | `src/app/globals.css`의 `:root` + `.dark` + `@theme inline` (세 곳 전부) |
| Phase 완료 기준 충족 | `docs/ROADMAP.md`의 해당 체크박스 |
| 의존성 추가/제거 | `package.json` + 실제 import하는 코드 (설치만 하고 방치 금지) |

> **`.env.example` 참고**: `NOTION_*` 4개 변수가 정의되어 있고, Supabase 변수는 MVP 미사용이므로 주석 처리되어 있다. Supabase를 되살리지 말 것 (§8.2).

---

## 11. AI 의사결정 표준

### 11.1 데이터를 어디서 가져올 것인가

```
노션 데이터가 필요하다
├─ 화면 렌더링용인가?          → Server Component에서 src/lib/notion/queries.ts 직접 호출 + revalidate
├─ PDF 생성용인가?             → /api/resume/pdf 라우트 핸들러에서 같은 queries 함수 호출
└─ 그 외(클라이언트 fetch)     → 재설계한다. 공개 조회 API는 만들지 않는다.
```

### 11.2 컴포넌트를 어디에 둘 것인가

```
새 컴포넌트가 필요하다
├─ shadcn 프리미티브인가?       → npx shadcn@latest add <name>  (직접 작성 금지)
├─ 헤더/푸터/전역 네비인가?      → src/components/layout/
├─ 전역 Provider인가?           → src/components/providers/
└─ 포트폴리오 도메인 UI인가?     → src/components/portfolio/
```

### 11.3 노션 값이 비어 있을 때

```
속성이 없거나 타입이 다르다
├─ 필수 문자열   → ""  로 폴백하고 렌더링은 계속한다
├─ 선택 필드     → null 로 폴백하고 해당 UI 블록을 렌더링하지 않는다
├─ 배열          → []  로 폴백한다
└─ 어떤 경우에도 → throw 하지 않는다. 서버 로그에만 경고를 남긴다.
```

### 11.4 스펙이 모호할 때 우선순위

1. `docs/PRD.md`에 명시된 타입명·필드명·파일 경로를 **그대로** 따른다. 유사한 다른 이름을 새로 만들지 않는다.
2. PRD에 없으면 `docs/ROADMAP.md`의 완료 기준으로 판단한다.
3. 둘 다 없고 **되돌리기 어려운 결정**(라이브러리 선택, 노션 스키마 변경, 배포 설정)이면 사용자에게 확인한다.
4. 되돌리기 쉬운 결정이면 PRD의 기존 패턴을 따라 스스로 결정하고, 그 근거를 주석에 남긴다.

### 11.5 전문 에이전트 위임 기준

| 상황 | 사용할 에이전트 |
|---|---|
| 노션 스키마 설계 / API 연동 코드 / 속성↔타입 매핑 / rate limit 처리 | `notion-api-expert` |
| 스타터킷 잔재·미사용 의존성 제거 | `project-initializer` |
| 파일 수정 없는 코드 리뷰 | `code-improver` |

---

## 12. 금지 사항 (Prohibited Actions)

- ❌ 노션 환경변수에 `NEXT_PUBLIC_` 접두사 붙이기
- ❌ `src/lib/notion/*`를 `"use client"` 파일에서 import
- ❌ 옵셔널 체이닝·`type` 확인 없이 노션 속성 직접 접근
- ❌ 전체 조회 후 렌더 단계에서 비공개 항목 숨기기 (쿼리 필터로 제외할 것)
- ❌ 목록/상세 조회용 공개 API 라우트 신설
- ❌ 공개 페이지에 `force-dynamic` / `no-store` 적용
- ❌ `src/components/ui/` 파일 직접 작성·편집
- ❌ 색상 하드코딩 (`bg-white`, `text-gray-500`, `#hex`)
- ❌ `tailwind.config.{js,ts}` 파일 생성
- ❌ `any` 타입, `as any` 우회
- ❌ Supabase / `zod` / `zustand` / `react-hook-form`을 MVP 코드에 새로 도입
- ❌ `puppeteer` / `jspdf`로 PDF 생성
- ❌ 한글 폰트 임베드 없이 PDF 구현
- ❌ `pages/` 디렉터리 생성
- ❌ 테스트 프레임워크 임의 설치
- ❌ `git push` 실행, 영문 커밋 메시지, Claude 서명 문구 삽입
- ❌ PRD에 정의된 이름 대신 임의의 새 이름 사용 (`src/lib/notion/`, `src/types/portfolio.ts`, `/api/resume/pdf`는 고정)
