import { renderToBuffer } from "@react-pdf/renderer";

import { createResumeDocument } from "@/lib/pdf/resume-document";
import { fetchCareers, fetchProfile } from "@/lib/notion/queries";
import { apiError } from "@/types";

/** react-pdf 는 Node API 에 의존하므로 edge 런타임을 쓸 수 없다. */
export const runtime = "nodejs";

/**
 * PDF 를 1시간 캐시한다. 이 값이 없으면 Next 15 에서 GET 라우트가 매 요청 실행되어
 * 방문마다 노션을 호출하게 된다 (FR-9 위반).
 * 주기를 바꿀 때는 페이지의 revalidate 와 함께 맞출 것.
 */
export const revalidate = 3600;

/**
 * GET /api/resume/pdf — 프로필 + 경력을 이력서 PDF 로 반환한다 (FR-5).
 *
 * 성공 시에만 PDF 바이너리를 반환하고, 실패 시에는 프로젝트 공통 `ApiResponse` JSON 을 반환한다.
 * 스트림이 아니라 버퍼로 렌더링하는 이유는, 렌더링 도중 실패했을 때
 * 이미 200 을 보낸 상태가 되지 않도록 상태 코드를 끝까지 통제하기 위함이다.
 */
export async function GET() {
  let profile;
  let careers;

  // 1) 노션 조회 실패와 PDF 생성 실패를 다른 에러 코드로 구분한다.
  try {
    [profile, careers] = await Promise.all([fetchProfile(), fetchCareers()]);
  } catch (error) {
    console.error("[resume/pdf] 노션 조회 실패:", error);
    return Response.json(
      apiError("NOTION_API_ERROR", "이력서 데이터를 불러오지 못했습니다."),
      { status: 502 }
    );
  }

  if (!profile) {
    console.error("[resume/pdf] 프로필 데이터가 없습니다.");
    return Response.json(
      apiError("NOTION_API_ERROR", "프로필 정보가 없어 이력서를 만들 수 없습니다."),
      { status: 502 }
    );
  }

  // 2) PDF 렌더링
  try {
    const buffer = await renderToBuffer(createResumeDocument({ profile, careers }));

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(buffer.byteLength),
        "Content-Disposition": buildContentDisposition(profile.name),
      },
    });
  } catch (error) {
    console.error("[resume/pdf] PDF 생성 실패:", error);
    return Response.json(
      apiError("PDF_GENERATION_FAILED", "이력서 PDF 를 만들지 못했습니다."),
      { status: 500 }
    );
  }
}

/**
 * 한글 파일명은 그대로 헤더에 넣을 수 없다.
 * 구형 클라이언트용 ASCII fallback 과 RFC 5987 형식을 함께 보낸다.
 */
function buildContentDisposition(name: string): string {
  const base = name ? `이력서_${name}` : "이력서";
  const encoded = encodeURIComponent(`${base}.pdf`);

  return `attachment; filename="resume.pdf"; filename*=UTF-8''${encoded}`;
}
