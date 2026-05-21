import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/teachers/route";
import { GET as listStudents, POST as createStudent } from "@/app/api/students/route";
import { prisma } from "@/lib/prisma";

const P = "__test__";

afterEach(async () => {
  await prisma.teacherToken.deleteMany({
    where: { teacher: { name: { startsWith: P } } },
  });
  await prisma.user.deleteMany({ where: { name: { startsWith: P } } });
});

function post(url: string, body: unknown) {
  return new NextRequest(`http://localhost${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/teachers", () => {
  it("returns 400 when name is missing", async () => {
    const res = await POST(
      post("/api/teachers", { phone: "9900000000", email: "x@test.invalid" })
    );
    expect(res.status).toBe(400);
  });

  it("creates teacher and auto-generates a token", async () => {
    const res = await POST(
      post("/api/teachers", {
        name: `${P} Teacher`,
        phone: `99${Date.now()}`.slice(0, 10),
        email: `t_${Date.now()}@test.invalid`,
      })
    );
    // Email will fail (no real Resend key in test env) — that's expected
    // The route still returns 201 with emailError set.
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.teacher.teacherToken.token).toBeTruthy();
    expect(data.scheduleUrl).toContain("/schedule/");
  });
});

describe("GET /api/teachers", () => {
  it("returns an array", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

describe("POST /api/students", () => {
  it("returns 400 when email is missing", async () => {
    const res = await createStudent(
      post("/api/students", { name: `${P} Student`, phone: "8800000000" })
    );
    expect(res.status).toBe(400);
  });

  it("creates a student", async () => {
    const res = await createStudent(
      post("/api/students", {
        name: `${P} Student`,
        phone: `88${Date.now()}`.slice(0, 10),
        email: `s_${Date.now()}@test.invalid`,
      })
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.student.role).toBe("STUDENT");
  });
});

describe("GET /api/students", () => {
  it("returns an array", async () => {
    const res = await listStudents();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
