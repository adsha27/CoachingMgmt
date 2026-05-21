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

interface SessionReminderProps {
  teacherName: string;
  subject: string;
  scheduledDate: Date;
  durationMinutes: number;
  meetLink: string;
  recipientRole: "teacher" | "student";
}

export function SessionReminderEmail({
  teacherName,
  subject,
  scheduledDate,
  durationMinutes,
  meetLink,
  recipientRole,
}: SessionReminderProps) {
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
        Reminder: {subject} tomorrow at {timeStr}
      </Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "24px 0" }}>
          <Heading style={{ fontSize: 20, color: "#111827" }}>
            Session reminder — tomorrow
          </Heading>
          <Section>
            <Text style={{ color: "#374151" }}>
              <strong>Subject:</strong> {subject}
            </Text>
            {recipientRole === "student" && (
              <Text style={{ color: "#374151" }}>
                <strong>Teacher:</strong> {teacherName}
              </Text>
            )}
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

export function sessionReminderText(props: SessionReminderProps): string {
  const dateStr = props.scheduledDate.toLocaleDateString("en-IN");
  const timeStr = props.scheduledDate.toLocaleTimeString("en-IN");
  return [
    `Reminder: ${props.subject} — tomorrow`,
    `Teacher: ${props.teacherName}`,
    `Date: ${dateStr} at ${timeStr}`,
    `Duration: ${props.durationMinutes} minutes`,
    ``,
    `Join: ${props.meetLink}`,
  ].join("\n");
}
