import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SkillBadges } from "@/components/portfolio/skill-badges";
import { formatPeriod } from "@/lib/format";
import type { Career } from "@/types/portfolio";

interface CareerTimelineProps {
  careers: Career[];
}

/**
 * 경력 타임라인.
 * 왼쪽 세로선 + 시점 점으로 표현하며, 모바일에서도 동일한 세로형을 유지한다.
 * 종료일이 없는 경력은 "재직중"으로 표시한다.
 */
export function CareerTimeline({ careers }: CareerTimelineProps) {
  if (careers.length === 0) {
    return <p className="text-sm text-muted-foreground">등록된 경력이 없습니다.</p>;
  }

  return (
    <ol className="relative border-l border-border">
      {careers.map((career) => {
        const period = formatPeriod(career.startDate, career.endDate, "재직중");

        return (
          <li key={career.id} className="relative pb-4 pl-5 last:pb-0 sm:pl-8">
            {/* 타임라인 시점 표시 — 세로선 위에 겹치도록 배치 */}
            <span
              aria-hidden
              className="absolute top-5 left-0 size-2.5 -translate-x-1/2 rounded-full bg-primary ring-4 ring-background"
            />

            <Card>
              <CardHeader>
                <CardTitle>{career.company}</CardTitle>
                {career.role ? <CardDescription>{career.role}</CardDescription> : null}
              </CardHeader>

              <CardContent className="space-y-3">
                {period ? (
                  <p className="text-xs text-muted-foreground tabular-nums">{period}</p>
                ) : null}

                {career.description ? (
                  <p className="text-sm whitespace-pre-line text-muted-foreground">
                    {career.description}
                  </p>
                ) : null}

                <SkillBadges skills={career.skills} />
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ol>
  );
}
