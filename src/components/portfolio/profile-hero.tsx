import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContactLinks } from "@/components/portfolio/contact-links";
import { ResumeDownloadButton } from "@/components/portfolio/resume-download-button";
import type { Profile } from "@/types/portfolio";

interface ProfileHeroProps {
  profile: Profile;
}

/** 이름에서 아바타 이니셜을 만든다. 한글은 첫 글자, 영문은 앞 두 단어의 머리글자. */
function toInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";

  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

/** 이메일을 "@" 기준으로 쪼갠다. 형식이 아니면 null. */
function splitEmail(email: string | null) {
  if (!email) return null;

  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return null;

  return { user: email.slice(0, at), domain: email.slice(at + 1) };
}

/**
 * 홈 상단 히어로 — 프로필 사진, 이름, 한줄소개, 연락처, 이력서 다운로드.
 * 노션에 값이 없는 항목은 렌더링하지 않는다.
 */
export function ProfileHero({ profile }: ProfileHeroProps) {
  return (
    <section className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-14 text-center sm:px-6 sm:py-20">
      <Avatar size="lg" className="size-20 sm:size-24">
        {profile.avatarUrl ? (
          <AvatarImage src={profile.avatarUrl} alt={`${profile.name} 프로필 사진`} />
        ) : null}
        <AvatarFallback className="text-xl">{toInitials(profile.name)}</AvatarFallback>
      </Avatar>

      {profile.name ? (
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{profile.name}</h1>
      ) : null}

      {profile.headline ? (
        <p className="max-w-xl text-base text-muted-foreground sm:text-lg">{profile.headline}</p>
      ) : null}

      <ContactLinks
        emailParts={splitEmail(profile.email)}
        github={profile.github}
        linkedin={profile.linkedin}
        blog={profile.blog}
      />

      <div className="mt-2">
        <ResumeDownloadButton />
      </div>
    </section>
  );
}
