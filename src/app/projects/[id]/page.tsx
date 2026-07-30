import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SkillBadges } from "@/components/portfolio/skill-badges";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPeriod } from "@/lib/format";
import { fetchProjectById, fetchProjects } from "@/lib/notion/queries";

/** ISR (FR-9) — 1시간. 리터럴이어야 한다 (Next 가 정적 분석함). */
export const revalidate = 3600;

/**
 * 공개된 프로젝트를 빌드 시점에 미리 생성한다.
 * 목록에 없는 새 프로젝트는 첫 요청 시 on-demand 로 생성된다 (dynamicParams 기본값 true).
 */
export async function generateStaticParams() {
  try {
    const projects = await fetchProjects();
    return projects.map((project) => ({ id: project.id }));
  } catch (error) {
    // 빌드가 노션 장애로 실패하지 않게 한다. 이 경우 전부 on-demand 생성된다.
    console.error("[projects] generateStaticParams 실패:", error);
    return [];
  }
}

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const project = await fetchProjectById(id);

  // 존재하지 않거나 비공개면 404 (FR-4, FR-6)
  if (!project) notFound();

  const period = formatPeriod(project.periodStart, project.periodEnd, "진행중");

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
          <Link href="/">
            <ArrowLeft data-icon="inline-start" aria-hidden />
            목록으로
          </Link>
        </Button>

        {project.thumbnailUrl ? (
          // TODO: Phase 5 에서 next/image 로 교체한다.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.thumbnailUrl}
            alt={`${project.title} 대표 이미지`}
            className="mb-8 aspect-video w-full rounded-xl object-cover ring-1 ring-foreground/10"
          />
        ) : null}

        <header className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{project.title}</h1>
          {project.summary ? (
            <p className="text-base text-muted-foreground">{project.summary}</p>
          ) : null}
        </header>

        <dl className="mt-6 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[auto_1fr]">
          {period ? (
            <>
              <dt className="font-medium text-muted-foreground">기간</dt>
              <dd className="tabular-nums">{period}</dd>
            </>
          ) : null}

          {project.role ? (
            <>
              <dt className="font-medium text-muted-foreground">역할</dt>
              <dd>{project.role}</dd>
            </>
          ) : null}

          {project.skills.length > 0 ? (
            <>
              <dt className="font-medium text-muted-foreground">사용 기술</dt>
              <dd>
                <SkillBadges skills={project.skills} />
              </dd>
            </>
          ) : null}
        </dl>

        {project.description ? (
          <>
            <Separator className="my-8" />
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">상세 설명</h2>
              <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                {project.description}
              </p>
            </div>
          </>
        ) : null}

        {project.link ? (
          <div className="mt-10">
            <Button asChild>
              <a href={project.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink data-icon="inline-start" aria-hidden />
                GitHub · 데모 보기
              </a>
            </Button>
          </div>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
