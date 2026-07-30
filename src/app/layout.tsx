import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SITE_NAME } from "@/lib/seo";
import { getSiteUrlObject } from "@/lib/site";
import "./globals.css";

/**
 * globals.css 의 `--font-sans` 와 매핑되는 본문 폰트.
 *
 * Geist 에는 한글 글리프가 없어 한국어 본문은 시스템 폰트로 폴백된다.
 * 이건 의도한 것이다 — 한글 웹폰트는 서브셋을 해도 수백 KB 라 LCP 에 불리하고,
 * 이 폰트가 실제로 그리는 건 숫자·날짜·기술명 같은 라틴 문자다.
 *
 * Geist Mono 는 걷어냈다. `font-mono` 를 쓰는 곳이 한 군데도 없는데
 * 폰트 파일 하나(약 25KB)를 매번 더 받고 있었다. 다시 필요해지면 그때 추가한다.
 */
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

/** 사이트 전역 기본값. 페이지별 값은 각 페이지의 `generateMetadata` 가 덮어쓴다 (FR-10). */
export const metadata: Metadata = {
  /**
   * OG 이미지·canonical 은 절대 URL 이어야 한다. 이 값을 기준으로 상대 경로가 절대화된다.
   * 없으면 Next 가 경고와 함께 localhost 를 쓰고, 그대로 배포되면 SNS 공유가 깨진다.
   */
  metadataBase: getSiteUrlObject(),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: "경력과 프로젝트를 소개하는 개인 포트폴리오 사이트입니다.",
  /**
   * 아래 openGraph / twitter 는 자체 metadata 를 만들지 않는 페이지(예: 404)용 기본값이다.
   * `generateMetadata` 가 있는 페이지에는 상속되지 않으므로 `buildSocialMetadata()` 를 쓴다.
   */
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
  },
  /**
   * `robots` 는 여기(전역)에 두지 않는다. Next 가 404 에 자체적으로 넣는 `noindex` 와
   * 겹쳐 모순된 메타태그 두 개가 나간다. 색인 대상 페이지에서 `INDEXABLE_ROBOTS` 를 쓴다.
   */
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: next-themes가 html 태그의 class를 클라이언트에서 변경하므로 필요
    <html lang="ko" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/*
            TooltipProvider 를 걷어냈다. 앱 전체를 감싸고 있었지만 정작 Tooltip 을
            쓰는 화면이 하나도 없어서, Radix 툴팁 코드만 모든 페이지 번들에 실렸다.
            툴팁이 필요해지면 그 화면에서만 Provider 로 감싼다.
          */}
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
