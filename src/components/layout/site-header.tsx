import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";

/**
 * 상단 헤더 — 로고 영역 + 테마 토글
 * TODO: 로고/이름을 실제 정보로 교체하세요. (docs/PRD.md 화면 설계 참고)
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span>홈</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
