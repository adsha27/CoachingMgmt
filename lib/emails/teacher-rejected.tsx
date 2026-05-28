import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components";
import React from "react";

interface TeacherRejectedProps {
  teacherName: string;
  action: "REJECTED" | "MORE_INFO_REQUESTED";
  reason?: string;
}

export function TeacherRejectedEmail({ teacherName, action, reason }: TeacherRejectedProps) {
  const isMoreInfo = action === "MORE_INFO_REQUESTED";
  return (
    <Html>
      <Head />
      <Preview>{isMoreInfo ? "More information needed for your teacher profile" : "Teacher profile update required"}</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb", padding: "32px 0" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", backgroundColor: "#fff", borderRadius: 8, padding: 32, border: "1px solid #e5e7eb" }}>
          <Heading style={{ fontSize: 22, color: "#111827", marginBottom: 4 }}>
            {isMoreInfo ? "More information needed" : "Profile not approved"}
          </Heading>
          <Text style={{ color: "#374151", fontSize: 15 }}>
            Hi {teacherName}, {isMoreInfo
              ? "our team needs more information before verifying your teacher profile."
              : "unfortunately, your teacher profile could not be approved at this time."}
          </Text>
          {reason && (
            <Section style={{ backgroundColor: "#fef2f2", borderRadius: 6, padding: "16px 20px", margin: "16px 0", border: "1px solid #fecaca" }}>
              <Text style={{ margin: 0, color: "#374151", fontSize: 14 }}>
                <strong>Reason:</strong> {reason}
              </Text>
            </Section>
          )}
          <Text style={{ color: "#374151", fontSize: 14 }}>
            {isMoreInfo
              ? "Please update your profile with the requested information and resubmit."
              : "You may update your profile and resubmit for review."}
          </Text>
          <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />
          <Text style={{ color: "#9ca3af", fontSize: 12 }}>CoachingMgmt · Teacher profile review notification.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export function teacherRejectedText(props: TeacherRejectedProps) {
  const isMoreInfo = props.action === "MORE_INFO_REQUESTED";
  return `Hi ${props.teacherName}, ${isMoreInfo ? "more information is needed for your profile." : "your profile was not approved."} ${props.reason ? `Reason: ${props.reason}` : ""} Please update and resubmit.`;
}
