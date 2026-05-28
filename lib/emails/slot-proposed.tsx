import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components";
import React from "react";

interface SlotProposedProps {
  teacherName: string;
  studentName: string;
  packageTitle: string;
  proposedDate: string;   // human-readable date
  proposedTime: string;   // "HH:MM"
  durationMinutes: number;
}

export function SlotProposedEmail({
  teacherName,
  studentName,
  packageTitle,
  proposedDate,
  proposedTime,
  durationMinutes,
}: SlotProposedProps) {
  return (
    <Html>
      <Head />
      <Preview>{studentName} proposed a session slot</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb", padding: "32px 0" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", backgroundColor: "#fff", borderRadius: 8, padding: 32, border: "1px solid #e5e7eb" }}>
          <Heading style={{ fontSize: 22, color: "#111827", marginBottom: 4 }}>
            New slot proposal
          </Heading>
          <Text style={{ color: "#374151", fontSize: 15 }}>
            Hi {teacherName}, <strong>{studentName}</strong> proposed a slot for <strong>{packageTitle}</strong>.
          </Text>
          <Section style={{ backgroundColor: "#fef3c7", borderRadius: 6, padding: "16px 20px", margin: "16px 0", border: "1px solid #fde68a" }}>
            <Text style={{ margin: "4px 0", color: "#374151", fontSize: 14 }}><strong>Date:</strong> {proposedDate}</Text>
            <Text style={{ margin: "4px 0", color: "#374151", fontSize: 14 }}><strong>Time:</strong> {proposedTime} IST</Text>
            <Text style={{ margin: "4px 0", color: "#374151", fontSize: 14 }}><strong>Duration:</strong> {durationMinutes} min</Text>
          </Section>
          <Text style={{ color: "#374151", fontSize: 14 }}>
            Log in to your dashboard to confirm or reject this slot.
          </Text>
          <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />
          <Text style={{ color: "#9ca3af", fontSize: 12 }}>CoachingMgmt · Student slot proposal notification.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export function slotProposedText(props: SlotProposedProps) {
  return `Hi ${props.teacherName}, ${props.studentName} proposed a slot for ${props.packageTitle}: ${props.proposedDate} at ${props.proposedTime} (${props.durationMinutes} min). Please log in to confirm or reject.`;
}
