/**
 * 포트폴리오 도메인 타입.
 * 노션 속성(한글) → 이 타입(영문)으로의 변환은 src/lib/notion/mappers.ts 가 담당한다.
 * 필드를 추가/변경하면 mappers.ts 와 docs/PRD.md "데이터 모델" 표를 함께 수정할 것.
 */

/** 노션 `공개여부`(status) 속성의 값 */
export type PublishStatus = "draft" | "published";

/** 프로필 — 노션 PROFILE DB 의 1개 행 */
export interface Profile {
  name: string;
  headline: string;
  bio: string | null;
  avatarUrl: string | null;
  email: string | null;
  github: string | null;
  linkedin: string | null;
  blog: string | null;
}

/** 경력 한 건 */
export interface Career {
  id: string;
  company: string;
  role: string;
  /** ISO date string */
  startDate: string;
  /** null 이면 재직중 */
  endDate: string | null;
  description: string | null;
  skills: string[];
}

/** 프로젝트 한 건 */
export interface Project {
  id: string;
  title: string;
  summary: string;
  description: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  role: string | null;
  skills: string[];
  thumbnailUrl: string | null;
  link: string | null;
  /** 수동 정렬용. null 이면 기간 최신순으로 폴백한다. */
  order: number | null;
}
