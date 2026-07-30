import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { formatPeriod } from "@/lib/format";
import { registerResumeFonts } from "@/lib/pdf/fonts";
import { sanitizeCareers, sanitizeProfile } from "@/lib/pdf/sanitize";
import type { Career, Profile } from "@/types/portfolio";

/**
 * 이력서 PDF 템플릿 (FR-5).
 *
 * 여기의 Document/Page/View/Text 는 DOM 컴포넌트가 아니라 @react-pdf/renderer 의
 * 자체 프리미티브다. 웹 UI 컴포넌트와 섞이지 않도록 `src/lib/pdf/` 에 둔다.
 * Tailwind 클래스는 쓸 수 없고 StyleSheet 로만 스타일링한다.
 *
 * 포함 범위는 PRD FR-5 대로 프로필 + 경력이다. 프로젝트 포함 여부는 PRD
 * "확인 필요 사항" 에서 미결이므로 넣지 않았다.
 */
const fontFamily = registerResumeFonts();

const styles = StyleSheet.create({
  page: {
    fontFamily,
    fontSize: 10,
    lineHeight: 1.6,
    color: "#1a1a1a",
    paddingVertical: 48,
    paddingHorizontal: 52,
  },
  name: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
  headline: { fontSize: 11, color: "#555555", marginBottom: 10 },
  contactRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4 },
  contactItem: { fontSize: 9, color: "#555555" },
  rule: { borderBottomWidth: 1, borderBottomColor: "#dddddd", marginVertical: 18 },
  sectionTitle: { fontSize: 13, fontWeight: 700, marginBottom: 10 },
  bio: { color: "#333333" },
  careerItem: { marginBottom: 16 },
  careerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 2,
  },
  company: { fontSize: 12, fontWeight: 700 },
  period: { fontSize: 9, color: "#666666" },
  role: { fontSize: 10, color: "#444444", marginBottom: 4 },
  description: { color: "#333333", marginBottom: 4 },
  skills: { fontSize: 9, color: "#666666" },
  empty: { color: "#888888" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 52,
    right: 52,
    fontSize: 8,
    color: "#999999",
    textAlign: "center",
  },
});

interface ResumeDocumentProps {
  profile: Profile;
  careers: Career[];
}

/**
 * 컴포넌트가 아니라 팩토리 함수인 이유:
 * `renderToBuffer` 는 최상위가 `Document` 엘리먼트인 ReactElement<DocumentProps> 를 요구한다.
 * 커스텀 컴포넌트로 감싸면 props 타입이 맞지 않아 타입 캐스팅이 필요해진다.
 */
export function createResumeDocument(input: ResumeDocumentProps) {
  // 임베드 폰트가 지원하지 않는 문자를 먼저 걸러낸다. 이 단계를 빼면
  // 서브셋에 없는 기호가 엉뚱한 글자로 렌더링된다 (sanitize.ts 주석 참고).
  const profile = sanitizeProfile(input.profile);
  const careers = sanitizeCareers(input.careers);

  const contacts = [
    profile.email,
    profile.github,
    profile.linkedin,
    profile.blog,
  ].filter((value): value is string => Boolean(value));

  const title = profile.name ? `${profile.name} 이력서` : "이력서";

  return (
    <Document title={title} author={profile.name || undefined}>
      <Page size="A4" style={styles.page}>
        {profile.name ? <Text style={styles.name}>{profile.name}</Text> : null}
        {profile.headline ? <Text style={styles.headline}>{profile.headline}</Text> : null}

        {contacts.length > 0 ? (
          <View style={styles.contactRow}>
            {contacts.map((contact) => (
              <Text key={contact} style={styles.contactItem}>
                {contact}
              </Text>
            ))}
          </View>
        ) : null}

        {profile.bio ? (
          <>
            <View style={styles.rule} />
            <Text style={styles.sectionTitle}>소개</Text>
            <Text style={styles.bio}>{profile.bio}</Text>
          </>
        ) : null}

        <View style={styles.rule} />
        <Text style={styles.sectionTitle}>경력</Text>

        {careers.length === 0 ? (
          <Text style={styles.empty}>등록된 경력이 없습니다.</Text>
        ) : (
          careers.map((career) => (
            <View key={career.id} style={styles.careerItem} wrap={false}>
              <View style={styles.careerHeader}>
                <Text style={styles.company}>{career.company}</Text>
                <Text style={styles.period}>
                  {formatPeriod(career.startDate, career.endDate, "재직중")}
                </Text>
              </View>

              {career.role ? <Text style={styles.role}>{career.role}</Text> : null}
              {career.description ? (
                <Text style={styles.description}>{career.description}</Text>
              ) : null}
              {career.skills.length > 0 ? (
                <Text style={styles.skills}>{career.skills.join(" · ")}</Text>
              ) : null}
            </View>
          ))
        )}

        <Text style={styles.footer} fixed>
          {formatGeneratedAt()} 기준
        </Text>
      </Page>
    </Document>
  );
}

/** 생성 시점을 "2026. 7. 30." 형태로 적는다. 이력서가 언제 기준인지 드러나야 한다. */
function formatGeneratedAt(): string {
  const now = new Date();
  return `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}.`;
}
