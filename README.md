# career-web — 포트폴리오 · 경력관리 웹사이트

노션(Notion) 데이터베이스에 입력한 경력·프로젝트·자기소개 정보를 로그인 없이 확인할 수 있는 공개 포트폴리오 웹사이트입니다. 노션을 콘텐츠 관리(CMS)의 Source of Truth로 삼아 Next.js가 정적/증분 재생성(ISR)으로 렌더링하고, 방문자는 요약 이력서를 PDF로 바로 받을 수 있습니다.

> 상세 요구사항은 [`docs/PRD.md`](./docs/PRD.md) 를 참고하세요. 현재 저장소는 Next.js 스타터킷을 기반으로 데모 콘텐츠를 정리한 초기 상태이며, 노션 연동/이력서 PDF 기능은 아직 구현되지 않았습니다.

## 기술 스택

| 분류 | 기술 |
| --- | --- |
| 프레임워크 | [Next.js 15](https://nextjs.org) (App Router, Turbopack) + React 19 |
| 언어 | TypeScript |
| 스타일링 | [Tailwind CSS v4](https://tailwindcss.com) (설정 파일 없음, CSS 변수 기반) |
| UI 컴포넌트 | [shadcn/ui](https://ui.shadcn.com) (Radix 기반) |
| 아이콘 | [lucide-react](https://lucide.dev) |
| 다크모드 | next-themes (라이트 / 다크 / 시스템) |
| 상태관리 | [Zustand](https://zustand.docs.pmnd.rs) (필요한 화면이 생기면 사용) |
| 폼 / 검증 | React Hook Form + Zod (필요한 화면이 생기면 사용) |
| 콘텐츠 소스 | Notion API (`@notionhq/client`, 예정) |
| 백엔드 | [Supabase](https://supabase.com) 클라이언트 유틸 내장 (MVP 범위에서는 미사용, 필요 시 P2로 검토) |

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:3000)
npm run dev

# 프로덕션 빌드 / 실행
npm run build
npm run start

# 린트 검사
npm run lint
```

## 현재 페이지

- `/` — 홈 페이지 (프로필 / 경력 / 프로젝트 / 이력서 다운로드 영역의 최소 정적 뼈대). 노션 연동 전까지는 placeholder 콘텐츠가 표시됩니다.

## 폴더 구조

```
src/
├─ app/                      # 라우트 (App Router)
│  ├─ layout.tsx             # 루트 레이아웃 (테마 프로바이더, 토스터)
│  └─ page.tsx               # 홈 페이지
├─ components/
│  ├─ ui/                    # shadcn/ui 컴포넌트 (CLI 로 추가)
│  ├─ providers/             # 전역 프로바이더 (테마 등)
│  └─ layout/                # 헤더, 푸터, 테마 토글
├─ lib/
│  ├─ utils.ts               # cn() 클래스 병합 유틸
│  └─ supabase/              # Supabase 클라이언트 (browser / server, 현재 미사용)
└─ types/                    # 공통 타입 (ApiResponse 등)
```

## shadcn/ui 컴포넌트 추가하기

필요한 컴포넌트는 CLI 로 추가합니다. 추가된 파일은 `src/components/ui/` 에 생성되며 자유롭게 수정할 수 있습니다.

```bash
npx shadcn@latest add accordion
```

> 이 프로젝트는 shadcn CLI 3.x (radix + nova 프리셋) 로 초기화되었습니다. 폼이 필요해지면 `field` 컴포넌트를 추가해 사용하세요. ([Field 문서](https://ui.shadcn.com/docs/components/field))

현재 설치된 컴포넌트: `avatar`, `badge`, `button`, `card`, `dropdown-menu`, `separator`, `skeleton`, `sonner`, `tooltip`.

## Notion 연동 (예정)

`docs/PRD.md` 의 "사전 준비 사항" 절을 참고해 아래 정보를 준비한 뒤 진행합니다.

1. [notion.so/my-integrations](https://www.notion.so/my-integrations) 에서 Internal Integration 을 생성하고 API 시크릿 키를 발급받습니다.
2. 프로필 / 경력 / 프로젝트 데이터베이스 각각에 위 Integration 을 연결(`Add connections`)합니다.
3. 각 데이터베이스 ID를 확인합니다.
4. `.env.local` 에 `NOTION_API_KEY`, `NOTION_PROFILE_DB_ID`, `NOTION_CAREER_DB_ID`, `NOTION_PROJECTS_DB_ID` 를 등록합니다.

## Supabase 연결하기 (선택, 현재 MVP 범위 밖)

이 프로젝트는 기본적으로 Next.js ISR(`revalidate`)만으로 캐싱하며 Supabase를 사용하지 않습니다. 트래픽/실시간성 요구가 커져 별도 캐시 저장소가 필요해지면 아래 방법으로 연결하세요.

1. [Supabase](https://supabase.com) 에서 프로젝트를 생성합니다.
2. `.env.example` 을 `.env.local` 로 복사합니다.
3. Supabase 대시보드 → **Project Settings → API** 에서 URL 과 anon key 를 복사해 입력합니다.
4. 클라이언트 컴포넌트에서는 `@/lib/supabase/client`, 서버 컴포넌트에서는 `@/lib/supabase/server` 의 `createClient()` 를 사용합니다.

```tsx
// 서버 컴포넌트 예시
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("table_name").select();
  // ...
}
```

> 로그인 세션 유지가 필요하다면 [Supabase SSR 가이드](https://supabase.com/docs/guides/auth/server-side/nextjs) 를 참고해 미들웨어를 추가하세요.

## 개발 컨벤션

- 들여쓰기 2칸, 컴포넌트 파일명은 kebab-case, 컴포넌트명은 PascalCase
- `any` 타입 사용 금지
- 모든 페이지는 반응형으로 작성
- API 응답은 `types/index.ts` 의 `ApiResponse<T>` 형식 유지
