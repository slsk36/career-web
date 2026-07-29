"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** next-themes 래퍼 — 루트 레이아웃에서 사용하는 다크모드 프로바이더 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
