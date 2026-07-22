import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Text,
} from "@react-email/components";
import React from "react";

export interface EnrolmentConfirmedProps {
  studentName: string;
  className: string;
  teacherName: string;
  meetingLink: string | null;
  firstSessionAt: string | null;
}

export function EnrolmentConfirmedEmail({
  studentName, className, teacherName, meetingLink, firstSessionAt,
}: EnrolmentConfirmedProps) {
  return (
    <Html>
      <Head />
      <Preview>You&apos;re enrolled in {className}</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb", padding: "32px 0" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", backgroundColor: "#fff", borderRadius: 8, padding: 32, border: "1px solid #e5e7eb" }}>
          <Heading style={{ fontSize: 22, color: "#111827", marginBottom: 4 }}>You&apos;re enrolled ✓</Heading>
          <Text style={{ color: "#374151", fontSize: 15 }}>
            Hi {studentName}, your place in <strong>{className}</strong> with {teacherName} is confirmed.
          </Text>
          {firstSessionAt && (
            <Text style={{ color: "#374151", fontSize: 15 }}>
              First session: <strong>{firstSessionAt}</strong>
            </Text>
          )}
          {meetingLink ? (
            <>
              <Text style={{ color: "#374151", fontSize: 15 }}>Join your class using this link:</Text>
              <Button href={meetingLink} style={{ backgroundColor: "#0F7A52", color: "#fff", fontSize: 15, fontWeight: 600, padding: "12px 24px", borderRadius: 8, textDecoration: "none", display: "inline-block", margin: "12px 0" }}>
                Join class
              </Button>
              <Text style={{ color: "#9ca3af", fontSize: 12, wordBreak: "break-all" }}>{meetingLink}</Text>
            </>
          ) : (
            <Text style={{ color: "#374151", fontSize: 15 }}>
              Your teacher will share the meeting link before the first session. You can always find it on your dashboard.
            </Text>
          )}
          <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />
          <Text style={{ color: "#9ca3af", fontSize: 12 }}>Novus Classes · Enrolment confirmation.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export function enrolmentConfirmedText({
  studentName, className, teacherName, meetingLink, firstSessionAt,
}: EnrolmentConfirmedProps) {
  return [
    `Hi ${studentName}, your place in ${className} with ${teacherName} is confirmed.`,
    firstSessionAt ? `First session: ${firstSessionAt}` : null,
    meetingLink ? `Join your class: ${meetingLink}` : "Your teacher will share the meeting link before the first session.",
  ].filter(Boolean).join("\n\n");
}
