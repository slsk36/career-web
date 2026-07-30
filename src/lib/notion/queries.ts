/**
 * 노션 조회 함수 (서버 전용).
 *
 * 캐싱: 이 함수들은 Next.js 의 patched fetch 가 아니라 노션 SDK 를 쓰므로
 * fetch 캐시가 적용되지 않는다. ISR 은 이 함수를 호출하는 **페이지 쪽에서**
 * `export const revalidate = REVALIDATE_SECONDS` 로 건다 (FR-9).
 * 방문 요청마다 노션을 호출하게 만드는 `force-dynamic` / `no-store` 를 쓰지 않는다.
 *
 * 비공개 항목은 렌더 단계가 아니라 이 조회 단계에서 제외한다 (FR-6).
 */
import { collectPaginatedAPI, isFullPage } from "@notionhq/client";
import type { PageObjectResponse, QueryDataSourceResponse } from "@notionhq/client";
import type { Career, Profile, Project } from "@/types/portfolio";
import { getDataSourceId, notion } from "./client";
import { PUBLISH_STATUS, STATUS_PROPERTY } from "./constants";
import {
  getPublishStatus,
  mapNotionPageToCareer,
  mapNotionPageToProfile,
  mapNotionPageToProject,
} from "./mappers";

/** 공개 항목만 남기는 노션 필터 */
const publishedFilter = {
  property: STATUS_PROPERTY,
  status: { equals: PUBLISH_STATUS.published },
} as const;

/** 조회 결과에서 완전한 페이지 객체만 남긴다. */
function onlyFullPages(results: QueryDataSourceResponse["results"]): PageObjectResponse[] {
  return results.filter((result): result is PageObjectResponse => isFullPage(result));
}

/**
 * 프로필 조회. PROFILE DB 의 첫 번째 행만 사용한다.
 * 행이 없으면 null 을 반환하므로 호출부에서 분기할 것.
 */
export async function fetchProfile(): Promise<Profile | null> {
  const dataSourceId = await getDataSourceId("profile");

  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    page_size: 1,
  });

  const [page] = onlyFullPages(response.results);
  return page ? mapNotionPageToProfile(page) : null;
}

/** 공개된 경력을 시작일 최신순으로 조회한다. */
export async function fetchCareers(): Promise<Career[]> {
  const dataSourceId = await getDataSourceId("career");

  const results = await collectPaginatedAPI(notion.dataSources.query, {
    data_source_id: dataSourceId,
    filter: publishedFilter,
  });

  return onlyFullPages(results)
    .map(mapNotionPageToCareer)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
}

/**
 * 공개된 프로젝트를 조회한다.
 * 정렬은 `정렬 순서`(order) 오름차순 우선, 값이 없는 항목은 뒤로 보내고 기간 최신순으로 폴백한다 (FR-12).
 * 노션 정렬로는 "빈 값을 뒤로" 를 표현하기 어려워 조회 후 JS 에서 정렬한다.
 */
export async function fetchProjects(): Promise<Project[]> {
  const dataSourceId = await getDataSourceId("projects");

  const results = await collectPaginatedAPI(notion.dataSources.query, {
    data_source_id: dataSourceId,
    filter: publishedFilter,
  });

  return onlyFullPages(results).map(mapNotionPageToProject).sort(compareProjects);
}

function compareProjects(a: Project, b: Project): number {
  const hasOrderA = a.order !== null;
  const hasOrderB = b.order !== null;

  if (hasOrderA && hasOrderB) return a.order! - b.order!;
  // order 가 지정된 항목을 항상 앞에 둔다
  if (hasOrderA !== hasOrderB) return hasOrderA ? -1 : 1;

  // 둘 다 order 가 없으면 기간 최신순
  return (b.periodStart ?? "").localeCompare(a.periodStart ?? "");
}

/**
 * 프로젝트 단건 조회.
 * 존재하지 않거나 비공개면 null 을 반환한다. 호출부에서 notFound() 로 이어갈 것 (FR-4).
 */
export async function fetchProjectById(id: string): Promise<Project | null> {
  try {
    const page = await notion.pages.retrieve({ page_id: id });
    if (!isFullPage(page)) return null;

    // 단건 조회에는 필터를 걸 수 없으므로 여기서 공개 여부를 확인한다.
    if (getPublishStatus(page.properties, STATUS_PROPERTY) !== "published") {
      return null;
    }

    return mapNotionPageToProject(page);
  } catch {
    // 존재하지 않는 ID, 권한 없음 등은 모두 "찾을 수 없음" 으로 처리한다.
    return null;
  }
}
