import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SkillBadgesProps {
  skills: string[];
  className?: string;
}

/**
 * 사용 기술 태그 목록.
 * 노션 `사용 기술`(multi_select) 값이 비어 있으면 아무것도 렌더링하지 않는다.
 */
export function SkillBadges({ skills, className }: SkillBadgesProps) {
  if (skills.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {skills.map((skill) => (
        <li key={skill}>
          <Badge variant="secondary">{skill}</Badge>
        </li>
      ))}
    </ul>
  );
}
