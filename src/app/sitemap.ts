import type { MetadataRoute } from "next";

import { fetchProjects } from "@/lib/notion/queries";
import { absoluteUrl } from "@/lib/site";

/** ISR (FR-9) — 1시간. 리터럴이어야 한다 (Next 가 정적 분석함). */
export const revalidate = 3600;

/**
 * `sitemap.xml` (FR-10).
 *
 * 비공개 프로젝트는 `fetchProjects` 가 조회 단계에서 이미 걸러낸다 (FR-6).
 * 사이트맵에 draft 항목이 들어가면 크롤러에게 404 를 안내하는 꼴이 된다.
 *
 * `lastModified` 는 넣지 않는다. `Project` 타입에 수정 시각이 없고, 현재 시각을 넣으면
 * "방금 바뀌었다" 는 거짓 신호를 매 재생성마다 보내게 된다. 값이 없는 것이 틀린 값보다 낫다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const home: MetadataRoute.Sitemap[number] = {
    url: absoluteUrl("/"),
    changeFrequency: "weekly",
    priority: 1,
  };

  try {
    const projects = await fetchProjects();

    return [
      home,
      ...projects.map((project) => ({
        url: absoluteUrl(`/projects/${project.id}`),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      })),
    ];
  } catch (error) {
    // 노션 장애 시 사이트맵 전체가 500 이 되는 것보다 홈만이라도 알리는 편이 낫다.
    console.error("[sitemap] 프로젝트 조회 실패. 홈만 포함합니다:", error);
    return [home];
  }
}
