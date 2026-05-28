import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components";
import React from "react";

interface BookingConfirmedTeacherProps {
  teacherName: string;
  studentName: string;
  courseTitle: string;
  enrolledCount: number;
  maxStudents: number;
}

export function BookingConfirmedTeacherEmail({
  teacherName,
  studentName,
  courseTitle,
  enrolledCount,
  maxStudents,
}: BookingConfirmedTeacherProps) {
  return (
    <Html>
      <Head />
      <Preview>New student enrolled in {courseTitle}</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb", padding: "32px 0" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", backgroundColor: "#fff", borderRadius: 8, padding: 32, border: "1px solid #e5e7eb" }}>
          <Heading style={{ fontSize: 22, color: "#111827", marginBottom: 4 }}>
            New enrolment in {courseTitle}
          </Heading>
          <Text style={{ color: "#374151", fontSize: 15 }}>
            Hi {teacherName}, <strong>{studentName}</strong> just enrolled in your course.
          </Text>
          <Section style={{ backgroundColor: "#f3f4f6", borderRadius: 6, padding: "16px 20px", margin: "16px 0" }}>
            <Text style={{ margin: "4px 0", color: "#374151", fontSize: 14 }}><strong>Course:</strong> {courseTitle}</Text>
            <Text style={{ margin: "4px 0", color: "#374151", fontSize: 14 }}>
              <strong>Enrolled:</strong> {enrolledCount} / {maxStudents} students
            </Text>
          </Section>
          <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />
          <Text style={{ color: "#9ca3af", fontSize: 12 }}>CoachingMgmt · You&apos;re receiving this because a student enrolled in your course.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export function bookingConfirmedTeacherText(props: BookingConfirmedTeacherProps) {
  return `Hi ${props.teacherName}, ${props.studentName} enrolled in ${props.courseTitle}. ${props.enrolledCount}/${props.maxStudents} students.`;
}
