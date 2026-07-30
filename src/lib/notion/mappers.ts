/**
 * 노션 페이지 → 도메인 타입 매핑.
 *
 * 노션 스키마는 언제든 바뀔 수 있으므로 모든 속성 접근은
 * `?.type` 확인 → 값 추출 → 기본값 폴백 순서를 지킨다 (FR-7).
 * 값이 없다고 예외를 던지지 않는다. 필드 하나가 비어도 페이지 전체가 죽으면 안 된다.
 */
import type { PageObjectResponse, RichTextItemResponse } from "@notionhq/client";
import type { Career, Profile, Project, PublishStatus } from "@/types/portfolio";
import { CAREER_PROPS, PROFILE_PROPS, PROJECT_PROPS, PUBLISH_STATUS } from "./constants";

type NotionProps = PageObjectResponse["properties"];

/** rich_text / title 배열을 평문으로 합친다. */
function extractPlainText(richText: RichTextItemResponse[] | undefined): string {
  if (!richText || richText.length === 0) return "";
  return richText.map((block) => block.plain_text).join("");
}

/** title 속성 → 문자열 (없으면 "") */
function getTitle(props: NotionProps, name: string): string {
  const prop = props[name];
  return prop?.type === "title" ? extractPlainText(prop.title) : "";
}

/** rich_text 속성 → 문자열 (없으면 "") */
function getRichText(props: NotionProps, name: string): string {
  const prop = props[name];
  return prop?.type === "rich_text" ? extractPlainText(prop.rich_text) : "";
}

/** url 속성 → 문자열 (없으면 null) */
function getUrl(props: NotionProps, name: string): string | null {
  const prop = props[name];
  return prop?.type === "url" ? prop.url : null;
}

/** email 속성 → 문자열 (없으면 null) */
function getEmail(props: NotionProps, name: string): string | null {
  const prop = props[name];
  return prop?.type === "email" ? prop.email : null;
}

/** number 속성 → 숫자 (없으면 null) */
function getNumber(props: NotionProps, name: string): number | null {
  const prop = props[name];
  return prop?.type === "number" ? prop.number : null;
}

/** multi_select 속성 → 옵션 이름 배열 (없으면 []) */
function getMultiSelect(props: NotionProps, name: string): string[] {
  const prop = props[name];
  if (prop?.type !== "multi_select") return [];
  return prop.multi_select.map((option) => option.name);
}

/**
 * files 속성 → 첫 번째 파일 URL (없으면 null)
 *
 * 주의: 노션 업로드 파일(`type: "file"`)의 URL 은 만료된다.
 * 이 값을 어딘가에 영구 저장하지 말고, 재생성 시점마다 새로 받아 쓴다.
 */
function getFileUrl(props: NotionProps, name: string): string | null {
  const prop = props[name];
  if (prop?.type !== "files") return null;

  const first = prop.files[0];
  if (!first) return null;
  if (first.type === "file") return first.file.url;
  if (first.type === "external") return first.external.url;
  return null;
}

/** date 속성 → { start, end } (없으면 둘 다 null) */
function getDateRange(
  props: NotionProps,
  name: string
): { start: string | null; end: string | null } {
  const prop = props[name];
  if (prop?.type !== "date" || !prop.date) return { start: null, end: null };
  return { start: prop.date.start ?? null, end: prop.date.end ?? null };
}

/** status 속성 → PublishStatus (알 수 없으면 안전한 쪽인 draft 로 폴백) */
export function getPublishStatus(props: NotionProps, name: string): PublishStatus {
  const prop = props[name];
  if (prop?.type !== "status") return "draft";
  return prop.status?.name === PUBLISH_STATUS.published ? "published" : "draft";
}

/** 노션 페이지 → Profile */
export function mapNotionPageToProfile(page: PageObjectResponse): Profile {
  const props = page.properties;

  return {
    name: getTitle(props, PROFILE_PROPS.name),
    headline: getRichText(props, PROFILE_PROPS.headline),
    bio: getRichText(props, PROFILE_PROPS.bio) || null,
    avatarUrl: getFileUrl(props, PROFILE_PROPS.avatar),
    email: getEmail(props, PROFILE_PROPS.email),
    github: getUrl(props, PROFILE_PROPS.github),
    linkedin: getUrl(props, PROFILE_PROPS.linkedin),
    blog: getUrl(props, PROFILE_PROPS.blog),
  };
}

/** 노션 페이지 → Career */
export function mapNotionPageToCareer(page: PageObjectResponse): Career {
  const props = page.properties;
  const start = getDateRange(props, CAREER_PROPS.startDate);
  const end = getDateRange(props, CAREER_PROPS.endDate);

  return {
    id: page.id,
    company: getTitle(props, CAREER_PROPS.company),
    role: getRichText(props, CAREER_PROPS.role),
    startDate: start.start ?? "",
    // 종료일이 비어 있으면 재직중으로 본다
    endDate: end.start,
    description: getRichText(props, CAREER_PROPS.description) || null,
    skills: getMultiSelect(props, CAREER_PROPS.skills),
  };
}

/** 노션 페이지 → Project */
export function mapNotionPageToProject(page: PageObjectResponse): Project {
  const props = page.properties;
  const period = getDateRange(props, PROJECT_PROPS.period);

  return {
    id: page.id,
    title: getTitle(props, PROJECT_PROPS.title),
    summary: getRichText(props, PROJECT_PROPS.summary),
    description: getRichText(props, PROJECT_PROPS.description) || null,
    periodStart: period.start,
    periodEnd: period.end,
    role: getRichText(props, PROJECT_PROPS.role) || null,
    skills: getMultiSelect(props, PROJECT_PROPS.skills),
    thumbnailUrl: getFileUrl(props, PROJECT_PROPS.thumbnail),
    link: getUrl(props, PROJECT_PROPS.link),
    order: getNumber(props, PROJECT_PROPS.order),
  };
}
