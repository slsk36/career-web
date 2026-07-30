import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * OG 이미지 생성용 한글 폰트 로더 (서버 전용).
 *
 * `next/og`(satori) 는 시스템 폰트를 쓰지 않고 전달받은 폰트만 사용한다.
 * 한글 폰트를 넘기지 않으면 제목이 전부 빈 사각형(tofu)으로 렌더링된다.
 *
 * PDF 와 같은 파일(`src/assets/fonts`)을 재사용한다. 따로 두면 두 벌을 관리하게 되고
 * 번들 용량도 두 배가 된다. 라이선스는 `src/assets/fonts/OFL.txt`(SIL OFL 1.1) 참고.
 *
 * 정적 분석으로 추적되지 않는 런타임 파일 읽기이므로, `next.config.ts` 의
 * `outputFileTracingIncludes` 에 OG 라우트 경로를 반드시 등록해야 한다.
 * 등록하지 않으면 로컬에서는 동작하고 배포 후에만 폰트를 찾지 못한다.
 */

/** satori 에 넘길 폰트 스펙 */
export interface OgFont {
  name: string;
  data: Buffer;
  weight: 400 | 700;
  style: "normal";
}

const FONT_FAMILY = "Noto Sans KR";

/**
 * 폰트 버퍼 캐시.
 * OG 라우트는 ISR 로 캐시되지만 재생성 시마다 4.8MB 를 다시 읽을 이유는 없다.
 * 실패를 캐시하지 않도록 Promise 가 아닌 확정 값만 저장한다.
 */
let cached: OgFont[] | null = null;

export async function loadOgFonts(): Promise<OgFont[]> {
  if (cached) return cached;

  const fontDir = path.join(process.cwd(), "src", "assets", "fonts");

  const [regular, bold] = await Promise.all([
    readFile(path.join(fontDir, "NotoSansKR-400.ttf")),
    readFile(path.join(fontDir, "NotoSansKR-700.ttf")),
  ]);

  cached = [
    { name: FONT_FAMILY, data: regular, weight: 400, style: "normal" },
    { name: FONT_FAMILY, data: bold, weight: 700, style: "normal" },
  ];
  return cached;
}

export { FONT_FAMILY as OG_FONT_FAMILY };
