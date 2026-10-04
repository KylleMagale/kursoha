import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import type { ResumeData } from "./template1"

const NAVY = "#1B2A4A"
const INK = "#23272F"
const MUTED = "#6B7280"
const RULE = "#CFD0DE"

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 9.2, color: INK, fontFamily: "Helvetica" },
  name: { fontSize: 19, fontWeight: 700, textTransform: "uppercase" },
  headline: { fontSize: 10.5, fontWeight: 700, color: NAVY, marginTop: 4 },
  tagline: { fontSize: 8.3, color: MUTED, marginTop: 1 },
  rule: { height: 2, backgroundColor: NAVY, marginTop: 6, marginBottom: 5 },
  contact: { fontSize: 8, color: MUTED },
  section: { marginTop: 7 },
  sectionTitle: {
    fontSize: 9.3, fontWeight: 700, color: NAVY, textTransform: "uppercase",
    borderBottom: `1 solid ${RULE}`, paddingBottom: 2, marginBottom: 4,
  },
  bulletRow: { flexDirection: "row", marginBottom: 1.5 },
  bulletDot: { width: 8, color: "#2F6690" },
  bulletText: { flex: 1, lineHeight: 1.22 },
  skillsRow: { flexDirection: "row", flexWrap: "wrap" },
  skillItem: { marginRight: 7, marginBottom: 2 },
  jobTitle: { fontSize: 10, fontWeight: 700 },
  jobMeta: { fontSize: 8, color: MUTED, marginTop: 0.5, marginBottom: 2 },
  bodyText: { lineHeight: 1.22 },
})

function splitSkills(raw: string): string[] {
  return raw.split(/[\n,;•]+/).map((s) => s.trim()).filter(Boolean)
}

export default function Template1PDF({ data }: { data: ResumeData }) {
  const skills = data.skills ? splitSkills(data.skills) : []
  const contactLine = [data.location, data.phone, data.email].filter(Boolean).join("   •   ")
  const linksLine = (data.links ?? []).filter(Boolean).join("   •   ")
  const hasStructuredJobs = (data.experience?.length ?? 0) > 0
  const highlights = data.highlights ?? []

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={{ alignItems: "center" }}>
          <Text style={[styles.name, { textAlign: "center" }]}>{data.fullName}</Text>
          {data.headline && <Text style={[styles.headline, { textAlign: "center" }]}>{data.headline}</Text>}
          {data.tagline && <Text style={[styles.tagline, { textAlign: "center" }]}>{data.tagline}</Text>}
          <View style={[styles.rule, { width: "100%" }]} />
          {contactLine && <Text style={[styles.contact, { textAlign: "center" }]}>{contactLine}</Text>}
          {linksLine && (
            <Text style={[styles.contact, { textAlign: "center", marginTop: 2 }]}>{linksLine}</Text>
          )}
        </View>

        {data.summary?.trim() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.bodyText}>{data.summary.trim()}</Text>
          </View>
        )}

        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Core Competencies</Text>
            <View style={styles.skillsRow}>
              {skills.map((s, i) => (
                <Text key={i} style={styles.skillItem}>
                  {s}{i < skills.length - 1 ? "  •" : ""}
                </Text>
              ))}
            </View>
          </View>
        )}

        {hasStructuredJobs ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Experience</Text>
            {data.experience!.map((job, i) => (
              <View key={i} style={{ marginBottom: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  {job.period && <Text style={styles.jobMeta}>{job.period}</Text>}
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 9, fontWeight: 700, color: NAVY }}>{job.company}</Text>
                  {job.location && <Text style={styles.jobMeta}>{job.location}</Text>}
                </View>
                {job.bullets.map((b, bi) => (
                  <View key={bi} style={[styles.bulletRow, { marginTop: 2 }]}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : (
          <>
            {highlights.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Professional Highlights</Text>
                {highlights.map((h, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{h}</Text>
                  </View>
                ))}
              </View>
            )}
            {data.workHistory?.trim() && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Professional Experience</Text>
                <Text style={styles.bodyText}>{data.workHistory.trim()}</Text>
              </View>
            )}
          </>
        )}

        {(data.education?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {data.education!.map((ed, i) => (
              <View key={i} style={{ marginBottom: 3 }}>
                <Text style={styles.jobTitle}>
                  {ed.degree}{ed.school ? ` — ${ed.school}` : ""}
                </Text>
                {(ed.location || ed.year) && (
                  <Text style={styles.jobMeta}>
                    {[ed.location, ed.year].filter(Boolean).join("   |   ")}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {(data.certifications?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {data.certifications!.map((cert, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{cert}</Text>
              </View>
            ))}
          </View>
        )}

        {(data.additional?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Details</Text>
            <Text style={{ color: MUTED, fontSize: 8.5 }}>{data.additional!.join("     •     ")}</Text>
          </View>
        )}
      </Page>
    </Document>
  )
}