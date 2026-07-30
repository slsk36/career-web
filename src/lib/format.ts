/**
 * 화면 표시용 포맷 유틸.
 *
 * 노션 date 속성은 `"2024-01-15"` 또는 `"2024-01-15T10:00:00.000+09:00"` 두 형태로 온다.
 * `new Date()` 로 파싱하면 타임존 때문에 하루 밀릴 수 있으므로 문자열을 그대로 자른다.
 */

/** ISO 날짜 문자열 → `"2024.01"`. 형식이 예상과 다르면 원본을 그대로 돌려준다. */
export function formatYearMonth(isoDate: string | null | undefined): string {
  if (!isoDate) return "";

  const match = /^(\d{4})-(\d{2})/.exec(isoDate);
  if (!match) return isoDate;

  return `${match[1]}.${match[2]}`;
}

/**
 * 기간 문자열을 만든다.
 *
 * - 시작·종료 모두 있음 → `"2023.05 ~ 2023.11"`
 * - 종료일 없음 → `"2022.03 ~ 재직중"` (ongoingLabel 로 문구 변경)
 * - 시작일도 없음 → `""` (호출부에서 빈 문자열이면 렌더링하지 않을 것)
 */
export function formatPeriod(
  start: string | null | undefined,
  end: string | null | undefined,
  ongoingLabel = "현재"
): string {
  const startLabel = formatYearMonth(start);
  if (!startLabel) return "";

  const endLabel = formatYearMonth(end);
  return `${startLabel} ~ ${endLabel || ongoingLabel}`;
}
