import {
  Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from "@react-email/components";
import React from "react";

interface SlotConfirmedProps {
  studentName: string;
  teacherName: string;
  packageTitle: string;
  confirmedDate: string;
  confirmedTime: string;
  durationMinutes: number;
  meetLink: string | null;
  teacherNote?: string;
}

export function SlotConfirmedEmail({
  studentName,
  teacherName,
  packageTitle,
  confirmedDate,
  confirmedTime,
  durationMinutes,
  meetLink,
  teacherNote,
}: SlotConfirmedProps) {
  return (
    <Html>
      <Head />
      <Preview>Your slot was confirmed — {confirmedDate} at {confirmedTime}</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb", padding: "32px 0" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", backgroundColor: "#fff", borderRadius: 8, padding: 32, border: "1px solid #e5e7eb" }}>
          <Heading style={{ fontSize: 22, color: "#111827", marginBottom: 4 }}>
            Slot confirmed ✓
          </Heading>
          <Text style={{ color: "#374151", fontSize: 15 }}>
            Hi {studentName}, <strong>{teacherName}</strong> confirmed your proposed slot for <strong>{packageTitle}</strong>.
          </Text>
          <Section style={{ backgroundColor: "#f0fdf4", borderRadius: 6, padding: "16px 20px", margin: "16px 0", border: "1px solid #bbf7d0" }}>
            <Text style={{ margin: "4px 0", color: "#374151", fontSize: 14 }}><strong>Date:</strong> {confirmedDate}</Text>
            <Text style={{ margin: "4px 0", color: "#374151", fontSize: 14 }}><strong>Time:</strong> {confirmedTime} IST</Text>
            <Text style={{ margin: "4px 0", color: "#374151", fontSize: 14 }}><strong>Duration:</strong> {durationMinutes} min</Text>
          </Section>
          {teacherNote && (
            <Text style={{ color: "#374151", fontSize: 14, fontStyle: "italic" }}>
              Teacher note: &ldquo;{teacherNote}&rdquo;
            </Text>
          )}
          {meetLink && (
            <Section style={{ marginTop: 16 }}>
              <Link href={meetLink} style={{ backgroundColor: "#4f46e5", color: "#fff", padding: "10px 20px", borderRadius: 6, fontSize: 14, textDecoration: "none", display: "inline-block" }}>
                Join Google Meet
              </Link>
            </Section>
          )}
          <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />
          <Text style={{ color: "#9ca3af", fontSize: 12 }}>CoachingMgmt · You&apos;ll get a reminder 24 hours before the session.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export function slotConfirmedText(props: SlotConfirmedProps) {
  return `Hi ${props.studentName}, ${props.teacherName} confirmed your slot for ${props.packageTitle}: ${props.confirmedDate} at ${props.confirmedTime} (${props.durationMinutes} min). ${props.meetLink ? `Meet: ${props.meetLink}` : ""}${props.teacherNote ? ` Note: "${props.teacherNote}"` : ""}`;
}
