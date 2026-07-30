import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

/**
 * `robots.txt` (FR-10).
 *
 * `/api/` 는 색인 대상이 아니다. 이력서 PDF 생성(`/api/resume/pdf`)은 요청마다
 * 서버 자원을 쓰고, 재생성 트리거(`/api/revalidate`)는 운영자 전용이다.
 * 다만 robots.txt 는 권고일 뿐 접근 제어가 아니므로, 보호는 엔드포인트 자체의
 * 시크릿 검증으로 한다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
