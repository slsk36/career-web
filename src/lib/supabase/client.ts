import { createBrowserClient } from "@supabase/ssr";

/**
 * 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트 생성.
 *
 * 사용 전 준비:
 * 1. `.env.example` 을 `.env.local` 로 복사
 * 2. Supabase 프로젝트의 URL 과 anon key 를 입력
 *
 * @example
 * "use client";
 * import { createClient } from "@/lib/supabase/client";
 *
 * const supabase = createClient();
 * const { data, error } = await supabase.from("orders").select();
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 환경 변수 미설정 시 원인을 바로 알 수 있도록 명시적으로 에러 처리
  if (!url || !anonKey) {
    throw new Error(
      "Supabase 환경 변수가 설정되지 않았습니다. .env.local 에 NEXT_PUBLIC_SUPABASE_URL 과 NEXT_PUBLIC_SUPABASE_ANON_KEY 를 추가해주세요."
    );
  }

  return createBrowserClient(url, anonKey);
}
