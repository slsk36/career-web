import Image from "next/image";
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
      {/*
        `fill` 대신 width/height 를 준다. `fill` 은 position 이 잡힌 래퍼 div 가 필요한데,
        그러면 Card 의 `has-[>img:first-child]:pt-0` / `*:[img:first-child]:rounded-t-xl`
        선택자가 첫 자식이 img 가 아니게 되어 매칭되지 않는다.
        실제 표시 크기는 아래 className(aspect-video / object-cover)이 결정하고,
        width/height 는 16:9 비율만 알려주는 역할이다.
      */}
      {project.thumbnailUrl ? (
        <Image
          src={project.thumbnailUrl}
          alt={`${project.title} 대표 이미지`}
          width={640}
          height={360}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
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
