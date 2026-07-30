import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SkillBadges } from "@/components/portfolio/skill-badges";
import { formatPeriod } from "@/lib/format";
import type { Project } from "@/types/portfolio";

interface ProjectCardProps {
  project: Project;
}

/**
 * 프로젝트 목록용 카드.
 *
 * 제목 링크에 `after:absolute after:inset-0` 을 걸어 카드 전체가 클릭되게 하면서도
 * 스크린리더에는 링크 텍스트가 제목 하나로만 읽히게 한다.
 */
export function ProjectCard({ project }: ProjectCardProps) {
  const period = formatPeriod(project.periodStart, project.periodEnd, "진행중");

  return (
    <Card className="relative h-full transition-shadow hover:ring-foreground/25 focus-within:ring-2 focus-within:ring-ring">
      {project.thumbnailUrl ? (
        // TODO: Phase 5 에서 next/image 로 교체하고 next.config.ts 에 remotePatterns 를 추가한다.
        // 노션 업로드 파일 URL 은 만료되므로 호스트가 확정된 뒤에 설정해야 한다.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.thumbnailUrl}
          alt={`${project.title} 대표 이미지`}
          loading="lazy"
          className="aspect-video w-full object-cover"
        />
      ) : null}

      <CardHeader>
        <CardTitle>
          <Link
            href={`/projects/${project.id}`}
            className="after:absolute after:inset-0 hover:underline"
          >
            {project.title}
          </Link>
        </CardTitle>
        {project.summary ? <CardDescription>{project.summary}</CardDescription> : null}
      </CardHeader>

      <CardContent className="mt-auto space-y-3">
        {period ? <p className="text-xs text-muted-foreground tabular-nums">{period}</p> : null}
        <SkillBadges skills={project.skills} />
      </CardContent>
    </Card>
  );
}
