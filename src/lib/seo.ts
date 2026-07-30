import type { Metadata } from "next";

/**
 * SEO 메타데이터 헬퍼 (FR-10).
 */

/** OG `site_name`. 레이아웃과 각 페이지가 같은 값을 쓰도록 여기 한 곳에 둔다. */
export const SITE_NAME = "포트폴리오";

/**
 * 색인 대상 페이지의 robots 지시.
 *
 * **레이아웃(전역)에 걸지 않는다.** 전역에 걸면 Next 가 자체적으로 `noindex` 를 넣는
 * 404 페이지에서 `noindex` 와 `index, follow` 두 개의 robots 메타태그가 함께 나간다.
 * 구글은 충돌 시 더 제한적인 쪽을 택하므로 결과는 맞지만, 크롤러에 모순된 신호를 보내는
 * 상태를 남길 이유가 없다. (2026-07-30 실측으로 확인)
 *
 * `index, follow` 자체는 어차피 기본값이라, 실질적인 의미는 googleBot 하위 지시에 있다.
 * 검색결과에서 이미지 미리보기와 본문 스니펫이 잘리지 않게 한다.
 */
export const INDEXABLE_ROBOTS: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
};

/**
 * 구글이 데스크톱 검색결과에 표시하는 길이는 대략 155~160자다.
 * 넘겨도 페널티는 없지만 어차피 잘리므로, 잘릴 자리를 우리가 정한다.
 */
const MAX_LENGTH = 155;

/**
 * 여러 조각을 이어 한 줄짜리 설명으로 만든다.
 * 노션 본문은 줄바꿈과 공백이 자유롭게 들어오는데, `<meta name="description">` 에
 * 그대로 넣으면 검색결과 스니펫이 지저분해진다. 한 줄로 펴고 길이를 자른다.
 *
 * 비어 있는 조각은 버리고, 남는 게 없으면 `fallback` 을 쓴다.
 */
export function buildMetaDescription(parts: (string | null | undefined)[], fallback: string): string {
  const joined = parts
    .map((part) => part?.replace(/\s+/g, " ").trim())
    .filter((part): part is string => Boolean(part))
    .join(" · ");

  if (!joined) return fallback;
  if (joined.length <= MAX_LENGTH) return joined;

  // 단어 중간에서 자르지 않도록 마지막 공백까지만 남긴다.
  const cut = joined.slice(0, MAX_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > MAX_LENGTH * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

interface SocialMetadataInput {
  title: string;
  description: string;
  /** 사이트 루트 기준 경로 (`metadataBase` 로 절대화된다) */
  path: string;
  type?: "website" | "article";
}

/**
 * 페이지의 `openGraph` / `twitter` 블록을 만든다.
 *
 * **레이아웃의 값이 상속될 것으로 기대하면 안 된다.** Next 의 메타데이터 병합은 얕아서,
 * 페이지가 `openGraph` 를 지정하는 순간 레이아웃의 `openGraph`(type/locale/siteName)는
 * 상속되지 않고 통째로 대체된다. `twitter` 도 마찬가지라 `card` 가 기본값 `summary` 로
 * 되돌아가 큰 이미지 미리보기가 사라진다. (2026-07-30 실측으로 확인)
 *
 * 그래서 공통 필드를 여기서 매번 함께 채운다.
 *
 * `images` 는 지정하지 않는다. `opengraph-image.tsx` 파일 컨벤션으로 생성한 이미지를
 * Next 가 자동으로 붙여주는데, 여기서 지정하면 그게 대체된다.
 */
export function buildSocialMetadata({
  title,
  description,
  path,
  type = "website",
}: SocialMetadataInput): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type,
      locale: "ko_KR",
      siteName: SITE_NAME,
      title,
      description,
      url: path,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
