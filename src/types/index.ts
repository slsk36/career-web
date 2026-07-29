/**
 * 프로젝트 공통 타입 정의.
 * 도메인별 타입이 늘어나면 파일을 분리하세요. (예: types/order.ts)
 */

/** API 응답 공통 형식 — 모든 라우트 핸들러가 이 형식을 따르도록 유지 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    /** 프로그램에서 분기 처리할 에러 코드 (예: "NOT_FOUND") */
    code: string;
    /** 사용자에게 보여줄 수 있는 메시지 */
    message: string;
  } | null;
}

/** 성공 응답 생성 헬퍼 */
export function apiSuccess<T>(data: T): ApiResponse<T> {
  return { success: true, data, error: null };
}

/** 실패 응답 생성 헬퍼 */
export function apiError(code: string, message: string): ApiResponse<never> {
  return { success: false, data: null, error: { code, message } };
}
