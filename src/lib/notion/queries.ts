/**
 * 노션 조회 함수 (서버 전용).
 *
 * 캐싱은 두 층으로 나뉜다.
 *
 * 1. **요청 간(ISR)** — 이 함수들은 Next.js 의 patched fetch 가 아니라 노션 SDK 를 쓰므로
 *    fetch 캐시가 적용되지 않는다. ISR 은 이 함수를 호출하는 **페이지 쪽에서**
 *    `export const revalidate = 3600` 으로 건다 (FR-9).
 *    방문 요청마다 노션을 호출하게 만드는 `force-dynamic` / `no-store` 를 쓰지 않는다.
 * 2. **요청 내(React cache)** — 한 요청 안에서 `generateMetadata` 와 페이지 렌더가
 *    같은 데이터를 각각 조회하면 노션 호출이 그대로 2배가 된다. `cache()` 로 감싸
 *    요청 범위에서 한 번만 호출되게 한다. 인자별로 구분되므로 `fetchProjectById` 도 안전하다.
 *
 * 비공개 항목은 렌더 단계가 아니라 이 조회 단계에서 제외한다 (FR-6).
 */
import { cache } from "react";
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
 * 프로필 조회. PROFILE DB 는 1행짜리 설정 테이블처럼 쓴다.
 *
 * **"첫 번째 행" 을 그대로 믿지 않는다.** 노션에서 빈 행이 실수로 추가되는 일은 흔한데,
 * 정렬을 지정하지 않은 조회의 순서는 보장되지 않아 그 빈 행이 먼저 나올 수 있다.
 * 실제로 빈 행 하나 때문에 이름·소개·연락처가 전부 사라진 적이 있다(2026-07-30).
 *
 * 그래서 이름이 있는 행만 후보로 삼고, 그 중 공개 상태인 행을 우선한다.
 * 행이 없거나 전부 비어 있으면 null 을 반환하므로 호출부에서 분기할 것.
 */
export const fetchProfile = cache(async function fetchProfile(): Promise<Profile | null> {
  const dataSourceId = await getDataSourceId("profile");

  // 1행만 받으면 그 1행이 빈 행일 때 복구할 방법이 없다. 여유 있게 받아 후보 중에서 고른다.
  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    page_size: 10,
  });

  const pages = onlyFullPages(response.results);

  // 이름이 비어 있으면 사실상 빈 행이다.
  const candidates = pages.filter((page) => mapNotionPageToProfile(page).name.trim() !== "");
  if (candidates.length === 0) return null;

  if (candidates.length > 1) {
    console.warn(
      `[notion] PROFILE DB 에 내용이 있는 행이 ${candidates.length} 개입니다. 공개 상태인 행을 우선해 1개만 사용합니다.`
    );
  }

  const published = candidates.find(
    (page) => getPublishStatus(page.properties, STATUS_PROPERTY) === PUBLISH_STATUS.published
  );

  return mapNotionPageToProfile(published ?? candidates[0]);
});

/** 공개된 경력을 시작일 최신순으로 조회한다. */
export const fetchCareers = cache(async function fetchCareers(): Promise<Career[]> {
  const dataSourceId = await getDataSourceId("career");

  const results = await collectPaginatedAPI(notion.dataSources.query, {
    data_source_id: dataSourceId,
    filter: publishedFilter,
  });

  return onlyFullPages(results)
    .map(mapNotionPageToCareer)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
});

/**
 * 공개된 프로젝트를 조회한다.
 * 정렬은 `정렬 순서`(order) 오름차순 우선, 값이 없는 항목은 뒤로 보내고 기간 최신순으로 폴백한다 (FR-12).
 * 노션 정렬로는 "빈 값을 뒤로" 를 표현하기 어려워 조회 후 JS 에서 정렬한다.
 */
export const fetchProjects = cache(async function fetchProjects(): Promise<Project[]> {
  const dataSourceId = await getDataSourceId("projects");

  const results = await collectPaginatedAPI(notion.dataSources.query, {
    data_source_id: dataSourceId,
    filter: publishedFilter,
  });

  return onlyFullPages(results).map(mapNotionPageToProject).sort(compareProjects);
});

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
export const fetchProjectById = cache(async function fetchProjectById(
  id: string
): Promise<Project | null> {
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
});
