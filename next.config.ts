import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * 이력서 PDF 라우트는 런타임에 `process.cwd()` 기준으로 폰트 TTF 를 읽는다.
   * 정적 분석으로는 추적되지 않으므로 서버리스 번들에 포함되도록 명시한다.
   * 이 설정이 없으면 로컬에서는 동작하고 Vercel 배포 후에만 폰트를 찾지 못한다.
   */
  outputFileTracingIncludes: {
    "/api/resume/pdf": ["./src/assets/fonts/**"],
  },

  /**
   * fontkit 은 CJS/ESM 조건부 export 를 쓰므로 서버 번들에서 외부 모듈로 두어야
   * 런타임에 정상 로드된다. (글리프 존재 검사에 사용 — src/lib/pdf/sanitize.ts)
   */
  serverExternalPackages: ["fontkit"],
};

export default nextConfig;
