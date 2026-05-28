import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components";
import React from "react";

interface BookingConfirmedGroupProps {
  studentName: string;
  courseTitle: string;
  teacherName: string;
  subject: string;
  totalSessions: number;
  priceINR: number;
  firstSessionDate?: string; // e.g. "Mon, 2 Jun 2025"
}

export function BookingConfirmedGroupEmail({
  studentName,
  courseTitle,
  teacherName,
  subject,
  totalSessions,
  priceINR,
  firstSessionDate,
}: BookingConfirmedGroupProps) {
  return (
    <Html>
      <Head />
      <Preview>You&apos;re enrolled in {courseTitle}</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb", padding: "32px 0" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", backgroundColor: "#fff", borderRadius: 8, padding: 32, border: "1px solid #e5e7eb" }}>
          <Heading style={{ fontSize: 22, color: "#111827", marginBottom: 4 }}>
            You&apos;re enrolled! 🎉
          </Heading>
          <Text style={{ color: "#374151", fontSize: 15 }}>
            Hi {studentName}, you&apos;ve successfully enrolled in <strong>{courseTitle}</strong>.
          </Text>
          <Section style={{ backgroundColor: "#f3f4f6", borderRadius: 6, padding: "16px 20px", margin: "16px 0" }}>
            <Text style={{ margin: "4px 0", color: "#374151", fontSize: 14 }}><strong>Teacher:</strong> {teacherName}</Text>
            <Text style={{ margin: "4px 0", color: "#374151", fontSize: 14 }}><strong>Subject:</strong> {subject}</Text>
            <Text style={{ margin: "4px 0", color: "#374151", fontSize: 14 }}><strong>Sessions:</strong> {totalSessions}</Text>
            <Text style={{ margin: "4px 0", color: "#374151", fontSize: 14 }}><strong>Price:</strong> ₹{priceINR.toLocaleString("en-IN")}</Text>
            {firstSessionDate && (
              <Text style={{ margin: "4px 0", color: "#374151", fontSize: 14 }}><strong>First session:</strong> {firstSessionDate}</Text>
            )}
          </Section>
          <Text style={{ color: "#6b7280", fontSize: 13 }}>
            You&apos;ll receive a reminder 24 hours before each session with the Meet link.
          </Text>
          <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />
          <Text style={{ color: "#9ca3af", fontSize: 12 }}>CoachingMgmt · You&apos;re receiving this because you enrolled in a course.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export function bookingConfirmedGroupText(props: BookingConfirmedGroupProps) {
  return `Hi ${props.studentName}, you've enrolled in ${props.courseTitle} by ${props.teacherName}. ${props.totalSessions} sessions, ₹${props.priceINR}. ${props.firstSessionDate ? `First session: ${props.firstSessionDate}.` : ""}`;
}
