import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * 노션에 **업로드한** 파일이 서비스되는 호스트다 (2026-07-30 실측).
     * 노션 파일 URL 은 1시간 만료 서명 URL 이라, next/image 로 프록시하면
     * 서버가 한 번 받아 최적화 결과를 캐시하므로 방문자마다 만료 URL 을
     * 직접 때리지 않는다.
     *
     * ⚠️ 노션에서 "링크 임베드" 로 **외부 이미지**를 넣으면 그 호스트는 여기
     * 없으므로 이미지가 렌더링되지 않는다. 그런 경우 해당 호스트를 추가한다.
     * (노션 UI 에서 파일을 직접 업로드하면 항상 아래 호스트로 들어온다.)
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "prod-files-secure.s3.us-west-2.amazonaws.com",
      },
    ],

    /**
     * 최적화 결과를 1시간 캐시한다 (기본값 60초).
     *
     * Next 의 이미지 옵티마이저는 외부 이미지를 받아올 때 **7초 타임아웃**이 하드코딩돼 있고
     * 이 값은 설정으로 바꿀 수 없다. 노션 S3 응답은 실측 1.3~6.5초로 흔들려서, 원본이 크면
     * 간헐적으로 타임아웃 500 이 나고 이미지가 깨진다.
     *
     * 기본 60초로 두면 1분마다 캐시가 만료되어 재페치하며 타임아웃 기회를 계속 만든다.
     * 서명 URL 이 1시간마다 새로 발급되어 어차피 캐시 키가 바뀌므로, TTL 을 1시간으로 맞추면
     * "서명 URL 1개당 성공 페치 1회" 가 되어 노출 구간이 최소화된다.
     *
     * 근본 해결은 노션에 올리는 원본 이미지를 작게 유지하는 것이다.
     */
    minimumCacheTTL: 3600,
  },

  /**
   * 아래 라우트들은 런타임에 `process.cwd()` 기준으로 폰트 TTF 를 읽는다.
   * 정적 분석으로는 추적되지 않으므로 서버리스 번들에 포함되도록 명시한다.
   * 이 설정이 없으면 로컬에서는 동작하고 Vercel 배포 후에만 폰트를 찾지 못한다.
   *
   * - `/api/resume/pdf`  : 이력서 PDF 한글 임베딩 (@react-pdf/renderer)
   * - `opengraph-image`  : OG 이미지의 한글 렌더링 (next/og · satori).
   *                        폰트를 못 찾으면 제목이 빈 사각형으로 나온다.
   */
  outputFileTracingIncludes: {
    "/api/resume/pdf": ["./src/assets/fonts/**"],
    "/opengraph-image": ["./src/assets/fonts/**"],
    "/projects/[id]/opengraph-image": ["./src/assets/fonts/**"],
  },

  /**
   * fontkit 은 CJS/ESM 조건부 export 를 쓰므로 서버 번들에서 외부 모듈로 두어야
   * 런타임에 정상 로드된다. (글리프 존재 검사에 사용 — src/lib/pdf/sanitize.ts)
   */
  serverExternalPackages: ["fontkit"],
};

export default nextConfig;
