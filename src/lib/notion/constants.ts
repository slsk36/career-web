/**
 * 노션 스키마와 코드를 잇는 유일한 접점.
 *
 * 노션 DB 의 속성명은 한글이고 내부 타입 필드는 영문이다.
 * 그 대응표를 여기 한 곳에만 두고, 다른 파일에서는 한글 리터럴을 직접 쓰지 않는다.
 * 노션에서 속성 이름을 바꾸면 이 파일만 고치면 된다.
 */

/**
 * ISR 재생성 주기는 각 페이지에서 `export const revalidate = 3600` 리터럴로 직접 선언한다.
 * Next.js 는 이 값을 정적 분석하므로 상수를 import 해서 쓸 수 없다
 * ("Invalid segment configuration export detected" 로 빌드 실패).
 * 주기를 바꿀 때는 `src/app/page.tsx` 와 `src/app/projects/[id]/page.tsx` 를 함께 고칠 것.
 */

/** 경력·프로젝트 공통 공개여부 속성명 */
export const STATUS_PROPERTY = "공개여부";

/**
 * `공개여부` status 옵션 이름.
 * 노션 DB 의 실제 옵션 이름과 반드시 일치해야 한다.
 * 불일치 시 필터는 에러 없이 0건을 반환하므로, 조회 결과가 비면 이 값부터 대조할 것.
 */
export const PUBLISH_STATUS = {
  draft: "draft",
  published: "published",
} as const;

/** PROFILE DB 속성명 */
export const PROFILE_PROPS = {
  name: "이름",
  headline: "직함/한줄소개",
  bio: "자기소개",
  avatar: "프로필 사진",
  email: "이메일",
  github: "GitHub",
  linkedin: "LinkedIn",
  blog: "블로그",
} as const;

/** CAREER DB 속성명 */
export const CAREER_PROPS = {
  company: "회사명",
  role: "직무",
  startDate: "시작일",
  endDate: "종료일",
  description: "주요 업무/성과",
  skills: "사용 기술",
  status: STATUS_PROPERTY,
} as const;

/** PROJECTS DB 속성명 */
export const PROJECT_PROPS = {
  title: "프로젝트명",
  summary: "한줄 소개",
  description: "상세 설명",
  period: "기간",
  role: "역할",
  skills: "사용 기술",
  thumbnail: "대표 이미지",
  link: "GitHub/데모 링크",
  status: STATUS_PROPERTY,
  order: "정렬 순서",
} as const;
