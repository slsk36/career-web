/**
 * 하단 푸터
 * TODO: 저작권/연락처 등 실제 정보로 교체하세요. (docs/PRD.md 화면 설계 참고)
 */
export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-6 text-sm text-muted-foreground sm:px-6">
        <p>&copy; {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
