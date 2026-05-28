import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/teacher/availability/route";
import { DELETE } from "@/app/api/teacher/availability/[id]/route";
import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE } from "@/lib/auth";

const P = "__test_availability__";
let seq = 0;

function uid() {
  return `${P}_${Date.now()}_${++seq}_${Math.random().toString(36).slice(2)}`;
}

function phone() {
  return `9${Math.floor(100_000_000 + Math.random() * 900_000_000)}`;
}

async function makeTeacher() {
  const id = uid();
  return prisma.user.create({
    data: { name: `${P} Teacher`, phone: phone(), email: `${id}@example.test`, role: "TEACHER" },
  });
}

function req(method: string, url: string, sid: string, body?: unknown) {
  return new NextRequest(`http://localhost${url}`, {
    method,
    headers: { "Content-Type": "application/json", Cookie: `${SESSION_COOKIE}=${sid}` },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

afterEach(async () => {
  await prisma.userSession.deleteMany({ where: { user: { name: { startsWith: P } } } });
  await prisma.teacherAvailability.deleteMany({ where: { teacher: { name: { startsWith: P } } } });
  await prisma.user.deleteMany({ where: { name: { startsWith: P } } });
});

describe("teacher availability API", () => {
  it("creates and lists a weekly recurring slot", async () => {
    const teacher = await makeTeacher();
    const sid = await createSession(teacher.id);

    const createRes = await POST(req("POST", "/api/teacher/availability", sid, {
      dayOfWeek: "MON",
      startTime: "09:00",
      endTime: "10:30",
    }));
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.dayOfWeek).toBe("MON");
    expect(created.startTime).toBe("09:00");
    expect(created.endTime).toBe("10:30");
    expect(created.isRecurring).toBe(true);

    const listRes = await GET(req("GET", "/api/teacher/availability", sid));
    expect(listRes.status).toBe(200);
    const slots = await listRes.json();
    expect(slots).toHaveLength(1);
    expect(slots[0].id).toBe(created.id);
  });

  it("creates a non-recurring one-off slot with a specific date", async () => {
    const teacher = await makeTeacher();
    const sid = await createSession(teacher.id);

    const createRes = await POST(req("POST", "/api/teacher/availability", sid, {
      dayOfWeek: "SAT",
      startTime: "14:00",
      endTime: "15:00",
      isRecurring: false,
      specificDate: "2026-06-07",
    }));
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.isRecurring).toBe(false);
    expect(created.specificDate).not.toBeNull();
  });

  it("rejects missing required fields", async () => {
    const teacher = await makeTeacher();
    const sid = await createSession(teacher.id);

    const res = await POST(req("POST", "/api/teacher/availability", sid, {
      dayOfWeek: "TUE",
      startTime: "09:00",
    }));
    expect(res.status).toBe(400);
  });

  it("rejects invalid dayOfWeek", async () => {
    const teacher = await makeTeacher();
    const sid = await createSession(teacher.id);

    const res = await POST(req("POST", "/api/teacher/availability", sid, {
      dayOfWeek: "MONDAY",
      startTime: "09:00",
      endTime: "10:00",
    }));
    expect(res.status).toBe(400);
  });

  it("rejects malformed time strings", async () => {
    const teacher = await makeTeacher();
    const sid = await createSession(teacher.id);

    const res = await POST(req("POST", "/api/teacher/availability", sid, {
      dayOfWeek: "WED",
      startTime: "9:00 AM",
      endTime: "10:00",
    }));
    expect(res.status).toBe(400);
  });

  it("rejects endTime not after startTime", async () => {
    const teacher = await makeTeacher();
    const sid = await createSession(teacher.id);

    const res = await POST(req("POST", "/api/teacher/availability", sid, {
      dayOfWeek: "FRI",
      startTime: "10:00",
      endTime: "09:00",
    }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "endTime must be after startTime" });
  });

  it("rejects unauthenticated requests", async () => {
    const noSid = new NextRequest("http://localhost/api/teacher/availability", { method: "GET" });
    const res = await GET(noSid);
    expect(res.status).toBe(401);
  });

  it("deletes an owned slot", async () => {
    const teacher = await makeTeacher();
    const sid = await createSession(teacher.id);
    const slot = await prisma.teacherAvailability.create({
      data: { teacherId: teacher.id, dayOfWeek: "THU", startTime: "11:00", endTime: "12:00" },
    });

    const res = await DELETE(
      req("DELETE", `/api/teacher/availability/${slot.id}`, sid),
      { params: Promise.resolve({ id: String(slot.id) }) },
    );
    expect(res.status).toBe(200);
    expect(await prisma.teacherAvailability.findUnique({ where: { id: slot.id } })).toBeNull();
  });

  it("returns 403 when deleting another teacher's slot", async () => {
    const owner = await makeTeacher();
    const other = await makeTeacher();
    const sid = await createSession(other.id);
    const slot = await prisma.teacherAvailability.create({
      data: { teacherId: owner.id, dayOfWeek: "SUN", startTime: "08:00", endTime: "09:00" },
    });

    const res = await DELETE(
      req("DELETE", `/api/teacher/availability/${slot.id}`, sid),
      { params: Promise.resolve({ id: String(slot.id) }) },
    );
    expect(res.status).toBe(403);
  });
});
