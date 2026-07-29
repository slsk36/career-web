import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버(서버 컴포넌트, 서버 액션, 라우트 핸들러)용 Supabase 클라이언트 생성.
 * 쿠키 기반 세션을 사용하므로 요청마다 새로 생성해야 합니다.
 *
 * @example
 * import { createClient } from "@/lib/supabase/server";
 *
 * export default async function Page() {
 *   const supabase = await createClient();
 *   const { data, error } = await supabase.from("orders").select();
 *   // ...
 * }
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 환경 변수 미설정 시 원인을 바로 알 수 있도록 명시적으로 에러 처리
  if (!url || !anonKey) {
    throw new Error(
      "Supabase 환경 변수가 설정되지 않았습니다. .env.local 에 NEXT_PUBLIC_SUPABASE_URL 과 NEXT_PUBLIC_SUPABASE_ANON_KEY 를 추가해주세요."
    );
  }

  // Next.js 15 부터 cookies() 는 비동기 API
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // 서버 컴포넌트에서 호출된 경우 쿠키 쓰기가 불가능하므로 무시.
          // 세션 갱신은 미들웨어에서 처리하는 것을 권장합니다.
        }
      },
    },
  });
}
