import {
  Body, Container, Head, Heading, Hr, Html, Preview, Text,
} from "@react-email/components";
import React from "react";

export interface VerifyEmailProps {
  name: string;
  code: string;
  expiresMinutes: number;
}

export function VerifyEmailEmail({ name, code, expiresMinutes }: VerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Novus Classes verification code</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb", padding: "32px 0" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", backgroundColor: "#fff", borderRadius: 8, padding: 32, border: "1px solid #e5e7eb" }}>
          <Heading style={{ fontSize: 22, color: "#111827", marginBottom: 4 }}>Confirm your email</Heading>
          <Text style={{ color: "#374151", fontSize: 15 }}>
            Hi {name}, enter this code to confirm your email address:
          </Text>
          <Text style={{ fontSize: 32, fontWeight: 700, letterSpacing: 8, color: "#0F7A52", margin: "20px 0", fontFamily: "monospace" }}>
            {code}
          </Text>
          <Text style={{ color: "#6b7280", fontSize: 13 }}>
            This code expires in {expiresMinutes} minutes. If you didn&apos;t create a Novus Classes account, you can ignore this email.
          </Text>
          <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />
          <Text style={{ color: "#9ca3af", fontSize: 12 }}>Novus Classes · Email verification.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export function verifyEmailText({ name, code, expiresMinutes }: VerifyEmailProps) {
  return `Hi ${name}, your Novus Classes verification code is ${code}. It expires in ${expiresMinutes} minutes.\n\nIf you didn't create an account, ignore this email.`;
}
