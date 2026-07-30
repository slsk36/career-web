/**
 * Notion 클라이언트 (서버 전용).
 *
 * 이 파일과 이 디렉터리의 다른 모듈은 절대 클라이언트 컴포넌트에서 import 하지 않는다.
 * NOTION_API_KEY 가 브라우저 번들에 포함될 수 있다.
 *
 * SDK 5.x 부터 `databases.query` 가 사라지고 데이터 소스(data source) 단위 조회로 바뀌었다.
 * 조회에는 DB ID 가 아니라 data_source_id 가 필요하므로, DB ID → data_source_id 해석을
 * 이 파일에서 담당하고 결과를 모듈 스코프에 캐시한다.
 */
import { Client, isFullDatabase } from "@notionhq/client";

/** 필수 환경변수를 읽는다. 없으면 원인이 드러나는 에러를 던진다. */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `환경변수 ${name} 가 설정되지 않았습니다. .env.local 을 확인해주세요. (형식은 .env.example 참고)`
    );
  }
  return value;
}

/**
 * 노션 API 클라이언트.
 * 429(rate limit)/5xx 재시도를 SDK 에 위임한다 (FR-11).
 * SDK 기본값은 maxRetries 2 이며, 재생성 작업이 rate limit 으로 실패하지 않도록 조금 늘렸다.
 */
export const notion = new Client({
  auth: requireEnv("NOTION_API_KEY"),
  retry: { maxRetries: 3 },
});

/** 조회 대상 DB 구분자 */
export type NotionDatabase = "profile" | "career" | "projects";

const DATABASE_ENV: Record<NotionDatabase, string> = {
  profile: "NOTION_PROFILE_DB_ID",
  career: "NOTION_CAREER_DB_ID",
  projects: "NOTION_PROJECTS_DB_ID",
};

/**
 * DB ID → data_source_id 캐시.
 * 데이터 소스 ID 는 DB 를 새로 만들지 않는 한 바뀌지 않으므로 프로세스 수명 동안 재사용한다.
 * 실패한 조회는 캐시하지 않도록 Promise 가 아닌 확정 값만 저장한다.
 */
const dataSourceIdCache = new Map<NotionDatabase, string>();

/**
 * 해당 DB 의 data_source_id 를 반환한다.
 * 노션 DB 하나에 데이터 소스가 여러 개일 수 있으나, 이 프로젝트의 3개 DB 는 모두 1개다.
 * 여러 개인 경우 첫 번째를 사용한다.
 */
export async function getDataSourceId(target: NotionDatabase): Promise<string> {
  const cached = dataSourceIdCache.get(target);
  if (cached) return cached;

  const databaseId = requireEnv(DATABASE_ENV[target]);
  const database = await notion.databases.retrieve({ database_id: databaseId });

  if (!isFullDatabase(database)) {
    throw new Error(
      `노션 DB(${target}) 응답이 불완전합니다. Integration 에 해당 DB 가 연결되어 있는지 확인해주세요.`
    );
  }

  const dataSourceId = database.data_sources?.[0]?.id;
  if (!dataSourceId) {
    throw new Error(
      `노션 DB(${target}) 에서 data_source 를 찾지 못했습니다. DB 가 삭제되었거나 권한이 없을 수 있습니다.`
    );
  }

  dataSourceIdCache.set(target, dataSourceId);
  return dataSourceId;
}
