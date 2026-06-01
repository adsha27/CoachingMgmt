import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as verifyTeacher } from "@/app/api/admin/teacher/[id]/verify/route";
import { POST as suspendTeacher } from "@/app/api/admin/teacher/[id]/suspend/route";
import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE } from "@/lib/auth";

const P = "__test_admin__";
let seq = 0;
function uid() { return `${P}_${Date.now()}_${++seq}`; }
function phone() { return `9${Math.floor(100_000_000 + Math.random() * 900_000_000)}`; }

function req(method: string, url: string, body?: unknown, sid?: string) {
  return new NextRequest(`http://localhost${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(sid ? { Cookie: `${SESSION_COOKIE}=${sid}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function makeUser(role: "ADMIN" | "TEACHER" | "STUDENT") {
  const id = uid();
  return prisma.user.create({
    data: { name: `${P} ${role}`, phone: phone(), email: `${id}@test.invalid`, role },
  });
}

afterEach(async () => {
  await prisma.teacherProfile.deleteMany({ where: { teacher: { name: { startsWith: P } } } });
  await prisma.userSession.deleteMany({ where: { user: { name: { startsWith: P } } } });
  await prisma.user.deleteMany({ where: { name: { startsWith: P } } });
});

// ─── Teacher Verification ─────────────────────────────────────────────────────

describe("POST /api/admin/teacher/[id]/verify", () => {
  async function makeTeacherWithProfile() {
    const teacher = await makeUser("TEACHER");
    await prisma.teacherProfile.create({
      data: { teacherId: teacher.id, subjects: ["Physics"], targetExams: ["JEE Main"], verifyStatus: "PENDING" },
    });
    return teacher;
  }

  it("admin approves a pending teacher — sets VERIFIED", async () => {
    const admin = await makeUser("ADMIN");
    const teacher = await makeTeacherWithProfile();
    const sid = await createSession(admin.id);

    const res = await verifyTeacher(
      req("POST", `/api/admin/teacher/${teacher.id}/verify`, { action: "APPROVE" }, sid),
      { params: Promise.resolve({ id: String(teacher.id) }) },
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.verifyStatus).toBe("VERIFIED");

    const profile = await prisma.teacherProfile.findUnique({ where: { teacherId: teacher.id } });
    expect(profile!.verifyStatus).toBe("VERIFIED");
    expect(profile!.rejectionReason).toBeNull();
  });

  it("admin rejects with reason — sets REJECTED and stores reason", async () => {
    const admin = await makeUser("ADMIN");
    const teacher = await makeTeacherWithProfile();
    const sid = await createSession(admin.id);

    const res = await verifyTeacher(
      req("POST", `/api/admin/teacher/${teacher.id}/verify`, { action: "REJECT", reason: "Incomplete qualifications" }, sid),
      { params: Promise.resolve({ id: String(teacher.id) }) },
    );
    expect(res.status).toBe(200);

    const profile = await prisma.teacherProfile.findUnique({ where: { teacherId: teacher.id } });
    expect(profile!.verifyStatus).toBe("REJECTED");
    expect(profile!.rejectionReason).toBe("Incomplete qualifications");
  });

  it("returns 400 if reason is missing for REJECT", async () => {
    const admin = await makeUser("ADMIN");
    const teacher = await makeTeacherWithProfile();
    const sid = await createSession(admin.id);

    const res = await verifyTeacher(
      req("POST", `/api/admin/teacher/${teacher.id}/verify`, { action: "REJECT" }, sid),
      { params: Promise.resolve({ id: String(teacher.id) }) },
    );
    expect(res.status).toBe(400);
  });

  it("sets MORE_INFO_REQUESTED with reason", async () => {
    const admin = await makeUser("ADMIN");
    const teacher = await makeTeacherWithProfile();
    const sid = await createSession(admin.id);

    const res = await verifyTeacher(
      req("POST", `/api/admin/teacher/${teacher.id}/verify`, { action: "MORE_INFO_REQUESTED", reason: "Need degree certificate" }, sid),
      { params: Promise.resolve({ id: String(teacher.id) }) },
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.verifyStatus).toBe("MORE_INFO_REQUESTED");
  });

  it("returns 403 for non-admin", async () => {
    const teacher = await makeTeacherWithProfile();
    const student = await makeUser("STUDENT");
    const sid = await createSession(student.id);

    const res = await verifyTeacher(
      req("POST", `/api/admin/teacher/${teacher.id}/verify`, { action: "APPROVE" }, sid),
      { params: Promise.resolve({ id: String(teacher.id) }) },
    );
    expect(res.status).toBe(403);
  });

  it("returns 404 for non-existent teacher profile", async () => {
    const admin = await makeUser("ADMIN");
    const sid = await createSession(admin.id);

    const res = await verifyTeacher(
      req("POST", `/api/admin/teacher/999999/verify`, { action: "APPROVE" }, sid),
      { params: Promise.resolve({ id: "999999" }) },
    );
    expect(res.status).toBe(404);
  });
});

// ─── Teacher Suspend ──────────────────────────────────────────────────────────

describe("POST /api/admin/teacher/[id]/suspend", () => {
  it("suspends an active teacher", async () => {
    const admin = await makeUser("ADMIN");
    const teacher = await makeUser("TEACHER");
    const sid = await createSession(admin.id);

    const res = await suspendTeacher(
      req("POST", `/api/admin/teacher/${teacher.id}/suspend`, {}, sid),
      { params: Promise.resolve({ id: String(teacher.id) }) },
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("SUSPENDED");

    const updated = await prisma.user.findUnique({ where: { id: teacher.id } });
    expect(updated!.status).toBe("SUSPENDED");
  });

  it("unsuspends a suspended teacher (toggle)", async () => {
    const admin = await makeUser("ADMIN");
    const teacher = await prisma.user.create({
      data: { name: `${P} TEACHER`, phone: phone(), email: `${uid()}@test.invalid`, role: "TEACHER", status: "SUSPENDED" },
    });
    const sid = await createSession(admin.id);

    const res = await suspendTeacher(
      req("POST", `/api/admin/teacher/${teacher.id}/suspend`, {}, sid),
      { params: Promise.resolve({ id: String(teacher.id) }) },
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ACTIVE");
  });

  it("returns 403 for non-admin", async () => {
    const teacher = await makeUser("TEACHER");
    const student = await makeUser("STUDENT");
    const sid = await createSession(student.id);

    const res = await suspendTeacher(
      req("POST", `/api/admin/teacher/${teacher.id}/suspend`, {}, sid),
      { params: Promise.resolve({ id: String(teacher.id) }) },
    );
    expect(res.status).toBe(403);
  });

  it("returns 404 for non-existent teacher", async () => {
    const admin = await makeUser("ADMIN");
    const sid = await createSession(admin.id);

    const res = await suspendTeacher(
      req("POST", `/api/admin/teacher/999999/suspend`, {}, sid),
      { params: Promise.resolve({ id: "999999" }) },
    );
    expect(res.status).toBe(404);
  });

  it("suspended teacher cannot log in", async () => {
    const teacher = await prisma.user.create({
      data: { name: `${P} TEACHER`, phone: phone(), email: `${uid()}@test.invalid`, role: "TEACHER", status: "SUSPENDED" },
    });
    const sid = await createSession(teacher.id);
    const { getSession } = await import("@/lib/auth");
    const session = await getSession(sid);
    expect(session).toBeNull();
  });
});
