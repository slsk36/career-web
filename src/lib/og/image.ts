/**
 * OG 이미지에 끼워 넣을 원격 이미지를 data URI 로 받아온다 (서버 전용).
 *
 * 노션 파일 URL 을 `<img src>` 에 그대로 넘기지 않고 미리 받아 두는 이유:
 * satori 내부에서 페치가 실패하면 OG 이미지 생성 전체가 예외로 죽는다.
 * 여기서 미리 받아 실패를 `null` 로 흡수하면 이미지만 빠진 카드로 폴백할 수 있다.
 *
 * 노션 서명 URL 의 만료(1시간)는 문제가 되지 않는다. 생성 시점에 한 번 받아
 * 결과 PNG 가 캐시되므로, 만료된 URL 을 크롤러가 직접 때리는 일이 없다.
 */

/** 노션 원본이 큰 경우가 있어 넉넉히 잡되, OG 생성이 무한정 매달리지 않게 한다. */
const DEFAULT_TIMEOUT_MS = 5000;

export async function fetchImageDataUri(
  url: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<string | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) {
      console.error(`[og] 이미지 페치 실패 (${response.status}). 이미지 없이 생성합니다.`);
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    // satori 가 디코딩할 수 있는 형식만 넘긴다. SVG 는 크기 추론이 불안정해 제외한다.
    if (!/^image\/(png|jpeg|jpg|gif|webp)/.test(contentType)) {
      console.error(`[og] 지원하지 않는 이미지 형식(${contentType}). 이미지 없이 생성합니다.`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch (error) {
    console.error("[og] 이미지 페치 중 오류. 이미지 없이 생성합니다:", error);
    return null;
  }
}
