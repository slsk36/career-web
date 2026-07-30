"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/**
 * 이력서 PDF 다운로드 버튼.
 *
 * `<a download>` 로 바로 걸지 않고 fetch 를 쓰는 이유는 두 가지다.
 * 1. 생성에 시간이 걸리므로 로딩 상태를 보여줘야 한다 (PRD 화면 설계).
 * 2. 실패 시 응답이 PDF 가 아니라 ApiResponse JSON 이므로, 그 에러 메시지를 사용자에게 보여줘야 한다.
 */
export function ResumeDownloadButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleDownload() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/resume/pdf");

      if (!response.ok) {
        // 실패 응답은 ApiResponse<never> JSON 이다.
        const message = await extractErrorMessage(response);
        toast.error(message);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = resolveFileName(response);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      // 즉시 해제하면 브라우저가 다운로드를 시작하기 전에 무효화될 수 있다.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error("이력서를 내려받지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button size="lg" onClick={handleDownload} disabled={isLoading}>
      {isLoading ? (
        <LoaderCircle data-icon="inline-start" className="animate-spin" aria-hidden />
      ) : (
        <Download data-icon="inline-start" aria-hidden />
      )}
      {isLoading ? "생성 중…" : "이력서 PDF 다운로드"}
    </Button>
  );
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.error?.message === "string") return body.error.message;
  } catch {
    // JSON 이 아니면 아래 기본 문구로 폴백한다.
  }
  return "이력서를 생성하지 못했습니다. 잠시 후 다시 시도해주세요.";
}

/**
 * Content-Disposition 에서 파일명을 뽑는다.
 *
 * 헤더에는 `filename="resume.pdf"`(ASCII 폴백)와 `filename*=UTF-8''...`(한글)이 함께 온다.
 * **`filename*` 을 먼저 봐야 한다.** 하나의 정규식으로 처리하면 앞에 있는 ASCII 폴백이
 * 먼저 매칭되어 한글 파일명이 무시된다.
 */
function resolveFileName(response: Response): string {
  const disposition = response.headers.get("Content-Disposition") ?? "";

  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].trim());
    } catch {
      // 잘못 인코딩된 값이면 아래 ASCII 폴백으로 넘어간다.
    }
  }

  const ascii = /filename="?([^";]+)"?/i.exec(disposition);
  if (ascii?.[1]) return ascii[1].trim();

  return "resume.pdf";
}
