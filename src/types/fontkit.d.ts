/**
 * fontkit 은 타입 선언을 배포하지 않고 @types/fontkit 도 없다.
 * 이력서 PDF 의 글리프 존재 검사에 필요한 최소 API 만 선언한다.
 * (fontkit 자체는 @react-pdf/renderer 가 내부적으로 쓰는 라이브러리이기도 하다.)
 */
declare module "fontkit" {
  interface FontkitFont {
    /** 폰트가 지원하는 유니코드 코드포인트 목록 */
    readonly characterSet: number[];
    readonly familyName: string;
    readonly numGlyphs: number;
  }

  export function openSync(filename: string): FontkitFont;
}
