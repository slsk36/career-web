import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SITE_NAME } from "@/lib/seo";
import { getSiteUrlObject } from "@/lib/site";
import "./globals.css";

// globals.css 의 --font-sans / --font-geist-mono 변수와 매핑되는 폰트
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
