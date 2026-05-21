import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import React from "react";

interface TeacherScheduleUrlProps {
  teacherName: string;
  scheduleUrl: string;
}

export function TeacherScheduleUrlEmail({
  teacherName,
  scheduleUrl,
}: TeacherScheduleUrlProps) {
  return (
    <Html>
      <Head />
      <Preview>Your teaching schedule is ready</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "24px 0" }}>
          <Heading style={{ fontSize: 20, color: "#111827" }}>
            Welcome, {teacherName}
          </Heading>
          <Section>
            <Text style={{ color: "#374151" }}>
              Your schedule page is ready. Bookmark this link — it shows all
              your upcoming sessions with student details and Google Meet links.
            </Text>
            <Text>
              <Link href={scheduleUrl} style={{ color: "#2563eb" }}>
                View your schedule
              </Link>
            </Text>
            <Text style={{ fontSize: 12, color: "#9ca3af" }}>{scheduleUrl}</Text>
          </Section>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>
            Keep this link private. Contact the admin if you need a new link.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function teacherScheduleUrlText(
  props: TeacherScheduleUrlProps
): string {
  return [
    `Welcome, ${props.teacherName}!`,
    ``,
    `Your schedule page shows all upcoming sessions with student details and Meet links.`,
    ``,
    `View your schedule: ${props.scheduleUrl}`,
    ``,
    `Keep this link private. Contact the admin if you need a new link.`,
  ].join("\n");
}
