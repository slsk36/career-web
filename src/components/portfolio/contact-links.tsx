"use client";

import { useEffect, useState } from "react";
import { BookOpen, Briefcase, GitBranch, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ContactLinksProps {
  /** 이메일을 "@" 앞뒤로 쪼갠 값. 서버 HTML 에 완전한 주소가 남지 않게 한다. */
  emailParts: { user: string; domain: string } | null;
  github: string | null;
  linkedin: string | null;
  blog: string | null;
}

/**
 * 연락처 링크 모음.
 *
 * 클라이언트 컴포넌트인 이유는 이메일 난독화 하나뿐이다.
 * prerender 된 HTML 에는 주소가 쪼개진 상태로만 들어가고, 마운트 후 mailto 를 조합한다.
 * 스팸 봇을 완전히 막지는 못하지만 정적 HTML 스크래핑은 걸러낸다.
 *
 * lucide 에 브랜드 아이콘(GitHub/LinkedIn)이 없어 범용 아이콘 + 텍스트 라벨을 함께 쓴다.
 * 아이콘만으로는 어떤 서비스인지 알 수 없기 때문이다.
 */
export function ContactLinks({ emailParts, github, linkedin, blog }: ContactLinksProps) {
  const [mailto, setMailto] = useState<string | null>(null);

  useEffect(() => {
    if (!emailParts) return;
    setMailto(`mailto:${emailParts.user}@${emailParts.domain}`);
  }, [emailParts]);

  const links = [
    { href: mailto, label: "이메일", icon: Mail, external: false },
    { href: github, label: "GitHub", icon: GitBranch, external: true },
    { href: linkedin, label: "LinkedIn", icon: Briefcase, external: true },
    { href: blog, label: "블로그", icon: BookOpen, external: true },
  ].filter((link): link is typeof link & { href: string } => Boolean(link.href));

  if (links.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center justify-center gap-2">
      {links.map(({ href, label, icon: Icon, external }) => (
        <li key={label}>
          <Button variant="outline" size="sm" asChild>
            <a
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              <Icon data-icon="inline-start" aria-hidden />
              {label}
            </a>
          </Button>
        </li>
      ))}
    </ul>
  );
}
