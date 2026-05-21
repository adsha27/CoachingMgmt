import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/teacher/availability/route";
import { DELETE } from "@/app/api/teacher/availability/[id]/route";
import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE } from "@/lib/auth";

const P = "__test_availability__";

let seq = 0;
function unique(prefix: string) {
  seq += 1;
  return `${prefix}_${Date.now()}_${seq}_${Math.random().toString(36).slice(2)}`;
}

function phone() {
  return `${Math.floor(1_000_000_000 + Math.random() * 9_000_000_000)}`;
}

async function makeTeacher(name = `${P} Teacher`) {
  const id = unique("teacher");
  return prisma.user.create({
    data: {
      name,
      phone: phone(),
      email: `${id}@example.test`,
      role: "TEACHER",
    },
  });
}

async function teacherReq(method: string, url: string, sid: string, body?: unknown) {
  return new NextRequest(`http://localhost${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Cookie: `${SESSION_COOKIE}=${sid}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

afterEach(async () => {
  await prisma.userSession.deleteMany({ where: { user: { name: { startsWith: P } } } });
  await prisma.teacherAvailability.deleteMany({ where: { teacher: { name: { startsWith: P } } } });
  await prisma.user.deleteMany({ where: { name: { startsWith: P } } });
});

describe("teacher availability API", () => {
  it("creates and lists a valid slot for the authenticated teacher", async () => {
    const teacher = await makeTeacher();
    const sid = await createSession(teacher.id);
    const startTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const createRes = await POST(await teacherReq("POST", "/api/teacher/availability", sid, {
      startTime,
      endTime,
      note: "Available after school",
    }));
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.note).toBe("Available after school");

    const listRes = await GET(await teacherReq("GET", "/api/teacher/availability", sid));
    expect(listRes.status).toBe(200);
    const slots = await listRes.json();
    expect(slots).toHaveLength(1);
    expect(slots[0].id).toBe(created.id);
  });

  it("rejects an end time before or equal to the start time", async () => {
    const teacher = await makeTeacher();
    const sid = await createSession(teacher.id);
    const startTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const res = await POST(await teacherReq("POST", "/api/teacher/availability", sid, {
      startTime,
      endTime: startTime,
    }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "End time must be after start time" });
  });

  it("deletes an owned slot", async () => {
    const teacher = await makeTeacher();
    const sid = await createSession(teacher.id);
    const slot = await prisma.teacherAvailability.create({
      data: {
        teacherId: teacher.id,
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      },
    });

    const res = await DELETE(await teacherReq("DELETE", `/api/teacher/availability/${slot.id}`, sid), {
      params: Promise.resolve({ id: String(slot.id) }),
    });
    expect(res.status).toBe(200);
    expect(await prisma.teacherAvailability.findUnique({ where: { id: slot.id } })).toBeNull();
  });

  it("returns 403 when deleting another teacher's slot", async () => {
    const teacher = await makeTeacher(`${P} Owner`);
    const other = await makeTeacher(`${P} Other`);
    const sid = await createSession(other.id);
    const slot = await prisma.teacherAvailability.create({
      data: {
        teacherId: teacher.id,
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      },
    });

    const res = await DELETE(await teacherReq("DELETE", `/api/teacher/availability/${slot.id}`, sid), {
      params: Promise.resolve({ id: String(slot.id) }),
    });
    expect(res.status).toBe(403);
  });
});
