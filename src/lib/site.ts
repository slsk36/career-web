/**
 * 사이트 절대 URL 확정 (서버 전용).
 *
 * OG 메타태그 · canonical · sitemap · robots 는 상대 경로로는 성립하지 않아
 * 절대 URL 이 필요하다. 커스텀 도메인이 아직 미정이므로 아래 순서로 폴백한다.
 *
 * 1. `SITE_URL`                        — 도메인이 확정되면 이 값만 넣으면 된다 (최우선)
 * 2. `VERCEL_PROJECT_PRODUCTION_URL`   — Vercel 이 넣어주는 **프로덕션** 도메인.
 *                                        프리뷰 배포에서도 프로덕션을 가리키므로 canonical 에 적합하다.
 * 3. `VERCEL_URL`                      — 배포 인스턴스별 URL. 위 둘이 없을 때의 최후 수단.
 * 4. `http://localhost:3000`           — 로컬 개발
 *
 * `NEXT_PUBLIC_` 접두사를 쓰지 않는다. 이 값은 서버에서만 필요하다.
 */

const LOCAL_FALLBACK = "http://localhost:3000";

/** 프로토콜이 없으면 https 를 붙이고, 끝의 `/` 를 제거해 결합 시 `//` 가 생기지 않게 한다. */
function normalize(value: string): string {
  const withProtocol = /^https?:\/\//.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/+$/, "");
}

/** 사이트 절대 URL 문자열 (끝에 `/` 없음) */
export function getSiteUrl(): string {
  const candidate =
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  if (!candidate) return LOCAL_FALLBACK;

  const normalized = normalize(candidate);

  // 잘못된 값이 들어와도 메타데이터 생성 전체가 죽지 않게 한다.
  try {
    return new URL(normalized).origin;
  } catch {
    console.error(`[site] 사이트 URL 을 해석할 수 없습니다: ${candidate}. 로컬 기본값으로 폴백합니다.`);
    return LOCAL_FALLBACK;
  }
}

/** `metadataBase` 용 URL 객체 */
export function getSiteUrlObject(): URL {
  return new URL(getSiteUrl());
}

/** 사이트 루트 기준 절대 URL 을 만든다. (`/projects/abc` → `https://.../projects/abc`) */
export function absoluteUrl(pathname: string): string {
  return `${getSiteUrl()}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
