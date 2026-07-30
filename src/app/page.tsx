import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CareerTimeline } from "@/components/portfolio/career-timeline";
import { ProfileHero } from "@/components/portfolio/profile-hero";
import { ProjectCard } from "@/components/portfolio/project-card";
import { fetchCareers, fetchProfile, fetchProjects } from "@/lib/notion/queries";
import type { Career, Profile, Project } from "@/types/portfolio";

/**
 * ISR — 방문 요청마다 노션을 호출하지 않고 이 주기로만 재생성한다 (FR-9). 1시간.
 * Next.js 가 정적 분석하는 값이므로 상수 import 가 아닌 리터럴이어야 한다.
 */
export const revalidate = 3600;

/**
 * 홈 페이지 — 프로필 / 자기소개 / 경력 / 프로젝트 / 이력서 다운로드
 *
 * 노션 조회 실패가 페이지 전체를 죽이지 않도록 세 조회를 개별로 처리한다.
 * 하나가 실패해도 나머지는 렌더링하고, 실패한 영역만 안내 문구로 대체한다.
 */
export default async function HomePage() {
  const [profileResult, careersResult, projectsResult] = await Promise.allSettled([
    fetchProfile(),
    fetchCareers(),
    fetchProjects(),
  ]);

  const profile = unwrap<Profile | null>(profileResult, null, "프로필");
  const careers = unwrap<Career[]>(careersResult, [], "경력");
  const projects = unwrap<Project[]>(projectsResult, [], "프로젝트");

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />

      <main className="flex-1">
        {profile ? (
          <ProfileHero profile={profile} />
        ) : (
          <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
            <p className="text-muted-foreground">프로필 정보를 불러올 수 없습니다.</p>
          </section>
        )}

        {/*
          모든 섹션이 같은 컨테이너를 공유해 제목의 왼쪽 끝이 일치하게 한다.
          섹션마다 max-w 를 따로 주면 제목이 계단처럼 어긋난다(실측 192px 차이).
          긴 글은 가독성을 위해 본문에만 max-w-3xl 을 걸고, 제목은 컨테이너 기준으로 정렬한다.
        */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {profile?.bio ? (
            <section className="pb-14">
              <h2 className="mb-4 text-xl font-semibold">소개</h2>
              <p className="max-w-3xl whitespace-pre-line text-muted-foreground">{profile.bio}</p>
            </section>
          ) : null}

          <section className="pb-14">
            <h2 className="mb-6 text-xl font-semibold">경력</h2>
            <div className="max-w-3xl">
              {careersResult.status === "rejected" ? (
                <UnavailableNotice />
              ) : (
                <CareerTimeline careers={careers} />
              )}
            </div>
          </section>

          <section className="pb-20">
            <h2 className="mb-6 text-xl font-semibold">프로젝트</h2>
            {projectsResult.status === "rejected" ? (
              <UnavailableNotice />
            ) : projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">등록된 프로젝트가 없습니다.</p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <li key={project.id}>
                    <ProjectCard project={project} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

/** 조회 실패 시 상세 원인은 서버 로그에만 남기고 기본값으로 폴백한다. */
function unwrap<T>(result: PromiseSettledResult<T>, fallback: T, label: string): T {
  if (result.status === "fulfilled") return result.value;

  console.error(`[home] ${label} 조회 실패:`, result.reason);
  return fallback;
}

function UnavailableNotice() {
  return (
    <p className="text-sm text-muted-foreground">
      정보를 일시적으로 불러올 수 없습니다. 잠시 후 다시 시도해주세요.
    </p>
  );
}
