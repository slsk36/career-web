import path from "node:path";

import { Font } from "@react-pdf/renderer";

/**
 * 이력서 PDF 용 한글 폰트 등록.
 *
 * @react-pdf/renderer 는 한글을 기본 지원하지 않으므로 폰트를 반드시 임베드해야 한다.
 * 등록하지 않으면 한글이 전부 빈 사각형으로 렌더링된다.
 *
 * 폰트 파일은 Google Fonts 의 한국어 서브셋 정적 TTF 다(각 약 2.4MB).
 * `src/assets/fonts/OFL.txt` 에 라이선스(SIL Open Font License 1.1)를 함께 두었다.
 *
 * 파일명이 `NotoSansKRThin-*` 으로 되어 있으나 이는 Google 서브셋 파이프라인의
 * 네이밍 흔적이고, 실제 usWeightClass 는 400 / 700 이다.
 */
const FONT_FAMILY = "Noto Sans KR";

let isRegistered = false;

/** 폰트를 한 번만 등록한다. 라우트 핸들러가 매 요청 호출해도 안전하다. */
export function registerResumeFonts(): string {
  if (isRegistered) return FONT_FAMILY;

  const fontDir = path.join(process.cwd(), "src", "assets", "fonts");

  Font.register({
    family: FONT_FAMILY,
    fonts: [
      { src: path.join(fontDir, "NotoSansKR-400.ttf"), fontWeight: 400 },
      { src: path.join(fontDir, "NotoSansKR-700.ttf"), fontWeight: 700 },
    ],
  });

  // 한글은 단어 사이 공백이 없는 구간이 많아 기본 하이픈 분절이 어색하다. 분절을 끈다.
  Font.registerHyphenationCallback((word) => [word]);

  isRegistered = true;
  return FONT_FAMILY;
}
