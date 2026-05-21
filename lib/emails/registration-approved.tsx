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

interface RegistrationApprovedProps {
  name: string;
  role: "TEACHER" | "STUDENT";
  loginUrl: string;
  scheduleUrl?: string; // teacher only
}

export function RegistrationApprovedEmail({
  name,
  role,
  loginUrl,
  scheduleUrl,
}: RegistrationApprovedProps) {
  return (
    <Html>
      <Head />
      <Preview>Your account has been approved</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "24px 0" }}>
          <Heading style={{ fontSize: 20, color: "#111827" }}>
            Welcome, {name}!
          </Heading>
          <Section>
            <Text style={{ color: "#374151" }}>
              Your {role === "TEACHER" ? "teacher" : "student"} account has been
              approved. You can now sign in and access your portal.
            </Text>
            <Text>
              <Link href={loginUrl} style={{ color: "#2563eb" }}>
                Sign in to your account
              </Link>
            </Text>
            {scheduleUrl && (
              <>
                <Text style={{ color: "#374151" }}>
                  Your personal schedule page (share with students):
                </Text>
                <Text>
                  <Link href={scheduleUrl} style={{ color: "#2563eb" }}>
                    {scheduleUrl}
                  </Link>
                </Text>
              </>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function registrationApprovedText(props: RegistrationApprovedProps): string {
  const lines = [
    `Welcome, ${props.name}!`,
    ``,
    `Your ${props.role === "TEACHER" ? "teacher" : "student"} account has been approved.`,
    `Sign in: ${props.loginUrl}`,
  ];
  if (props.scheduleUrl) {
    lines.push(``, `Your schedule page: ${props.scheduleUrl}`);
  }
  return lines.join("\n");
}
