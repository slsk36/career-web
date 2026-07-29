import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * 홈 페이지 — 프로필 / 경력 / 프로젝트 / 이력서 다운로드
 * 노션(Notion) 데이터 연동 전까지는 최소 정적 뼈대만 제공합니다.
 * TODO: 노션 API 연동 후 아래 placeholder 를 실제 데이터로 교체하세요. (docs/PRD.md 참고)
 */
export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* 프로필 영역 */}
        <section className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-16 text-center sm:py-24">
          <Avatar size="lg">
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            이름
          </h1>
          <p className="max-w-xl text-muted-foreground">
            한줄 소개가 여기에 표시됩니다.
          </p>
          <Button size="lg">이력서 PDF 다운로드</Button>
        </section>

        {/* 경력 타임라인 영역 */}
        <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
          <h2 className="mb-6 text-xl font-semibold">경력</h2>
          <Card>
            <CardHeader>
              <CardTitle>준비 중</CardTitle>
              <CardDescription>
                노션 연동 후 경력 정보가 이 영역에 표시됩니다.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        {/* 프로젝트 목록 영역 */}
        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <h2 className="mb-6 text-xl font-semibold">프로젝트</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Badge variant="secondary" className="w-fit">
                  준비 중
                </Badge>
                <CardTitle>프로젝트 예시</CardTitle>
                <CardDescription>
                  노션 연동 후 프로젝트 목록이 이 영역에 표시됩니다.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
