import Image from "next/image";

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
      {/*
        shadcn `Avatar`(Radix) 를 쓰지 않는다. 두 가지 이유가 있다.
        1. Radix `AvatarImage` 는 순수 `<img>` 를 그리므로 next/image 최적화를 타지 않는다.
           노션 프로필 사진 원본은 1MB 를 넘고 이게 홈 화면 LCP 이미지다.
        2. Radix 의 fallback 은 이미지 로드 상태를 클라이언트에서 판정하는 장치인데,
           우리는 서버에서 이미 `avatarUrl` 유무를 알고 있어 그 판정이 필요 없다.
      */}
      {profile.avatarUrl ? (
        <Image
          src={profile.avatarUrl}
          alt={`${profile.name} 프로필 사진`}
          width={256}
          height={256}
          // 홈 최상단 이미지라 LCP 후보다. 지연 로딩하지 않는다.
          priority
          sizes="(min-width: 640px) 128px, 112px"
          className="size-28 rounded-full object-cover ring-1 ring-border sm:size-32"
        />
      ) : (
        <div
          aria-hidden
          className="flex size-28 items-center justify-center rounded-full bg-muted text-3xl text-muted-foreground ring-1 ring-border sm:size-32 sm:text-4xl"
        >
          {toInitials(profile.name)}
        </div>
      )}

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
