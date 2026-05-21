import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface SessionInviteProps {
  teacherName: string;
  studentNames: string[];
  subject: string;
  scheduledDate: Date;
  durationMinutes: number;
  meetLink: string;
}

export function SessionInviteEmail({
  teacherName,
  studentNames,
  subject,
  scheduledDate,
  durationMinutes,
  meetLink,
}: SessionInviteProps) {
  const dateStr = scheduledDate.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = scheduledDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Html>
      <Head />
      <Preview>
        Session confirmed — {subject} on {dateStr} at {timeStr}
      </Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "24px 0" }}>
          <Heading style={{ fontSize: 20, color: "#111827" }}>
            Session confirmed
          </Heading>
          <Section>
            <Text style={{ color: "#374151" }}>
              <strong>Subject:</strong> {subject}
            </Text>
            <Text style={{ color: "#374151" }}>
              <strong>Teacher:</strong> {teacherName}
            </Text>
            <Text style={{ color: "#374151" }}>
              <strong>Student(s):</strong> {studentNames.join(", ")}
            </Text>
            <Text style={{ color: "#374151" }}>
              <strong>Date:</strong> {dateStr}
            </Text>
            <Text style={{ color: "#374151" }}>
              <strong>Time:</strong> {timeStr}
            </Text>
            <Text style={{ color: "#374151" }}>
              <strong>Duration:</strong> {durationMinutes} minutes
            </Text>
          </Section>
          <Hr />
          <Section>
            <Text style={{ color: "#374151" }}>
              <Link href={meetLink} style={{ color: "#2563eb" }}>
                Join Google Meet
              </Link>
            </Text>
            <Text style={{ fontSize: 12, color: "#9ca3af" }}>{meetLink}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function sessionInviteText(props: SessionInviteProps): string {
  const dateStr = props.scheduledDate.toLocaleDateString("en-IN");
  const timeStr = props.scheduledDate.toLocaleTimeString("en-IN");
  return [
    `Session confirmed: ${props.subject}`,
    `Teacher: ${props.teacherName}`,
    `Student(s): ${props.studentNames.join(", ")}`,
    `Date: ${dateStr} at ${timeStr}`,
    `Duration: ${props.durationMinutes} minutes`,
    ``,
    `Join: ${props.meetLink}`,
  ].join("\n");
}
