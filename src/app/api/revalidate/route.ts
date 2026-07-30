import { createHash, timingSafeEqual } from "node:crypto";

import { revalidatePath } from "next/cache";

import { apiError, apiSuccess } from "@/types";

/** `revalidatePath` 와 `node:crypto` 를 쓰므로 node 런타임이어야 한다. */
export const runtime = "nodejs";

/**
 * 운영자용 트리거이므로 캐시하지 않는다.
 * 캐시되면 두 번째 호출부터 재생성이 실제로 일어나지 않는다.
 */
export const dynamic = "force-dynamic";

/** 재생성을 허용할 경로 패턴. 임의 경로를 그대로 받지 않는다. */
const ALLOWED_PATH = /^\/(?:$|projects\/[a-zA-Z0-9-]+$)/;

interface RevalidateBody {
  secret?: unknown;
  path?: unknown;
}

/**
 * POST /api/revalidate — 노션 변경사항을 즉시 반영한다 (PRD API 설계, P1).
 *
 * ISR 주기가 1시간이라 노션을 고쳐도 최대 1시간 동안 옛 내용이 보인다.
 * 급할 때 이 엔드포인트로 특정 경로만 즉시 재생성한다.
 *
 * Body: `{ secret: string, path: string }`
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;

  // 시크릿이 설정되지 않았으면 열어두지 않고 막는다. 미설정 상태로 배포되는 사고를 막기 위함이다.
  if (!secret) {
    console.error("[revalidate] REVALIDATE_SECRET 이 설정되지 않았습니다.");
    return Response.json(
      apiError("REVALIDATE_NOT_CONFIGURED", "재생성 기능이 설정되지 않았습니다."),
      { status: 503 }
    );
  }

  let body: RevalidateBody;
  try {
    body = (await request.json()) as RevalidateBody;
  } catch {
    return Response.json(apiError("INVALID_REQUEST", "요청 형식이 올바르지 않습니다."), {
      status: 400,
    });
  }

  if (typeof body.secret !== "string" || !isSecretValid(body.secret, secret)) {
    // 어떤 부분이 틀렸는지 알려주지 않는다.
    console.error("[revalidate] 시크릿 불일치로 거부했습니다.");
    return Response.json(apiError("UNAUTHORIZED", "인증에 실패했습니다."), { status: 401 });
  }

  if (typeof body.path !== "string" || !ALLOWED_PATH.test(body.path)) {
    return Response.json(
      apiError("INVALID_REQUEST", "재생성할 수 없는 경로입니다. (`/` 또는 `/projects/{id}`)"),
      { status: 400 }
    );
  }

  try {
    revalidatePath(body.path);
    console.log(`[revalidate] 재생성 요청 완료: ${body.path}`);
    return Response.json(apiSuccess({ revalidated: true as const }));
  } catch (error) {
    console.error("[revalidate] 재생성 실패:", error);
    return Response.json(apiError("REVALIDATE_FAILED", "재생성에 실패했습니다."), { status: 500 });
  }
}

/**
 * 시크릿 비교.
 *
 * `===` 는 앞에서부터 비교하다 다른 문자를 만나면 즉시 끝나서, 응답 시간 차이로
 * 시크릿을 한 글자씩 알아낼 수 있다. 길이가 달라도 비교가 성립하도록 양쪽을 먼저
 * 해시한 뒤 고정 길이로 비교한다.
 */
function isSecretValid(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}
