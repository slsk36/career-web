import path from "node:path";

import { openSync } from "fontkit";

import type { Career, Profile } from "@/types/portfolio";

/**
 * 이력서 PDF 용 문자 정제.
 *
 * 임베드한 폰트는 Google Fonts 의 **한국어 서브셋**이라 한글·라틴·일부 문장부호만 들어 있다.
 * 서브셋에 없는 문자를 그대로 넘기면 PDF 에서 두부(□)가 아니라 **엉뚱한 다른 글자로 치환**되어
 * 조용히 내용이 망가진다. (실측: `→` 가 `’` 로 렌더링됨)
 *
 * 그래서 폰트의 characterSet 을 직접 조회해 지원되지 않는 문자를 ASCII 대응물로 바꾼다.
 * 폰트 파일을 교체하면 이 검사도 자동으로 따라간다.
 */
const FONT_PATH = path.join(process.cwd(), "src", "assets", "fonts", "NotoSansKR-400.ttf");

/** Regular 와 Bold 의 characterSet 이 동일함을 확인했으므로 하나만 검사한다. */
let supportedCodePoints: Set<number> | null = null;

function getSupportedCodePoints(): Set<number> {
  if (!supportedCodePoints) {
    supportedCodePoints = new Set(openSync(FONT_PATH).characterSet);
  }
  return supportedCodePoints;
}

/** 서브셋에 없지만 한국어 문서에서 흔히 쓰이는 기호들의 ASCII 대응물. */
const REPLACEMENTS: Record<string, string> = {
  "→": "->",
  "⇒": "=>",
  "←": "<-",
  "⇐": "<=",
  "↔": "<->",
  "↑": "^",
  "↓": "v",
  "※": "*",
  "★": "*",
  "☆": "*",
  "●": "*",
  "○": "o",
  "◆": "*",
  "◇": "*",
  "■": "*",
  "□": "*",
  "▶": ">",
  "◀": "<",
  "♥": "<3",
  "♡": "<3",
  "✓": "v",
  "✔": "v",
  "✕": "x",
  "✗": "x",
  "①": "(1)",
  "②": "(2)",
  "③": "(3)",
  "④": "(4)",
  "⑤": "(5)",
  "⑥": "(6)",
  "⑦": "(7)",
  "⑧": "(8)",
  "⑨": "(9)",
  "⑩": "(10)",
  "㈜": "(주)",
};

/** 같은 문자를 반복해서 경고하지 않기 위한 기록 */
const warnedCharacters = new Set<string>();

/**
 * 폰트가 지원하지 않는 문자를 치환한다.
 * 대응물이 없으면 제거하고 서버 로그에 남긴다 — 잘못된 글자로 남는 것보다 낫다.
 */
export function sanitizeForPdf(text: string): string {
  const supported = getSupportedCodePoints();
  let result = "";

  // 서로게이트 페어를 쪼개지 않도록 코드포인트 단위로 순회한다.
  for (const char of text) {
    const codePoint = char.codePointAt(0);
    if (codePoint === undefined) continue;

    // 개행·탭 등 제어문자와 공백은 폰트 글리프와 무관하므로 그대로 둔다.
    if (codePoint <= 0x20) {
      result += char;
      continue;
    }

    if (supported.has(codePoint)) {
      result += char;
      continue;
    }

    const replacement = REPLACEMENTS[char];
    if (replacement !== undefined) {
      result += replacement;
    }

    if (!warnedCharacters.has(char)) {
      warnedCharacters.add(char);
      console.warn(
        `[resume/pdf] 폰트가 지원하지 않는 문자 ${JSON.stringify(char)} ` +
          `(U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}) 를 ` +
          `${replacement !== undefined ? `"${replacement}" 로 치환` : "제거"}했습니다.`
      );
    }
  }

  return result;
}

/** null 을 유지하면서 정제한다. */
function sanitizeNullable(value: string | null): string | null {
  return value === null ? null : sanitizeForPdf(value);
}

export function sanitizeProfile(profile: Profile): Profile {
  return {
    ...profile,
    name: sanitizeForPdf(profile.name),
    headline: sanitizeForPdf(profile.headline),
    bio: sanitizeNullable(profile.bio),
    // URL·이메일은 ASCII 라 정제 대상이 아니지만, 한글 도메인 등을 대비해 함께 처리한다.
    email: sanitizeNullable(profile.email),
    github: sanitizeNullable(profile.github),
    linkedin: sanitizeNullable(profile.linkedin),
    blog: sanitizeNullable(profile.blog),
  };
}

export function sanitizeCareers(careers: Career[]): Career[] {
  return careers.map((career) => ({
    ...career,
    company: sanitizeForPdf(career.company),
    role: sanitizeForPdf(career.role),
    description: sanitizeNullable(career.description),
    skills: career.skills.map(sanitizeForPdf),
  }));
}
