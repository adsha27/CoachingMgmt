import {
  Body, Container, Head, Heading, Hr, Html, Preview, Text,
} from "@react-email/components";
import React from "react";

interface TeacherVerifiedProps {
  teacherName: string;
}

export function TeacherVerifiedEmail({ teacherName }: TeacherVerifiedProps) {
  return (
    <Html>
      <Head />
      <Preview>Your teacher profile has been verified</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb", padding: "32px 0" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", backgroundColor: "#fff", borderRadius: 8, padding: 32, border: "1px solid #e5e7eb" }}>
          <Heading style={{ fontSize: 22, color: "#111827", marginBottom: 4 }}>
            You&apos;re verified! ✓
          </Heading>
          <Text style={{ color: "#374151", fontSize: 15 }}>
            Hi {teacherName}, your teacher profile has been reviewed and <strong>approved</strong>.
          </Text>
          <Text style={{ color: "#374151", fontSize: 15 }}>
            You can now create courses and packages that students can browse and enrol in. Log in to your dashboard to get started.
          </Text>
          <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />
          <Text style={{ color: "#9ca3af", fontSize: 12 }}>CoachingMgmt · Teacher verification notification.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export function teacherVerifiedText(props: TeacherVerifiedProps) {
  return `Hi ${props.teacherName}, your teacher profile has been approved! Log in to your dashboard to create courses.`;
}
