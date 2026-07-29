# Claude Code 훅 이벤트를 Slack Incoming Webhook으로 전송하는 스크립트
# 사용법: 훅 JSON을 stdin으로 받아 -EventType(notification|stop)에 따라 메시지를 보낸다
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('notification', 'stop')]
  [string]$EventType
)

# 웹훅 URL은 환경변수에서만 읽는다 (스크립트/저장소에 비밀정보 노출 금지)
$webhookUrl = $env:CLAUDE_SLACK_WEBHOOK_URL
if ([string]::IsNullOrWhiteSpace($webhookUrl)) { exit 0 }

try {
  # Windows PowerShell 5.1은 기본 TLS 버전이 낮아 Slack API 연결에 실패할 수 있음
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

  # 훅 입력 JSON 파싱 (stdin)
  $raw = [Console]::In.ReadToEnd()
  $payload = $null
  if (-not [string]::IsNullOrWhiteSpace($raw)) {
    $payload = $raw | ConvertFrom-Json
  }

  $projectName = Split-Path -Leaf (Get-Location)

  if ($EventType -eq 'notification') {
    $detail = ''
    if ($payload -and $payload.message) { $detail = $payload.message }
    $text = ":closed_lock_with_key: *Claude Code 권한 요청*`n프로젝트: $projectName`n내용: $detail"
  }
  else {
    $text = ":white_check_mark: *Claude Code 작업 완료*`n프로젝트: $projectName"
  }

  # 한글이 깨지지 않도록 UTF-8 바이트로 전송
  $body = @{ text = $text } | ConvertTo-Json
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
  Invoke-RestMethod -Uri $webhookUrl -Method Post -ContentType 'application/json; charset=utf-8' -Body $bytes | Out-Null
}
catch {
  # Slack 전송 실패가 Claude Code 동작을 막지 않도록 조용히 무시
}
exit 0
