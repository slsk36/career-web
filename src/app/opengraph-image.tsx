import { ImageResponse } from "next/og";

import { OgCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/card";
import { loadOgFonts } from "@/lib/og/fonts";
import { fetchImageDataUri } from "@/lib/og/image";
import { fetchProfile } from "@/lib/notion/queries";

/** 폰트 TTF 를 파일 시스템에서 읽으므로 edge 가 아닌 node 런타임이어야 한다. */
export const runtime = "nodejs";

/** ISR (FR-9) — 1시간. 리터럴이어야 한다 (Next 가 정적 분석함). */
export const revalidate = 3600;

/**
 * `alt` 는 정적 문자열만 허용된다(파일 컨벤션 제약). 프로필 이름을 넣을 수 없어
 * 일반적인 문구를 쓴다.
 */
export const alt = "포트폴리오 대표 이미지";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/**
 * 홈 OG 이미지 (FR-10).
 *
 * 노션 프로필 사진을 직접 `og:image` 로 지정하지 않는 이유는 서명 URL 이 1시간 뒤 만료되어
 * 크롤러가 나중에 받아가면 403 이 되기 때문이다. 여기서 생성 시점에 한 번 받아 PNG 로 구워두면
 * 만료와 무관해진다.
 */
export default async function OpengraphImage() {
  const [fonts, profile] = await Promise.all([loadOgFonts(), safeFetchProfile()]);

  const avatar = profile?.avatarUrl ? await fetchImageDataUri(profile.avatarUrl) : null;

  return new ImageResponse(
    (
      <OgCard
        eyebrow="PORTFOLIO"
        title={profile?.name || "포트폴리오"}
        subtitle={profile?.headline || null}
        imageDataUri={avatar}
        imageShape="circle"
      />
    ),
    { ...size, fonts }
  );
}

/** 노션 장애가 OG 이미지 생성 실패로 이어지지 않게 한다. 이름 없는 기본 카드로 폴백한다. */
async function safeFetchProfile() {
  try {
    return await fetchProfile();
  } catch (error) {
    console.error("[og] 프로필 조회 실패. 기본 카드로 생성합니다:", error);
    return null;
  }
}
