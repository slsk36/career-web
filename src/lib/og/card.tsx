import { OG_FONT_FAMILY } from "./fonts";

/**
 * OG 이미지 카드 레이아웃 (1200×630).
 *
 * satori 는 CSS 를 전부 지원하지 않는다. 아래 제약을 지켜 작성한다.
 * - flexbox 만 쓴다 (grid 없음). 자식이 둘 이상인 요소에는 `display: "flex"` 를 명시한다.
 * - Tailwind 클래스와 CSS 변수는 동작하지 않는다. 색상을 직접 값으로 적는다.
 *   (앱 화면이 아니라 크롤러가 받는 정적 PNG 이므로 다크모드 대응 대상이 아니다.)
 * - `gap` 대신 margin 을 쓴다. 버전에 따라 해석이 달라지는 속성을 피한다.
 */

/** OG 이미지 규격. 이 크기를 벗어나면 SNS 미리보기에서 잘린다. */
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

const COLORS = {
  background: "#09090b",
  accent: "#6366f1",
  title: "#fafafa",
  body: "#a1a1aa",
  eyebrow: "#71717a",
  border: "rgba(250, 250, 250, 0.12)",
} as const;

/** 지정 길이를 넘으면 말줄임한다. 카드 밖으로 넘쳐 잘리는 것보다 낫다. */
function truncate(value: string, max: number): string {
  const trimmed = value.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

interface OgCardProps {
  /** 상단 작은 라벨 (예: "PROJECT", 사이트 이름) */
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  /** 하단 보조 정보 (예: 기간 · 역할) */
  footnote?: string | null;
  /** 우측에 얹을 이미지의 data URI. null 이면 텍스트만 렌더링한다. */
  imageDataUri?: string | null;
  /** 원형으로 자를지 여부 (프로필 사진용) */
  imageShape?: "circle" | "rounded";
}

export function OgCard({
  eyebrow,
  title,
  subtitle,
  footnote,
  imageDataUri,
  imageShape = "rounded",
}: OgCardProps) {
  const hasImage = Boolean(imageDataUri);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: COLORS.background,
        fontFamily: OG_FONT_FAMILY,
      }}
    >
      {/* 상단 액센트 바 — 브랜드 색을 한 줄로만 쓴다 */}
      <div style={{ display: "flex", height: 10, backgroundColor: COLORS.accent }} />

      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          padding: "0 72px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            // 이미지가 있으면 텍스트 폭을 줄여 두 영역이 겹치지 않게 한다
            width: hasImage ? 620 : "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 4,
              color: COLORS.eyebrow,
            }}
          >
            {truncate(eyebrow, 40)}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontSize: hasImage ? 62 : 72,
              fontWeight: 700,
              lineHeight: 1.2,
              color: COLORS.title,
            }}
          >
            {truncate(title, hasImage ? 40 : 52)}
          </div>

          {subtitle ? (
            <div
              style={{
                display: "flex",
                marginTop: 24,
                fontSize: 32,
                fontWeight: 400,
                lineHeight: 1.4,
                color: COLORS.body,
              }}
            >
              {truncate(subtitle, hasImage ? 70 : 96)}
            </div>
          ) : null}

          {footnote ? (
            <div
              style={{
                display: "flex",
                marginTop: 32,
                fontSize: 26,
                fontWeight: 400,
                color: COLORS.eyebrow,
              }}
            >
              {truncate(footnote, 70)}
            </div>
          ) : null}
        </div>

        {imageDataUri ? (
          /*
            `<img>` 대신 `background-image` 를 쓴다.
            satori 는 둘 다 지원하는데, `<img>` 는 `@next/next/no-img-element` 규칙에 걸린다.
            그 규칙은 브라우저에서의 LCP·대역폭을 걱정하는 것이고 여기서는 해당되지 않지만,
            규칙을 끄기보다 같은 결과를 내는 다른 방법을 쓰는 편이 낫다.
            `object-fit: cover` 는 `background-size: cover` + `center` 로 그대로 대응된다.
          */
          <div style={{ display: "flex", marginLeft: "auto" }}>
            {/*
              `<img>` 를 쓴다. satori 가 이미지를 그리는 유일한 방법이다.
              `background-image` + data URI 는 satori 가 조용히 무시해 빈 영역만 남는다(실측).
              이 JSX 는 브라우저로 가지 않고 서버에서 PNG 로 구워지므로 next/image 는 쓸 수 없다.
              `@next/next/no-img-element` 예외는 eslint.config.mjs 에서 이 디렉터리로만 한정해 둔다.
            */}
            <img
              src={imageDataUri}
              alt=""
              width={360}
              height={360}
              style={{
                width: 360,
                height: 360,
                objectFit: "cover",
                borderRadius: imageShape === "circle" ? 180 : 28,
                border: `1px solid ${COLORS.border}`,
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
