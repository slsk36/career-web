import { ImageResponse } from "next/og";

import { formatPeriod } from "@/lib/format";
import { fetchProjectById, fetchProjects } from "@/lib/notion/queries";
import { OgCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/card";
import { loadOgFonts } from "@/lib/og/fonts";
import { fetchImageDataUri } from "@/lib/og/image";

/** 폰트 TTF 를 파일 시스템에서 읽으므로 edge 가 아닌 node 런타임이어야 한다. */
export const runtime = "nodejs";

/** ISR (FR-9) — 1시간. 리터럴이어야 한다 (Next 가 정적 분석함). */
export const revalidate = 3600;

export const alt = "프로젝트 대표 이미지";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/**
 * 페이지와 동일하게 빌드 시점에 미리 생성한다.
 *
 * 이게 없으면 이 라우트만 동적(ƒ)으로 남아 `revalidate` 가 적용되지 않고,
 * 크롤러가 링크 미리보기를 요청할 때마다 노션 조회 + 이미지 페치 + satori 렌더가
 * 통째로 다시 돈다. (빌드 출력의 Revalidate 열이 비어 있는 것으로 확인)
 */
export async function generateStaticParams() {
  try {
    const projects = await fetchProjects();
    return projects.map((project) => ({ id: project.id }));
  } catch (error) {
    // 노션 장애로 빌드가 실패하지 않게 한다. 이 경우 전부 on-demand 생성된다.
    console.error("[og] generateStaticParams 실패:", error);
    return [];
  }
}

/**
 * 프로젝트 상세 OG 이미지 (FR-10).
 *
 * 비공개·존재하지 않는 프로젝트도 이미지 생성 자체는 막지 않는다.
 * 페이지가 이미 404 를 내므로 크롤러가 이 이미지에 도달할 경로가 없고,
 * 여기서 404 를 만들면 페이지는 200 인데 OG 만 깨지는 경우를 다루기 번거로워진다.
 */
export default async function OpengraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [fonts, project] = await Promise.all([loadOgFonts(), fetchProjectById(id)]);

  const thumbnail = project?.thumbnailUrl ? await fetchImageDataUri(project.thumbnailUrl) : null;
  const period = project ? formatPeriod(project.periodStart, project.periodEnd, "진행중") : null;

  const footnote = [period, project?.role].filter(Boolean).join(" · ") || null;

  return new ImageResponse(
    (
      <OgCard
        eyebrow="PROJECT"
        title={project?.title || "프로젝트"}
        subtitle={project?.summary || null}
        footnote={footnote}
        imageDataUri={thumbnail}
      />
    ),
    { ...size, fonts }
  );
}
