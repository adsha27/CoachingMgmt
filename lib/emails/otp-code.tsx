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

interface OtpCodeProps {
  code: string;
  expiresMinutes?: number;
}

export function OtpCodeEmail({ code, expiresMinutes = 10 }: OtpCodeProps) {
  return (
    <Html>
      <Head />
      <Preview>Your login code: {code}</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb" }}>
        <Container style={{ maxWidth: 480, margin: "0 auto", padding: "32px 0" }}>
          <Heading style={{ fontSize: 20, color: "#111827", marginBottom: 8 }}>
            Your login code
          </Heading>
          <Section
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "24px 32px",
              textAlign: "center",
              margin: "24px 0",
            }}
          >
            <Text
              style={{
                fontSize: 40,
                fontWeight: "bold",
                letterSpacing: 12,
                color: "#4f46e5",
                margin: 0,
              }}
            >
              {code}
            </Text>
          </Section>
          <Text style={{ color: "#6b7280", fontSize: 14 }}>
            This code expires in {expiresMinutes} minutes. Do not share it with anyone.
          </Text>
          <Text style={{ color: "#9ca3af", fontSize: 12 }}>
            If you didn't request this code, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function otpCodeText(code: string, expiresMinutes = 10): string {
  return `Your login code: ${code}\n\nThis code expires in ${expiresMinutes} minutes.\nDo not share it with anyone.`;
}
