import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface SessionCancelledProps {
  subject: string;
  scheduledDate: Date;
  reason?: string;
}

export function SessionCancelledEmail({
  subject,
  scheduledDate,
  reason,
}: SessionCancelledProps) {
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
        Session cancelled — {subject} on {dateStr}
      </Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "24px 0" }}>
          <Heading style={{ fontSize: 20, color: "#111827" }}>
            Session cancelled
          </Heading>
          <Section>
            <Text style={{ color: "#374151" }}>
              <strong>Subject:</strong> {subject}
            </Text>
            <Text style={{ color: "#374151" }}>
              <strong>Was scheduled:</strong> {dateStr} at {timeStr}
            </Text>
            {reason && (
              <Text style={{ color: "#374151" }}>
                <strong>Reason:</strong> {reason}
              </Text>
            )}
          </Section>
          <Text style={{ color: "#6b7280", fontSize: 14 }}>
            Please contact the admin if you have any questions.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function sessionCancelledText(props: SessionCancelledProps): string {
  const dateStr = props.scheduledDate.toLocaleDateString("en-IN");
  const timeStr = props.scheduledDate.toLocaleTimeString("en-IN");
  const lines = [
    `Session cancelled: ${props.subject}`,
    `Was scheduled: ${dateStr} at ${timeStr}`,
  ];
  if (props.reason) lines.push(`Reason: ${props.reason}`);
  return lines.join("\n");
}
