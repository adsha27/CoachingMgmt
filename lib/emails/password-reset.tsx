import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Text,
} from "@react-email/components";
import React from "react";

interface PasswordResetProps {
  name: string;
  resetUrl: string;
  expiresMinutes: number;
}

export function PasswordResetEmail({ name, resetUrl, expiresMinutes }: PasswordResetProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your Novus Classes password</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb", padding: "32px 0" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", backgroundColor: "#fff", borderRadius: 8, padding: 32, border: "1px solid #e5e7eb" }}>
          <Heading style={{ fontSize: 22, color: "#111827", marginBottom: 4 }}>Reset your password</Heading>
          <Text style={{ color: "#374151", fontSize: 15 }}>
            Hi {name}, we received a request to reset your Novus Classes password.
            Click the button below to choose a new one.
          </Text>
          <Button href={resetUrl} style={{ backgroundColor: "#0F7A52", color: "#fff", fontSize: 15, fontWeight: 600, padding: "12px 24px", borderRadius: 8, textDecoration: "none", display: "inline-block", margin: "12px 0" }}>
            Reset password
          </Button>
          <Text style={{ color: "#6b7280", fontSize: 13 }}>
            This link expires in {expiresMinutes} minutes. If you didn&apos;t request this, you can safely ignore this email — your password won&apos;t change.
          </Text>
          <Text style={{ color: "#9ca3af", fontSize: 12, wordBreak: "break-all" }}>
            Or paste this link into your browser: {resetUrl}
          </Text>
          <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />
          <Text style={{ color: "#9ca3af", fontSize: 12 }}>Novus Classes · Password reset.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export function passwordResetText({ name, resetUrl, expiresMinutes }: PasswordResetProps) {
  return `Hi ${name}, reset your Novus Classes password using this link (expires in ${expiresMinutes} minutes): ${resetUrl}\n\nIf you didn't request this, ignore this email — your password won't change.`;
}
