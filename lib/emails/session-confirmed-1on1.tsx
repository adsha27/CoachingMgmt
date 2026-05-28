import {
  Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from "@react-email/components";
import React from "react";

interface SessionConfirmed1on1Props {
  recipientName: string;
  recipientRole: "teacher" | "student";
  otherPartyName: string;
  packageTitle: string;
  scheduledAt: string; // human-readable
  durationMinutes: number;
  meetLink: string | null;
}

export function SessionConfirmed1on1Email({
  recipientName,
  recipientRole,
  otherPartyName,
  packageTitle,
  scheduledAt,
  durationMinutes,
  meetLink,
}: SessionConfirmed1on1Props) {
  const intro = recipientRole === "student"
    ? `Your session with ${otherPartyName} has been confirmed.`
    : `You've confirmed a session with ${otherPartyName}.`;

  return (
    <Html>
      <Head />
      <Preview>Session confirmed — {scheduledAt}</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb", padding: "32px 0" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", backgroundColor: "#fff", borderRadius: 8, padding: 32, border: "1px solid #e5e7eb" }}>
          <Heading style={{ fontSize: 22, color: "#111827", marginBottom: 4 }}>
            Session confirmed ✓
          </Heading>
          <Text style={{ color: "#374151", fontSize: 15 }}>
            Hi {recipientName}, {intro}
          </Text>
          <Section style={{ backgroundColor: "#f3f4f6", borderRadius: 6, padding: "16px 20px", margin: "16px 0" }}>
            <Text style={{ margin: "4px 0", color: "#374151", fontSize: 14 }}><strong>Package:</strong> {packageTitle}</Text>
            <Text style={{ margin: "4px 0", color: "#374151", fontSize: 14 }}><strong>When:</strong> {scheduledAt}</Text>
            <Text style={{ margin: "4px 0", color: "#374151", fontSize: 14 }}><strong>Duration:</strong> {durationMinutes} min</Text>
          </Section>
          {meetLink && (
            <Section>
              <Text style={{ color: "#374151", fontSize: 14, marginBottom: 8 }}>Join your session:</Text>
              <Link href={meetLink} style={{ backgroundColor: "#4f46e5", color: "#fff", padding: "10px 20px", borderRadius: 6, fontSize: 14, textDecoration: "none", display: "inline-block" }}>
                Join Google Meet
              </Link>
            </Section>
          )}
          <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />
          <Text style={{ color: "#9ca3af", fontSize: 12 }}>CoachingMgmt · You&apos;ll also get a reminder 24 hours before.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export function sessionConfirmed1on1Text(props: SessionConfirmed1on1Props) {
  return `Hi ${props.recipientName}, your session "${props.packageTitle}" is confirmed for ${props.scheduledAt} (${props.durationMinutes} min). ${props.meetLink ? `Meet: ${props.meetLink}` : ""}`;
}
